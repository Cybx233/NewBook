<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  bookmark: { type: Object, required: true },
})

const emit = defineEmits(['close', 'edit', 'delete', 'create'])

const menuRef = ref(null)
const menuStyle = ref({})
const showEditModal = ref(false)
const showNewModal = ref(false)
const showDeleteConfirm = ref(false)
const editTitle = ref('')
const editUrl = ref('')
const newTitle = ref('')
const newUrl = ref('')

function adjustPosition() {
  const rect = menuRef.value?.getBoundingClientRect()
  if (!rect) {
    menuStyle.value = { left: props.x + 'px', top: props.y + 'px' }
    return
  }
  let left = props.x
  let top = props.y
  if (left + rect.width > window.innerWidth) left = window.innerWidth - rect.width - 8
  if (top + rect.height > window.innerHeight) top = window.innerHeight - rect.height - 8
  menuStyle.value = { left: left + 'px', top: top + 'px' }
}

function onWindowClick() {
  if (!mounted) return
  if (showEditModal.value || showNewModal.value || showDeleteConfirm.value) return
  emit('close')
}

function onWindowBlur() {
  emit('close')
}

function openEdit() {
  editTitle.value = props.bookmark.title
  editUrl.value = props.bookmark.url || ''
  showEditModal.value = true
}

function submitEdit() {
  emit('edit', { ...props.bookmark, title: editTitle.value, url: editUrl.value })
  showEditModal.value = false
  emit('close')
}

function closeEdit() {
  showEditModal.value = false
  emit('close')
}

function openNew() {
  newTitle.value = ''
  newUrl.value = ''
  showNewModal.value = true
}

function submitNew() {
  emit('create', props.bookmark.parentId || props.bookmark.id, { title: newTitle.value, url: newUrl.value })
  showNewModal.value = false
  emit('close')
}

function closeNew() {
  showNewModal.value = false
  emit('close')
}

function confirmDelete() {
  emit('delete', props.bookmark)
  showDeleteConfirm.value = false
  emit('close')
}

function cancelDelete() {
  showDeleteConfirm.value = false
  emit('close')
}

function openDeleteConfirm() {
  showDeleteConfirm.value = true
}

const isFolder = !!props.bookmark.children

const showMenu = computed(() => !showEditModal.value && !showNewModal.value && !showDeleteConfirm.value)

let mounted = false

onMounted(async () => {
  await nextTick()
  adjustPosition()
  setTimeout(() => {
    mounted = true
    window.addEventListener('click', onWindowClick)
    window.addEventListener('blur', onWindowBlur)
  }, 0)
})

onUnmounted(() => {
  window.removeEventListener('click', onWindowClick)
  window.removeEventListener('blur', onWindowBlur)
})
</script>

<template>
  <Teleport to="body">
    <!-- 右键菜单 -->
    <div
      v-if="showMenu"
      ref="menuRef"
      class="fixed bg-terminal-card border border-terminal-border rounded-lg shadow-2xl shadow-black/40 py-1 min-w-[150px] font-mono z-[9999]"
      :style="menuStyle"
      @click.stop
    >
      <button class="w-full text-left px-3.5 py-1.5 text-xs text-terminal-text-secondary hover:bg-terminal-input transition-colors" @click="openEdit">
        {{ isFolder ? '重命名' : '编辑' }}
      </button>
      <button v-if="isFolder" class="w-full text-left px-3.5 py-1.5 text-xs text-terminal-text-secondary hover:bg-terminal-input transition-colors" @click="openNew">
        新增书签
      </button>
      <div class="border-t border-terminal-border my-1" />
      <button class="w-full text-left px-3.5 py-1.5 text-xs transition-colors hover:bg-terminal-input" style="color: var(--t-danger)" @click="openDeleteConfirm">
        删除
      </button>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div class="bg-terminal-card border border-terminal-border rounded-xl p-5 w-96 shadow-2xl font-mono" @click.stop>
        <h3 class="text-terminal-text text-sm mb-4">&gt;_ {{ isFolder ? '重命名文件夹' : '编辑书签' }}</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-[11px] text-terminal-text-muted mb-1">名称</label>
            <input v-model="editTitle" class="w-full bg-terminal-input border border-terminal-border rounded-lg px-3 py-2 text-xs text-terminal-text outline-none focus:border-terminal-border-hover transition-colors" />
          </div>
          <div v-if="bookmark.url !== undefined && !isFolder">
            <label class="block text-[11px] text-terminal-text-muted mb-1">URL</label>
            <input v-model="editUrl" class="w-full bg-terminal-input border border-terminal-border rounded-lg px-3 py-2 text-xs text-terminal-text outline-none focus:border-terminal-border-hover transition-colors" />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-5">
          <button class="px-3.5 py-1.5 text-xs text-terminal-text-muted hover:text-terminal-text-secondary transition-colors" @click="closeEdit">取消</button>
          <button class="px-3.5 py-1.5 text-xs bg-terminal-text/90 text-terminal-bg hover:bg-terminal-text rounded-lg transition-colors" @click="submitEdit">保存</button>
        </div>
      </div>
    </div>

    <!-- 新增书签弹窗 -->
    <div v-if="showNewModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div class="bg-terminal-card border border-terminal-border rounded-xl p-5 w-96 shadow-2xl font-mono" @click.stop>
        <h3 class="text-terminal-text text-sm mb-4">&gt;_ 新增书签</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-[11px] text-terminal-text-muted mb-1">名称</label>
            <input v-model="newTitle" class="w-full bg-terminal-input border border-terminal-border rounded-lg px-3 py-2 text-xs text-terminal-text outline-none focus:border-terminal-border-hover transition-colors" />
          </div>
          <div>
            <label class="block text-[11px] text-terminal-text-muted mb-1">URL</label>
            <input v-model="newUrl" class="w-full bg-terminal-input border border-terminal-border rounded-lg px-3 py-2 text-xs text-terminal-text outline-none focus:border-terminal-border-hover transition-colors" />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-5">
          <button class="px-3.5 py-1.5 text-xs text-terminal-text-muted hover:text-terminal-text-secondary transition-colors" @click="closeNew">取消</button>
          <button class="px-3.5 py-1.5 text-xs bg-terminal-text/90 text-terminal-bg hover:bg-terminal-text rounded-lg transition-colors" @click="submitNew">创建</button>
        </div>
      </div>
    </div>

    <!-- 删除确认 -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div class="bg-terminal-card border border-terminal-border rounded-xl p-5 w-80 shadow-2xl font-mono" @click.stop>
        <h3 class="text-terminal-text text-sm mb-2">&gt;_ 确认删除</h3>
        <p class="text-xs text-terminal-text-secondary">
          {{ isFolder ? `删除文件夹「${bookmark.title}」及其所有书签？` : `删除书签「${bookmark.title}」？` }}
        </p>
        <p class="text-[10px] text-terminal-text-muted mt-1">此操作不可撤销</p>
        <div class="flex justify-end gap-2 mt-5">
          <button class="px-3.5 py-1.5 text-xs text-terminal-text-muted hover:text-terminal-text-secondary transition-colors" @click="cancelDelete">取消</button>
          <button
            class="px-3.5 py-1.5 text-xs text-white rounded-lg transition-colors"
            :style="{ background: 'var(--t-danger)' }"
            @click="confirmDelete"
          >删除</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
