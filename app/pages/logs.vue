<template>
  <div class="h-full flex flex-col gap-4 p-6 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between glass-panel p-4 shrink-0">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <Terminal class="text-emerald-500" :size="20" />
        </div>
        <div>
          <h2 class="text-xl font-bold">系统终端日志</h2>
          <p class="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            实时追踪网关和后台任务
          </p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <button class="btn-outline flex items-center gap-2 text-sm" @click="clearLogs">
          <Trash2 :size="14" /> 清空
        </button>
        <button class="btn-primary flex items-center gap-2 text-sm" @click="togglePause">
          <component :is="isPaused ? Play : Pause" :size="14" /> {{ isPaused ? '恢复' : '暂停' }}
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="glass-panel p-4 shrink-0">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">日志文件:</span>
          <select v-model="selectedFile" @change="refreshLogs" class="bg-background border border-card-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary">
            <option v-for="file in logFiles" :key="file" :value="file">{{ file }}</option>
          </select>
        </div>
        
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">日志级别:</span>
          <div class="flex gap-1">
            <button v-for="level in logLevels" :key="level.value" 
              @click="toggleLevel(level.value)"
              :class="[
                'px-2 py-1 rounded text-xs font-medium transition-all',
                selectedLevels.includes(level.value) 
                  ? level.activeClass 
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              ]">
              {{ level.label }}
            </button>
          </div>
        </div>
        
        <div class="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search :size="16" class="text-muted-foreground" />
          <input type="text" v-model="searchKeyword" placeholder="搜索日志内容..." 
            class="flex-1 bg-background border border-card-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" />
        </div>
        
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">行数:</span>
          <select v-model="linesCount" @change="refreshLogs" class="bg-background border border-card-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary">
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="200">200</option>
            <option :value="500">500</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Terminal Emulator -->
    <div class="flex-1 min-h-0 bg-[#050505] border border-card-border rounded-xl shadow-2xl flex flex-col font-mono text-sm">
      <!-- Terminal Header -->
      <div class="h-9 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 shrink-0 rounded-t-xl">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <div class="w-3 h-3 rounded-full bg-amber-500"></div>
          <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
        </div>
        <div class="flex-1 text-center text-xs text-zinc-500 truncate px-4">hermes@server: ~/.hermes/logs/{{ selectedFile }}</div>
        <div class="text-xs text-zinc-500 shrink-0">{{ filteredLogs.length }} 条</div>
      </div>
      
      <!-- Terminal Body - 关键修复: overflow-auto 和 will-change -->
      <div 
        ref="logContainer" 
        class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4"
        style="contain: strict;"
      >
        <div v-if="filteredLogs.length === 0" class="text-center text-zinc-500 py-8">
          没有匹配的日志记录
        </div>
        
        <!-- 使用唯一的 log.id 作为 key，避免重影 -->
        <div 
          v-for="log in filteredLogs" 
          :key="log.id" 
          class="flex gap-3 hover:bg-white/5 transition-colors px-2 py-0.5 rounded group"
          :class="getLogColor(log.level)"
        >
          <span class="text-zinc-600 shrink-0 w-20">{{ log.time }}</span>
          <span class="shrink-0 w-14 text-center" :class="getLevelBg(log.level)">[{{ log.level }}]</span>
          <span class="shrink-0 w-20 text-zinc-400 truncate" :title="log.source">[{{ log.source }}]</span>
          <span class="flex-1 whitespace-pre-wrap break-words" v-html="highlightKeyword(log.message)"></span>
        </div>
        
        <!-- Blinking Cursor -->
        <div v-if="!isPaused && filteredLogs.length > 0" class="flex gap-3 px-2 py-0.5 text-zinc-600">
          <span class="w-20"></span>
          <span class="w-2 h-4 bg-emerald-500/50 animate-[blink_1s_infinite]"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Terminal, Trash2, Pause, Play, Search } from 'lucide-vue-next'

const logContainer = ref<HTMLElement | null>(null)
const isPaused = ref(false)
const selectedFile = ref('agent.log')
const linesCount = ref(100)
const searchKeyword = ref('')
const selectedLevels = ref(['INFO', 'WARN', 'ERROR', 'SUCCESS', 'DEBUG'])

const logFiles = ['agent.log', 'gateway.log', 'cron.log', 'mcp.log']

const logLevels = [
  { value: 'ERROR', label: 'ERROR', activeClass: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  { value: 'WARN', label: 'WARN', activeClass: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  { value: 'INFO', label: 'INFO', activeClass: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  { value: 'SUCCESS', label: 'SUCCESS', activeClass: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  { value: 'DEBUG', label: 'DEBUG', activeClass: 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30' },
]

const { data, refresh } = await useFetch(() => `/api/logs?file=${selectedFile.value}&lines=${linesCount.value}`)

interface LogEntry {
  id: string
  time: string
  level: string
  source: string
  message: string
}

const logs = ref<LogEntry[]>([])

// 为每条日志生成唯一ID
let logIdCounter = 0
const generateLogId = () => `log-${Date.now()}-${logIdCounter++}`

// 初始化日志数据
const initLogs = (rawLogs: any[]) => {
  logs.value = rawLogs.map((log, idx) => ({
    ...log,
    id: log.id || generateLogId()
  }))
}

const filteredLogs = computed(() => {
  let result = logs.value
  
  // Filter by level
  if (selectedLevels.value.length < logLevels.length) {
    result = result.filter(log => selectedLevels.value.includes(log.level))
  }
  
  // Filter by keyword
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(log => 
      log.message.toLowerCase().includes(keyword) ||
      log.source.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

const toggleLevel = (level: string) => {
  const idx = selectedLevels.value.indexOf(level)
  if (idx > -1) {
    selectedLevels.value.splice(idx, 1)
  } else {
    selectedLevels.value.push(level)
  }
}

const refreshLogs = async () => {
  await refresh()
  if (data.value?.logs) {
    initLogs(data.value.logs)
  }
  nextTick(() => scrollToBottom())
}

const getLogColor = (level: string) => {
  switch(level) {
    case 'ERROR': return 'text-red-400'
    case 'WARN': return 'text-amber-400'
    case 'INFO': return 'text-zinc-300'
    case 'DEBUG': return 'text-zinc-500'
    case 'SUCCESS': return 'text-emerald-400'
    default: return 'text-zinc-300'
  }
}

const getLevelBg = (level: string) => {
  switch(level) {
    case 'ERROR': return 'bg-red-500/10 px-1 rounded text-red-400'
    case 'WARN': return 'bg-amber-500/10 px-1 rounded text-amber-400'
    case 'SUCCESS': return 'bg-emerald-500/10 px-1 rounded text-emerald-400'
    case 'INFO': return 'bg-blue-500/10 px-1 rounded text-blue-400'
    case 'DEBUG': return 'bg-zinc-500/10 px-1 rounded text-zinc-400'
    default: return ''
  }
}

const highlightKeyword = (message: string) => {
  if (!searchKeyword.value.trim()) return message
  try {
    const regex = new RegExp(`(${searchKeyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return message.replace(regex, '<mark class="bg-yellow-500/30 text-yellow-300 px-0.5 rounded">$1</mark>')
  } catch {
    return message
  }
}

const clearLogs = () => {
  logs.value = []
  logIdCounter = 0
}

const togglePause = () => {
  isPaused.value = !isPaused.value
}

const scrollToBottom = () => {
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
}

let intervalId: ReturnType<typeof setInterval>

onMounted(() => {
  // 初始化日志
  if (data.value?.logs) {
    initLogs(data.value.logs)
  }
  scrollToBottom()
  
  // Polling logs every 3 seconds
  intervalId = setInterval(async () => {
    if (isPaused.value) return
    
    if (data.value?.isRealHermesConnected) {
      await refreshLogs()
    } else {
      // Mock data for demo
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      
      const mockMessages = [
        { level: 'INFO', source: 'Cron', message: 'Job "Daily Backup" running.' },
        { level: 'DEBUG', source: 'Agent', message: 'Evaluating tool response.' },
        { level: 'INFO', source: 'Telegram', message: 'Received new message from user @admin.' },
        { level: 'SUCCESS', source: 'Memory', message: 'Skill generated from recent conversation.' },
        { level: 'WARN', source: 'Gateway', message: 'Rate limit approaching for OpenRouter API.' },
        { level: 'ERROR', source: 'MCP', message: 'Failed to connect to weather server.' },
      ]
      
      const randomMsg = mockMessages[Math.floor(Math.random() * mockMessages.length)]
      
      logs.value.push({
        id: generateLogId(),
        time: timeStr,
        level: randomMsg!.level,
        source: randomMsg!.source,
        message: randomMsg!.message
      })
      
      // Keep max logs based on linesCount
      if (logs.value.length > linesCount.value) {
        logs.value.shift()
      }
    }
    
    nextTick(() => scrollToBottom())
  }, 3000)
})

onUnmounted(() => {
  clearInterval(intervalId)
})
</script>

<style scoped>
@keyframes blink {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
</style>
