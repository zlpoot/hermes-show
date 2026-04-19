<template>
  <div class="h-[calc(100vh-10rem)] flex flex-col gap-6">
    <div class="flex items-center justify-between glass-panel p-4 shrink-0">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <Terminal class="text-emerald-500" size="20" />
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
          <Trash2 size="14" /> 清空
        </button>
        <button class="btn-primary flex items-center gap-2 text-sm" @click="togglePause">
          <component :is="isPaused ? Play : Pause" size="14" /> {{ isPaused ? '恢复' : '暂停' }}
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
          <Search size="16" class="text-muted-foreground" />
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
    <div class="flex-1 bg-[#050505] border border-card-border rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-sm relative group">
      <!-- Terminal Header -->
      <div class="h-8 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 shrink-0">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <div class="w-3 h-3 rounded-full bg-amber-500"></div>
          <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
        </div>
        <div class="flex-1 text-center text-xs text-zinc-500">hermes@server: ~/.hermes/logs/{{ selectedFile }}</div>
        <div class="text-xs text-zinc-500">{{ filteredLogs.length }} 条日志</div>
      </div>
      
      <!-- Terminal Body -->
      <div ref="logContainer" class="flex-1 overflow-y-auto p-4 space-y-1.5 select-text selection:bg-emerald-500/30">
        <div v-if="filteredLogs.length === 0" class="text-center text-zinc-500 py-8">
          没有匹配的日志记录
        </div>
        <div v-for="(log, idx) in filteredLogs" :key="idx" class="flex gap-3 hover:bg-white/5 transition-colors px-2 py-0.5 rounded" :class="getLogColor(log.level)">
          <span class="text-zinc-600 shrink-0 w-24">{{ log.time }}</span>
          <span class="shrink-0 w-16" :class="getLevelBg(log.level)">[{{ log.level }}]</span>
          <span class="shrink-0 w-24 text-zinc-400">[{{ log.source }}]</span>
          <span class="flex-1 whitespace-pre-wrap break-words" v-html="highlightKeyword(log.message)"></span>
        </div>
        
        <!-- Blinking Cursor -->
        <div v-if="!isPaused" class="flex gap-3 px-2 py-0.5 text-zinc-600">
          <span class="w-24"></span>
          <span class="w-2 h-4 bg-emerald-500/50 animate-[blink_1s_infinite]"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
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
const logs = ref(data.value?.logs || [])

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
    logs.value = data.value.logs
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
    case 'ERROR': return 'bg-red-500/10 px-1 rounded'
    case 'WARN': return 'bg-amber-500/10 px-1 rounded'
    case 'SUCCESS': return 'bg-emerald-500/10 px-1 rounded'
    default: return ''
  }
}

const highlightKeyword = (message: string) => {
  if (!searchKeyword.value.trim()) return message
  const regex = new RegExp(`(${searchKeyword.value})`, 'gi')
  return message.replace(regex, '<mark class="bg-yellow-500/30 text-yellow-300 px-0.5 rounded">$1</mark>')
}

const clearLogs = () => {
  logs.value = []
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
        time: timeStr,
        ...randomMsg
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
