import { ref, computed, onMounted, onUnmounted } from 'vue'

const ROOT_TITLES = ['Bookmarks bar', '收藏夹栏', '书签栏', 'Other bookmarks', '其他书签', '其他收藏']
const MAX_ITEMS_PER_FOLDER = 30
const SORT_LABELS = { index: 'index', alpha: 'A-Z', recent: 'recent' }

export function useBookmarks() {
  const bookmarkMap = ref({})
  const loading = ref(true)
  const version = ref(0)
  const sortMode = ref('index')

  let eventQueue = []
  let flushTimer = null

  function buildMap(nodes) {
    for (const node of nodes) {
      bookmarkMap.value[node.id] = node
      if (node.children) {
        buildMap(node.children)
      }
    }
  }

  function removeDescendants(id) {
    const stack = [id]
    while (stack.length) {
      const cur = stack.pop()
      const children = Object.values(bookmarkMap.value).filter(n => n.parentId === cur)
      for (const child of children) {
        stack.push(child.id)
      }
      delete bookmarkMap.value[cur]
    }
  }

  function flushEvents() {
    const updates = {}
    for (const ev of eventQueue) {
      if (ev.type === 'created') {
        updates[ev.node.id] = ev.node
      } else if (ev.type === 'removed') {
        updates[ev.id] = '__remove__'
      } else if (ev.type === 'changed') {
        if (bookmarkMap.value[ev.id]) {
          updates[ev.id] = { ...bookmarkMap.value[ev.id], ...ev.changes }
        }
      } else if (ev.type === 'moved') {
        if (bookmarkMap.value[ev.id]) {
          const oldParentId = bookmarkMap.value[ev.id].parentId
          const oldIndex = bookmarkMap.value[ev.id].index
          const newParentId = ev.newParentId
          const newIndex = ev.newIndex

          updates[ev.id] = { ...bookmarkMap.value[ev.id], parentId: newParentId, index: newIndex }

          // 同文件夹内重排：调整被挤开的兄弟节点的 index
          if (oldParentId === newParentId && oldIndex !== newIndex) {
            const siblings = Object.values(bookmarkMap.value).filter(
              n => n.parentId === newParentId && n.id !== ev.id
            )
            if (oldIndex < newIndex) {
              // 从上方移到下方，中间节点 index -1
              for (const sib of siblings) {
                const sibIdx = sib.index ?? 0
                if (sibIdx > oldIndex && sibIdx <= newIndex) {
                  updates[sib.id] = { ...bookmarkMap.value[sib.id], index: sibIdx - 1 }
                }
              }
            } else {
              // 从下方移到上方，中间节点 index +1
              for (const sib of siblings) {
                const sibIdx = sib.index ?? 0
                if (sibIdx >= newIndex && sibIdx < oldIndex) {
                  updates[sib.id] = { ...bookmarkMap.value[sib.id], index: sibIdx + 1 }
                }
              }
            }
          }
        }
      }
    }
    eventQueue = []

    // 批量应用
    const removedIds = new Set()
    for (const [id, val] of Object.entries(updates)) {
      if (val === '__remove__') {
        removedIds.add(id)
      } else {
        bookmarkMap.value[id] = val
      }
    }
    for (const id of removedIds) {
      removeDescendants(id)
    }
    version.value++
  }

  function scheduleFlush() {
    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null
        flushEvents()
      }, 50)
    }
  }

  function handleCreated(id, node) {
    // 确保文件夹节点有 children 数组（onCreated 事件中可能缺失）
    if (!node.url && !node.children) {
      node = { ...node, children: [] }
    }
    eventQueue.push({ type: 'created', node })
    scheduleFlush()
  }

  function handleRemoved(id, removeInfo) {
    eventQueue.push({ type: 'removed', id })
    scheduleFlush()
  }

  function handleChanged(id, changes) {
    eventQueue.push({ type: 'changed', id, changes })
    scheduleFlush()
  }

  function handleMoved(id, moveInfo) {
    eventQueue.push({ type: 'moved', id, newParentId: moveInfo.parentId, newIndex: moveInfo.index })
    scheduleFlush()
  }

  function init() {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) return

    chrome.storage.sync.get('sortMode').then((result) => {
      if (result.sortMode && ['index', 'alpha', 'recent'].includes(result.sortMode)) {
        sortMode.value = result.sortMode
      }
    })

    chrome.bookmarks.getTree().then((tree) => {
      buildMap(tree)
      loading.value = false
    })

    chrome.bookmarks.onCreated.addListener(handleCreated)
    chrome.bookmarks.onRemoved.addListener(handleRemoved)
    chrome.bookmarks.onChanged.addListener(handleChanged)
    chrome.bookmarks.onMoved.addListener(handleMoved)
  }

  function destroy() {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) return
    chrome.bookmarks.onCreated.removeListener(handleCreated)
    chrome.bookmarks.onRemoved.removeListener(handleRemoved)
    chrome.bookmarks.onChanged.removeListener(handleChanged)
    chrome.bookmarks.onMoved.removeListener(handleMoved)
  }

  const rootFolderIds = computed(() => {
    void version.value
    return Object.values(bookmarkMap.value)
      .filter(n => ROOT_TITLES.includes(n.title) && n.children)
      .map(n => n.id)
  })

  // 跳过系统根文件夹容器，直接取第一级子文件夹/书签 id
  const topLevelFolderIds = computed(() => {
    void version.value
    return rootFolderIds.value.flatMap(rootId =>
      Object.values(bookmarkMap.value)
        .filter(n => n.parentId === rootId && !ROOT_TITLES.includes(n.title))
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
        .map(n => n.id)
    )
  })

  function useChildren(parentId) {
    return computed(() => {
      void version.value
      const nodes = Object.values(bookmarkMap.value).filter(n => n.parentId === parentId)
      switch (sortMode.value) {
        case 'alpha':
          return nodes.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        case 'recent':
          return nodes.sort((a, b) => (b.dateAdded ?? 0) - (a.dateAdded ?? 0))
        default:
          return nodes.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      }
    })
  }

  const sortLabel = computed(() => SORT_LABELS[sortMode.value] || 'index')

  function cycleSortMode() {
    const modes = ['index', 'alpha', 'recent']
    const idx = modes.indexOf(sortMode.value)
    sortMode.value = modes[(idx + 1) % modes.length]
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ sortMode: sortMode.value })
    }
  }

  function getTotalChildrenCount(parentId) {
    return Object.values(bookmarkMap.value).filter(n => n.parentId === parentId).length
  }

  // CRUD 包装
  async function createBookmark(parentId, { title, url }) {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) return
    return chrome.bookmarks.create({ parentId, title, url })
  }

  async function updateBookmark(id, changes) {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) return
    return chrome.bookmarks.update(id, changes)
  }

  async function removeBookmark(id) {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) return
    const node = bookmarkMap.value[id]
    if (node && node.children) {
      return chrome.bookmarks.removeTree(id)
    }
    return chrome.bookmarks.remove(id)
  }

  return {
    bookmarkMap,
    loading,
    rootFolderIds,
    topLevelFolderIds,
    useChildren,
    getTotalChildrenCount,
    createBookmark,
    updateBookmark,
    removeBookmark,
    sortMode,
    sortLabel,
    cycleSortMode,
    init,
    destroy,
  }
}
