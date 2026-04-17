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
        <button class="btn-outline flex items-center gap-2 text-sm">
          <Filter size="14" /> 过滤
        </button>
        <button class="btn-primary flex items-center gap-2 text-sm" @click="togglePause">
          <component :is="isPaused ? Play : Pause" size="14" /> {{ isPaused ? '恢复' : '暂停' }}
        </button>
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
        <div class="flex-1 text-center text-xs text-zinc-500">hermes@server: ~/.hermes/logs</div>
      </div>
      
      <!-- Terminal Body -->
      <div ref="logContainer" class="flex-1 overflow-y-auto p-4 space-y-1.5 select-text selection:bg-emerald-500/30">
        <div v-for="(log, idx) in logs" :key="idx" class="flex gap-3 hover:bg-white/5 transition-colors px-2 py-0.5 rounded" :class="getLogColor(log.level)">
          <span class="text-zinc-600 shrink-0 w-24">{{ log.time }}</span>
          <span class="shrink-0 w-16" :class="getLevelBg(log.level)">[{{ log.level }}]</span>
          <span class="shrink-0 w-24 text-zinc-400">[{{ log.source }}]</span>
          <span class="flex-1 whitespace-pre-wrap break-words" v-html="log.message"></span>
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Terminal, Trash2, Filter, Pause, Play } from 'lucide-vue-next'

const logContainer = ref<HTMLElement | null>(null)
const isPaused = ref(false)

const { data } = await useFetch('/api/logs')
const logs = ref(data.value?.logs || [])

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

const clearLogs = () => {
  logs.value = []
}

const togglePause = () => {
  isPaused.value = !isPaused.value
}

let intervalId: ReturnType<typeof setInterval>

const scrollToBottom = () => {
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
}

onMounted(() => {
  scrollToBottom()
  
  // Polling logs every 3 seconds
  intervalId = setInterval(async () => {
    if (isPaused.value) return
    
    if (data.value?.isRealHermesConnected) {
      const { data: newData } = await useFetch('/api/logs')
      if (newData.value?.logs) {
        // Simple append strategy (in real app, we should diff or track last line)
        logs.value = newData.value.logs
      }
    } else {
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      
      const mockMessages = [
        { level: 'INFO', source: 'Cron', message: 'Job "Daily Backup" running.' },
        { level: 'DEBUG', source: 'Agent', message: 'Evaluating tool response.' },
        { level: 'INFO', source: 'Telegram', message: 'Received new message from user @admin.' },
        { level: 'SUCCESS', source: 'Memory', message: 'Skill generated from recent conversation.' }
      ]
      
      const randomMsg = mockMessages[Math.floor(Math.random() * mockMessages.length)]
      
      logs.value.push({
        time: timeStr,
        ...randomMsg
      })
      
      // Keep max 100 logs
      if (logs.value.length > 100) {
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
