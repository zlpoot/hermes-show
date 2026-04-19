<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">任务队列</h1>
        <p class="text-sm text-muted-foreground mt-1">管理和监控异步任务执行</p>
      </div>
      <button @click="showAddModal = true" 
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
        <Plus size="18" />
        新建任务
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted-foreground">待处理</span>
          <Clock size="16" class="text-amber-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono mt-1">{{ stats.pending }}</h3>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted-foreground">执行中</span>
          <Loader2 size="16" class="text-blue-400 animate-spin" />
        </div>
        <h3 class="text-2xl font-bold font-mono mt-1">{{ stats.in_progress }}</h3>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted-foreground">已完成</span>
          <CheckCircle size="16" class="text-green-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono mt-1">{{ stats.completed }}</h3>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted-foreground">失败</span>
          <XCircle size="16" class="text-red-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono mt-1">{{ stats.failed }}</h3>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted-foreground">总计</span>
          <ListTodo size="16" class="text-primary" />
        </div>
        <h3 class="text-2xl font-bold font-mono mt-1">{{ stats.total }}</h3>
      </div>
    </div>

    <!-- Current Task -->
    <div v-if="stats.currentTask" class="glass-panel p-6 border-primary/50">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Loader2 size="18" class="text-primary animate-spin" />
          当前执行中
        </h3>
        <span class="text-xs text-muted-foreground">
          已执行 {{ stats.currentTask.duration }} 分钟
        </span>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">#{{ stats.currentTask.id }} {{ stats.currentTask.title }}</p>
          <p class="text-xs text-muted-foreground mt-1">
            开始于 {{ formatTime(stats.currentTask.started_at) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="glass-panel p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <Filter size="16" class="text-muted-foreground" />
          <select v-model="filters.status" @change="loadTasks" 
                  class="bg-card border border-card-border rounded-lg px-3 py-1.5 text-sm">
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="in_progress">执行中</option>
            <option value="completed">已完成</option>
            <option value="failed">失败</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
        
        <div class="flex items-center gap-2">
          <select v-model="filters.priority" @change="loadTasks"
                  class="bg-card border border-card-border rounded-lg px-3 py-1.5 text-sm">
            <option value="all">全部优先级</option>
            <option value="1">P1 - 最高</option>
            <option value="2">P2 - 高</option>
            <option value="3">P3 - 中高</option>
            <option value="4">P4 - 中</option>
            <option value="5">P5 - 普通</option>
          </select>
        </div>
        
        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <Search size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input v-model="filters.search" @input="debouncedSearch" 
                   placeholder="搜索任务..."
                   class="w-full bg-card border border-card-border rounded-lg pl-9 pr-3 py-1.5 text-sm" />
          </div>
        </div>
        
        <button @click="loadTasks" class="p-2 hover:bg-muted/30 rounded-lg transition-colors">
          <RefreshCw size="16" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- Task List -->
    <div class="glass-panel p-6">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-card-border">
              <th class="text-left py-3 px-4 font-medium text-muted-foreground w-16">ID</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">标题</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground w-24">优先级</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground w-28">状态</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground w-40">创建时间</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground w-32">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in tasks" :key="task.id" 
                class="border-b border-card-border/50 hover:bg-muted/30 transition-colors">
              <td class="py-3 px-4 font-mono text-xs">#{{ task.id }}</td>
              <td class="py-3 px-4">
                <div>
                  <p class="font-medium">{{ task.title }}</p>
                  <p v-if="task.description" class="text-xs text-muted-foreground truncate max-w-xs">
                    {{ task.description }}
                  </p>
                </div>
              </td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-md text-xs" 
                      :class="getPriorityClass(task.priority)">
                  P{{ task.priority }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span class="flex items-center gap-1.5">
                  <div class="w-2 h-2 rounded-full" :class="getStatusDotClass(task.status)"></div>
                  <span :class="getStatusTextClass(task.status)">{{ getStatusLabel(task.status) }}</span>
                </span>
              </td>
              <td class="py-3 px-4 text-xs text-muted-foreground">
                {{ formatTime(task.created_at) }}
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <button @click="editTask(task)" 
                          class="p-1.5 hover:bg-muted/50 rounded transition-colors"
                          :disabled="task.status === 'in_progress'">
                    <Edit2 size="14" class="text-muted-foreground hover:text-primary" />
                  </button>
                  <button @click="deleteTask(task)" 
                          class="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                          :disabled="task.status === 'in_progress'">
                    <Trash2 size="14" class="text-muted-foreground hover:text-red-400" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="!tasks.length" class="text-center py-12 text-muted-foreground">
          <ListTodo size="48" class="mx-auto mb-4 opacity-50" />
          <p>暂无任务</p>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between mt-4 pt-4 border-t border-card-border">
        <p class="text-sm text-muted-foreground">
          共 {{ total }} 个任务，第 {{ page }} / {{ totalPages }} 页
        </p>
        <div class="flex items-center gap-2">
          <button @click="prevPage" :disabled="page <= 1"
                  class="px-3 py-1.5 bg-card border border-card-border rounded-lg hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            上一页
          </button>
          <button @click="nextPage" :disabled="page >= totalPages"
                  class="px-3 py-1.5 bg-card border border-card-border rounded-lg hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || editingTask" 
         class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
         @click.self="closeModal">
      <div class="glass-panel p-6 w-full max-w-lg">
        <h3 class="text-lg font-semibold mb-4">
          {{ editingTask ? '编辑任务' : '新建任务' }}
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">标题 *</label>
            <input v-model="taskForm.title" 
                   class="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-sm"
                   placeholder="任务标题" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">描述</label>
            <textarea v-model="taskForm.description" rows="3"
                      class="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="任务详细描述..."></textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">优先级</label>
              <select v-model="taskForm.priority"
                      class="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-sm">
                <option :value="1">P1 - 最高</option>
                <option :value="2">P2 - 高</option>
                <option :value="3">P3 - 中高</option>
                <option :value="4">P4 - 中</option>
                <option :value="5">P5 - 普通</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">Discord 通知</label>
              <select v-model="taskForm.notify_discord"
                      class="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-sm">
                <option :value="true">开启</option>
                <option :value="false">关闭</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button @click="closeModal"
                  class="px-4 py-2 bg-card border border-card-border rounded-lg hover:border-primary/50 transition-colors">
            取消
          </button>
          <button @click="saveTask"
                  class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            {{ editingTask ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast" 
         class="fixed bottom-4 right-4 px-4 py-3 rounded-xl border shadow-lg z-50"
         :class="toast.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { 
  Plus, Clock, Loader2, CheckCircle, XCircle, ListTodo, Filter, Search, RefreshCw,
  Edit2, Trash2
} from 'lucide-vue-next'

// State
const loading = ref(false)
const tasks = ref<any[]>([])
const stats = ref<any>({ pending: 0, in_progress: 0, completed: 0, failed: 0, total: 0 })
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)
const showAddModal = ref(false)
const editingTask = ref<any>(null)
const toast = ref<{ type: string, message: string } | null>(null)

const filters = reactive({
  status: 'all',
  priority: 'all',
  search: ''
})

const taskForm = reactive({
  title: '',
  description: '',
  priority: 5,
  notify_discord: true
})

let searchTimeout: any = null

// Methods
const loadTasks = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      pageSize: pageSize.value.toString(),
      ...(filters.status !== 'all' && { status: filters.status }),
      ...(filters.priority !== 'all' && { priority: filters.priority }),
      ...(filters.search && { search: filters.search })
    })
    
    const res = await $fetch(`/api/tasks/queue?${params}`)
    tasks.value = res.tasks || []
    total.value = res.total || 0
    totalPages.value = res.totalPages || 1
  } catch (e) {
    showToast('error', '加载任务失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    stats.value = await $fetch('/api/tasks/stats')
  } catch (e) {
    console.error('Failed to load stats')
  }
}

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    loadTasks()
  }, 300)
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadTasks()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadTasks()
  }
}

const editTask = (task: any) => {
  editingTask.value = task
  taskForm.title = task.title
  taskForm.description = task.description || ''
  taskForm.priority = task.priority
  taskForm.notify_discord = task.notify_discord
}

const deleteTask = async (task: any) => {
  // 直接删除，不使用 confirm
  try {
    await $fetch(`/api/tasks/queue?id=${task.id}`, { method: 'DELETE' })
    showToast('success', `任务 #${task.id} 已删除`)
    loadTasks()
    loadStats()
  } catch (e: any) {
    const msg = e.data?.error || '删除失败'
    showToast('error', msg)
  }
}

const saveTask = async () => {
  if (!taskForm.title.trim()) {
    showToast('error', '请输入任务标题')
    return
  }
  
  try {
    if (editingTask.value) {
      // Update
      await $fetch('/api/tasks/queue', {
        method: 'PUT',
        body: {
          id: editingTask.value.id,
          title: taskForm.title,
          priority: taskForm.priority
        }
      })
      showToast('success', '任务已更新')
    } else {
      // Create
      await $fetch('/api/tasks/queue', {
        method: 'POST',
        body: taskForm
      })
      showToast('success', '任务已创建')
    }
    
    closeModal()
    loadTasks()
    loadStats()
  } catch (e) {
    showToast('error', editingTask.value ? '更新失败' : '创建失败')
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingTask.value = null
  taskForm.title = ''
  taskForm.description = ''
  taskForm.priority = 5
  taskForm.notify_discord = true
}

const showToast = (type: string, message: string) => {
  toast.value = { type, message }
  setTimeout(() => { toast.value = null }, 3000)
}

// Helpers
const formatTime = (time: string) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待处理',
    in_progress: '执行中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return labels[status] || status
}

const getStatusDotClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'bg-amber-400',
    in_progress: 'bg-blue-400 animate-pulse',
    completed: 'bg-green-400',
    failed: 'bg-red-400',
    cancelled: 'bg-gray-400'
  }
  return classes[status] || 'bg-gray-400'
}

const getStatusTextClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'text-amber-400',
    in_progress: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
    cancelled: 'text-gray-400'
  }
  return classes[status] || ''
}

const getPriorityClass = (priority: number) => {
  if (priority <= 2) return 'bg-red-500/20 text-red-400'
  if (priority <= 4) return 'bg-amber-500/20 text-amber-400'
  return 'bg-muted text-muted-foreground'
}

// Lifecycle
onMounted(() => {
  loadTasks()
  loadStats()
  // Auto refresh every 30s
  setInterval(loadStats, 30000)
})
</script>
