<template>
  <div class="space-y-6">
    <!-- Overall Status -->
    <div class="glass-panel p-6" :class="overallStatusClass">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="overallStatusBg">
            <component :is="overallStatusIcon" :size="24" :class="overallStatusText" />
          </div>
          <div>
            <h2 class="text-xl font-semibold">系统状态: {{ overallStatusLabel }}</h2>
            <p class="text-sm text-muted-foreground">{{ data?.timestamp ? formatTime(data.timestamp) : '' }}</p>
          </div>
        </div>
        <button @click="doRefresh" class="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors flex items-center gap-2">
          <RefreshCw :size="16" :class="{ 'animate-spin': isRefreshing }" />
          刷新
        </button>
      </div>
    </div>

    <!-- Health Checks -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="(check, key) in data?.healthChecks" :key="key" 
           class="glass-panel p-4 border-l-4"
           :class="getCheckBorderClass(check.status)">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground capitalize">{{ key }}</span>
          <component :is="getCheckIcon(check.status)" :size="16" :class="getCheckIconClass(check.status)" />
        </div>
        <p class="text-sm font-medium">{{ check.message }}</p>
      </div>
    </div>

    <!-- System Info & Disk -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- System Info -->
      <div class="glass-panel p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Server :size="18" class="text-primary" />
          系统信息
        </h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-card-border/50">
            <span class="text-muted-foreground">平台</span>
            <span class="font-mono text-sm">{{ data?.systemInfo?.platform }} ({{ data?.systemInfo?.arch }})</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-card-border/50">
            <span class="text-muted-foreground">主机名</span>
            <span class="font-mono text-sm">{{ data?.systemInfo?.hostname }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-card-border/50">
            <span class="text-muted-foreground">运行时间</span>
            <span class="font-mono text-sm">{{ data?.systemInfo?.uptime }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-card-border/50">
            <span class="text-muted-foreground">CPU</span>
            <span class="font-mono text-sm">{{ data?.systemInfo?.cpuCores }} 核 - {{ data?.systemInfo?.cpuModel?.split(' ')[0] }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-card-border/50">
            <span class="text-muted-foreground">负载</span>
            <span class="font-mono text-sm">{{ data?.systemInfo?.loadAverage?.join(' / ') }}</span>
          </div>
        </div>
      </div>

      <!-- Memory & Disk -->
      <div class="glass-panel p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <HardDrive :size="18" class="text-primary" />
          存储与内存
        </h3>
        
        <!-- Memory -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium">内存</span>
            <span class="text-xs text-muted-foreground">{{ data?.systemInfo?.usedMemoryPercent }}% 已使用</span>
          </div>
          <div class="w-full h-3 bg-background rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all" 
                 :class="getProgressClass(data?.systemInfo?.usedMemoryPercent || 0)"
                 :style="{ width: `${data?.systemInfo?.usedMemoryPercent || 0}%` }"></div>
          </div>
          <div class="flex justify-between text-xs text-muted-foreground mt-1">
            <span>空闲: {{ data?.systemInfo?.freeMemory }}</span>
            <span>总计: {{ data?.systemInfo?.totalMemory }}</span>
          </div>
        </div>
        
        <!-- Disk -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium">磁盘</span>
            <span class="text-xs text-muted-foreground">{{ data?.diskInfo?.usedPercent }}% 已使用</span>
          </div>
          <div class="w-full h-3 bg-background rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all"
                 :class="getProgressClass(data?.diskInfo?.usedPercent || 0)"
                 :style="{ width: `${data?.diskInfo?.usedPercent || 0}%` }"></div>
          </div>
          <div class="flex justify-between text-xs text-muted-foreground mt-1">
            <span>已用: {{ data?.diskInfo?.used }}</span>
            <span>可用: {{ data?.diskInfo?.free }} / {{ data?.diskInfo?.total }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Hermes Directory -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Folder :size="18" class="text-primary" />
          Hermes 目录
        </h3>
        <div class="flex items-center gap-4">
          <span class="text-xs text-muted-foreground font-mono">{{ data?.hermesInfo?.path }}</span>
          <span class="px-3 py-1 rounded-full text-xs font-medium" 
                :class="data?.hermesInfo?.exists ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'">
            {{ data?.hermesInfo?.exists ? '存在' : '未找到' }}
          </span>
        </div>
      </div>
      
      <!-- Summary Stats -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div class="bg-muted/30 p-3 rounded-lg border border-card-border text-center">
          <p class="text-2xl font-bold font-mono text-primary">{{ data?.hermesInfo?.totalSize }}</p>
          <p class="text-xs text-muted-foreground">总大小</p>
        </div>
        <div class="bg-muted/30 p-3 rounded-lg border border-card-border text-center">
          <p class="text-2xl font-bold font-mono">{{ data?.hermesInfo?.sessionCount }}</p>
          <p class="text-xs text-muted-foreground">会话记录</p>
        </div>
        <div class="bg-muted/30 p-3 rounded-lg border border-card-border text-center">
          <p class="text-2xl font-bold font-mono">{{ data?.hermesInfo?.skillCount }}</p>
          <p class="text-xs text-muted-foreground">Skills</p>
        </div>
        <div class="bg-muted/30 p-3 rounded-lg border border-card-border text-center">
          <p class="text-2xl font-bold font-mono">{{ data?.hermesInfo?.dbSize }}</p>
          <p class="text-xs text-muted-foreground">数据库</p>
        </div>
        <div class="bg-muted/30 p-3 rounded-lg border border-card-border text-center">
          <p class="text-2xl font-bold font-mono">{{ data?.hermesInfo?.logSize }}</p>
          <p class="text-xs text-muted-foreground">日志</p>
        </div>
      </div>
      
      <!-- Breakdown -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-muted-foreground mb-3">存储分布</h4>
        <div v-for="item in data?.hermesInfo?.breakdown" :key="item.path" 
             class="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
          <div class="flex items-center gap-3">
            <FolderOpen :size="16" class="text-muted-foreground" />
            <span class="text-sm">{{ item.name }}</span>
            <span class="text-xs text-muted-foreground font-mono">{{ item.path }}</span>
          </div>
          <span class="font-mono text-sm font-medium">{{ item.size }}</span>
        </div>
      </div>
    </div>

    <!-- Gateway Status -->
    <div class="glass-panel p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Radio :size="18" class="text-primary" />
        Gateway 状态
      </h3>
      <div class="flex items-center justify-between p-4 rounded-xl" 
           :class="data?.gatewayStatus?.running ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30 border border-card-border'">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full flex items-center justify-center"
               :class="data?.gatewayStatus?.running ? 'bg-primary/20' : 'bg-muted'">
            <div v-if="data?.gatewayStatus?.running" class="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
            <div v-else class="w-3 h-3 rounded-full bg-muted-foreground"></div>
          </div>
          <div>
            <p class="font-medium">{{ data?.gatewayStatus?.running ? '运行中' : '未运行' }}</p>
            <p v-if="data?.gatewayStatus?.running" class="text-sm text-muted-foreground">
              PID: {{ data?.gatewayStatus?.pid }} · 运行时间: {{ data?.gatewayStatus?.uptime }}
            </p>
          </div>
        </div>
        <div v-if="data?.gatewayStatus?.running" class="flex items-center gap-2 text-primary">
          <CheckCircle :size="20" />
          <span class="text-sm font-medium">正常</span>
        </div>
        <div v-else class="flex items-center gap-2 text-muted-foreground">
          <XCircle :size="20" />
          <span class="text-sm">离线</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Server, HardDrive, Folder, FolderOpen, Radio, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Activity
} from 'lucide-vue-next'

const { data, refresh: refreshData } = await useFetch('/api/health')
const isRefreshing = ref(false)

const doRefresh = async () => {
  isRefreshing.value = true
  await refreshData()
  setTimeout(() => { isRefreshing.value = false }, 500)
}

// Overall status
const overallStatus = computed(() => data.value?.overallStatus || 'unknown')
const overallStatusClass = computed(() => {
  switch (overallStatus.value) {
    case 'healthy': return 'border-l-4 border-l-primary'
    case 'warning': return 'border-l-4 border-l-amber-500'
    case 'critical': return 'border-l-4 border-l-red-500'
    default: return ''
  }
})

const overallStatusBg = computed(() => {
  switch (overallStatus.value) {
    case 'healthy': return 'bg-primary/20'
    case 'warning': return 'bg-amber-500/20'
    case 'critical': return 'bg-red-500/20'
    default: return 'bg-muted'
  }
})

const overallStatusText = computed(() => {
  switch (overallStatus.value) {
    case 'healthy': return 'text-primary'
    case 'warning': return 'text-amber-500'
    case 'critical': return 'text-red-500'
    default: return 'text-muted-foreground'
  }
})

const overallStatusIcon = computed(() => {
  switch (overallStatus.value) {
    case 'healthy': return CheckCircle
    case 'warning': return AlertTriangle
    case 'critical': return XCircle
    default: return Activity
  }
})

const overallStatusLabel = computed(() => {
  switch (overallStatus.value) {
    case 'healthy': return '健康'
    case 'warning': return '警告'
    case 'critical': return '异常'
    default: return '未知'
  }
})

// Health check helpers
const getCheckBorderClass = (status: string) => {
  switch (status) {
    case 'healthy': return 'border-primary'
    case 'warning': return 'border-amber-500'
    case 'critical': return 'border-red-500'
    default: return 'border-card-border'
  }
}

const getCheckIcon = (status: string) => {
  switch (status) {
    case 'healthy': return CheckCircle
    case 'warning': return AlertTriangle
    case 'critical': return XCircle
    default: return Activity
  }
}

const getCheckIconClass = (status: string) => {
  switch (status) {
    case 'healthy': return 'text-primary'
    case 'warning': return 'text-amber-500'
    case 'critical': return 'text-red-500'
    default: return 'text-muted-foreground'
  }
}

const getProgressClass = (percent: number) => {
  if (percent < 70) return 'bg-primary'
  if (percent < 85) return 'bg-amber-500'
  return 'bg-red-500'
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}
</script>
