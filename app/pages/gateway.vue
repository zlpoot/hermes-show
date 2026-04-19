<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Radio class="text-primary" size="24" />
          </div>
          <div>
            <h2 class="text-2xl font-bold">网关状态</h2>
            <p class="text-muted-foreground text-sm mt-1">实时监控 Gateway 运行状态和平台连接</p>
          </div>
        </div>
        <button @click="refresh" class="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-xl hover:bg-primary/20 transition flex items-center gap-2">
          <RefreshCw size="16" :class="{ 'animate-spin': pending }" />
          刷新
        </button>
      </div>
    </div>

    <!-- Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="glass-panel p-5">
        <div class="flex items-center gap-3">
          <div :class="statusBgClass" class="w-10 h-10 rounded-lg flex items-center justify-center">
            <Activity :class="statusTextClass" size="20" />
          </div>
          <div>
            <div class="text-sm text-muted-foreground">运行状态</div>
            <div class="font-semibold" :class="statusTextClass">{{ statusText }}</div>
          </div>
        </div>
      </div>
      <div class="glass-panel p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Cpu class="text-secondary" size="20" />
          </div>
          <div>
            <div class="text-sm text-muted-foreground">进程 PID</div>
            <div class="font-semibold">{{ data?.pid || '-' }}</div>
          </div>
        </div>
      </div>
      <div class="glass-panel p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Clock class="text-amber-500" size="20" />
          </div>
          <div>
            <div class="text-sm text-muted-foreground">运行时间</div>
            <div class="font-semibold">{{ data?.uptime || '-' }}</div>
          </div>
        </div>
      </div>
      <div class="glass-panel p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Database class="text-blue-500" size="20" />
          </div>
          <div>
            <div class="text-sm text-muted-foreground">数据大小</div>
            <div class="font-semibold">{{ data?.system?.data_dir_size || '-' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Platforms -->
    <div class="glass-panel p-6">
      <div class="flex items-center gap-2 mb-5">
        <MessageSquare size="18" class="text-primary" />
        <h3 class="text-lg font-semibold">平台连接</h3>
      </div>
      <div v-if="!data?.platforms || Object.keys(data.platforms).length === 0" class="text-center py-8 text-muted-foreground">
        <WifiOff size="32" class="mx-auto mb-2 opacity-50" />
        <p>暂无已连接的平台</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="(platform, name) in data.platforms" :key="name" 
             class="p-4 rounded-xl border border-card-border bg-muted/20 hover:bg-muted/30 transition">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ getPlatformIcon(name) }}</span>
              <div>
                <div class="font-semibold">{{ getPlatformName(name) }}</div>
                <div class="text-xs text-muted-foreground">{{ name }}</div>
              </div>
            </div>
            <span :class="getPlatformStatusClass(platform.state)" class="px-3 py-1 rounded-full text-xs font-medium">
              {{ platform.state === 'connected' ? '已连接' : platform.state }}
            </span>
          </div>
          <div v-if="platform.error_message" class="mt-3 text-sm text-destructive bg-destructive/10 p-2 rounded">
            {{ platform.error_message }}
          </div>
          <div class="mt-3 text-xs text-muted-foreground flex items-center gap-1">
            <Clock size="12" />
            更新: {{ formatTime(platform.updated_at) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Paired Users -->
    <div class="glass-panel p-6">
      <div class="flex items-center gap-2 mb-5">
        <Users size="18" class="text-primary" />
        <h3 class="text-lg font-semibold">已授权用户</h3>
        <span class="ml-auto text-sm text-muted-foreground">{{ data?.pairedUsers?.length || 0 }} 个用户</span>
      </div>
      <div v-if="!data?.pairedUsers?.length" class="text-center py-8 text-muted-foreground">
        <UserX size="32" class="mx-auto mb-2 opacity-50" />
        <p>暂无授权用户</p>
      </div>
      <div v-else class="space-y-2">
        <div v-for="user in data.pairedUsers" :key="user.id" 
             class="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-card-border">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User size="16" class="text-primary" />
            </div>
            <div>
              <span class="font-mono text-sm">{{ user.id }}</span>
              <span v-if="user.platform" class="ml-2 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {{ user.platform }}
              </span>
            </div>
          </div>
          <span class="text-sm text-muted-foreground">{{ user.approved_at }}</span>
        </div>
      </div>
    </div>

    <!-- Config & System -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Gateway Config -->
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-5">
          <Settings size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">网关配置</h3>
        </div>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-card-border">
            <span class="text-muted-foreground">Gateway 超时</span>
            <span class="font-mono">{{ data?.config?.gateway_timeout ? `${data.config.gateway_timeout}s` : '默认' }}</span>
          </div>
          <div class="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-card-border">
            <span class="text-muted-foreground">允许所有用户</span>
            <span :class="data?.config?.allow_all_users ? 'text-primary' : ''" class="font-medium">
              {{ data?.config?.allow_all_users ? '是' : '否' }}
            </span>
          </div>
          <div class="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-card-border">
            <span class="text-muted-foreground">微信消息策略</span>
            <span class="font-mono">{{ data?.config?.weixin_dm_policy || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- System Status -->
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-5">
          <Server size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">系统状态</h3>
        </div>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-card-border">
            <span class="text-muted-foreground">进程状态</span>
            <span class="flex items-center gap-2">
              <span :class="data?.system?.process_running ? 'bg-primary' : 'bg-destructive'" class="w-2 h-2 rounded-full"></span>
              {{ data?.system?.process_running ? '运行中' : '已停止' }}
            </span>
          </div>
          <div class="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-card-border">
            <span class="text-muted-foreground">端口监听</span>
            <span class="flex items-center gap-2">
              <span :class="data?.system?.listening_ports ? 'bg-primary' : 'bg-amber-500'" class="w-2 h-2 rounded-full"></span>
              {{ data?.system?.listening_ports ? '正常' : '未监听' }}
            </span>
          </div>
          <div class="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-card-border">
            <span class="text-muted-foreground">日志大小</span>
            <span class="font-mono">{{ data?.system?.logs_size || '-' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Radio, RefreshCw, Activity, Cpu, Clock, Database, MessageSquare, WifiOff, Users, UserX, User, Settings, Server } from 'lucide-vue-next'

const { data, refresh, pending } = await useFetch('/api/gateway/status')

const statusText = computed(() => {
  switch (data.value?.status) {
    case 'running': return '运行中'
    case 'offline': return '离线'
    case 'dead': return '已停止'
    default: return '未知'
  }
})

const statusTextClass = computed(() => {
  switch (data.value?.status) {
    case 'running': return 'text-primary'
    case 'offline': return 'text-muted-foreground'
    case 'dead': return 'text-destructive'
    default: return 'text-amber-500'
  }
})

const statusBgClass = computed(() => {
  switch (data.value?.status) {
    case 'running': return 'bg-primary/10'
    case 'offline': return 'bg-muted'
    case 'dead': return 'bg-destructive/10'
    default: return 'bg-amber-500/10'
  }
})

function getPlatformIcon(name: string): string {
  const icons: Record<string, string> = {
    weixin: '💬',
    telegram: '✈️',
    discord: '🎮',
    whatsapp: '📱',
    slack: '💼'
  }
  return icons[name] || '🔌'
}

function getPlatformName(name: string): string {
  const names: Record<string, string> = {
    weixin: '微信',
    telegram: 'Telegram',
    discord: 'Discord',
    whatsapp: 'WhatsApp',
    slack: 'Slack'
  }
  return names[name] || name
}

function getPlatformStatusClass(status: string): string {
  switch (status) {
    case 'connected': return 'bg-primary/10 text-primary border border-primary/30'
    case 'disconnected': return 'bg-destructive/10 text-destructive border border-destructive/30'
    case 'connecting': return 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
    default: return 'bg-muted text-muted-foreground border border-card-border'
  }
}

function formatTime(time: string): string {
  if (!time) return '-'
  try {
    return new Date(time).toLocaleString('zh-CN')
  } catch {
    return time
  }
}
</script>
