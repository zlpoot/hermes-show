<template>
  <div class="space-y-6">
    <!-- Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="(stat, index) in stats" :key="index" class="glass-panel p-6 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-medium text-muted-foreground">{{ stat.title }}</span>
          <div class="p-2 rounded-lg" :class="stat.iconBg">
            <component :is="stat.icon" size="18" :class="stat.iconColor" />
          </div>
        </div>
        <div>
          <h3 class="text-3xl font-bold font-mono tracking-tight">{{ stat.value }}</h3>
          <p class="text-xs mt-2" :class="stat.trend > 0 ? 'text-primary' : 'text-muted-foreground'">
            <span v-if="stat.trend > 0">↑ {{ stat.trend }}%</span>
            <span v-else-if="stat.trend < 0">↓ {{ Math.abs(stat.trend) }}%</span>
            <span v-else>保持平稳</span>
            <span class="text-muted-foreground ml-1">较昨日</span>
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
          <select class="bg-muted border border-card-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
            <option>本周</option>
            <option>本月</option>
            <option>全部</option>
          </select>
        </div>
        <div class="h-72 w-full flex items-center justify-center border border-dashed border-card-border rounded-xl bg-card/30">
          <!-- Placeholder for chart, in a real app use vue-chartjs -->
          <div class="flex flex-col items-center text-muted-foreground">
            <BarChart2 size="48" class="mb-4 opacity-50" />
            <p>折线图表渲染区域</p>
            <p class="text-xs mt-2">基于 vue-chartjs</p>
          </div>
        </div>
      </div>

      <!-- Active Tasks -->
      <div class="glass-panel p-6 flex flex-col">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold">活跃任务 (Active)</h3>
          <span class="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium border border-primary/30">
            {{ activeTasks.length }} 运行中
          </span>
        </div>
        
        <div class="flex-1 overflow-y-auto space-y-4 pr-2">
          <div v-for="task in activeTasks" :key="task.id" class="p-4 rounded-xl bg-muted/30 border border-card-border hover:border-primary/30 transition-colors">
            <div class="flex justify-between items-start mb-2">
              <h4 class="font-medium text-sm">{{ task.name }}</h4>
              <span class="text-xs font-mono text-muted-foreground">{{ task.time }}</span>
            </div>
            <div class="flex items-center gap-2 mb-3">
              <span class="text-xs px-2 py-0.5 rounded-md bg-background border border-card-border">{{ task.agent }}</span>
              <span class="text-xs text-muted-foreground">{{ task.platform }}</span>
            </div>
            <!-- Progress bar -->
            <div class="w-full h-1.5 bg-background rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full relative">
                <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] w-full" style="background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);"></div>
              </div>
            </div>
          </div>
        </div>
        
        <button class="mt-4 w-full py-2 border border-dashed border-card-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-2">
          <Plus size="16" />
          <span>新建定时任务</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Activity, Cpu, Coins, Network, BarChart2, Plus } from 'lucide-vue-next'

const stats = [
  { 
    title: '今日 Tokens', 
    value: '1.24M', 
    trend: 12.5, 
    icon: Coins,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500'
  },
  { 
    title: '系统 CPU 负载', 
    value: '18.4%', 
    trend: -2.1, 
    icon: Cpu,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary'
  },
  { 
    title: '活跃子 Agent', 
    value: '4', 
    trend: 0, 
    icon: Network,
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary'
  },
  { 
    title: 'API 请求延迟', 
    value: '245ms', 
    trend: -15.4, 
    icon: Activity,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500'
  }
]

const activeTasks = [
  { id: 1, name: '数据备份到 S3 (Cron)', agent: 'sys-admin-01', platform: 'Background', time: '10:30 AM' },
  { id: 2, name: '总结 GitHub Issues', agent: 'research-bot', platform: 'Telegram', time: '11:15 AM' },
  { id: 3, name: '训练轨迹压缩 (MiMo v2)', agent: 'hermes-core', platform: 'Local', time: '11:42 AM' },
]
</script>

<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
