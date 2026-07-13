<script setup>
import { ref, provide, onMounted, onUnmounted } from 'vue'
import SearchBar from './components/SearchBar.vue'
import BookmarkFolder from './components/BookmarkFolder.vue'
import ContextMenu from './components/ContextMenu.vue'
import EngineEditor from './components/EngineEditor.vue'
import { useBookmarks } from './composables/useBookmarks.js'
import { useTheme } from './composables/useTheme.js'

const { bookmarkMap, loading, topLevelFolderIds, useChildren, getTotalChildrenCount, createBookmark, updateBookmark, removeBookmark, sortMode, sortLabel, cycleSortMode, init, destroy } = useBookmarks()
const { themeLabel, cycleTheme, init: initTheme } = useTheme()

provide('bookmarkMap', bookmarkMap)

const contextMenu = ref({ show: false, x: 0, y: 0, bookmark: null })
const showEngineEditor = ref(false)

function openContextMenu(e, bookmark) {
  e.preventDefault()
  contextMenu.value = { show: true, x: e.clientX, y: e.clientY, bookmark }
}

function closeContextMenu() {
  contextMenu.value.show = false
}

function openEngineEditor() {
  showEngineEditor.value = true
}

function closeEngineEditor() {
  showEngineEditor.value = false
}

onMounted(() => {
  initTheme()
  init()
})

onUnmounted(() => {
  destroy()
})
</script>

<template>
  <div class="min-h-screen bg-terminal-bg text-terminal-text flex flex-col font-mono" @click="closeContextMenu">
    <!-- 顶部：搜索栏 -->
    <div class="mx-auto w-full max-w-5xl px-6 pt-20">
      <SearchBar @open-settings="openEngineEditor" />
      <div class="flex justify-end mt-1.5 items-center gap-3">
        <span
          class="text-[10px] cursor-pointer hover:text-terminal-text-secondary transition-colors select-none"
          style="color: var(--t-text-micro)"
          @click="cycleTheme"
        >
          theme: {{ themeLabel }}
        </span>
        <span
          class="text-[10px] cursor-pointer hover:text-terminal-text-secondary transition-colors select-none"
          style="color: var(--t-text-micro)"
          @click="cycleSortMode"
        >
          sort: {{ sortLabel }}
        </span>
      </div>
    </div>

    <!-- 加载态 -->
    <div v-if="loading" class="mx-auto w-full max-w-5xl px-6 mt-10">
      <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-1.5">
        <div v-for="i in 8" :key="i" class="h-[52px] bg-terminal-card border border-terminal-border rounded-lg skeleton" />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="topLevelFolderIds.length === 0" class="flex-1 flex items-center justify-center text-terminal-text-muted">
      <div class="text-center">
        <div class="text-5xl mb-4">📑</div>
        <p class="text-sm">&gt;_ 暂无书签</p>
        <p class="text-[11px] mt-1">在浏览器收藏夹中添加书签后，他们会出现在这里</p>
      </div>
    </div>

    <!-- 底部：书签文件夹 -->
    <div v-else class="mx-auto w-full max-w-5xl px-6 pb-12 mt-auto pt-10 space-y-8">
      <BookmarkFolder
        v-for="folderId in topLevelFolderIds"
        :key="folderId"
        :folder-id="folderId"
        :depth="0"
        :use-children="useChildren"
        :get-total-children-count="getTotalChildrenCount"
        @contextmenu="openContextMenu"
      />
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      v-if="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :bookmark="contextMenu.bookmark"
      @close="closeContextMenu"
      @edit="(b) => updateBookmark(b.id, { title: b.title, url: b.url })"
      @delete="(b) => removeBookmark(b.id)"
      @create="(parentId, info) => createBookmark(parentId, info)"
    />

    <!-- 搜索引擎编辑器 -->
    <EngineEditor v-if="showEngineEditor" @close="closeEngineEditor" />
  </div>
</template>
