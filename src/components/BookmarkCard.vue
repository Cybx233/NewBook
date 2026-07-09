<script setup>
import { ref, computed } from 'vue'
import { isSafeUrl } from '../utils/safeUrl.js'

const props = defineProps({
  bookmark: { type: Object, required: true },
  isFolder: { type: Boolean, default: false },
  showInsertBefore: { type: Boolean, default: false },
})

const emit = defineEmits(['click', 'contextmenu', 'dragoverReorder', 'dropReorder'])

const showFallback = ref(false)
const isDragging = ref(false)
const isPressed = ref(false)

function onDragStart(e) {
  if (props.isFolder) return
  isDragging.value = true
  e.dataTransfer.setData('text/plain', props.bookmark.id)
  e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  isDragging.value = false
  isPressed.value = false
}

function onDragOverForeign(e) {
  if (props.isFolder) return
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer.dropEffect = 'move'
  emit('dragoverReorder', props.bookmark.id)
}

function onDropForeign(e) {
  e.preventDefault()
  e.stopPropagation()
  const bookmarkId = e.dataTransfer.getData('text/plain')
  if (bookmarkId && bookmarkId !== props.bookmark.id) {
    emit('dropReorder', bookmarkId, props.bookmark.id)
  }
}

const faviconUrl = computed(() => {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome.runtime.getURL('/_favicon/?pageUrl=' + encodeURIComponent(props.bookmark.url || 'about:blank') + '&size=32')
  }
  return null
})

function onFaviconError(e) {
  showFallback.value = true
}

const displayDomain = computed(() => {
  try { return new URL(props.bookmark.url).hostname.replace(/^www\./, '') }
  catch { return '' }
})

function handleClick(e) {
  if (props.isFolder) {
    emit('click')
    return
  }
  if (!isSafeUrl(props.bookmark.url)) return
  if (e.ctrlKey || e.metaKey) {
    window.open(props.bookmark.url, '_blank')
    return
  }
  window.location.href = props.bookmark.url
}

function handleMouseDown(e) {
  if (e.button === 0 || e.button === 1) {
    isPressed.value = true
  }
  if (e.button === 1 && !props.isFolder) {
    e.preventDefault()
    if (isSafeUrl(props.bookmark.url)) {
      window.open(props.bookmark.url, '_blank')
    }
  }
}

function handleMouseUp() {
  isPressed.value = false
}

function handleContextmenu(e) {
  emit('contextmenu', e)
}
</script>

<template>
  <div
    class="bookmark-card flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg cursor-pointer select-none border transition-all duration-150 group"
    :class="{ 'opacity-40': isDragging, 'insert-before': showInsertBefore, 'is-pressed': isPressed && !isDragging }"
    style="background: #181715;"
    :data-bookmark-id="bookmark.id"
    :draggable="!isFolder"
    @click="handleClick"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @contextmenu="handleContextmenu"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dragover="onDragOverForeign"
    @drop="onDropForeign"
  >
    <!-- Favicon / Folder icon -->
    <div class="relative flex-shrink-0 w-[22px] h-[22px] rounded-[5px] flex items-center justify-center" style="background: #1c1c1c;">
      <img
        v-if="bookmark.url && !showFallback"
        :src="faviconUrl"
        class="w-[15px] h-[15px] object-contain"
        @error="onFaviconError"
        loading="lazy"
        alt=""
      />
      <div v-if="showFallback" class="w-[15px] h-[15px] flex items-center justify-center">
        <svg class="w-3 h-3 text-terminal-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      </div>
      <svg v-if="isFolder" class="w-[15px] h-[15px] text-terminal-text-muted" fill="currentColor" viewBox="0 0 24 24">
        <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v1H2V6z" />
        <path d="M2 9v9a2 2 0 002 2h16a2 2 0 002-2V9H2z" />
      </svg>
    </div>

    <!-- 文本区 -->
    <div class="flex flex-col min-w-0 gap-y-1 leading-tight">
      <span class="text-[13px] truncate font-sans font-medium" :class="isFolder ? 'text-terminal-text-secondary' : 'text-terminal-text'">
        {{ bookmark.title }}
      </span>
      <span v-if="!isFolder && displayDomain" class="text-[11px] text-[#555] truncate font-mono">
        {{ displayDomain }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.bookmark-card {
  border-color: #1e1e1e;
}
.bookmark-card.insert-before {
  border-color: #1e1e1e;
  border-left-color: #666;
}
.bookmark-card:hover {
  border-color: #2e2e2e;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}
.bookmark-card.insert-before:hover {
  border-color: #2e2e2e;
  border-left-color: #666;
}
.bookmark-card.is-pressed {
  transform: scale(0.97);
  background: #1e1c1a;
  transition: transform 80ms ease, background 80ms ease;
}
</style>
