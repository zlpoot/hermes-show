<template>
  <div class="h-full flex flex-col gap-4 p-6 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between glass-panel p-4 shrink-0">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Bell class="text-primary" size="20" />
        </div>
        <div>
          <h2 class="text-xl font-bold">通知设置</h2>
          <p class="text-sm text-muted-foreground mt-0.5">配置事件通知渠道和规则</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button @click="doRefresh" class="btn-outline flex items-center gap-2 text-sm">
          <RefreshCw size="14" :class="{ 'animate-spin': isRefreshing }" /> 刷新
        </button>
        <NuxtLink to="/docs/notifications" class="btn-primary flex items-center gap-2 text-sm">
          <BookOpen size="14" /> 文档
        </NuxtLink>
      </div>
    </div>

    <!-- Notification Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">今日通知</span>
          <Bell size="16" class="text-primary" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ stats.todayCount }}</h3>
        <p class="text-xs mt-1" :class="stats.yesterdayChange >= 0 ? 'text-emerald-400' : 'text-red-400'">
          较昨日 {{ stats.yesterdayChange >= 0 ? '+' : '' }}{{ stats.yesterdayChange }}%
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">错误告警</span>
          <AlertTriangle size="16" class="text-red-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono text-red-400">{{ stats.errorAlerts }}</h3>
        <p class="text-xs text-muted-foreground mt-1">未处理</p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">活跃规则</span>
          <Settings2 size="16" class="text-blue-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ stats.activeRules }}</h3>
        <p class="text-xs text-muted-foreground mt-1">共 {{ stats.totalRules }} 条</p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">通知渠道</span>
          <Send size="16" class="text-emerald-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ stats.activeChannels }}</h3>
        <p class="text-xs text-muted-foreground mt-1">已启用</p>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 min-h-0 flex gap-4">
      <!-- Left: Channels & Rules -->
      <div class="flex-1 min-h-0 flex flex-col gap-4">
        <!-- Notification Channels -->
        <div class="glass-panel p-4 flex-1 min-h-0 flex flex-col">
          <div class="flex items-center justify-between mb-4 shrink-0">
            <h3 class="font-semibold flex items-center gap-2">
              <Radio size="16" class="text-primary" />
              通知渠道
            </h3>
            <button @click="openChannelModal()" class="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-1">
              <Plus size="14" /> 添加
            </button>
          </div>
          
          <div class="flex-1 min-h-0 overflow-y-auto space-y-2">
            <div v-for="channel in channels" :key="channel.id" 
                 class="p-3 bg-muted/30 rounded-xl border border-card-border hover:border-primary/30 transition-colors">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-card flex items-center justify-center border border-card-border">
                    <component :is="getChannelIcon(channel.type)" size="18" :class="channel.enabled ? 'text-primary' : 'text-muted-foreground'" />
                  </div>
                  <div>
                    <p class="font-medium text-sm">{{ channel.name }}</p>
                    <p class="text-xs text-muted-foreground">{{ channel.description }}</p>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground hidden sm:block">{{ channel.todaySent }} 条/今日</span>
                  <label class="flex items-center cursor-pointer">
                    <div class="relative">
                      <input type="checkbox" v-model="channel.enabled" @change="toggleChannel(channel)" class="sr-only" />
                      <div class="w-8 h-4 bg-muted rounded-full transition-colors" :class="{ 'bg-primary': channel.enabled }"></div>
                      <div class="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform" :class="{ 'translate-x-4': channel.enabled }"></div>
                    </div>
                  </label>
                  <button @click="testChannel(channel)" class="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-primary" title="测试">
                    <TestTube size="14" />
                  </button>
                  <button @click="openChannelModal(channel)" class="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-blue-400" title="编辑">
                    <Pencil size="14" />
                  </button>
                  <button @click="deleteChannel(channel)" class="p-1.5 hover:bg-red-500/10 rounded transition-colors text-muted-foreground hover:text-red-400" title="删除">
                    <Trash2 size="14" />
                  </button>
                </div>
              </div>
            </div>
            
            <div v-if="channels.length === 0" class="text-center py-8 text-muted-foreground">
              <Radio size="32" class="mx-auto mb-2 opacity-50" />
              <p class="text-sm">暂无通知渠道</p>
            </div>
          </div>
        </div>

        <!-- Notification Rules -->
        <div class="glass-panel p-4 flex-1 min-h-0 flex flex-col">
          <div class="flex items-center justify-between mb-4 shrink-0">
            <h3 class="font-semibold flex items-center gap-2">
              <BellRing size="16" class="text-primary" />
              通知规则
            </h3>
            <button @click="openRuleModal()" class="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-1">
              <Plus size="14" /> 新建
            </button>
          </div>
          
          <div class="flex-1 min-h-0 overflow-y-auto space-y-2">
            <div v-for="rule in rules" :key="rule.id" 
                 class="p-3 bg-muted/30 rounded-xl border border-card-border hover:border-primary/30 transition-colors">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center border border-card-border"
                       :class="getEventBgColor(rule.eventType)">
                    <component :is="getEventIcon(rule.eventType)" size="14" :class="getEventColor(rule.eventType)" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="font-medium text-sm">{{ rule.name }}</p>
                      <span class="px-1.5 py-0.5 rounded text-xs" 
                            :class="getSeverityClass(rule.severity)">
                        {{ getSeverityLabel(rule.severity) }}
                      </span>
                    </div>
                    <p class="text-xs text-muted-foreground">{{ rule.description }}</p>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1 text-xs text-muted-foreground">
                    <component :is="getChannelIcon(rule.channel)" size="12" />
                    <span class="hidden sm:inline">{{ rule.channelName }}</span>
                  </div>
                  <label class="flex items-center cursor-pointer">
                    <div class="relative">
                      <input type="checkbox" v-model="rule.enabled" @change="toggleRule(rule)" class="sr-only" />
                      <div class="w-8 h-4 bg-muted rounded-full transition-colors" :class="{ 'bg-primary': rule.enabled }"></div>
                      <div class="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform" :class="{ 'translate-x-4': rule.enabled }"></div>
                    </div>
                  </label>
                  <button @click="openRuleModal(rule)" class="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-blue-400" title="编辑">
                    <Pencil size="14" />
                  </button>
                  <button @click="deleteRule(rule)" class="p-1.5 hover:bg-red-500/10 rounded transition-colors text-muted-foreground hover:text-red-400" title="删除">
                    <Trash2 size="14" />
                  </button>
                </div>
              </div>
            </div>
            
            <div v-if="rules.length === 0" class="text-center py-8 text-muted-foreground">
              <BellRing size="32" class="mx-auto mb-2 opacity-50" />
              <p class="text-sm">暂无通知规则</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Event Types & History -->
      <div class="w-80 shrink-0 flex flex-col gap-4">
        <!-- Event Types -->
        <div class="glass-panel p-4 flex-1 min-h-0 flex flex-col">
          <h3 class="font-semibold mb-3 flex items-center gap-2 shrink-0">
            <Zap size="16" class="text-primary" />
            事件类型
          </h3>
          
          <div class="flex-1 min-h-0 overflow-y-auto space-y-2">
            <div v-for="eventType in eventTypes" :key="eventType.id" 
                 class="p-2.5 bg-muted/30 rounded-lg border border-card-border">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded flex items-center justify-center border border-card-border"
                       :class="getEventBgColor(eventType.id)">
                    <component :is="getEventIcon(eventType.id)" size="12" :class="getEventColor(eventType.id)" />
                  </div>
                  <span class="text-sm font-medium">{{ eventType.name }}</span>
                </div>
                <label class="flex items-center cursor-pointer">
                  <div class="relative">
                    <input type="checkbox" v-model="eventType.enabled" @change="toggleEventType(eventType)" class="sr-only" />
                    <div class="w-7 h-3.5 bg-muted rounded-full transition-colors" :class="{ 'bg-primary': eventType.enabled }"></div>
                    <div class="absolute left-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform" :class="{ 'translate-x-3.5': eventType.enabled }"></div>
                  </div>
                </label>
              </div>
              <p class="text-xs text-muted-foreground">{{ eventType.description }}</p>
              <div class="mt-1 text-xs text-muted-foreground">
                触发: <span class="font-mono">{{ eventType.triggerCount }}</span> 次
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Notifications -->
        <div class="glass-panel p-4 h-64 shrink-0 flex flex-col">
          <div class="flex items-center justify-between mb-3 shrink-0">
            <h3 class="font-semibold flex items-center gap-2">
              <History size="16" class="text-primary" />
              最近通知
            </h3>
            <button @click="clearHistory" class="text-xs text-muted-foreground hover:text-primary">
              清空
            </button>
          </div>
          
          <div class="flex-1 min-h-0 overflow-y-auto space-y-2">
            <div v-for="notif in recentNotifications" :key="notif.id" 
                 class="p-2 bg-muted/30 rounded-lg border border-card-border">
              <div class="flex items-start gap-2">
                <div class="w-6 h-6 rounded flex items-center justify-center border border-card-border shrink-0"
                     :class="getEventBgColor(notif.eventType)">
                  <component :is="getEventIcon(notif.eventType)" size="10" :class="getEventColor(notif.eventType)" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1">
                    <p class="text-xs font-medium truncate">{{ notif.title }}</p>
                    <span class="text-xs text-muted-foreground shrink-0">{{ notif.time }}</span>
                  </div>
                  <p class="text-xs text-muted-foreground line-clamp-1">{{ notif.message }}</p>
                </div>
              </div>
            </div>
            
            <div v-if="recentNotifications.length === 0" class="text-center py-4 text-muted-foreground">
              <BellOff size="24" class="mx-auto mb-1 opacity-50" />
              <p class="text-xs">暂无通知记录</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Channel Modal -->
    <div v-if="showChannelModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="showChannelModal = false">
      <div class="glass-panel p-6 w-full max-w-md rounded-2xl">
        <h3 class="text-lg font-semibold mb-4">{{ editingChannel?.id ? '编辑渠道' : '添加渠道' }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="text-xs text-muted-foreground block mb-2">渠道类型</label>
            <select v-model="channelForm.type" class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value="telegram">Telegram</option>
              <option value="wechat">微信</option>
              <option value="discord">Discord</option>
              <option value="email">邮件</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">名称</label>
            <input type="text" v-model="channelForm.name" placeholder="输入渠道名称"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">描述</label>
            <input type="text" v-model="channelForm.description" placeholder="简短描述"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          
          <!-- Telegram -->
          <template v-if="channelForm.type === 'telegram'">
            <div>
              <label class="text-xs text-muted-foreground block mb-2">Bot Token</label>
              <input type="password" v-model="channelForm.config.botToken" placeholder="123456:ABC-DEF..."
                     class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-2">Chat ID</label>
              <input type="text" v-model="channelForm.config.chatId" placeholder="-1001234567890"
                     class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </template>
          
          <!-- Discord -->
          <template v-if="channelForm.type === 'discord'">
            <div>
              <label class="text-xs text-muted-foreground block mb-2">Webhook URL</label>
              <input type="text" v-model="channelForm.config.webhookUrl" placeholder="https://discord.com/api/webhooks/..."
                     class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </template>
          
          <!-- WeChat -->
          <template v-if="channelForm.type === 'wechat'">
            <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p class="text-xs text-amber-400">微信通知通过 Hermes Gateway 配置，请在网关设置中开启通知功能。</p>
            </div>
          </template>
          
          <!-- Email -->
          <template v-if="channelForm.type === 'email'">
            <div>
              <label class="text-xs text-muted-foreground block mb-2">收件地址</label>
              <input type="email" v-model="channelForm.config.email" placeholder="admin@example.com"
                     class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-2">SMTP 服务器</label>
              <input type="text" v-model="channelForm.config.smtpHost" placeholder="smtp.example.com"
                     class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </template>
          
          <!-- Webhook -->
          <template v-if="channelForm.type === 'webhook'">
            <div>
              <label class="text-xs text-muted-foreground block mb-2">Webhook URL</label>
              <input type="text" v-model="channelForm.config.webhookUrl" placeholder="https://your-server.com/webhook"
                     class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-2">Secret (可选)</label>
              <input type="password" v-model="channelForm.config.secret" placeholder="用于签名验证"
                     class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </template>
        </div>
        
        <div class="flex justify-end gap-2 mt-6">
          <button @click="showChannelModal = false" class="px-4 py-2 text-sm bg-muted/50 rounded-lg border border-card-border hover:bg-muted transition-colors">
            取消
          </button>
          <button @click="saveChannel" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- Rule Modal -->
    <div v-if="showRuleModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="showRuleModal = false">
      <div class="glass-panel p-6 w-full max-w-md rounded-2xl">
        <h3 class="text-lg font-semibold mb-4">{{ editingRule?.id ? '编辑规则' : '新建规则' }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="text-xs text-muted-foreground block mb-2">规则名称</label>
            <input type="text" v-model="ruleForm.name" placeholder="输入规则名称"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">描述</label>
            <input type="text" v-model="ruleForm.description" placeholder="简短描述触发条件"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">事件类型</label>
            <select v-model="ruleForm.eventType" class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option v-for="et in eventTypes" :key="et.id" :value="et.id">{{ et.name }}</option>
            </select>
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">严重程度</label>
            <select v-model="ruleForm.severity" class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value="critical">紧急</option>
              <option value="warning">警告</option>
              <option value="info">信息</option>
            </select>
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">通知渠道</label>
            <select v-model="ruleForm.channelId" class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option v-for="ch in enabledChannels" :key="ch.id" :value="ch.id">{{ ch.name }}</option>
            </select>
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-6">
          <button @click="showRuleModal = false" class="px-4 py-2 text-sm bg-muted/50 rounded-lg border border-card-border hover:bg-muted transition-colors">
            取消
          </button>
          <button @click="saveRule" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast" 
         class="fixed bottom-4 right-4 px-4 py-3 rounded-xl border shadow-lg z-50 flex items-center gap-2"
         :class="toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'">
      <CheckCircle v-if="toast.type === 'success'" size="16" />
      <AlertCircle v-else size="16" />
      <span class="text-sm">{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { 
  Bell, BellRing, BellOff, AlertTriangle, Settings2, Send, Radio, Plus, Pencil, Trash2,
  TestTube, History, Zap, CheckCircle, AlertCircle, RefreshCw, BookOpen,
  MessageCircle, Mail, Link, XCircle, CheckCircle2, Clock, Activity
} from 'lucide-vue-next'

// Mock data
const stats = ref({
  todayCount: 47,
  yesterdayChange: 12,
  errorAlerts: 3,
  activeRules: 8,
  totalRules: 12,
  activeChannels: 3
})

const channels = ref([
  { id: 'ch-001', type: 'telegram', name: 'Telegram 管理员', description: '@admin_notifications', enabled: true, todaySent: 23, config: { botToken: '', chatId: '' } },
  { id: 'ch-002', type: 'wechat', name: '微信通知', description: '运维群', enabled: true, todaySent: 15, config: {} },
  { id: 'ch-003', type: 'discord', name: 'Discord 告警', description: '#alerts', enabled: true, todaySent: 9, config: { webhookUrl: '' } },
  { id: 'ch-004', type: 'email', name: '邮件通知', description: 'admin@example.com', enabled: false, todaySent: 0, config: { email: '', smtpHost: '' } },
  { id: 'ch-005', type: 'webhook', name: '自定义 Webhook', description: '内网告警系统', enabled: false, todaySent: 0, config: { webhookUrl: '', secret: '' } }
])

const rules = ref([
  { id: 'rule-001', name: 'API 错误告警', description: 'API 调用失败时发送通知', eventType: 'error', severity: 'critical', channel: 'telegram', channelName: 'Telegram 管理员', enabled: true },
  { id: 'rule-002', name: '网关断开告警', description: 'Gateway 连接断开时通知', eventType: 'gateway', severity: 'critical', channel: 'wechat', channelName: '微信通知', enabled: true },
  { id: 'rule-003', name: '任务完成通知', description: '定时任务执行完成时通知', eventType: 'task_complete', severity: 'info', channel: 'telegram', channelName: 'Telegram 管理员', enabled: true },
  { id: 'rule-004', name: '高延迟警告', description: 'API 响应超过 5 秒时警告', eventType: 'warning', severity: 'warning', channel: 'discord', channelName: 'Discord 告警', enabled: true },
  { id: 'rule-005', name: 'Token 使用预警', description: '日 Token 超过限额 80% 时警告', eventType: 'warning', severity: 'warning', channel: 'telegram', channelName: 'Telegram 管理员', enabled: false }
])

const eventTypes = ref([
  { id: 'error', name: '错误告警', description: 'API 错误、任务失败等', enabled: true, triggerCount: 127 },
  { id: 'warning', name: '性能警告', description: '高延迟、资源过高等', enabled: true, triggerCount: 45 },
  { id: 'task_complete', name: '任务完成', description: '定时任务完成通知', enabled: true, triggerCount: 892 },
  { id: 'system', name: '系统事件', description: '启动、关闭等事件', enabled: true, triggerCount: 34 },
  { id: 'gateway', name: '网关事件', description: '连接状态变化', enabled: true, triggerCount: 56 },
  { id: 'cron', name: '定时任务', description: 'Cron 任务通知', enabled: false, triggerCount: 234 }
])

const recentNotifications = ref([
  { id: 'notif-001', title: 'API 调用失败', message: 'OpenAI API 返回 429 错误', eventType: 'error', channel: 'telegram', time: '14:32' },
  { id: 'notif-002', title: '网关重连成功', message: '微信 Gateway 已重新连接', eventType: 'gateway', channel: 'wechat', time: '14:28' },
  { id: 'notif-003', title: '定时任务完成', message: '任务 "每日备份" 已成功完成', eventType: 'task_complete', channel: 'telegram', time: '12:00' },
  { id: 'notif-004', title: '高延迟警告', message: 'Claude API 响应时间 6.2 秒', eventType: 'warning', channel: 'discord', time: '11:45' }
])

const isRefreshing = ref(false)
const toast = ref<{ type: string, message: string } | null>(null)
const showChannelModal = ref(false)
const showRuleModal = ref(false)
const editingChannel = ref<any>(null)
const editingRule = ref<any>(null)

const channelForm = reactive({
  type: 'telegram',
  name: '',
  description: '',
  config: {} as Record<string, any>
})

const ruleForm = reactive({
  name: '',
  description: '',
  eventType: 'error',
  severity: 'warning',
  channelId: ''
})

const enabledChannels = computed(() => channels.value.filter(c => c.enabled))

const showToast = (type: string, message: string) => {
  toast.value = { type, message }
  setTimeout(() => { toast.value = null }, 3000)
}

const doRefresh = () => {
  isRefreshing.value = true
  setTimeout(() => { isRefreshing.value = false }, 500)
  showToast('success', '数据已刷新')
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
    'task_complete': 'text-emerald-400',
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
    'task_complete': 'bg-emerald-500/10',
    'system': 'bg-blue-500/10',
    'gateway': 'bg-purple-500/10',
    'cron': 'bg-cyan-500/10'
  }
  return colors[type] || 'bg-muted/30'
}

const getSeverityClass = (severity: string) => {
  const classes: Record<string, string> = {
    'critical': 'bg-red-500/20 text-red-400',
    'warning': 'bg-amber-500/20 text-amber-400',
    'info': 'bg-blue-500/20 text-blue-400'
  }
  return classes[severity] || 'bg-muted/30 text-muted-foreground'
}

const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = {
    'critical': '紧急',
    'warning': '警告',
    'info': '信息'
  }
  return labels[severity] || severity
}

const toggleChannel = (channel: any) => {
  showToast('success', channel.enabled ? '渠道已启用' : '渠道已禁用')
}

const toggleRule = (rule: any) => {
  showToast('success', rule.enabled ? '规则已启用' : '规则已禁用')
}

const toggleEventType = (eventType: any) => {
  showToast('success', eventType.enabled ? '事件类型已启用' : '事件类型已禁用')
}

const openChannelModal = (channel?: any) => {
  editingChannel.value = channel || null
  if (channel) {
    Object.assign(channelForm, {
      type: channel.type,
      name: channel.name,
      description: channel.description,
      config: { ...channel.config }
    })
  } else {
    Object.assign(channelForm, {
      type: 'telegram',
      name: '',
      description: '',
      config: {}
    })
  }
  showChannelModal.value = true
}

const saveChannel = () => {
  if (editingChannel.value) {
    Object.assign(editingChannel.value, {
      type: channelForm.type,
      name: channelForm.name,
      description: channelForm.description,
      config: { ...channelForm.config }
    })
    showToast('success', '渠道已更新')
  } else {
    channels.value.push({
      id: `ch-${Date.now()}`,
      type: channelForm.type,
      name: channelForm.name,
      description: channelForm.description,
      enabled: true,
      todaySent: 0,
      config: { ...channelForm.config }
    })
    showToast('success', '渠道已添加')
  }
  showChannelModal.value = false
}

const deleteChannel = (channel: any) => {
  if (!confirm(`确定要删除渠道 "${channel.name}" 吗？`)) return
  const idx = channels.value.findIndex(c => c.id === channel.id)
  if (idx > -1) {
    channels.value.splice(idx, 1)
    showToast('success', '渠道已删除')
  }
}

const testChannel = (channel: any) => {
  showToast('success', `测试消息已发送到 ${channel.name}`)
}

const openRuleModal = (rule?: any) => {
  editingRule.value = rule || null
  if (rule) {
    Object.assign(ruleForm, {
      name: rule.name,
      description: rule.description,
      eventType: rule.eventType,
      severity: rule.severity,
      channelId: channels.value.find(c => c.type === rule.channel)?.id || ''
    })
  } else {
    Object.assign(ruleForm, {
      name: '',
      description: '',
      eventType: 'error',
      severity: 'warning',
      channelId: enabledChannels.value[0]?.id || ''
    })
  }
  showRuleModal.value = true
}

const saveRule = () => {
  const channel = channels.value.find(c => c.id === ruleForm.channelId)
  if (editingRule.value) {
    Object.assign(editingRule.value, {
      name: ruleForm.name,
      description: ruleForm.description,
      eventType: ruleForm.eventType,
      severity: ruleForm.severity,
      channel: channel?.type,
      channelName: channel?.name
    })
    showToast('success', '规则已更新')
  } else {
    rules.value.push({
      id: `rule-${Date.now()}`,
      name: ruleForm.name,
      description: ruleForm.description,
      eventType: ruleForm.eventType,
      severity: ruleForm.severity,
      channel: channel?.type,
      channelName: channel?.name || '',
      enabled: true
    })
    showToast('success', '规则已创建')
  }
  showRuleModal.value = false
}

const deleteRule = (rule: any) => {
  if (!confirm(`确定要删除规则 "${rule.name}" 吗？`)) return
  const idx = rules.value.findIndex(r => r.id === rule.id)
  if (idx > -1) {
    rules.value.splice(idx, 1)
    showToast('success', '规则已删除')
  }
}

const clearHistory = () => {
  if (!confirm('确定要清空通知历史吗？')) return
  recentNotifications.value = []
  showToast('success', '历史已清空')
}
</script>
