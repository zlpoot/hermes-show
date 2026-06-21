<template>
  <div class="space-y-6">
    <!-- ============================================================
         第一节：运行状态
    ============================================================ -->
    <section>
      <div class="flex items-center gap-2 mb-4">
        <Activity :size="18" class="text-primary" />
        <h2 class="text-lg font-semibold">运行状态</h2>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Hermes 连接状态 -->
        <div class="glass-panel p-4 flex items-center gap-3">
          <div class="p-2 rounded-lg"
            :class="data?.status?.isHermesConnected ? 'bg-primary/10' : 'bg-amber-500/10'">
            <div class="w-2.5 h-2.5 rounded-full"
              :class="data?.status?.isHermesConnected ? 'bg-primary animate-pulse' : 'bg-amber-500'">
            </div>
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Hermes 状态</p>
            <p class="text-sm font-medium">{{ data?.status?.isHermesConnected ? '已连接' : '未连接' }}</p>
          </div>
        </div>
        <!-- CPU 负载 -->
        <div class="glass-panel p-4 flex items-center gap-3">
          <div class="p-2 rounded-lg bg-primary/10">
            <Cpu :size="18" class="text-primary" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">CPU 负载</p>
            <p class="text-sm font-medium font-mono">{{ data?.status?.cpuLoad ?? '—' }}</p>
          </div>
        </div>
        <!-- 最后刷新 -->
        <div class="glass-panel p-4 flex items-center gap-3">
          <div class="p-2 rounded-lg bg-blue-500/10">
            <RefreshCw :size="18" class="text-blue-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">数据刷新</p>
            <p class="text-sm font-medium">{{ formatRefreshTime(data?.status?.lastRefreshTime ?? '') }}</p>
          </div>
        </div>
        <!-- 刷新按钮 -->
        <button @click="refresh"
          class="glass-panel p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer text-left">
          <div class="p-2 rounded-lg bg-secondary/10">
            <RefreshCw :size="18" class="text-secondary"
              :class="{ 'animate-spin': isRefreshing }" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">操作</p>
            <p class="text-sm font-medium">刷新数据</p>
          </div>
        </button>
      </div>
      <!-- 无连接信息 -->
      <div v-if="!data?.status?.isHermesConnected"
        class="mt-3 bg-amber-500/10 text-amber-500 border border-amber-500/30 p-3 rounded-xl text-sm">
        未检测到会话数据。请确认 Hermes Agent 是否已运行并生成了会话记录。
      </div>
    </section>

    <!-- ============================================================
         第二节：最近活动
    ============================================================ -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <History :size="18" class="text-primary" />
          <h2 class="text-lg font-semibold">最近活动</h2>
        </div>
        <div class="text-xs text-muted-foreground">
          <template v-if="data?.coverage?.lastActivityDate">
            最后活动：<span class="font-medium">{{ data.coverage.lastActivityDate }}</span>
          </template>
          <template v-else>暂无活动记录</template>
        </div>
      </div>

      <!-- 活跃会话列表 -->
      <div class="glass-panel p-6 mb-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium flex items-center gap-2">
            <Zap :size="16" class="text-primary" />
            {{ data?.recentActiveSessions?.length ? '近期活跃会话' : '暂无运行中任务' }}
          </h3>
          <span v-if="data?.recentActiveSessions?.length"
            class="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
            {{ data.recentActiveSessions.length }}
          </span>
        </div>

        <div class="space-y-2">
          <NuxtLink v-for="s in data?.recentActiveSessions ?? []" :key="s.id"
            :to="`/history?id=${s.id}`"
            class="block p-3 rounded-xl bg-muted/30 border border-card-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <div class="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                <span class="text-sm truncate group-hover:text-primary transition-colors">{{ s.name }}</span>
              </div>
              <span class="text-xs text-muted-foreground flex-shrink-0 ml-2">{{ s.platform }}</span>
            </div>
          </NuxtLink>

          <div v-if="!data?.recentActiveSessions?.length"
            class="text-center text-muted-foreground py-6">
            <CheckCircle :size="28" class="mx-auto mb-2 opacity-50" />
            <p class="text-sm">当前没有正在进行的会话任务</p>
          </div>
        </div>
      </div>

      <!-- 最近会话列表 -->
      <div class="glass-panel p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium flex items-center gap-2">
            <MessageSquare :size="16" class="text-primary" />
            最近会话
          </h3>
          <NuxtLink to="/history" class="text-xs text-primary hover:underline">查看全部</NuxtLink>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-card-border">
                <th class="text-left py-2.5 px-3 font-medium text-muted-foreground">会话</th>
                <th class="text-left py-2.5 px-3 font-medium text-muted-foreground">平台</th>
                <th class="text-left py-2.5 px-3 font-medium text-muted-foreground">时间</th>
                <th class="text-right py-2.5 px-3 font-medium text-muted-foreground">Tokens</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in data?.recentSessions ?? []" :key="s.id"
                class="border-b border-card-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                @click="navigateTo(`/history?id=${s.id}`)">
                <td class="py-2.5 px-3">
                  <span class="truncate max-w-[200px] block">{{ s.title }}</span>
                </td>
                <td class="py-2.5 px-3">
                  <span class="text-xs px-1.5 py-0.5 rounded bg-muted">{{ s.platform }}</span>
                </td>
                <td class="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{{ s.time }}</td>
                <td class="py-2.5 px-3 text-right font-mono">{{ s.hasTokens ? s.tokens.toLocaleString() : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!data?.recentSessions?.length"
          class="text-center text-muted-foreground py-6">
          <p class="text-sm">暂无会话记录</p>
        </div>
      </div>
    </section>

    <!-- ============================================================
         第三节：数据覆盖 & 趋势图
    ============================================================ -->
    <section>
      <div class="flex items-center gap-2 mb-4">
        <BarChart2 :size="18" class="text-primary" />
        <h2 class="text-lg font-semibold">数据覆盖</h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <!-- 覆盖概况 -->
        <div class="lg:col-span-2 space-y-4">
          <div class="glass-panel p-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">总会话数</span>
              <span class="text-lg font-bold font-mono">{{ data?.coverage?.totalSessions ?? 0 }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">今日会话</span>
              <span class="text-sm font-mono">{{ data?.coverage?.todaySessions ?? 0 }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">近 7 天活动</span>
              <span class="text-sm font-mono">{{ data?.coverage?.recent7DaySessions ?? 0 }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">最后活动</span>
              <span class="text-sm font-mono">{{ data?.coverage?.lastActivityTime ?? '—' }}</span>
            </div>
          </div>

          <div class="glass-panel p-4">
            <h4 class="text-xs font-medium text-muted-foreground mb-3">平台分布</h4>
            <div class="space-y-2">
              <div v-for="(count, platform) in data?.coverage?.platformDistribution ?? {}" :key="platform"
                class="flex items-center justify-between">
                <span class="text-sm">{{ platform }}</span>
                <div class="flex items-center gap-2">
                  <div class="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div class="h-full rounded-full bg-primary"
                      :style="{ width: coveragePercent(count) + '%' }"></div>
                  </div>
                  <span class="text-xs font-mono text-muted-foreground w-8 text-right">{{ count }}</span>
                </div>
              </div>
              <div v-if="!Object.keys(data?.coverage?.platformDistribution ?? {}).length"
                class="text-xs text-muted-foreground text-center py-2">暂无数据</div>
            </div>
          </div>

          <div v-if="data?.coverage?.totalSessions > 0" class="glass-panel p-4">
            <h4 class="text-xs font-medium text-muted-foreground mb-2">Token 覆盖率</h4>
            <div class="flex items-center gap-2">
              <span class="text-lg font-bold font-mono">{{ data.coverage.hasTokenSessions }}</span>
              <span class="text-xs text-muted-foreground">
                / {{ data.coverage.totalSessions }} 条会话有 token 记录
              </span>
            </div>
            <div v-if="data.coverage.hasTokenSessions < data.coverage.totalSessions"
              class="mt-1 text-xs text-amber-500/80">
              仅部分会话记录了 token 消耗，全局平均值已隐藏
            </div>
          </div>
        </div>

        <!-- 趋势图 -->
        <div class="lg:col-span-3 glass-panel p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium flex items-center gap-2">
              <BarChart2 :size="16" class="text-primary" />
              {{ chartTitle }}
            </h3>
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <div class="w-3 h-3 rounded-full bg-primary"></div>
              <span>{{ chartUnitLabel }}</span>
            </div>
          </div>

          <div class="h-64 w-full flex items-center justify-center border border-card-border rounded-xl bg-card/30 p-4">
            <Line v-if="hasChartData"
              :data="chartJsData"
              :options="chartOptions" />
            <div v-else class="flex flex-col items-center text-muted-foreground">
              <BarChart2 :size="40" class="mb-3 opacity-50" />
              <p class="text-sm">暂无图表数据</p>
              <p v-if="data?.chartData?.note" class="text-xs mt-1 opacity-70">{{ data.chartData.note }}</p>
            </div>
          </div>

          <div v-if="data?.chartData?.note && hasChartData"
            class="mt-2 text-xs text-amber-500/80 text-center">
            {{ data.chartData.note }}
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Activity, Cpu, RefreshCw, History, Zap, MessageSquare, BarChart2, CheckCircle } from 'lucide-vue-next'
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

// ── 图表 ─────────────────────────────────────

const hasChartData = computed(() => {
  const d = data.value?.chartData
  if (!d?.labels?.length || !d?.datasets?.length) return false
  return d.datasets[0].data.length > 0
})

const chartTitle = computed(() => {
  const mode = data.value?.chartData?.mode
  if (mode === 'tokens') return 'Tokens 消耗趋势（近 30 天）'
  if (mode === 'sessions') return '会话趋势（近 30 天）'
  return '趋势统计'
})

const chartUnitLabel = computed(() => {
  const mode = data.value?.chartData?.mode
  if (mode === 'tokens') return 'Tokens'
  if (mode === 'sessions') return '会话数'
  return ''
})

const coverageTotal = computed(() => data.value?.coverage?.totalSessions ?? 0)

function coveragePercent(count: number): string {
  if (coverageTotal.value === 0) return '0'
  return ((count / coverageTotal.value) * 100).toFixed(0)
}

// ── Chart.js 数据 ───────────────────────────

const chartJsData = computed(() => {
  const d = data.value?.chartData
  if (!d?.labels?.length || !d?.datasets?.length) {
    return { labels: [], datasets: [] }
  }
  return {
    labels: d.labels,
    datasets: d.datasets.map(ds => ({
      ...ds,
      fill: true,
      tension: 0.4,
    })),
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 12,
      displayColors: false,
      callbacks: {
        label: (context: any) => {
          const label = context.dataset.label || 'Value'
          return `${label}: ${context.raw.toLocaleString()}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: 'rgba(255,255,255,0.5)' },
    },
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: {
        color: 'rgba(255,255,255,0.5)',
        callback: (value: any) => value >= 1000 ? (value / 1000) + 'K' : value,
      },
    },
  },
}

// ── 工具函数 ───────────────────────────────

function formatRefreshTime(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString('zh-CN', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}
</script>
