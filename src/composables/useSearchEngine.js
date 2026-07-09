import { ref, watch } from 'vue'
import { isSafeUrl } from '../utils/safeUrl.js'

const DEFAULT_ENGINES = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=%s', isDefault: true },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=%s', isDefault: false },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s', isDefault: false },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q=%s', isDefault: false },
  { id: 'stackoverflow', name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=%s', isDefault: false },
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
    const url = engine.url.replace('%s', encodeURIComponent(query.trim()))
    if (isSafeUrl(url)) {
      window.open(url, '_blank')
    }
  }

  function addEngine(engine) {
    if (!isSafeUrl(engine.url)) return
    const id = 'custom_' + Date.now()
    engines.value.push({ ...engine, id, isDefault: false })
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
