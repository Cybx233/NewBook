<script setup>
import { ref, onMounted } from 'vue'
import { useSearchEngine } from '../composables/useSearchEngine.js'

const emit = defineEmits(['close'])

const { engines, currentEngine, loaded, loadEngines, selectEngine, addEngine, updateEngine, deleteEngine } = useSearchEngine()

const showAddForm = ref(false)
const newName = ref('')
const newUrl = ref('')
const editingId = ref(null)
const editName = ref('')
const editUrl = ref('')

onMounted(async () => {
  await loadEngines()
})

function startAdd() {
  showAddForm.value = true
  newName.value = ''
  newUrl.value = ''
}

function submitAdd() {
  if (!newName.value.trim() || !newUrl.value.trim()) return
  addEngine({ name: newName.value.trim(), url: newUrl.value.trim() })
  showAddForm.value = false
}

function startEdit(engine) {
  editingId.value = engine.id
  editName.value = engine.name
  editUrl.value = engine.url
}

function submitEdit() {
  if (!editName.value.trim() || !editUrl.value.trim()) return
  updateEngine(editingId.value, { name: editName.value.trim(), url: editUrl.value.trim() })
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

function onDeleteEngine(id) {
  if (engines.value.length <= 1) return
  deleteEngine(id)
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" @click.self="emit('close')">
      <div class="bg-terminal-card border border-terminal-border rounded-xl p-5 w-[480px] max-h-[80vh] overflow-y-auto shadow-2xl font-mono">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-terminal-text text-sm">&gt;_ 搜索引擎设置</h3>
          <button class="text-terminal-text-muted hover:text-terminal-text-secondary transition-colors" @click="emit('close')">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 引擎列表 -->
        <div class="space-y-1 mb-4">
          <div
            v-for="engine in engines"
            :key="engine.id"
            class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors border"
            :class="engine.id === currentEngine?.id ? 'bg-terminal-input border-terminal-border-hover' : 'border-transparent hover:bg-terminal-input/50'"
          >
            <!-- 编辑模式 -->
            <template v-if="editingId === engine.id">
              <input v-model="editName" class="w-24 flex-shrink-0 bg-terminal-bg border border-terminal-border rounded px-2 py-1 text-xs text-terminal-text outline-none focus:border-terminal-border-hover" placeholder="名称" />
              <input v-model="editUrl" class="flex-1 min-w-0 bg-terminal-bg border border-terminal-border rounded px-2 py-1 text-xs text-terminal-text outline-none focus:border-terminal-border-hover" placeholder="URL (%s)" />
              <button class="flex-shrink-0 px-2 py-1 text-xs text-terminal-text-secondary hover:text-terminal-text" @click="submitEdit">保存</button>
              <button class="flex-shrink-0 px-2 py-1 text-xs text-terminal-text-muted hover:text-terminal-text-secondary" @click="cancelEdit">取消</button>
            </template>

            <!-- 显示模式 -->
            <template v-else>
              <span class="flex-1 text-xs text-terminal-text">{{ engine.name }}</span>
              <span class="text-[10px] text-terminal-text-muted truncate max-w-[180px] hidden sm:block">{{ engine.url }}</span>
              <button
                class="px-2 py-1 text-[10px] transition-colors"
                :class="engine.id === currentEngine?.id ? 'text-terminal-text-secondary' : 'text-terminal-text-muted hover:text-terminal-text-secondary'"
                @click="selectEngine(engine)"
              >
                {{ engine.id === currentEngine?.id ? '当前' : '使用' }}
              </button>
              <button class="px-2 py-1 text-[10px] text-terminal-text-muted hover:text-terminal-text-secondary transition-colors" @click="startEdit(engine)">编辑</button>
              <button
                v-if="engines.length > 1"
                class="px-2 py-1 text-[10px] text-terminal-text-muted transition-colors hover:text-[var(--t-danger)]"
                @click="onDeleteEngine(engine.id)"
              >删除</button>
            </template>
          </div>
        </div>

        <!-- 新增引擎 -->
        <div v-if="showAddForm" class="flex flex-col gap-2 mt-3 p-3 bg-terminal-input rounded-lg border border-terminal-border">
          <input v-model="newName" class="bg-terminal-bg border border-terminal-border rounded px-3 py-1.5 text-xs text-terminal-text outline-none focus:border-terminal-border-hover" placeholder="名称 (如 GitHub)" />
          <input v-model="newUrl" class="bg-terminal-bg border border-terminal-border rounded px-3 py-1.5 text-xs text-terminal-text outline-none focus:border-terminal-border-hover" placeholder="URL (如 https://github.com/search?q=%s)" />
          <div class="flex justify-end gap-2 mt-1">
            <button class="px-3 py-1 text-xs text-terminal-text-muted hover:text-terminal-text-secondary" @click="showAddForm = false">取消</button>
            <button class="px-3 py-1 text-xs bg-terminal-text/90 text-terminal-bg hover:bg-terminal-text rounded" @click="submitAdd">添加</button>
          </div>
        </div>

        <button
          v-if="!showAddForm"
          class="w-full mt-3 py-2 text-xs text-terminal-text-muted hover:text-terminal-text-secondary border border-dashed border-terminal-border hover:border-terminal-border-hover rounded-lg transition-colors"
          @click="startAdd"
        >
          + 添加搜索引擎
        </button>
      </div>
    </div>
  </Teleport>
</template>
