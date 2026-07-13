import { ref, computed } from 'vue'

const THEME_LABELS = { ink: '墨色', rice: '宣纸', blue: '青墨', bamboo: '竹风' }
const THEME_ORDER = ['ink', 'rice', 'blue', 'bamboo']

export function useTheme() {
  const theme = ref('ink')
  const themeLabel = computed(() => THEME_LABELS[theme.value] || 'ink')

  function applyTheme(id) {
    document.documentElement.dataset.theme = id
    theme.value = id
  }

  async function init() {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      applyTheme('ink')
      return
    }
    try {
      const result = await chrome.storage.sync.get('theme')
      if (result.theme && THEME_ORDER.includes(result.theme)) {
        applyTheme(result.theme)
      } else {
        applyTheme('ink')
      }
    } catch {
      applyTheme('ink')
    }
  }

  function cycleTheme() {
    const idx = THEME_ORDER.indexOf(theme.value)
    const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length]
    applyTheme(next)
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ theme: next })
    }
  }

  return { theme, themeLabel, cycleTheme, init }
}
