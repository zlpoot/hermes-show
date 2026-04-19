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

    <!-- Notification Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">今日通知</span>
          <Bell size="16" class="text-primary" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ data?.stats?.todayCount || 0 }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          较昨日 {{ data?.stats?.yesterdayChange || 0 > 0 ? '+' : '' }}{{ data?.stats?.yesterdayChange || 0 }}%
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">错误告警</span>
          <AlertTriangle size="16" class="text-red-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono text-red-400">{{ data?.stats?.errorAlerts || 0 }}</h3>
        <p class="text-xs text-muted-foreground mt-1">未处理</p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">活跃规则</span>
          <Settings2 size="16" class="text-blue-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ data?.stats?.activeRules || 0 }}</h3>
        <p class="text-xs text-muted-foreground mt-1">共 {{ data?.stats?.totalRules || 0 }} 条规则</p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">通知渠道</span>
          <Send size="16" class="text-green-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ data?.stats?.activeChannels || 0 }}</h3>
        <p class="text-xs text-muted-foreground mt-1">已启用</p>
      </div>
    </div>

    <!-- Notification Channels -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Radio size="18" class="text-primary" />
          通知渠道
        </h3>
        <button @click="addChannel" class="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-1">
          <Plus size="14" />
          添加渠道
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="channel in data?.channels" :key="channel.id" 
             class="p-4 bg-muted/30 rounded-xl border border-card-border hover:border-primary/50 transition-colors">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-card-border">
                <component :is="getChannelIcon(channel.type)" size="20" :class="channel.enabled ? 'text-primary' : 'text-muted-foreground'" />
              </div>
              <div>
                <p class="font-medium text-sm">{{ channel.name }}</p>
                <p class="text-xs text-muted-foreground">{{ channel.description }}</p>
              </div>
            </div>
            <label class="flex items-center cursor-pointer">
              <div class="relative">
                <input type="checkbox" v-model="channel.enabled" @change="toggleChannel(channel)" class="sr-only" />
                <div class="w-9 h-5 bg-muted rounded-full transition-colors" :class="{ 'bg-primary': channel.enabled }"></div>
                <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform" :class="{ 'translate-x-4': channel.enabled }"></div>
              </div>
            </label>
          </div>
          
          <div class="flex items-center justify-between text-xs">
            <span class="text-muted-foreground">今日发送: {{ channel.todaySent }}</span>
            <div class="flex items-center gap-1">
              <button @click="testChannel(channel)" class="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-primary">
                <TestTube size="14" />
              </button>
              <button @click="editChannel(channel)" class="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-blue-400">
                <Pencil size="14" />
              </button>
              <button @click="deleteChannel(channel)" class="p-1.5 hover:bg-red-500/10 rounded transition-colors text-muted-foreground hover:text-red-400">
                <Trash2 size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification Rules -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <BellRing size="18" class="text-primary" />
          通知规则
        </h3>
        <button @click="addRule" class="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-1">
          <Plus size="14" />
          新建规则
        </button>
      </div>
      
      <div class="space-y-3">
        <div v-for="rule in data?.rules" :key="rule.id" 
             class="p-4 bg-muted/30 rounded-xl border border-card-border hover:border-primary/50 transition-colors">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center border border-card-border"
                   :class="getEventBgColor(rule.eventType)">
                <component :is="getEventIcon(rule.eventType)" size="18" :class="getEventColor(rule.eventType)" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="font-medium text-sm">{{ rule.name }}</p>
                  <span class="px-2 py-0.5 rounded-md text-xs" 
                        :class="rule.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 
                                rule.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' : 
                                'bg-blue-500/20 text-blue-400'">
                    {{ getSeverityLabel(rule.severity) }}
                  </span>
                </div>
                <p class="text-xs text-muted-foreground mt-0.5">{{ rule.description }}</p>
              </div>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <component :is="getChannelIcon(rule.channel)" size="14" />
                <span>{{ rule.channelName }}</span>
              </div>
              
              <label class="flex items-center cursor-pointer">
                <div class="relative">
                  <input type="checkbox" v-model="rule.enabled" @change="toggleRule(rule)" class="sr-only" />
                  <div class="w-9 h-5 bg-muted rounded-full transition-colors" :class="{ 'bg-primary': rule.enabled }"></div>
                  <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform" :class="{ 'translate-x-4': rule.enabled }"></div>
                </div>
              </label>
              
              <button @click="editRule(rule)" class="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-blue-400">
                <Pencil size="14" />
              </button>
              <button @click="deleteRule(rule)" class="p-1.5 hover:bg-red-500/10 rounded transition-colors text-muted-foreground hover:text-red-400">
                <Trash2 size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Types Settings -->
    <div class="glass-panel p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Zap size="18" class="text-primary" />
        事件类型
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="eventType in data?.eventTypes" :key="eventType.id" 
             class="p-4 bg-muted/30 rounded-xl border border-card-border">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center border border-card-border"
                   :class="getEventBgColor(eventType.id)">
                <component :is="getEventIcon(eventType.id)" size="16" :class="getEventColor(eventType.id)" />
              </div>
              <span class="font-medium text-sm">{{ eventType.name }}</span>
            </div>
            <label class="flex items-center cursor-pointer">
              <div class="relative">
                <input type="checkbox" v-model="eventType.enabled" @change="toggleEventType(eventType)" class="sr-only" />
                <div class="w-9 h-5 bg-muted rounded-full transition-colors" :class="{ 'bg-primary': eventType.enabled }"></div>
                <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform" :class="{ 'translate-x-4': eventType.enabled }"></div>
              </div>
            </label>
          </div>
          <p class="text-xs text-muted-foreground">{{ eventType.description }}</p>
          <div class="mt-2 flex items-center gap-2 text-xs">
            <span class="text-muted-foreground">触发次数:</span>
            <span class="font-mono">{{ eventType.triggerCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Notifications -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <History size="18" class="text-primary" />
          最近通知
        </h3>
        <button @click="clearHistory" class="text-xs px-3 py-1.5 bg-muted/50 rounded-lg border border-card-border hover:bg-muted transition-colors">
          清空历史
        </button>
      </div>
      
      <div class="space-y-2 max-h-80 overflow-y-auto">
        <div v-for="notif in data?.recentNotifications" :key="notif.id" 
             class="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-card-border">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center border border-card-border shrink-0"
               :class="getEventBgColor(notif.eventType)">
            <component :is="getEventIcon(notif.eventType)" size="14" :class="getEventColor(notif.eventType)" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-medium truncate">{{ notif.title }}</p>
              <span class="text-xs text-muted-foreground shrink-0">{{ notif.time }}</span>
            </div>
            <p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">{{ notif.message }}</p>
            <div class="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span class="flex items-center gap-1">
                <component :is="getChannelIcon(notif.channel)" size="12" />
                {{ notif.channelName }}
              </span>
              <span :class="notif.status === 'sent' ? 'text-green-400' : 'text-red-400'">
                {{ notif.status === 'sent' ? '已发送' : '发送失败' }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-if="!data?.recentNotifications?.length" class="text-center py-8 text-muted-foreground">
          <BellOff size="32" class="mx-auto mb-2 opacity-50" />
          <p class="text-sm">暂无通知记录</p>
        </div>
      </div>
    </div>

    <!-- Add/Edit Channel Modal -->
    <div v-if="showChannelModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="showChannelModal = false">
      <div class="glass-panel p-6 w-full max-w-md rounded-2xl">
        <h3 class="text-lg font-semibold mb-4">{{ editingChannel?.id ? '编辑渠道' : '添加渠道' }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="text-xs text-muted-foreground block mb-2">渠道类型</label>
            <select v-model="channelForm.type" class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm">
              <option value="wechat">微信</option>
              <option value="telegram">Telegram</option>
              <option value="discord">Discord</option>
              <option value="email">邮件</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">名称</label>
            <input type="text" v-model="channelForm.name" placeholder="输入渠道名称"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm" />
          </div>
          
          <div v-if="channelForm.type === 'telegram'">
            <label class="text-xs text-muted-foreground block mb-2">Bot Token</label>
            <input type="password" v-model="channelForm.botToken" placeholder="输入 Bot Token"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm" />
            <label class="text-xs text-muted-foreground block mb-2 mt-3">Chat ID</label>
            <input type="text" v-model="channelForm.chatId" placeholder="输入 Chat ID"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm" />
          </div>
          
          <div v-if="channelForm.type === 'webhook'">
            <label class="text-xs text-muted-foreground block mb-2">Webhook URL</label>
            <input type="text" v-model="channelForm.webhookUrl" placeholder="https://"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-6">
          <button @click="showChannelModal = false" class="px-4 py-2 text-sm bg-muted/50 rounded-lg border border-card-border">
            取消
          </button>
          <button @click="saveChannel" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- Status Message -->
    <div v-if="statusMessage" 
         class="fixed bottom-4 right-4 px-4 py-3 rounded-xl border shadow-lg z-50"
         :class="statusMessage.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'">
      <div class="flex items-center gap-2">
        <CheckCircle v-if="statusMessage.type === 'success'" size="16" />
        <AlertCircle v-else size="16" />
        <span class="text-sm">{{ statusMessage.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { 
  Bell, BellRing, BellOff, AlertTriangle, Settings2, Send, Radio, Plus, Pencil, Trash2,
  TestTube, History, Zap, CheckCircle, AlertCircle, RefreshCw,
  MessageCircle, Mail, Link, XCircle, CheckCircle2, Clock, Activity
} from 'lucide-vue-next'

const { data, refresh: refreshData } = await useFetch('/api/notifications')
const isRefreshing = ref(false)
const statusMessage = ref<{ type: string, message: string } | null>(null)
const showChannelModal = ref(false)
const editingChannel = ref<any>(null)

const channelForm = reactive({
  type: 'telegram',
  name: '',
  botToken: '',
  chatId: '',
  webhookUrl: ''
})

const doRefresh = async () => {
  isRefreshing.value = true
  await refreshData()
  setTimeout(() => { isRefreshing.value = false }, 500)
}

const showStatus = (type: string, message: string) => {
  statusMessage.value = { type, message }
  setTimeout(() => { statusMessage.value = null }, 3000)
}

const getChannelIcon = (type: string) => {
  const icons: Record<string, any> = {
    'wechat': MessageCircle,
    'telegram': Send,
    'discord': MessageCircle,
    'email': Mail,
    'webhook': Link
  }
  return icons[type] || Bell
}

const getEventIcon = (type: string) => {
  const icons: Record<string, any> = {
    'error': XCircle,
    'warning': AlertTriangle,
    'task_complete': CheckCircle2,
    'system': Activity,
    'gateway': Radio,
    'cron': Clock
  }
  return icons[type] || Bell
}

const getEventColor = (type: string) => {
  const colors: Record<string, string> = {
    'error': 'text-red-400',
    'warning': 'text-amber-400',
    'task_complete': 'text-green-400',
    'system': 'text-blue-400',
    'gateway': 'text-purple-400',
    'cron': 'text-cyan-400'
  }
  return colors[type] || 'text-muted-foreground'
}

const getEventBgColor = (type: string) => {
  const colors: Record<string, string> = {
    'error': 'bg-red-500/10',
    'warning': 'bg-amber-500/10',
    'task_complete': 'bg-green-500/10',
    'system': 'bg-blue-500/10',
    'gateway': 'bg-purple-500/10',
    'cron': 'bg-cyan-500/10'
  }
  return colors[type] || 'bg-muted/30'
}

const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = {
    'critical': '紧急',
    'warning': '警告',
    'info': '信息'
  }
  return labels[severity] || severity
}

const toggleChannel = async (channel: any) => {
  showStatus('success', channel.enabled ? '渠道已启用' : '渠道已禁用')
}

const toggleRule = async (rule: any) => {
  showStatus('success', rule.enabled ? '规则已启用' : '规则已禁用')
}

const toggleEventType = async (eventType: any) => {
  showStatus('success', eventType.enabled ? '事件类型已启用' : '事件类型已禁用')
}

const addChannel = () => {
  editingChannel.value = null
  Object.assign(channelForm, { type: 'telegram', name: '', botToken: '', chatId: '', webhookUrl: '' })
  showChannelModal.value = true
}

const editChannel = (channel: any) => {
  editingChannel.value = channel
  Object.assign(channelForm, channel)
  showChannelModal.value = true
}

const saveChannel = async () => {
  showStatus('success', editingChannel.value ? '渠道已更新' : '渠道已添加')
  showChannelModal.value = false
}

const deleteChannel = async (channel: any) => {
  if (!confirm(`确定要删除渠道 "${channel.name}" 吗？`)) return
  showStatus('success', '渠道已删除')
}

const testChannel = async (channel: any) => {
  showStatus('success', `测试消息已发送到 ${channel.name}`)
}

const addRule = () => {
  showStatus('success', '请通过配置文件添加规则')
}

const editRule = (rule: any) => {
  showStatus('success', '请通过配置文件编辑规则')
}

const deleteRule = async (rule: any) => {
  if (!confirm(`确定要删除规则 "${rule.name}" 吗？`)) return
  showStatus('success', '规则已删除')
}

const clearHistory = async () => {
  if (!confirm('确定要清空通知历史吗？')) return
  showStatus('success', '历史已清空')
}
</script>
