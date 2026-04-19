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
          <span class="text-xs text-muted-foreground">平均响应时间</span>
          <Clock size="16" class="text-blue-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ (data?.summary?.avgResponseTime || 0).toFixed(0) }}ms</h3>
        <p class="text-xs text-muted-foreground mt-1">
          最快: {{ data?.summary?.minResponseTime || 0 }}ms / 最慢: {{ data?.summary?.maxResponseTime || 0 }}ms
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">成功率</span>
          <CheckCircle size="16" class="text-green-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono text-green-400">{{ (data?.summary?.successRate || 0).toFixed(1) }}%</h3>
        <p class="text-xs text-muted-foreground mt-1">
          成功: {{ data?.summary?.successfulCalls || 0 }} / 失败: {{ data?.summary?.failedCalls || 0 }}
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">总调用次数</span>
          <Activity size="16" class="text-primary" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ formatNumber(data?.summary?.totalCalls || 0) }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          最近24h: {{ formatNumber(data?.summary?.callsLast24h || 0) }}
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">活跃提供商</span>
          <Server size="16" class="text-amber-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ data?.summary?.activeProviders || 0 }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          模型: {{ data?.summary?.activeModels || 0 }}
        </p>
      </div>
    </div>

    <!-- Provider Performance Table -->
    <div class="glass-panel p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Server size="18" class="text-primary" />
        提供商性能
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-card-border">
              <th class="text-left py-3 text-muted-foreground font-medium">提供商</th>
              <th class="text-left py-3 text-muted-foreground font-medium">模型</th>
              <th class="text-right py-3 text-muted-foreground font-medium">调用</th>
              <th class="text-right py-3 text-muted-foreground font-medium">成功率</th>
              <th class="text-right py-3 text-muted-foreground font-medium">平均响应</th>
              <th class="text-right py-3 text-muted-foreground font-medium">P95</th>
              <th class="text-center py-3 text-muted-foreground font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data?.providers" :key="item.provider + item.model" 
                class="border-b border-card-border/50 hover:bg-muted/30 cursor-pointer"
                @click="showProviderDetail(item)">
              <td class="py-3">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" :class="getProviderStatusColor(item.successRate)"></div>
                  <span class="font-medium">{{ item.provider }}</span>
                </div>
              </td>
              <td class="py-3 font-mono text-xs">{{ item.model }}</td>
              <td class="py-3 text-right font-mono">{{ formatNumber(item.calls) }}</td>
              <td class="py-3 text-right">
                <span class="font-mono" :class="getSuccessRateColor(item.successRate)">
                  {{ item.successRate.toFixed(1) }}%
                </span>
              </td>
              <td class="py-3 text-right font-mono">{{ item.avgResponseTime.toFixed(0) }}ms</td>
              <td class="py-3 text-right font-mono text-amber-400">{{ item.p95ResponseTime.toFixed(0) }}ms</td>
              <td class="py-3 text-center">
                <span class="px-2 py-1 rounded-full text-xs" 
                      :class="getStatusBadgeClass(item.successRate)">
                  {{ getStatusText(item.successRate) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Response Time Chart -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="glass-panel p-6">
        <h3 class="text-lg font-semibold mb-4">响应时间分布</h3>
        <div class="h-64">
          <Bar v-if="responseTimeData" :data="responseTimeData" :options="responseTimeOptions" />
          <div v-else class="h-full flex items-center justify-center text-muted-foreground">
            <BarChart2 size="48" class="opacity-50" />
          </div>
        </div>
      </div>

      <div class="glass-panel p-6">
        <h3 class="text-lg font-semibold mb-4">成功率趋势 (24h)</h3>
        <div class="h-64">
          <Line v-if="successRateData" :data="successRateData" :options="successRateOptions" />
          <div v-else class="h-full flex items-center justify-center text-muted-foreground">
            <TrendingUp size="48" class="opacity-50" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error Logs -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle size="18" class="text-red-400" />
          最近错误
        </h3>
        <span class="text-xs text-muted-foreground">{{ data?.errors?.length || 0 }} 条</span>
      </div>
      <div class="space-y-3 max-h-80 overflow-y-auto">
        <div v-for="error in data?.errors" :key="error.id" 
             class="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">{{ error.provider }}</span>
              <span class="text-xs text-muted-foreground font-mono">{{ error.model }}</span>
            </div>
            <span class="text-xs text-muted-foreground">{{ error.time }}</span>
          </div>
          <p class="text-sm text-red-300">{{ error.message }}</p>
          <div class="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span>会话: {{ error.sessionId }}</span>
            <span>响应时间: {{ error.responseTime }}ms</span>
          </div>
        </div>
        
        <div v-if="!data?.errors?.length" class="text-center py-8 text-muted-foreground">
          <CheckCircle size="32" class="mx-auto mb-2 text-green-400" />
          <p class="text-sm">暂无错误记录</p>
        </div>
      </div>
    </div>

    <!-- Provider Detail Modal -->
    <div v-if="selectedProvider" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="selectedProvider = null">
      <div class="bg-card border border-card-border rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">{{ selectedProvider.provider }} - {{ selectedProvider.model }}</h3>
          <button @click="selectedProvider = null" class="text-muted-foreground hover:text-foreground">
            <X size="20" />
          </button>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-muted/30 p-3 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">总调用</p>
            <p class="text-xl font-bold font-mono">{{ formatNumber(selectedProvider.calls) }}</p>
          </div>
          <div class="bg-muted/30 p-3 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">成功率</p>
            <p class="text-xl font-bold font-mono" :class="getSuccessRateColor(selectedProvider.successRate)">
              {{ selectedProvider.successRate.toFixed(1) }}%
            </p>
          </div>
          <div class="bg-muted/30 p-3 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">平均响应</p>
            <p class="text-xl font-bold font-mono">{{ selectedProvider.avgResponseTime.toFixed(0) }}ms</p>
          </div>
          <div class="bg-muted/30 p-3 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">P95 响应</p>
            <p class="text-xl font-bold font-mono text-amber-400">{{ selectedProvider.p95ResponseTime.toFixed(0) }}ms</p>
          </div>
        </div>
        
        <div class="space-y-4">
          <h4 class="font-medium text-sm text-muted-foreground">最近调用</h4>
          <div class="space-y-2 max-h-60 overflow-y-auto">
            <div v-for="call in selectedProvider.recentCalls" :key="call.id" 
                 class="flex items-center justify-between p-2 bg-muted/20 rounded-lg text-sm">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full" :class="call.success ? 'bg-green-400' : 'bg-red-400'"></div>
                <span class="text-muted-foreground">{{ call.time }}</span>
                <span class="font-mono text-xs">{{ call.sessionId }}</span>
              </div>
              <span class="font-mono">{{ call.responseTime }}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { 
  Clock, CheckCircle, Activity, Server, AlertTriangle, RefreshCw, X, BarChart2, TrendingUp
} from 'lucide-vue-next'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const { data, refresh: refreshData } = await useFetch('/api/providers')
const isRefreshing = ref(false)
const selectedProvider = ref<any>(null)

const doRefresh = async () => {
  isRefreshing.value = true
  await refreshData()
  setTimeout(() => { isRefreshing.value = false }, 500)
}

const showProviderDetail = (provider: any) => {
  selectedProvider.value = provider
}

const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

const getProviderStatusColor = (rate: number): string => {
  if (rate >= 99) return 'bg-green-400'
  if (rate >= 95) return 'bg-amber-400'
  return 'bg-red-400'
}

const getSuccessRateColor = (rate: number): string => {
  if (rate >= 99) return 'text-green-400'
  if (rate >= 95) return 'text-amber-400'
  return 'text-red-400'
}

const getStatusBadgeClass = (rate: number): string => {
  if (rate >= 99) return 'bg-green-500/20 text-green-400'
  if (rate >= 95) return 'bg-amber-500/20 text-amber-400'
  return 'bg-red-500/20 text-red-400'
}

const getStatusText = (rate: number): string => {
  if (rate >= 99) return '健康'
  if (rate >= 95) return '警告'
  return '异常'
}

// Response time distribution chart
const responseTimeData = computed(() => {
  if (!data.value?.responseTimeDistribution) return null
  return {
    labels: data.value.responseTimeDistribution.map((d: any) => d.label),
    datasets: [{
      label: '调用次数',
      data: data.value.responseTimeDistribution.map((d: any) => d.count),
      backgroundColor: 'rgba(16, 185, 129, 0.5)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 1
    }]
  }
})

const responseTimeOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: { color: 'rgba(255, 255, 255, 0.5)' }
    },
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: { color: 'rgba(255, 255, 255, 0.5)' }
    }
  }
}

// Success rate trend chart
const successRateData = computed(() => {
  if (!data.value?.successRateTrend) return null
  return {
    labels: data.value.successRateTrend.map((d: any) => d.hour),
    datasets: [{
      label: '成功率',
      data: data.value.successRateTrend.map((d: any) => d.rate),
      borderColor: 'rgba(16, 185, 129, 1)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }]
  }
})

const successRateOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: { color: 'rgba(255, 255, 255, 0.5)' }
    },
    y: {
      min: 90,
      max: 100,
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: { 
        color: 'rgba(255, 255, 255, 0.5)',
        callback: (value: number) => value + '%'
      }
    }
  }
}
</script>
