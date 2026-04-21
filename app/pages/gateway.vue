<template>
  <div class="space-y-6">
    <!-- Connection Status -->
    <div v-if="data?.isRealHermesConnected" class="bg-primary/20 text-primary border border-primary/30 p-3 rounded-xl flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        <span class="text-sm font-medium">已连接 Hermes Agent</span>
      </div>
      <button @click="doRefresh" class="text-xs hover:underline flex items-center gap-1">
        <RefreshCw :size="14" :class="{ 'animate-spin': isRefreshing }" />
        刷新
      </button>
    </div>
    <div v-else class="bg-amber-500/10 text-amber-500 border border-amber-500/30 p-3 rounded-xl">
      <span class="text-sm font-medium">Mock 模式 (示例数据)</span>
    </div>

    <!-- Gateway Overview Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">网关状态</span>
          <div class="w-3 h-3 rounded-full" :class="data?.status === 'running' ? 'bg-green-400 animate-pulse' : 'bg-red-400'"></div>
        </div>
        <h3 class="text-xl font-bold" :class="data?.status === 'running' ? 'text-green-400' : 'text-red-400'">
          {{ data?.status === 'running' ? '运行中' : '已停止' }}
        </h3>
        <p class="text-xs text-muted-foreground mt-1">
          运行时长: {{ data?.uptime || '-' }}
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">连接数</span>
          <Users :size="16" class="text-blue-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ data?.connections?.length || 0 }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          活跃连接
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">消息队列</span>
          <Mail :size="16" class="text-amber-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ data?.messageQueue?.length || 0 }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          待处理消息
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">重连次数</span>
          <RefreshCw :size="16" class="text-red-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ data?.reconnectCount || 0 }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          今日重连
        </p>
      </div>
    </div>

    <!-- Platform Connections -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Radio :size="18" class="text-primary" />
          平台连接状态
        </h3>
        <button @click="reconnectAll" class="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors">
          重连全部
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="conn in data?.connections" :key="conn.platform" 
             class="p-4 bg-muted/30 rounded-xl border border-card-border hover:border-primary/50 transition-colors">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-card-border">
                <component :is="getPlatformIcon(conn.platform)" :size="20" :class="conn.connected ? 'text-primary' : 'text-muted-foreground'" />
              </div>
              <div>
                <p class="font-medium text-sm">{{ conn.displayName }}</p>
                <p class="text-xs text-muted-foreground">{{ conn.accountId }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 rounded-full" :class="conn.connected ? 'bg-green-400' : 'bg-red-400'"></div>
              <span class="text-xs" :class="conn.connected ? 'text-green-400' : 'text-red-400'">
                {{ conn.connected ? '已连接' : '断开' }}
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>延迟: {{ conn.latency }}ms</span>
            <span>消息: {{ conn.messageCount }}</span>
          </div>
          <div v-if="!conn.connected" class="mt-3">
            <button @click="reconnect(conn.platform)" class="w-full text-xs py-1.5 bg-card border border-card-border rounded-lg hover:border-primary/50 transition-colors">
              重新连接
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Paired Users -->
    <div v-if="data?.pairedUsers?.length" class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Users :size="18" class="text-primary" />
          配对用户
        </h3>
        <span class="text-xs text-muted-foreground">{{ data?.pairedUsers?.length || 0 }} 个已授权</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div v-for="user in data?.pairedUsers" :key="user.id" 
             class="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-card-border">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <component :is="getPlatformIcon(user.platform)" :size="14" class="text-primary" />
            </div>
            <div>
              <p class="text-sm font-medium font-mono truncate max-w-[180px]">{{ user.id.slice(0, 20) }}{{ user.id.length > 20 ? '...' : '' }}</p>
              <p class="text-xs text-muted-foreground">{{ user.approved_at }}</p>
            </div>
          </div>
          <span class="text-xs px-2 py-0.5 rounded-md bg-primary/20 text-primary">
            {{ user.platform }}
          </span>
        </div>
      </div>
    </div>

    <!-- Message Queue -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Mail :size="18" class="text-primary" />
          消息队列
        </h3>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground">队列容量: {{ data?.queueCapacity || 100 }}</span>
          <button @click="clearQueue" class="text-xs px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/20 transition-colors">
            清空队列
          </button>
        </div>
      </div>
      
      <div class="space-y-2 max-h-80 overflow-y-auto">
        <div v-for="(msg, index) in data?.messageQueue" :key="index" 
             class="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-card-border">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-card flex items-center justify-center border border-card-border">
              <component :is="getPlatformIcon(msg.platform)" :size="14" class="text-primary" />
            </div>
            <div>
              <p class="text-sm font-medium truncate max-w-xs">{{ msg.preview }}</p>
              <p class="text-xs text-muted-foreground">来自: {{ msg.sender }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs px-2 py-0.5 rounded-md" 
                  :class="msg.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-muted'">
              {{ msg.priority === 'high' ? '高优先' : '普通' }}
            </span>
            <span class="text-xs text-muted-foreground">{{ msg.timestamp }}</span>
          </div>
        </div>
        
        <div v-if="!data?.messageQueue?.length" class="text-center py-8 text-muted-foreground">
          <Mail :size="32" class="mx-auto mb-2 opacity-50" />
          <p class="text-sm">队列为空</p>
        </div>
      </div>
    </div>

    <!-- Reconnection History -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <History :size="18" class="text-primary" />
          重连历史
        </h3>
        <span class="text-xs text-muted-foreground">最近 24 小时</span>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-card-border">
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">时间</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">平台</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">原因</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">持续时间</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in data?.reconnectHistory" :key="index" class="border-b border-card-border/50 hover:bg-muted/30">
              <td class="py-3 px-4 font-mono text-xs">{{ item.timestamp }}</td>
              <td class="py-3 px-4">{{ item.platform }}</td>
              <td class="py-3 px-4 text-muted-foreground">{{ item.reason }}</td>
              <td class="py-3 px-4 font-mono text-xs">{{ item.duration }}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-md text-xs" 
                      :class="item.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'">
                  {{ item.success ? '成功' : '失败' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="!data?.reconnectHistory?.length" class="text-center py-8 text-muted-foreground">
          <p class="text-sm">无重连记录</p>
        </div>
      </div>
    </div>

    <!-- Gateway Actions -->
    <div class="glass-panel p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Settings :size="18" class="text-primary" />
        网关操作
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button @click="restartGateway" 
                class="flex flex-col items-center gap-2 p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-card-border transition-colors">
          <RefreshCw :size="20" class="text-amber-400" />
          <span class="text-sm font-medium">重启网关</span>
        </button>
        
        <button @click="reloadConfig" 
                class="flex flex-col items-center gap-2 p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-card-border transition-colors">
          <FileText :size="20" class="text-blue-400" />
          <span class="text-sm font-medium">重载配置</span>
        </button>
        
        <button @click="enableMaintenance" 
                class="flex flex-col items-center gap-2 p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-card-border transition-colors">
          <Shield :size="20" class="text-green-400" />
          <span class="text-sm font-medium">维护模式</span>
        </button>
        
        <button @click="viewLogs" 
                class="flex flex-col items-center gap-2 p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-card-border transition-colors">
          <TerminalSquare :size="20" class="text-primary" />
          <span class="text-sm font-medium">查看日志</span>
        </button>
      </div>
    </div>

    <!-- Status Message -->
    <div v-if="statusMessage" 
         class="fixed bottom-4 right-4 px-4 py-3 rounded-xl border shadow-lg z-50"
         :class="statusMessage.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'">
      <div class="flex items-center gap-2">
        <CheckCircle v-if="statusMessage.type === 'success'" :size="16" />
        <AlertCircle v-else :size="16" />
        <span class="text-sm">{{ statusMessage.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  Radio, Users, Mail, RefreshCw, History, Settings, FileText, Shield, TerminalSquare,
  CheckCircle, AlertCircle, MessageCircle, Phone, Send
} from 'lucide-vue-next'

const { data, refresh: refreshData } = await useFetch('/api/gateway')
const isRefreshing = ref(false)
const statusMessage = ref<{ type: string, message: string } | null>(null)

const doRefresh = async () => {
  isRefreshing.value = true
  await refreshData()
  setTimeout(() => { isRefreshing.value = false }, 500)
}

const showStatus = (type: string, message: string) => {
  statusMessage.value = { type, message }
  setTimeout(() => { statusMessage.value = null }, 3000)
}

const getPlatformIcon = (platform: string) => {
  const icons: Record<string, any> = {
    'wechat': MessageCircle,
    'telegram': Send,
    'discord': Users,
    'default': Radio
  }
  return icons[platform] || icons['default']
}

const reconnectAll = async () => {
  try {
    const result = await $fetch('/api/gateway/reconnect', {
      method: 'POST',
      body: {}
    })
    showStatus(result.success ? 'success' : 'error', result.message)
    if (result.success) {
      setTimeout(() => refreshData(), 2000)
    }
  } catch (error: any) {
    showStatus('error', error.message || '重连失败')
  }
}

const reconnect = async (platform: string) => {
  try {
    const result = await $fetch('/api/gateway/reconnect', {
      method: 'POST',
      body: { platform }
    })
    showStatus(result.success ? 'success' : 'error', result.message)
    if (result.success) {
      setTimeout(() => refreshData(), 2000)
    }
  } catch (error: any) {
    showStatus('error', error.message || '重连失败')
  }
}

const clearQueue = async () => {
  if (!confirm('确定要清空消息队列吗？')) return
  try {
    const result = await $fetch('/api/gateway/queue/clear', {
      method: 'POST'
    })
    showStatus(result.success ? 'success' : 'error', result.message)
    if (result.success) {
      refreshData()
    }
  } catch (error: any) {
    showStatus('error', error.message || '清空队列失败')
  }
}

const restartGateway = async () => {
  if (!confirm('确定要重启网关吗？这将暂时中断所有连接。')) return
  try {
    const result = await $fetch('/api/gateway/restart', {
      method: 'POST'
    })
    showStatus(result.success ? 'success' : 'error', result.message)
    if (result.success) {
      setTimeout(() => refreshData(), 3000)
    }
  } catch (error: any) {
    showStatus('error', error.message || '重启失败')
  }
}

const reloadConfig = async () => {
  try {
    const result = await $fetch('/api/gateway/reload', {
      method: 'POST'
    })
    showStatus(result.success ? 'success' : 'error', result.message)
  } catch (error: any) {
    showStatus('error', error.message || '重载配置失败')
  }
}

const enableMaintenance = async () => {
  showStatus('success', '维护模式已启用')
}

const viewLogs = () => {
  navigateTo('/logs')
}
</script>
