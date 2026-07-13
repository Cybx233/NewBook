<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useSearchEngine } from '../composables/useSearchEngine.js'

const CATEGORY_LABELS = { search: '搜索', ai: 'AI 对话', custom: '自定义' }

const emit = defineEmits(['openSettings'])

const { engines, currentEngine, loaded, loadEngines, selectEngine, search } = useSearchEngine()

const groupedEngines = computed(() => {
  const groups = {}
  for (const e of engines.value) {
    const cat = e.category || 'custom'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(e)
  }
  const order = ['search', 'ai', 'custom']
  return order
    .filter(cat => groups[cat]?.length)
    .map(cat => ({
      label: CATEGORY_LABELS[cat] || '',
      engines: groups[cat],
    }))
})

const query = ref('')
const showEngineList = ref(false)
const inputRef = ref(null)

function onSearch() {
  search(query.value)
}

function onSelectEngine(engine) {
  selectEngine(engine)
  showEngineList.value = false
  nextTick(() => inputRef.value?.focus())
}

function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    inputRef.value?.focus()
    return
  }

  if (e.key === 'Tab' && showEngineList.value) {
    e.preventDefault()
    const idx = engines.value.findIndex(en => en.id === currentEngine.value?.id)
    const next = engines.value[(idx + 1) % engines.value.length]
    selectEngine(next)
  }

  if (
    document.activeElement === document.body &&
    e.key.length === 1 &&
    !e.ctrlKey && !e.metaKey && !e.altKey
  ) {
    inputRef.value?.focus()
    query.value = e.key
  }
}

onMounted(async () => {
  await loadEngines()
  nextTick(() => inputRef.value?.focus())
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="relative font-mono">
    <form
      class="flex items-center gap-2.5 bg-terminal-input border border-terminal-border rounded-lg px-3.5 py-2.5 transition-all duration-150 search-form"
      @submit.prevent="onSearch"
    >
      <!-- 引擎切换 pill -->
      <button
        type="button"
        class="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-terminal-input border border-terminal-border text-terminal-text-secondary hover:text-terminal-text hover:border-terminal-border-hover transition-colors"
        @click="showEngineList = !showEngineList"
      >
        <span>{{ currentEngine?.name || 'Search' }}</span>
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- >_ 前缀 -->
      <span class="flex-shrink-0 text-sm text-terminal-text-muted select-none">&gt;_</span>

      <!-- 输入框 -->
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        placeholder="搜索或输入网址..."
        class="flex-1 bg-transparent text-terminal-text placeholder:text-terminal-text-muted outline-none text-sm"
      />

      <!-- ⌘K 快捷键 -->
      <span class="flex-shrink-0 text-xs text-terminal-text-muted hidden sm:block">
        ⌘K
      </span>

      <!-- 设置 -->
      <button
        type="button"
        class="flex-shrink-0 p-1 rounded text-terminal-text-muted hover:text-terminal-text-secondary transition-colors"
        @click="emit('openSettings')"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </form>

    <!-- 引擎下拉 -->
    <div
      v-if="showEngineList"
      class="absolute top-full left-0 mt-1.5 w-52 bg-terminal-card border border-terminal-border rounded-lg shadow-xl overflow-hidden z-50"
    >
      <template v-for="(group, gIdx) in groupedEngines" :key="gIdx">
        <!-- 分组标签 -->
        <div
          v-if="group.label"
          class="px-3.5 pt-2.5 pb-1 text-[10px] font-medium text-terminal-text-muted/50 uppercase tracking-wider"
        >{{ group.label }}</div>
        <button
          v-for="engine in group.engines"
          :key="engine.id"
          class="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left hover:bg-terminal-input transition-colors"
          :class="engine.id === currentEngine?.id ? 'text-terminal-text bg-terminal-input' : 'text-terminal-text-secondary'"
          @click="onSelectEngine(engine)"
        >
          <span>{{ engine.name }}</span>
          <span v-if="engine.id === currentEngine?.id" class="ml-auto text-terminal-text-muted">&#10003;</span>
        </button>
        <!-- 分隔线 -->
        <div v-if="group.label && gIdx < groupedEngines.length - 1" class="mx-3 border-t border-terminal-border" />
      </template>
    </div>

    <div v-if="showEngineList" class="fixed inset-0 z-40" @click="showEngineList = false" />
  </div>
</template>

<style scoped>
.search-form:focus-within {
  border-color: var(--t-accent);
}
</style>
