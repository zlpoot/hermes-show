<template>
  <div class="h-full flex flex-col gap-4 p-6 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between glass-panel p-4 shrink-0">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Bell class="text-primary" :size="20" />
        </div>
        <div>
          <h2 class="text-xl font-bold">通知设置</h2>
          <p class="text-sm text-muted-foreground mt-0.5">配置事件通知渠道和规则</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button @click="doRefresh" class="btn-outline flex items-center gap-2 text-sm">
          <RefreshCw :size="14" :class="{ 'animate-spin': isRefreshing }" /> 刷新
        </button>
        <NuxtLink to="/docs/notifications" class="btn-primary flex items-center gap-2 text-sm">
          <BookOpen :size="14" /> 文档
        </NuxtLink>
      </div>
    </div>

    <!-- Notification Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">今日通知</span>
          <Bell :size="16" class="text-primary" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ stats.todaySent }}<span class="text-base text-muted-foreground">/{{ stats.todayCount }}</span></h3>
        <p class="text-xs mt-1" :class="stats.yesterdayChange >= 0 ? 'text-emerald-400' : 'text-red-400'">
          较昨日 {{ stats.yesterdayChange >= 0 ? '+' : '' }}{{ stats.yesterdayChange }}%
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">失败通知</span>
          <AlertTriangle :size="16" class="text-red-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono" :class="stats.todayFailed > 0 ? 'text-red-400' : ''">{{ stats.todayFailed }}</h3>
        <p class="text-xs text-muted-foreground mt-1">今日失败</p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">路由规则</span>
          <Settings2 :size="16" class="text-blue-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ stats.activeRules }}<span class="text-base text-muted-foreground">/{{ stats.totalRules }}</span></h3>
        <p class="text-xs text-muted-foreground mt-1">已启用/总数</p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">通知渠道</span>
          <Send :size="16" class="text-emerald-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ stats.activeChannels }}<span class="text-base text-muted-foreground">/{{ stats.totalChannels }}</span></h3>
        <p class="text-xs text-muted-foreground mt-1">健康/总数</p>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 min-h-0 flex gap-4">
      <!-- Left: Channels & Rules -->
      <div class="flex-1 min-h-0 flex flex-col gap-4">
        <!-- Notification Channels -->
        <div class="glass-panel p-4 min-h-[180px] flex flex-col" style="flex: 1 1 40%;">
          <div class="flex items-center justify-between mb-3 shrink-0">
            <h3 class="font-semibold flex items-center gap-2">
              <Radio :size="16" class="text-primary" />
              通知渠道
              <span class="text-xs text-muted-foreground font-normal">({{ channels.length }})</span>
            </h3>
            <button @click="openChannelModal()" class="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-1">
              <Plus :size="14" /> 添加
            </button>
          </div>
          
          <div class="flex-1 min-h-0 overflow-y-auto">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div v-for="channel in channels" :key="channel.id" 
                   class="p-3 bg-muted/30 rounded-xl border border-card-border hover:border-primary/30 transition-colors">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-card flex items-center justify-center border border-card-border relative">
                      <component :is="getChannelIcon(channel.type)" :size="18" :class="channel.enabled ? 'text-primary' : 'text-muted-foreground'" />
                      <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card"
                           :class="getStatusBgClass(channel.status)"
                           :title="getStatusTitle(channel.status)"></div>
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <p class="font-medium text-sm">{{ channel.name }}</p>
                        <span v-if="channel.isDefault" class="px-1.5 py-0.5 rounded text-xs bg-primary/20 text-primary">默认</span>
                      </div>
                      <p class="text-xs text-muted-foreground">{{ channel.description || channel.type }}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs text-muted-foreground mr-1">
                      <span class="text-emerald-400">{{ channel.todaySent || 0 }}</span>
                      <span v-if="channel.todayFailed > 0" class="text-red-400">/{{ channel.todayFailed }}</span>
                    </span>
                    <label class="flex items-center cursor-pointer">
                      <div class="relative">
                        <input type="checkbox" v-model="channel.enabled" @change="toggleChannel(channel)" class="sr-only" />
                        <div class="w-8 h-4 bg-muted rounded-full transition-colors" :class="{ 'bg-primary': channel.enabled }"></div>
                        <div class="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform" :class="{ 'translate-x-4': channel.enabled }"></div>
                      </div>
                    </label>
                    <button @click="testChannel(channel)" class="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-primary" title="测试发送">
                      <TestTube :size="14" />
                    </button>
                    <button @click="openChannelModal(channel)" class="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-blue-400" title="编辑">
                      <Pencil :size="14" />
                    </button>
                    <button @click="deleteChannel(channel)" class="p-1.5 hover:bg-red-500/10 rounded transition-colors text-muted-foreground hover:text-red-400" title="删除">
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="channels.length === 0" class="text-center py-8 text-muted-foreground">
              <Radio :size="32" class="mx-auto mb-2 opacity-50" />
              <p class="text-sm">暂无通知渠道</p>
              <p class="text-xs mt-1">点击「添加」按钮创建新渠道</p>
            </div>
          </div>
        </div>

        <!-- Notification Rules - 改为表格形式 -->
        <div class="glass-panel p-4 min-h-[200px] flex flex-col" style="flex: 1 1 60%;">
          <div class="flex items-center justify-between mb-3 shrink-0">
            <h3 class="font-semibold flex items-center gap-2">
              <BellRing :size="16" class="text-primary" />
              路由规则
              <span class="text-xs text-muted-foreground font-normal">(事件 → 频道)</span>
            </h3>
          </div>
          
          <div class="flex-1 min-h-0 overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="text-xs text-muted-foreground border-b border-card-border">
                <tr>
                  <th class="text-left py-2 px-2">目标频道</th>
                  <th class="text-left py-2 px-2">订阅事件</th>
                  <th class="text-center py-2 px-2">今日发送</th>
                  <th class="text-center py-2 px-2">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rule in rules" :key="rule.id" 
                    class="border-b border-card-border/50 hover:bg-muted/20 transition-colors">
                  <td class="py-2.5 px-2">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded flex items-center justify-center border border-card-border"
                           :class="getChannelBgClass(rule.channelType)">
                        <component :is="getChannelIcon(rule.channelType)" :size="12" :class="getChannelColor(rule.channelType)" />
                      </div>
                      <span class="font-medium">{{ rule.name }}</span>
                    </div>
                  </td>
                  <td class="py-2.5 px-2">
                    <div class="flex flex-wrap gap-1">
                      <span v-for="event in rule.events.slice(0, 4)" :key="event"
                            class="px-1.5 py-0.5 rounded text-xs border"
                            :class="getEventTagClass(event)">
                        {{ getEventShortName(event) }}
                      </span>
                      <span v-if="rule.events.length > 4" class="px-1.5 py-0.5 rounded text-xs bg-muted/50 text-muted-foreground">
                        +{{ rule.events.length - 4 }}
                      </span>
                    </div>
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <span class="font-mono text-emerald-400">{{ getChannelSentCount(rule.channel) }}</span>
                    <span v-if="getChannelFailedCount(rule.channel) > 0" class="font-mono text-red-400">/{{ getChannelFailedCount(rule.channel) }}</span>
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <span class="px-2 py-0.5 rounded text-xs"
                          :class="rule.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted/50 text-muted-foreground'">
                      {{ rule.enabled ? '启用' : '禁用' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div v-if="rules.length === 0" class="text-center py-8 text-muted-foreground">
              <BellRing :size="32" class="mx-auto mb-2 opacity-50" />
              <p class="text-sm">暂无路由规则</p>
              <p class="text-xs mt-1">添加渠道后会自动生成规则</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Event Types & History -->
      <div class="w-80 shrink-0 flex flex-col gap-4">
        <!-- Event Types -->
        <div class="glass-panel p-4 flex-1 min-h-0 flex flex-col">
          <h3 class="font-semibold mb-3 flex items-center gap-2 shrink-0">
            <Zap :size="16" class="text-primary" />
            事件类型
          </h3>
          
          <div class="flex-1 min-h-0 overflow-y-auto space-y-2">
            <div v-for="eventType in eventTypesWithStats" :key="eventType.id" 
                 class="p-2.5 bg-muted/30 rounded-lg border border-card-border">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded flex items-center justify-center border border-card-border"
                       :class="getEventBgColor(eventType.id)">
                    <component :is="getEventIcon(eventType.id)" :size="12" :class="getEventColor(eventType.id)" />
                  </div>
                  <span class="text-sm font-medium">{{ eventType.name }}</span>
                </div>
                <span class="text-xs font-mono text-muted-foreground">{{ eventType.triggerCount }}</span>
              </div>
              <p class="text-xs text-muted-foreground pl-8">{{ eventType.description }}</p>
            </div>
          </div>
        </div>

        <!-- Notification History -->
        <div class="glass-panel p-4 h-72 shrink-0 flex flex-col">
          <div class="flex items-center justify-between mb-3 shrink-0">
            <h3 class="font-semibold flex items-center gap-2">
              <History :size="16" class="text-primary" />
              通知历史
            </h3>
            <div class="flex items-center gap-2">
              <select v-model="historyFilter.channel" class="text-xs bg-background border border-card-border rounded px-2 py-1">
                <option value="">全部渠道</option>
                <option v-for="ch in channels" :key="ch.id" :value="ch.id">{{ ch.name }}</option>
              </select>
            </div>
          </div>
          
          <div class="flex-1 min-h-0 overflow-y-auto space-y-2">
            <div v-for="notif in filteredNotifications" :key="notif.id" 
                 class="p-2 bg-muted/30 rounded-lg border border-card-border">
              <div class="flex items-start gap-2">
                <div class="w-5 h-5 rounded flex items-center justify-center border border-card-border shrink-0"
                     :class="getEventBgColor(notif.eventType)">
                  <component :is="getEventIcon(notif.eventType)" :size="10" :class="getEventColor(notif.eventType)" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1">
                    <p class="text-xs font-medium truncate">{{ notif.title }}</p>
                    <span class="text-xs text-muted-foreground shrink-0">{{ notif.time }}</span>
                  </div>
                  <p class="text-xs text-muted-foreground line-clamp-1">{{ notif.message }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs px-1.5 py-0.5 rounded"
                          :class="notif.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'">
                      {{ notif.status === 'sent' ? '已发送' : '失败' }}
                    </span>
                    <span class="text-xs text-muted-foreground">{{ notif.channelName }}</span>
                  </div>
                  <p v-if="notif.error" class="text-xs text-red-400 mt-0.5 truncate">{{ notif.error }}</p>
                </div>
              </div>
            </div>
            
            <div v-if="filteredNotifications.length === 0" class="text-center py-4 text-muted-foreground">
              <BellOff :size="24" class="mx-auto mb-1 opacity-50" />
              <p class="text-xs">暂无通知记录</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Channel Modal -->
    <div v-if="showChannelModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="showChannelModal = false">
      <div class="glass-panel p-6 w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">{{ editingChannel?.id ? '编辑渠道' : '添加渠道' }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="text-xs text-muted-foreground block mb-2">渠道ID <span class="text-red-400">*</span></label>
            <input type="text" v-model="channelForm.id" placeholder="例如: discord-alerts"
                   :disabled="!!editingChannel?.id"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-50" />
            <p class="text-xs text-muted-foreground mt-1">唯一标识符，创建后不可修改</p>
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">渠道类型 <span class="text-red-400">*</span></label>
            <select v-model="channelForm.type" class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value="discord">Discord</option>
              <option value="telegram">Telegram</option>
              <option value="weixin">微信</option>
            </select>
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">名称 <span class="text-red-400">*</span></label>
            <input type="text" v-model="channelForm.name" placeholder="输入渠道名称"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">描述</label>
            <input type="text" v-model="channelForm.description" placeholder="简短描述用途"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          
          <!-- Discord Webhook -->
          <template v-if="channelForm.type === 'discord'">
            <div>
              <label class="text-xs text-muted-foreground block mb-2">Channel ID <span class="text-red-400">*</span></label>
              <input type="text" v-model="channelForm.channelId" placeholder="例如: 123456789012345678"
                     class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <p class="text-xs text-muted-foreground mt-1">Discord 频道 ID，使用 Bot Token 发送</p>
            </div>
          </template>
          
          <!-- Telegram -->
          <template v-if="channelForm.type === 'telegram'">
            <div>
              <label class="text-xs text-muted-foreground block mb-2">Bot Token</label>
              <input type="password" v-model="channelForm.botToken" placeholder="123456:ABC-DEF..."
                     class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-2">Chat ID</label>
              <input type="text" v-model="channelForm.chatId" placeholder="-1001234567890"
                     class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </template>
          
          <!-- WeChat -->
          <template v-if="channelForm.type === 'weixin'">
            <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p class="text-xs text-amber-400">微信通知通过 Hermes Gateway 配置，请确保网关已启动。</p>
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-2">用户/群ID</label>
              <input type="text" v-model="channelForm.channelId" placeholder="微信用户ID或群ID"
                     class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </template>
          
          <!-- Event Types Selection -->
          <div>
            <label class="text-xs text-muted-foreground block mb-2">订阅事件类型</label>
            <div class="flex flex-wrap gap-2">
              <label v-for="et in eventTypes" :key="et.id" 
                     class="flex items-center gap-1.5 px-2 py-1 rounded border border-card-border cursor-pointer hover:border-primary/50 transition-colors"
                     :class="channelForm.events.includes(et.id) ? 'bg-primary/10 border-primary/50' : 'bg-muted/30'">
                <input type="checkbox" :value="et.id" v-model="channelForm.events" class="sr-only" />
                <component :is="getEventIcon(et.id)" :size="12" :class="getEventColor(et.id)" />
                <span class="text-xs">{{ et.name }}</span>
              </label>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="channelForm.enabled" id="channelEnabled" class="rounded" />
            <label for="channelEnabled" class="text-sm">启用此渠道</label>
          </div>
          
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="channelForm.isDefault" id="isDefault" class="rounded" />
            <label for="isDefault" class="text-sm">设为默认渠道</label>
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-6">
          <button @click="showChannelModal = false" class="px-4 py-2 text-sm bg-muted/50 rounded-lg border border-card-border hover:bg-muted transition-colors">
            取消
          </button>
          <button @click="saveChannel" :disabled="isSaving" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            {{ isSaving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast" 
         class="fixed bottom-4 right-4 px-4 py-3 rounded-xl border shadow-lg z-50 flex items-center gap-2"
         :class="toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'">
      <CheckCircle v-if="toast.type === 'success'" :size="16" />
      <AlertCircle v-else :size="16" />
      <span class="text-sm">{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { 
  Bell, BellRing, BellOff, AlertTriangle, Settings2, Send, Radio, Plus, Pencil, Trash2,
  TestTube, History, Zap, CheckCircle, AlertCircle, RefreshCw, BookOpen,
  MessageCircle, Link, XCircle, CheckCircle2, Clock, Activity
} from 'lucide-vue-next'

// API data
const stats = ref({
  todayCount: 0,
  todaySent: 0,
  todayFailed: 0,
  yesterdayCount: 0,
  yesterdayChange: 0,
  errorAlerts: 0,
  activeRules: 0,
  totalRules: 0,
  activeChannels: 0,
  totalChannels: 0
})

const channels = ref<any[]>([])
const rules = ref<any[]>([])
const eventTypes = ref<any[]>([])
const recentNotifications = ref<any[]>([])

// UI state
const isRefreshing = ref(false)
const isSaving = ref(false)
const toast = ref<{ type: string, message: string } | null>(null)
const showChannelModal = ref(false)
const editingChannel = ref<any>(null)

// Form state
const channelForm = reactive({
  id: '',
  type: 'discord',
  name: '',
  description: '',
  webhookUrl: '',
  botToken: '',
  chatId: '',
  channelId: '',
  events: [] as string[],
  enabled: true,
  isDefault: false
})

// History filter
const historyFilter = reactive({
  channel: '',
  eventType: ''
})

// Computed
const filteredNotifications = computed(() => {
  let result = recentNotifications.value
  
  if (historyFilter.channel) {
    result = result.filter(n => n.channelId === historyFilter.channel)
  }
  
  if (historyFilter.eventType) {
    result = result.filter(n => n.eventType === historyFilter.eventType)
  }
  
  return result
})

// 事件类型带统计
const eventTypesWithStats = computed(() => {
  return eventTypes.value.filter(et => et.triggerCount > 0 || ['error', 'critical', 'task_complete', 'system', 'cron', 'budget'].includes(et.id))
})

// Methods
const showToast = (type: string, message: string) => {
  toast.value = { type, message }
  setTimeout(() => { toast.value = null }, 3000)
}

const fetchData = async () => {
  try {
    const response = await $fetch('/api/notifications')
    if (response) {
      stats.value = response.stats || stats.value
      channels.value = response.channels || []
      rules.value = response.rules || []
      eventTypes.value = response.eventTypes || eventTypes.value
      recentNotifications.value = response.recentNotifications || []
    }
  } catch (e) {
    console.error('Failed to fetch notifications data', e)
    showToast('error', '获取数据失败')
  }
}

const doRefresh = async () => {
  isRefreshing.value = true
  await fetchData()
  setTimeout(() => { isRefreshing.value = false }, 300)
  showToast('success', '数据已刷新')
}

const getStatusBgClass = (status: string) => {
  const classes: Record<string, string> = {
    'healthy': 'bg-emerald-400',
    'degraded': 'bg-amber-400',
    'error': 'bg-red-400'
  }
  return classes[status] || 'bg-gray-400'
}

const getStatusTitle = (status: string) => {
  const titles: Record<string, string> = {
    'healthy': '健康',
    'degraded': '降级',
    'error': '异常'
  }
  return titles[status] || '未知'
}

const getChannelIcon = (type: string) => {
  const icons: Record<string, any> = {
    'wechat': MessageCircle,
    'telegram': Send,
    'discord': MessageCircle,
    'weixin': MessageCircle
  }
  return icons[type] || Bell
}

const getChannelColor = (type: string) => {
  const colors: Record<string, string> = {
    'discord': 'text-indigo-400',
    'telegram': 'text-blue-400',
    'weixin': 'text-green-400',
    'wechat': 'text-green-400'
  }
  return colors[type] || 'text-muted-foreground'
}

const getChannelBgClass = (type: string) => {
  const classes: Record<string, string> = {
    'discord': 'bg-indigo-500/10',
    'telegram': 'bg-blue-500/10',
    'weixin': 'bg-green-500/10',
    'wechat': 'bg-green-500/10'
  }
  return classes[type] || 'bg-muted/30'
}

const getEventIcon = (type: string) => {
  const icons: Record<string, any> = {
    'error': XCircle,
    'warning': AlertTriangle,
    'critical': AlertTriangle,
    'task_complete': CheckCircle2,
    'task_start': Activity,
    'task_failed': XCircle,
    'system': Activity,
    'gateway': Radio,
    'cron': Clock,
    'connection': Link,
    'config_change': Settings2,
    'auth': Bell,
    'budget': AlertTriangle,
    'backup': CheckCircle2,
    'info': Bell,
    'test': TestTube,
    'daily': Bell
  }
  return icons[type] || Bell
}

const getEventColor = (type: string) => {
  const colors: Record<string, string> = {
    'error': 'text-red-400',
    'warning': 'text-amber-400',
    'critical': 'text-red-400',
    'task_complete': 'text-emerald-400',
    'task_start': 'text-blue-400',
    'task_failed': 'text-red-400',
    'system': 'text-blue-400',
    'gateway': 'text-purple-400',
    'cron': 'text-cyan-400',
    'connection': 'text-indigo-400',
    'config_change': 'text-orange-400',
    'auth': 'text-pink-400',
    'budget': 'text-yellow-400',
    'backup': 'text-teal-400',
    'info': 'text-blue-400',
    'test': 'text-green-400',
    'daily': 'text-gray-400'
  }
  return colors[type] || 'text-muted-foreground'
}

const getEventBgColor = (type: string) => {
  const colors: Record<string, string> = {
    'error': 'bg-red-500/10',
    'warning': 'bg-amber-500/10',
    'critical': 'bg-red-500/10',
    'task_complete': 'bg-emerald-500/10',
    'task_start': 'bg-blue-500/10',
    'task_failed': 'bg-red-500/10',
    'system': 'bg-blue-500/10',
    'gateway': 'bg-purple-500/10',
    'cron': 'bg-cyan-500/10',
    'connection': 'bg-indigo-500/10',
    'config_change': 'bg-orange-500/10',
    'auth': 'bg-pink-500/10',
    'budget': 'bg-yellow-500/10',
    'backup': 'bg-teal-500/10',
    'info': 'bg-blue-500/10',
    'test': 'bg-green-500/10',
    'daily': 'bg-gray-500/10'
  }
  return colors[type] || 'bg-muted/30'
}

const getEventShortName = (type: string) => {
  const names: Record<string, string> = {
    'error': '错误',
    'warning': '警告',
    'critical': '严重',
    'task_complete': '完成',
    'task_start': '开始',
    'task_failed': '失败',
    'system': '系统',
    'gateway': '网关',
    'cron': '定时',
    'connection': '连接',
    'config_change': '配置',
    'auth': '授权',
    'budget': '预算',
    'backup': '备份',
    'info': '信息',
    'test': '测试',
    'daily': '日常'
  }
  return names[type] || type
}

const getEventTagClass = (type: string) => {
  const classes: Record<string, string> = {
    'error': 'bg-red-500/10 border-red-500/30 text-red-400',
    'warning': 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    'critical': 'bg-red-500/10 border-red-500/30 text-red-400',
    'task_complete': 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    'task_start': 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    'task_failed': 'bg-red-500/10 border-red-500/30 text-red-400',
    'system': 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    'gateway': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    'cron': 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    'connection': 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    'config_change': 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    'auth': 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    'budget': 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    'backup': 'bg-teal-500/10 border-teal-500/30 text-teal-400',
    'info': 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    'test': 'bg-green-500/10 border-green-500/30 text-green-400',
    'daily': 'bg-gray-500/10 border-gray-500/30 text-gray-400'
  }
  return classes[type] || 'bg-muted/30 border-card-border text-muted-foreground'
}

// 获取渠道发送统计
const getChannelSentCount = (channelId: string) => {
  const channel = channels.value.find(c => c.id === channelId)
  return channel?.todaySent || 0
}

const getChannelFailedCount = (channelId: string) => {
  const channel = channels.value.find(c => c.id === channelId)
  return channel?.todayFailed || 0
}

const toggleChannel = async (channel: any) => {
  try {
    await $fetch('/api/notification-channels', {
      method: 'PUT',
      body: {
        id: channel.id,
        enabled: channel.enabled
      }
    })
    showToast('success', channel.enabled ? '渠道已启用' : '渠道已禁用')
  } catch (e) {
    showToast('error', '更新失败')
    channel.enabled = !channel.enabled // revert
  }
}

const openChannelModal = (channel?: any) => {
  editingChannel.value = channel || null
  if (channel) {
    Object.assign(channelForm, {
      id: channel.id,
      type: channel.type,
      name: channel.name,
      description: channel.description || '',
      webhookUrl: '',
      botToken: '',
      chatId: '',
      channelId: channel.channelId || '',
      events: channel.events || [],
      enabled: channel.enabled,
      isDefault: channel.isDefault
    })
  } else {
    Object.assign(channelForm, {
      id: '',
      type: 'discord',
      name: '',
      description: '',
      webhookUrl: '',
      botToken: '',
      chatId: '',
      channelId: '',
      events: [],
      enabled: true,
      isDefault: false
    })
  }
  showChannelModal.value = true
}

const saveChannel = async () => {
  if (!channelForm.id || !channelForm.type || !channelForm.name) {
    showToast('error', '请填写必填项')
    return
  }
  
  isSaving.value = true
  try {
    const body: any = {
      id: channelForm.id,
      type: channelForm.type,
      name: channelForm.name,
      description: channelForm.description,
      events: channelForm.events,
      enabled: channelForm.enabled,
      isDefault: channelForm.isDefault
    }
    
    // Add type-specific config
    if (channelForm.type === 'discord') {
      body.webhookUrl = channelForm.webhookUrl
      body.channelId = channelForm.channelId
    } else if (channelForm.type === 'telegram') {
      body.botToken = channelForm.botToken
      body.chatId = channelForm.chatId
    } else if (channelForm.type === 'weixin') {
      body.channelId = channelForm.channelId
    }
    
    if (editingChannel.value) {
      await $fetch('/api/notification-channels', {
        method: 'PUT',
        body
      })
      showToast('success', '渠道已更新')
    } else {
      await $fetch('/api/notification-channels', {
        method: 'POST',
        body
      })
      showToast('success', '渠道已创建')
    }
    
    showChannelModal.value = false
    await fetchData()
  } catch (e: any) {
    showToast('error', e.data?.statusMessage || '保存失败')
  } finally {
    isSaving.value = false
  }
}

const deleteChannel = async (channel: any) => {
  if (!confirm(`确定要删除渠道 "${channel.name}" 吗？\n关联的事件路由也将被移除。`)) return
  
  try {
    await $fetch(`/api/notification-channels?channelId=${channel.id}`, {
      method: 'DELETE'
    })
    showToast('success', '渠道已删除')
    await fetchData()
  } catch (e) {
    showToast('error', '删除失败')
  }
}

const testChannel = async (channel: any) => {
  try {
    const result = await $fetch('/api/notify', {
      method: 'POST',
      body: {
        event: 'test',
        severity: 'info',
        title: '测试通知',
        message: `这是一条来自 **${channel.name}** 的测试消息\n发送时间: ${new Date().toLocaleString('zh-CN')}`,
        channels: [channel.id],
        metadata: {
          channelType: channel.type,
          testTime: new Date().toISOString()
        }
      }
    })
    
    if (result.success) {
      showToast('success', `测试消息已发送到 ${channel.name}`)
      // 刷新以更新状态
      await fetchData()
    } else {
      showToast('error', '发送失败: ' + ((result as any).results?.[0]?.error || '未知错误'))
    }
  } catch (e: any) {
    showToast('error', '发送失败: ' + (e.data?.statusMessage || '网络错误'))
  }
}

// Initialize
onMounted(() => {
  fetchData()
})
</script>
