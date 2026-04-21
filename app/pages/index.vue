<template>
  <div class="space-y-6">
    <!-- Connection Status -->
    <div v-if="data?.isRealHermesConnected" class="bg-primary/20 text-primary border border-primary/30 p-3 rounded-xl flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        <span class="text-sm font-medium">已成功接入本地 Hermes Agent</span>
      </div>
      <button @click="refresh" class="text-xs hover:underline flex items-center gap-1">
        <RefreshCw :size="14" :class="{ 'animate-spin': isRefreshing }" />
        刷新
      </button>
    </div>
    <div v-else class="bg-amber-500/10 text-amber-500 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">Mock 模式 (未检测到 ~/.hermes 目录)</span>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div v-for="(stat, index) in stats" :key="index" class="glass-panel p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-medium text-muted-foreground">{{ stat.title }}</span>
          <div class="p-1.5 rounded-lg" :class="stat.iconBg">
            <component :is="stat.icon" :size="16" :class="stat.iconColor" />
          </div>
        </div>
        <div>
          <h3 class="text-2xl font-bold font-mono tracking-tight">{{ stat.value }}</h3>
          <p v-if="stat.trend" class="text-xs mt-1" :class="stat.trend > 0 ? 'text-primary' : 'text-muted-foreground'">
            <span v-if="stat.trend > 0">↑ {{ stat.trend }}%</span>
            <span v-else-if="stat.trend < 0">↓ {{ Math.abs(stat.trend) }}%</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Charts and Active Tasks -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Chart -->
      <div class="lg:col-span-2 glass-panel p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold">Tokens 消耗趋势 (近7天)</h3>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <div class="w-3 h-3 rounded-full bg-primary"></div>
            <span>Tokens</span>
          </div>
        </div>
        <div class="h-72 w-full flex items-center justify-center border border-card-border rounded-xl bg-card/30 p-4">
          <Line v-if="chartData && chartData.labels && chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
          <div v-else class="flex flex-col items-center text-muted-foreground">
            <BarChart2 :size="48" class="mb-4 opacity-50" />
            <p>暂无图表数据</p>
          </div>
        </div>
      </div>

      <!-- Active Tasks -->
      <div class="glass-panel p-6 flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">活跃任务</h3>
          <span class="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium border border-primary/30">
            {{ activeTasks.length }} 运行中
          </span>
        </div>
        
        <div class="flex-1 overflow-y-auto space-y-3 pr-2">
          <NuxtLink v-for="task in activeTasks" :key="task.id" :to="`/history?id=${task.id}`" 
            class="block p-3 rounded-xl bg-muted/30 border border-card-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group">
            <div class="flex justify-between items-start mb-2">
              <h4 class="font-medium text-sm group-hover:text-primary transition-colors truncate flex-1">{{ task.name }}</h4>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs px-2 py-0.5 rounded-md bg-background border border-card-border">{{ task.agent }}</span>
                <span class="text-xs text-muted-foreground">{{ task.platform }}</span>
              </div>
              <span class="text-xs font-mono text-muted-foreground">{{ task.time }}</span>
            </div>
            <!-- Progress bar -->
            <div class="w-full h-1 bg-background rounded-full overflow-hidden mt-2">
              <div class="h-full bg-primary rounded-full relative w-full">
                <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] w-full" 
                  style="background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);"></div>
              </div>
            </div>
          </NuxtLink>
          
          <div v-if="activeTasks.length === 0" class="text-center text-muted-foreground py-8">
            <CheckCircle :size="32" class="mx-auto mb-2 opacity-50" />
            <p class="text-sm">没有活跃任务</p>
          </div>
        </div>
        
        <NuxtLink to="/history" class="mt-4 w-full py-2 border border-dashed border-card-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-2">
          <List :size="16" />
          <span>查看全部历史</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Recent Sessions -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">最近会话</h3>
        <NuxtLink to="/history" class="text-xs text-primary hover:underline">查看全部</NuxtLink>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-card-border">
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">会话</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">平台</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">时间</th>
              <th class="text-right py-3 px-4 font-medium text-muted-foreground">Tokens</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in recentSessions" :key="session.id" 
              class="border-b border-card-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
              @click="navigateTo(`/history?id=${session.id}`)">
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <MessageSquare :size="16" class="text-muted-foreground" />
                  <span class="truncate max-w-[200px]">{{ session.title }}</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <span class="text-xs px-2 py-0.5 rounded bg-muted">{{ session.platform }}</span>
              </td>
              <td class="py-3 px-4 text-muted-foreground">{{ session.time }}</td>
              <td class="py-3 px-4 text-right font-mono">{{ session.tokens.toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="recentSessions.length === 0" class="text-center text-muted-foreground py-8">
          <p class="text-sm">暂无会话记录</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Activity, Cpu, Coins, Network, BarChart2, MessageSquare, CheckCircle, List, RefreshCw, Users, Calendar, Zap } from 'lucide-vue-next'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend)

const { data, refresh: refreshData } = await useFetch('/api/dashboard')
const isRefreshing = ref(false)

const refresh = async () => {
  isRefreshing.value = true
  await refreshData()
  setTimeout(() => { isRefreshing.value = false }, 500)
}

const chartData = computed(() => data.value?.chartData)
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 12,
      displayColors: false,
      callbacks: {
        label: (context: any) => `Tokens: ${context.raw.toLocaleString()}`
      }
    }
  },
  scales: {
    x: { 
      grid: { display: false },
      ticks: { color: 'rgba(255,255,255,0.5)' }
    },
    y: { 
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: { 
        color: 'rgba(255,255,255,0.5)',
        callback: (value: any) => value >= 1000 ? (value/1000) + 'K' : value
      }
    }
  }
}

const stats = computed(() => {
  const d = data.value?.stats || {
    todayTokens: '0',
    totalSessions: 0,
    todaySessions: 0,
    cpuLoad: '0%',
    activeAgents: 0,
    latency: '0ms',
    avgTokensPerSession: '0'
  }
  
  return [
    { 
      title: '今日 Tokens', 
      value: d.todayTokens, 
      trend: 12.5, 
      icon: Coins,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500'
    },
    { 
      title: '总会话数', 
      value: d.totalSessions, 
      trend: 0, 
      icon: Users,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500'
    },
    { 
      title: '今日会话', 
      value: d.todaySessions, 
      trend: 8.3, 
      icon: Calendar,
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-500'
    },
    { 
      title: 'CPU 负载', 
      value: d.cpuLoad, 
      trend: -2.1, 
      icon: Cpu,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary'
    },
    { 
      title: '活跃 Agent', 
      value: d.activeAgents, 
      trend: 0, 
      icon: Network,
      iconBg: 'bg-secondary/10',
      iconColor: 'text-secondary'
    },
    { 
      title: 'API 延迟', 
      value: d.latency, 
      trend: -15.4, 
      icon: Zap,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500'
    },
  ]
})

const activeTasks = computed(() => data.value?.activeTasks || [])
const recentSessions = computed(() => data.value?.recentSessions || [])
</script>

<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
