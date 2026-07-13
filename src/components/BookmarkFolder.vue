<script setup>
import { ref, computed, inject } from 'vue'
import BookmarkCard from './BookmarkCard.vue'
import { isSafeUrl } from '../utils/safeUrl.js'

const props = defineProps({
  folderId: { type: String, required: true },
  depth: { type: Number, default: 0 },
  useChildren: { type: Function, required: true },
  getTotalChildrenCount: { type: Function, default: null },
})

const emit = defineEmits(['contextmenu'])

const MAX_ITEMS = 31
const MAX_ITEMS_SUB = 7

const collapsed = ref(props.depth > 0)
const isDragOver = ref(false)
const expandedSubfolders = ref(new Set())
const collapsedSubfolders = ref(new Set())
const expandedPrimary = ref(false)
const bookmarkMapInjected = inject('bookmarkMap', ref({}))
const children = props.useChildren(props.folderId)

const folderNode = computed(() => bookmarkMapInjected.value[props.folderId])

const allBookmarks = computed(() => children.value.filter(c => c.url))
const hasMorePrimary = computed(() => !expandedPrimary.value && allBookmarks.value.length > MAX_ITEMS)
const moreCountPrimary = computed(() => allBookmarks.value.length - MAX_ITEMS)

// Track which bookmark IDs are within the visible limit
const visibleBookmarkIds = computed(() => {
  if (expandedPrimary.value) {
    const ids = new Set()
    for (const child of children.value) {
      if (child.url) ids.add(child.id)
    }
    return ids
  }
  const ids = new Set()
  let count = 0
  for (const child of children.value) {
    if (child.url) {
      if (count < MAX_ITEMS) ids.add(child.id)
      count++
    }
  }
  return ids
})

// Sub-folder section data
const subFolderSections = computed(() => {
  const map = new Map()
  for (const child of children.value) {
    if (!child.url) {
      const subChildren = props.useChildren(child.id)
      const subBookmarks = subChildren.value.filter(c => c.url)
      const isExpanded = expandedSubfolders.value.has(child.id)
      const total = subBookmarks.length
      const displayBookmarks = isExpanded || total <= MAX_ITEMS_SUB ? subBookmarks : subBookmarks.slice(0, MAX_ITEMS_SUB)
      const hasMore = total > MAX_ITEMS_SUB && !isExpanded
      const moreCount = total - MAX_ITEMS_SUB
      map.set(child.id, {
        folder: child,
        bookmarks: subBookmarks,
        displayBookmarks,
        hasMore,
        moreCount,
        total,
        isCollapsed: collapsedSubfolders.value.has(child.id),
      })
    }
  }
  return map
})

// Interleaved segments: bookmark runs and sub-folder sections in index order
const segments = computed(() => {
  const segs = []
  let bookmarkRun = []

  function flushRun() {
    if (bookmarkRun.length > 0) {
      segs.push({ type: 'bookmarks', items: bookmarkRun })
      bookmarkRun = []
    }
  }

  for (const child of children.value) {
    if (child.url) {
      if (visibleBookmarkIds.value.has(child.id)) {
        bookmarkRun.push(child)
      }
    } else {
      flushRun()
      const section = subFolderSections.value.get(child.id)
      if (section) {
        segs.push({ type: 'folder', data: section })
      }
    }
  }
  flushRun()

  if (hasMorePrimary.value) {
    for (let i = segs.length - 1; i >= 0; i--) {
      if (segs[i].type === 'bookmarks') {
        segs[i].showMorePrimary = true
        break
      }
    }
  }

  return segs
})

function togglePrimaryExpand() {
  expandedPrimary.value = true
}

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

function toggleSubfolderExpand(subFolderId) {
  const next = new Set(expandedSubfolders.value)
  if (next.has(subFolderId)) next.delete(subFolderId)
  else next.add(subFolderId)
  expandedSubfolders.value = next
}

function toggleSubfolderCollapse(subFolderId) {
  const next = new Set(collapsedSubfolders.value)
  if (next.has(subFolderId)) next.delete(subFolderId)
  else next.add(subFolderId)
  collapsedSubfolders.value = next
}

function onContextMenu(e, bookmark) {
  emit('contextmenu', e, bookmark)
}

// --- drag & drop (parent folder) ---
function onDragOver(e) {
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer.dropEffect = 'move'
  isDragOver.value = true
}

function onDragLeave(e) {
  e.stopPropagation()
  if (e.currentTarget.contains(e.relatedTarget)) return
  isDragOver.value = false
}

function onDrop(e) {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false
  const bookmarkId = e.dataTransfer.getData('text/plain')
  if (!bookmarkId || typeof chrome === 'undefined' || !chrome.bookmarks) return
  chrome.bookmarks.move(bookmarkId, { parentId: props.folderId })
}

// --- sub-folder section interactions ---
const dragOverSubId = ref(null)
const dragOverCardId = ref(null)

function clearDragOverCard() {
  dragOverCardId.value = null
}

function computeInsertIndex(parentId, beforeNodeId) {
  const siblings = Object.values(bookmarkMapInjected.value)
    .filter(n => n.parentId === parentId)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
  const pos = siblings.findIndex(n => n.id === beforeNodeId)
  return pos === -1 ? siblings.length : pos
}

function handleDropReorder(sourceId, targetId) {
  dragOverCardId.value = null
  const targetNode = bookmarkMapInjected.value[targetId]
  if (!targetNode) return
  const targetParentId = targetNode.parentId
  const targetIndex = computeInsertIndex(targetParentId, targetId)
  if (typeof chrome !== 'undefined' && chrome.bookmarks) {
    chrome.bookmarks.move(sourceId, { parentId: targetParentId, index: targetIndex })
  }
}

function handleCardDragOver(cardId) {
  dragOverCardId.value = cardId
}

function onSubDragOver(e, folderId) {
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer.dropEffect = 'move'
  dragOverSubId.value = folderId
}

function onSubDragLeave(e) {
  e.stopPropagation()
  if (e.currentTarget.contains(e.relatedTarget)) return
  dragOverSubId.value = null
}

function onSubDrop(e, folderId) {
  e.preventDefault()
  e.stopPropagation()
  dragOverSubId.value = null
  const bookmarkId = e.dataTransfer.getData('text/plain')
  if (!bookmarkId || typeof chrome === 'undefined' || !chrome.bookmarks) return
  chrome.bookmarks.move(bookmarkId, { parentId: folderId })
}

function onSubMiddleClick(e, folderId) {
  if (e.button === 1) {
    e.preventDefault()
    const urls = collectDescendantUrls(folderId)
    for (const url of urls) {
      if (isSafeUrl(url)) window.open(url, '_blank')
    }
  }
}

function onSubContextMenu(e, folder) {
  emit('contextmenu', e, folder)
}

// --- middle-click open all ---
function collectDescendantUrls(folderId) {
  const urls = []
  const map = bookmarkMapInjected.value
  const stack = [folderId]
  while (stack.length) {
    const id = stack.pop()
    for (const node of Object.values(map)) {
      if (node.parentId === id) {
        if (node.url) urls.push(node.url)
        if (node.children) stack.push(node.id)
      }
    }
  }
  return urls
}

function onFolderMouseDown(e) {
  if (e.button === 1) {
    e.preventDefault()
    const urls = collectDescendantUrls(props.folderId)
    for (const url of urls) {
      if (isSafeUrl(url)) window.open(url, '_blank')
    }
  }
}
</script>

<template>
  <div v-if="folderNode" class="folder-group font-mono">
    <!-- 文件夹标题栏 -->
    <div
      class="flex items-center gap-1.5 cursor-pointer select-none group/title rounded mb-1.5 py-[5px]"
      :class="{
        'border-b pb-1.5': !collapsed,
        'bg-terminal-input': isDragOver,
      }"
      style="border-color: var(--t-border-subtle)"
      @click="toggleCollapse"
      @mousedown="onFolderMouseDown"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <span class="w-3 flex-shrink-0 text-xs text-terminal-text-muted">{{ collapsed ? '▸' : '▾' }}</span>
      <span class="text-xs text-terminal-accent">&gt;_</span>
      <span class="text-xs text-terminal-accent group-hover/title:text-terminal-text transition-colors truncate">{{ folderNode.title }}</span>
      <span class="text-[10px] text-terminal-accent">({{ children.length }})</span>
    </div>

    <!-- 展开内容 -->
    <Transition name="collapse">
    <div v-if="!collapsed" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop" @dragend="clearDragOverCard">
      <!-- 交错：书签 runs + 子文件夹 sections 按 index 顺序 -->
      <template v-for="seg in segments" :key="seg.type === 'folder' ? seg.data.folder.id : seg.items[0].id">
        <!-- 书签 grid（连续书签归为一组） -->
        <div v-if="seg.type === 'bookmarks'" class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-1.5 mb-1.5">
          <BookmarkCard
            v-for="child in seg.items"
            :key="child.id"
            :bookmark="child"
            :show-insert-before="dragOverCardId === child.id"
            @contextmenu="(e) => onContextMenu(e, child)"
            @dragoverReorder="handleCardDragOver"
            @dropReorder="handleDropReorder"
          />
          <div
            v-if="seg.showMorePrimary"
            class="flex items-center justify-center px-3.5 py-2.5 rounded-lg cursor-pointer select-none font-mono border bg-transparent"
            style="border-style: dashed; border-color: var(--t-border-subtle); border-width: 1px"
            @click.stop="togglePrimaryExpand"
          >
            <span class="text-[11px]" style="color: var(--t-text-micro)">+ {{ moreCountPrimary }} more</span>
          </div>
        </div>

        <!-- 子文件夹 section -->
        <div
          v-else
          class="mb-[14px]"
          :class="{ 'bg-terminal-input/30 rounded-lg': dragOverSubId === seg.data.folder.id }"
          @dragover="(e) => onSubDragOver(e, seg.data.folder.id)"
          @dragleave="onSubDragLeave"
          @drop="(e) => onSubDrop(e, seg.data.folder.id)"
          @dragend="clearDragOverCard"
        >
          <!-- Section header（可折叠） -->
          <div
            class="flex items-center gap-1.5 cursor-pointer select-none"
            @click="toggleSubfolderCollapse(seg.data.folder.id)"
            @mousedown="(e) => onSubMiddleClick(e, seg.data.folder.id)"
            @contextmenu.prevent="(e) => onSubContextMenu(e, seg.data.folder)"
          >
            <span class="w-3 flex-shrink-0 text-[10px]" style="color: var(--t-text-micro)">{{ seg.data.isCollapsed ? '▸' : '▾' }}</span>
            <span class="text-[10px] flex-shrink-0" style="color: var(--t-text-micro)">&gt;_</span>
            <span class="text-[10px] flex-shrink-0" style="color: var(--t-text-micro)">{{ seg.data.folder.title }}</span>
            <span class="text-[10px] flex-shrink-0" style="color: var(--t-text-micro)">({{ seg.data.total }})</span>
            <span class="flex-1 ml-2" style="height: 0.5px; background: var(--t-border-subtle); align-self: center"></span>
          </div>

          <!-- 子文件夹书签 grid -->
          <div v-if="!seg.data.isCollapsed && seg.data.displayBookmarks.length > 0" class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-1.5">
            <BookmarkCard
              v-for="child in seg.data.displayBookmarks"
              :key="child.id"
              :bookmark="child"
              :show-insert-before="dragOverCardId === child.id"
              @contextmenu="(e) => onContextMenu(e, child)"
              @dragoverReorder="handleCardDragOver"
              @dropReorder="handleDropReorder"
            />
            <div
              v-if="seg.data.hasMore"
              class="flex items-center justify-center px-3.5 py-2.5 rounded-lg cursor-pointer select-none font-mono border bg-transparent"
              style="border-style: dashed; border-color: var(--t-border-subtle); border-width: 1px"
              @click.stop="toggleSubfolderExpand(seg.data.folder.id)"
            >
              <span class="text-[11px]" style="color: var(--t-text-micro)">+ {{ seg.data.moreCount }} more</span>
            </div>
          </div>
        </div>
      </template>

    </div>
    </Transition>
  </div>
</template>
