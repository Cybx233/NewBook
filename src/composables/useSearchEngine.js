import { ref, watch } from 'vue'
import { isSafeUrl } from '../utils/safeUrl.js'

const DEFAULT_ENGINES = [
  // 搜索引擎
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=%s', isDefault: true, category: 'search' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=%s', isDefault: false, category: 'search' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s', isDefault: false, category: 'search' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q=%s', isDefault: false, category: 'search' },
  { id: 'stackoverflow', name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=%s', isDefault: false, category: 'search' },
  // AI 对话 — URL 预填（输入自动填入输入框，需手动发送）
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/?q=%s', isDefault: false, category: 'ai' },
  { id: 'grok', name: 'Grok', url: 'https://grok.com/?q=%s', isDefault: false, category: 'ai' },
  // AI 对话 — 剪贴板模式（不支持 URL 预填，复制提示词 + 打开首页）
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', isDefault: false, category: 'ai', behavior: 'clipboard' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', isDefault: false, category: 'ai', behavior: 'clipboard' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com/', isDefault: false, category: 'ai', behavior: 'clipboard' },
]

const STORAGE_KEY = 'newbook_engines'

export function useSearchEngine() {
  const engines = ref([...DEFAULT_ENGINES])
  const currentEngine = ref(null)
  const loaded = ref(false)

  async function loadEngines() {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      currentEngine.value = DEFAULT_ENGINES[0]
      loaded.value = true
      return
    }

    const result = await chrome.storage.sync.get(STORAGE_KEY)
    if (result[STORAGE_KEY] && result[STORAGE_KEY].length > 0) {
      engines.value = result[STORAGE_KEY]
      // 迁移：为存量用户补上缺失的引擎，并修复旧版本数据
      let changed = false
      for (const def of DEFAULT_ENGINES) {
        const existing = engines.value.find(e => e.id === def.id)
        if (!existing) {
          engines.value.push({ ...def })
          changed = true
        } else {
          // 修复：确保预设引擎的 url 和 behavior 与当前默认值一致
          if (def.category === 'ai') {
            if (existing.url !== def.url || existing.behavior !== def.behavior) {
              existing.url = def.url
              existing.behavior = def.behavior
              changed = true
            }
          }
          // 给旧数据补上 category 字段
          if (!existing.category) {
            existing.category = def.category
            changed = true
          }
        }
      }
      // 给非预设引擎补上 category
      for (const e of engines.value) {
        if (!e.category) {
          e.category = 'custom'
          changed = true
        }
      }
      if (changed) await persistEngines()
    } else {
      await chrome.storage.sync.set({ [STORAGE_KEY]: DEFAULT_ENGINES })
    }
    currentEngine.value = engines.value.find(e => e.isDefault) || engines.value[0]
    loaded.value = true
  }

  async function persistEngines() {
    if (typeof chrome === 'undefined' || !chrome.storage) return
    await chrome.storage.sync.set({ [STORAGE_KEY]: engines.value })
  }

  function selectEngine(engine) {
    engines.value.forEach(e => (e.isDefault = e.id === engine.id))
    currentEngine.value = engine
    persistEngines()
  }

  function search(query) {
    const engine = currentEngine.value
    if (!engine || !query.trim()) return
    const q = query.trim()

    if (engine.behavior === 'clipboard') {
      // 不支持 URL 预填的服务：复制到剪贴板 + 打开首页
      // 不 await，确保 window.open 在用户手势内同步调用，避免被浏览器拦截
      navigator.clipboard.writeText(q).catch(() => {})
      if (isSafeUrl(engine.url)) {
        window.open(engine.url, '_blank')
      }
      return
    }

    // 默认：URL 占位符替换
    const url = engine.url.replace('%s', encodeURIComponent(q))
    if (isSafeUrl(url)) {
      window.open(url, '_blank')
    }
  }

  function addEngine(engine) {
    if (!isSafeUrl(engine.url)) return
    const id = 'custom_' + Date.now()
    engines.value.push({ ...engine, id, isDefault: false, category: 'custom' })
    persistEngines()
  }

  function updateEngine(id, updates) {
    if (updates.url && !isSafeUrl(updates.url)) return
    const idx = engines.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      engines.value[idx] = { ...engines.value[idx], ...updates }
      persistEngines()
    }
  }

  function deleteEngine(id) {
    const idx = engines.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      engines.value.splice(idx, 1)
      if (currentEngine.value?.id === id) {
        currentEngine.value = engines.value[0]
      }
      persistEngines()
    }
  }

  return {
    engines,
    currentEngine,
    loaded,
    loadEngines,
    selectEngine,
    search,
    addEngine,
    updateEngine,
    deleteEngine,
  }
}
