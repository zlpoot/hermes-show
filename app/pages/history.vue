<template>
  <div class="h-[calc(100vh-10rem)] flex gap-6">
    <!-- Session List -->
    <div class="w-80 glass-panel flex flex-col overflow-hidden">
      <ClientOnly>
        <template #fallback>
          <div class="p-4 border-b border-card-border">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold flex items-center gap-2">
                <History :size="18" class="text-primary" />
                会话历史
              </h3>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-2">
            <div class="h-full flex items-center justify-center text-muted-foreground">
              <Loader2 :size="24" class="animate-spin" />
            </div>
          </div>
        </template>
        
        <div class="p-4 border-b border-card-border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold flex items-center gap-2">
              <History :size="18" class="text-primary" />
              会话历史
            </h3>
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors" v-if="sessions.length > 0">
                <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" class="w-3.5 h-3.5 rounded border-card-border text-primary focus:ring-primary cursor-pointer" />
                全选
              </label>
              <button v-if="selectedIds.length > 0" @click="deleteSelected" :disabled="isDeleting" class="text-red-500 hover:bg-red-500/10 p-1.5 rounded flex items-center gap-1 text-xs transition-colors">
                <Trash2 :size="14" />
                {{ isDeleting ? '删除中...' : `删除 (${selectedIds.length})` }}
              </button>
            </div>
          </div>
          
          <!-- Search -->
          <div class="relative mb-3">
            <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              v-model="searchQuery" 
              @input="debouncedSearch" 
              placeholder="搜索对话内容..." 
              class="w-full bg-background border border-card-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
            <Loader2 v-if="isSearching" :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
          </div>
          
          <!-- Type Filter Dropdown -->
          <div class="relative" ref="dropdownRef">
            <button 
              @click="showTypeDropdown = !showTypeDropdown"
              class="w-full flex items-center justify-between px-3 py-2 bg-background border border-card-border rounded-lg text-sm hover:border-primary/50 transition-colors">
              <span class="flex items-center gap-2">
                <Filter :size="14" class="text-muted-foreground" />
                <span class="text-muted-foreground">
                  {{ selectedTypes.length === 0 ? '全部分类' : `已选 ${selectedTypes.length} 个分类` }}
                </span>
              </span>
              <ChevronDown :size="16" class="text-muted-foreground transition-transform" :class="{ 'rotate-180': showTypeDropdown }" />
            </button>
            
            <!-- Dropdown -->
            <div 
              v-if="showTypeDropdown" 
              class="absolute left-0 right-0 top-full mt-1 bg-card border border-card-border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
              <div class="p-2 border-b border-card-border flex justify-between">
                <button @click.prevent="selectAllTypes" class="text-xs text-primary hover:underline">全选</button>
                <button @click.prevent="clearAllTypes" class="text-xs text-muted-foreground hover:text-foreground">清除</button>
              </div>
              <div class="p-1">
                <div 
                  v-for="p in platforms" 
                  :key="p.id"
                  @click="toggleType(p.id)"
                  class="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  :class="selectedTypes.includes(p.id) ? 'bg-primary/10' : ''">
                  <span class="flex items-center gap-3">
                    <Check v-if="selectedTypes.includes(p.id)" :size="16" class="text-primary" />
                    <div v-else class="w-4 h-4 rounded border border-card-border"></div>
                    <span class="text-sm" :class="selectedTypes.includes(p.id) ? 'text-primary font-medium' : ''">{{ p.name }}</span>
                  </span>
                  <span class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{{ p.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Session List with Pagination -->
        <div class="flex-1 overflow-y-auto p-2 space-y-1">
          <div v-for="session in sessions" :key="session.id"
            class="w-full flex items-center text-left p-1 rounded-lg transition-colors border border-transparent hover:bg-muted/50 group cursor-pointer"
            :class="activeSession === session.id ? 'bg-primary/10 border-primary/30' : ''"
            @click="selectSession(session.id)">
            
            <!-- Checkbox for batch selection -->
            <input type="checkbox" :value="session.id" v-model="selectedIds" 
              @click.stop
              class="mx-2 w-4 h-4 cursor-pointer rounded border-card-border text-primary focus:ring-primary" />
            
            <div class="flex-1 overflow-hidden p-2">
              <h4 class="text-sm font-medium line-clamp-1" :class="activeSession === session.id ? 'text-primary' : 'text-foreground'">{{ session.title }}</h4>
              <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-muted-foreground">{{ session.date }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-card-border/50 text-muted-foreground">{{ session.platformDisplay || session.platform }}</span>
              </div>
            </div>
          </div>
          
          <!-- Empty State -->
          <div v-if="sessions.length === 0 && !isSearching" class="py-12 text-center text-muted-foreground">
            <MessageSquare :size="32" class="mx-auto mb-3 opacity-30" />
            <p class="text-sm">暂无会话记录</p>
          </div>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="p-3 border-t border-card-border">
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground">
              {{ totalCount }} 条记录 · 第 {{ currentPage }} / {{ totalPages }} 页
            </span>
            <div class="flex items-center gap-1">
              <button 
                @click="goToPage(1)" 
                :disabled="currentPage === 1"
                class="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronsLeft :size="14" />
              </button>
              <button 
                @click="goToPage(currentPage - 1)" 
                :disabled="currentPage === 1"
                class="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft :size="14" />
              </button>
              <span class="px-3 py-1 text-sm font-mono">{{ currentPage }}</span>
              <button 
                @click="goToPage(currentPage + 1)" 
                :disabled="currentPage === totalPages"
                class="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight :size="14" />
              </button>
              <button 
                @click="goToPage(totalPages)" 
                :disabled="currentPage === totalPages"
                class="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronsRight :size="14" />
              </button>
            </div>
          </div>
        </div>
      </ClientOnly>
    </div>

    <!-- Conversation Detail -->
    <div class="flex-1 glass-panel flex flex-col overflow-hidden">
      <ClientOnly>
        <template #fallback>
          <div class="p-4 border-b border-card-border flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-card-border">
                <MessageSquare :size="20" class="text-muted-foreground" />
              </div>
              <div>
                <h2 class="font-semibold">选择一个会话</h2>
                <p class="text-xs text-muted-foreground">---</p>
              </div>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-6">
            <div class="h-full flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare :size="48" class="mb-4 opacity-20" />
              <p>从左侧选择会话以查看详细信息</p>
            </div>
          </div>
        </template>
        
        <div class="p-4 border-b border-card-border flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-card-border">
              <MessageSquare :size="20" class="text-muted-foreground" />
            </div>
            <div>
              <h2 class="font-semibold">{{ currentSession?.title || '选择一个会话' }}</h2>
              <p class="text-xs text-muted-foreground">{{ currentSession?.id || '---' }}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2" v-if="currentSession">
            <span class="text-xs px-2 py-1 bg-background border border-card-border rounded-md text-muted-foreground">Tokens: {{ currentSession.tokens }}</span>
            <div class="relative">
              <button @click="showExportMenu = !showExportMenu" class="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                <Download :size="16" />
              </button>
              <div v-if="showExportMenu" class="absolute right-0 top-full mt-1 bg-card border border-card-border rounded-lg shadow-lg py-1 min-w-[140px] z-10">
                <button @click="exportSession('json')" class="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                  <FileJson :size="14" /> 导出 JSON
                </button>
                <button @click="exportSession('md')" class="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                  <FileText :size="14" /> 导出 Markdown
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <div v-if="!currentSession" class="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare :size="48" class="mb-4 opacity-20" />
            <p>从左侧选择会话以查看详细信息</p>
          </div>
          
          <template v-else>
          <!-- Message Filter -->
          <div class="flex items-center gap-3 pb-4 border-b border-card-border">
            <div class="relative flex-1 max-w-md">
              <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                v-model="messageFilter" 
                placeholder="过滤消息内容..." 
                class="w-full bg-background border border-card-border rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors" />
            </div>
            <select v-model="roleFilter" class="bg-background border border-card-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary">
              <option value="">全部角色</option>
              <option value="user">用户</option>
              <option value="assistant">助手</option>
              <option value="tool">工具调用</option>
            </select>
            <span class="text-xs text-muted-foreground">{{ filteredMessages.length }} / {{ messages.length }} 条消息</span>
          </div>
        
          <div v-for="(msg, idx) in filteredMessages" :key="idx" class="flex gap-4 max-w-3xl">
            <!-- User Message -->
            <template v-if="msg.role === 'user'">
              <div class="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center shrink-0">
                <User :size="16" class="text-secondary" />
              </div>
              <div class="pt-1">
                <p class="text-sm text-muted-foreground mb-1 font-medium">User</p>
                <div class="bg-muted/50 p-4 rounded-2xl rounded-tl-none border border-card-border text-sm leading-relaxed whitespace-pre-wrap">
                  {{ msg.content }}
                </div>
              </div>
            </template>
            
            <!-- Tool Call -->
            <template v-else-if="msg.role === 'tool' || msg.tool_name">
              <div class="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Wrench :size="16" class="text-amber-500" />
              </div>
              <div class="pt-1 w-full">
                <p class="text-sm text-amber-500 mb-1 font-medium">Tool Call: {{ msg.tool_name || 'unknown_tool' }}</p>
                <div class="bg-background p-3 rounded-xl border border-card-border text-xs font-mono text-muted-foreground">
                  <div class="pl-4 border-l-2 border-card-border opacity-70 whitespace-pre-wrap">
                    {{ msg.content }}
                  </div>
                </div>
              </div>
            </template>
            
            <!-- Agent Message -->
            <template v-else-if="msg.role === 'assistant'">
              <div class="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <Bot :size="16" class="text-primary" />
              </div>
              <div class="pt-1">
                <p class="text-sm text-primary mb-1 font-medium">Hermes Agent</p>
                <div class="bg-primary/5 p-4 rounded-2xl rounded-tl-none border border-primary/20 text-sm leading-relaxed prose prose-invert max-w-none whitespace-pre-wrap">
                  {{ msg.content }}
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  History, Search, MessageSquare, Download, User, Bot, Wrench, 
  Trash2, Loader2, FileJson, FileText, Filter, ChevronDown, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check 
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

// Type definitions
interface Session {
  id: string
  title: string
  platform: string
  platformDisplay?: string
  date: string
  tokens: string
}

interface SessionListResponse {
  sessions: Session[]
  platforms: { id: string; name: string; count: number }[]
  total: number
  page?: number
  pageSize?: number
  hasMore?: boolean
  isRealHermesConnected?: boolean
}

interface SessionDetailResponse {
  session: Session
  messages: { role: string; content: string; tool_name?: string; timestamp?: number }[]
  isRealHermesConnected?: boolean
}

type HistoryApiResponse = SessionListResponse | SessionDetailResponse

// Type guard to check if response is a session list
function isSessionListResponse(data: HistoryApiResponse | null | undefined): data is SessionListResponse {
  return data !== null && data !== undefined && 'sessions' in data
}

// Type guard to check if response is a session detail
function isSessionDetailResponse(data: HistoryApiResponse | null | undefined): data is SessionDetailResponse {
  return data !== null && data !== undefined && 'session' in data
}

const searchQuery = ref('')
const isSearching = ref(false)
const showTypeDropdown = ref(false)

// Pagination
const pageSize = ref(20)
const currentPage = ref(1)
const totalCount = ref(0)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value) || 1)

// Type filter
const selectedTypes = ref<string[]>([])
const platforms = ref<{ id: string; name: string; count: number }[]>([])

// Fetch sessions with type filter and pagination
const { data, refresh } = await useFetch<HistoryApiResponse>('/api/history', {
  query: computed(() => ({
    types: selectedTypes.value.length > 0 ? selectedTypes.value.join(',') : undefined,
    limit: pageSize.value,
    offset: (currentPage.value - 1) * pageSize.value
  }))
})

const sessions = computed<Session[]>(() => {
  if (isSessionListResponse(data.value)) {
    return data.value.sessions
  }
  return []
})

// Update total count from API response
watch(data, (newData) => {
  if (isSessionListResponse(newData) && newData.total !== undefined) {
    totalCount.value = newData.total
  }
}, { immediate: true })

// Active session - initialized from URL query
const activeSession = ref((route.query.id as string) || '')
const activeSessionDetail = ref<SessionDetailResponse | null>(null)

const selectedIds = ref<string[]>([])
const isDeleting = ref(false)

// Message filter
const messageFilter = ref('')
const roleFilter = ref('')
const showExportMenu = ref(false)

// Initialize platforms from API response
watch(data, (newData) => {
  if (isSessionListResponse(newData) && newData.platforms) {
    platforms.value = newData.platforms
    // Auto-select all types except cron on first load
    if (selectedTypes.value.length === 0) {
      selectedTypes.value = newData.platforms
        .filter((p) => p.id !== 'cron')
        .map((p) => p.id)
    }
  }
}, { immediate: true })

// Toggle type selection
const toggleType = (typeId: string) => {
  const idx = selectedTypes.value.indexOf(typeId)
  if (idx > -1) {
    selectedTypes.value.splice(idx, 1)
  } else {
    selectedTypes.value.push(typeId)
  }
  // Reset to first page when filter changes
  currentPage.value = 1
}

// Select all types
const selectAllTypes = () => {
  selectedTypes.value = platforms.value.map(p => p.id)
  currentPage.value = 1
}

// Clear all types
const clearAllTypes = () => {
  selectedTypes.value = []
  currentPage.value = 1
}

// Pagination navigation
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    selectedIds.value = [] // Clear selection on page change
  }
}

// Filter messages by content and role
const filteredMessages = computed(() => {
  let result = messages.value
  
  if (roleFilter.value) {
    if (roleFilter.value === 'tool') {
      result = result.filter((m: any) => m.role === 'tool' || m.tool_name)
    } else {
      result = result.filter((m: any) => m.role === roleFilter.value && !m.tool_name)
    }
  }
  
  if (messageFilter.value.trim()) {
    const query = messageFilter.value.toLowerCase()
    result = result.filter((m: any) => 
      (m.content && m.content.toLowerCase().includes(query)) ||
      (m.tool_name && m.tool_name.toLowerCase().includes(query))
    )
  }
  
  return result
})

// Export session
const exportSession = (format: 'json' | 'md') => {
  showExportMenu.value = false
  if (!currentSession.value || !messages.value.length) return
  
  let content: string
  let filename: string
  
  if (format === 'json') {
    content = JSON.stringify({
      session: currentSession.value,
      messages: messages.value
    }, null, 2)
    filename = `${currentSession.value.id}.json`
  } else {
    const lines: string[] = [
      `# ${currentSession.value.title}`,
      '',
      `- **ID**: ${currentSession.value.id}`,
      `- **Platform**: ${currentSession.value.platform}`,
      `- **Date**: ${currentSession.value.date}`,
      `- **Tokens**: ${currentSession.value.tokens}`,
      '',
      '---',
      '',
      '## Conversation',
      ''
    ]
    
    for (const msg of messages.value) {
      if (msg.role === 'user') {
        lines.push(`### User`, '', msg.content, '')
      } else if (msg.role === 'tool' || msg.tool_name) {
        lines.push(`### Tool: ${msg.tool_name || 'unknown'}`, '', '```', msg.content, '```', '')
      } else if (msg.role === 'assistant') {
        lines.push(`### Assistant`, '', msg.content, '')
      }
    }
    
    content = lines.join('\n')
    filename = `${currentSession.value.id}.md`
  }
  
  // Download file
  const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Select a session and load its details
const selectSession = (sessionId: string) => {
  activeSession.value = sessionId
}

// Debounced search function
let searchTimeout: ReturnType<typeof setTimeout>
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    isSearching.value = true
    currentPage.value = 1 // Reset to first page on search
    try {
      const query = searchQuery.value.trim()
      if (query) {
        const { data: searchData } = await useFetch<HistoryApiResponse>(`/api/history?q=${encodeURIComponent(query)}&types=${selectedTypes.value.join(',')}&limit=${pageSize.value}&offset=0`)
        if (searchData.value && isSessionListResponse(searchData.value)) {
          data.value = searchData.value
        }
      } else {
        await refresh()
      }
    } finally {
      isSearching.value = false
    }
  }, 300)
}

const isAllSelected = computed(() => {
  return sessions.value.length > 0 && selectedIds.value.length === sessions.value.length
})

const toggleSelectAll = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    selectedIds.value = sessions.value.map(s => s.id)
  } else {
    selectedIds.value = []
  }
}

const deleteSelected = async () => {
  if (selectedIds.value.length === 0) return
  if (!confirm(`确定要删除选定的 ${selectedIds.value.length} 个对话吗？`)) return

  isDeleting.value = true
  try {
    const res = await $fetch('/api/history', {
      method: 'DELETE',
      body: { ids: selectedIds.value }
    })
    
    if ((res as any).success) {
      // Clear selection
      const idsToDelete = [...selectedIds.value]
      selectedIds.value = []
      
      // If the active session is deleted, reset it
      if (idsToDelete.includes(activeSession.value)) {
        activeSession.value = ''
        router.replace({ query: { ...route.query, id: undefined } })
      }
      
      // Refresh session list
      await refresh()
    } else {
      alert('删除失败: ' + ((res as any).message || '未知错误'))
    }
  } catch (e) {
    console.error('Delete failed:', e)
    alert('删除过程中出现异常，请重试')
  } finally {
    isDeleting.value = false
  }
}

watch(activeSession, async (newId) => {
  if (newId) {
    // Update URL to reflect selected session (without page reload)
    if (route.query.id !== newId) {
      router.replace({ query: { ...route.query, id: newId } })
    }
    
    // Use $fetch to avoid caching issues
    try {
      const detailData = await $fetch<SessionDetailResponse>(`/api/history?id=${newId}`)
      activeSessionDetail.value = detailData
    } catch (e) {
      console.error('Failed to load session detail:', e)
    }
  }
}, { immediate: true })

// Also react to external URL changes (e.g. browser back button)
watch(() => route.query.id, (newId) => {
  if (newId && newId !== activeSession.value) {
    activeSession.value = newId as string
  }
})

const currentSession = computed<Session | undefined>(() => {
  // First try to get from detail (has fresh data)
  if (activeSessionDetail.value?.session) {
    return activeSessionDetail.value.session
  }
  // Fallback to session list
  return sessions.value.find(s => s.id === activeSession.value)
})

const messages = computed<{ role: string; content: string; tool_name?: string; timestamp?: number }[]>(() => 
  activeSessionDetail.value?.messages || []
)

// Close dropdown when clicking outside
const dropdownRef = ref<HTMLElement | null>(null)
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (dropdownRef.value && !dropdownRef.value.contains(target)) {
      showTypeDropdown.value = false
    }
  })
})
</script>
