<template>
  <div class="space-y-6">
    <!-- Connection Status -->
    <div v-if="data?.isRealHermesConnected" class="bg-primary/20 text-primary border border-primary/30 p-3 rounded-xl flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        <span class="text-sm font-medium">已连接 Hermes Agent</span>
      </div>
      <button @click="doRefresh" class="text-xs hover:underline flex items-center gap-1">
        <RefreshCw size="14" :class="{ 'animate-spin': isRefreshing }" />
        刷新
      </button>
    </div>
    <div v-else class="bg-amber-500/10 text-amber-500 border border-amber-500/30 p-3 rounded-xl">
      <span class="text-sm font-medium">Mock 模式 (示例数据)</span>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">总会话数</span>
          <MessageSquare size="16" class="text-primary" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ formatNumber(data?.summary?.totalSessions || 0) }}</h3>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">总 Tokens</span>
          <Coins size="16" class="text-blue-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ formatTokens(data?.summary?.totalTokens || 0) }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          输入: {{ formatTokens(data?.summary?.totalInputTokens || 0) }} / 
          输出: {{ formatTokens(data?.summary?.totalOutputTokens || 0) }}
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">总费用</span>
          <DollarSign size="16" class="text-green-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono text-green-400">${{ (data?.summary?.totalCost || 0).toFixed(2) }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          ¥{{ ((data?.summary?.totalCost || 0) * 7.2).toFixed(2) }}
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">平均每会话</span>
          <TrendingUp size="16" class="text-amber-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">${{ (data?.summary?.avgCostPerSession || 0).toFixed(4) }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          ¥{{ ((data?.summary?.avgCostPerSession || 0) * 7.2).toFixed(3) }}
        </p>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Token Trend Chart -->
      <div class="lg:col-span-2 glass-panel p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold">Token 消耗趋势</h3>
          <div class="flex items-center gap-4 text-xs">
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-full bg-blue-400"></div>
              <span class="text-muted-foreground">输入</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-full bg-primary"></div>
              <span class="text-muted-foreground">输出</span>
            </div>
          </div>
        </div>
        <div class="h-72 w-full flex items-center justify-center border border-card-border rounded-xl bg-card/30 p-4">
          <Line v-if="chartData && chartData.labels && chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
          <div v-else class="flex flex-col items-center text-muted-foreground">
            <BarChart2 size="48" class="mb-4 opacity-50" />
            <p>暂无数据</p>
          </div>
        </div>
      </div>

      <!-- Cost by Model -->
      <div class="glass-panel p-6">
        <h3 class="text-lg font-semibold mb-4">按模型费用分布</h3>
        <div class="space-y-4">
          <div v-for="item in data?.byModel" :key="item.model" class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="font-mono text-xs">{{ item.model }}</span>
              <span class="text-green-400 font-mono">${{ item.cost.toFixed(3) }}</span>
            </div>
            <div class="w-full h-2 bg-background rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-primary to-primary/50 rounded-full transition-all"
                   :style="{ width: `${getCostPercentage(item.cost)}%` }"></div>
            </div>
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>{{ item.sessions }} 会话</span>
              <span>{{ formatTokens(item.inputTokens + item.outputTokens) }} tokens</span>
            </div>
          </div>
          
          <div v-if="!data?.byModel?.length" class="text-center text-muted-foreground py-8">
            <PieChart size="32" class="mx-auto mb-2 opacity-50" />
            <p class="text-sm">暂无数据</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Tables -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Model Details -->
      <div class="glass-panel p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Cpu size="18" class="text-primary" />
          模型明细
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-card-border">
                <th class="text-left py-2 text-muted-foreground font-medium">模型</th>
                <th class="text-right py-2 text-muted-foreground font-medium">会话</th>
                <th class="text-right py-2 text-muted-foreground font-medium">输入</th>
                <th class="text-right py-2 text-muted-foreground font-medium">输出</th>
                <th class="text-right py-2 text-muted-foreground font-medium">费用</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in data?.byModel" :key="item.model" class="border-b border-card-border/50 hover:bg-muted/30">
                <td class="py-3 font-mono text-xs">{{ item.model }}</td>
                <td class="py-3 text-right font-mono">{{ item.sessions }}</td>
                <td class="py-3 text-right font-mono text-blue-400">{{ formatTokens(item.inputTokens) }}</td>
                <td class="py-3 text-right font-mono text-primary">{{ formatTokens(item.outputTokens) }}</td>
                <td class="py-3 text-right font-mono text-green-400">${{ item.cost.toFixed(3) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Platform Details -->
      <div class="glass-panel p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Monitor size="18" class="text-primary" />
          平台明细
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-card-border">
                <th class="text-left py-2 text-muted-foreground font-medium">平台</th>
                <th class="text-right py-2 text-muted-foreground font-medium">会话</th>
                <th class="text-right py-2 text-muted-foreground font-medium">输入</th>
                <th class="text-right py-2 text-muted-foreground font-medium">输出</th>
                <th class="text-right py-2 text-muted-foreground font-medium">费用</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in data?.byPlatform" :key="item.platform" class="border-b border-card-border/50 hover:bg-muted/30">
                <td class="py-3">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full" :class="getPlatformColor(item.platform)"></span>
                    <span class="capitalize">{{ item.platform }}</span>
                  </div>
                </td>
                <td class="py-3 text-right font-mono">{{ item.sessions }}</td>
                <td class="py-3 text-right font-mono text-blue-400">{{ formatTokens(item.inputTokens) }}</td>
                <td class="py-3 text-right font-mono text-primary">{{ formatTokens(item.outputTokens) }}</td>
                <td class="py-3 text-right font-mono text-green-400">${{ item.cost.toFixed(3) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Pricing Reference -->
    <div class="glass-panel p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Info size="18" class="text-primary" />
        模型定价参考 (USD/1M Tokens)
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
        <div v-for="(pricing, model) in modelPricing" :key="model" class="bg-muted/30 p-3 rounded-lg border border-card-border">
          <p class="font-mono font-medium mb-1">{{ model }}</p>
          <p class="text-muted-foreground">
            输入: ${{ pricing.input }} / 输出: ${{ pricing.output }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { 
  DollarSign, Coins, TrendingUp, MessageSquare, BarChart2, PieChart, 
  Cpu, Monitor, Info, RefreshCw 
} from 'lucide-vue-next'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const { data, refresh: refreshData } = await useFetch('/api/cost')
const isRefreshing = ref(false)

const doRefresh = async () => {
  isRefreshing.value = true
  await refreshData()
  setTimeout(() => { isRefreshing.value = false }, 500)
}

const chartData = computed(() => data.value?.chartData || null)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      displayColors: true
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)'
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)'
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)'
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        callback: (value: number) => formatTokens(value)
      }
    }
  }
}

const modelPricing = {
  'deepseek': { input: 0.14, output: 0.28 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10 },
  'claude-3-sonnet': { input: 3, output: 15 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'claude-3-opus': { input: 15, output: 75 }
}

const maxCost = computed(() => {
  const costs = data.value?.byModel?.map(m => m.cost) || []
  return Math.max(...costs, 0.01)
})

const getCostPercentage = (cost: number) => {
  return (cost / maxCost.value) * 100
}

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return (tokens / 1000000).toFixed(1) + 'M'
  } else if (tokens >= 1000) {
    return (tokens / 1000).toFixed(1) + 'K'
  }
  return tokens.toString()
}

const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

const getPlatformColor = (platform: string): string => {
  const colors: Record<string, string> = {
    'weixin': 'bg-green-500',
    'telegram': 'bg-blue-500',
    'discord': 'bg-indigo-500',
    'cli': 'bg-amber-500',
    'local': 'bg-gray-500'
  }
  return colors[platform] || 'bg-primary'
}
</script>
