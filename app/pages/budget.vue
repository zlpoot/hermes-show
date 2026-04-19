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

    <!-- Budget Overview -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Wallet size="18" class="text-primary" />
          本月预算概览
        </h3>
        <div class="flex items-center gap-2">
          <button @click="editBudget" class="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-1">
            <Pencil size="14" />
            设置预算
          </button>
        </div>
      </div>
      
      <!-- Budget Progress -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-muted-foreground">已使用 / 月度预算</span>
          <span class="text-sm font-mono">
            <span class="font-semibold">{{ formatCurrency(data?.budget?.used || 0) }}</span>
            <span class="text-muted-foreground"> / {{ formatCurrency(data?.budget?.total || 0) }}</span>
          </span>
        </div>
        <div class="h-4 bg-muted rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500"
               :class="budgetPercent >= 90 ? 'bg-red-500' : budgetPercent >= 70 ? 'bg-amber-500' : 'bg-primary'"
               :style="{ width: Math.min(budgetPercent, 100) + '%' }"></div>
        </div>
        <div class="flex items-center justify-between mt-2 text-xs">
          <span :class="budgetPercent >= 90 ? 'text-red-400' : budgetPercent >= 70 ? 'text-amber-400' : 'text-muted-foreground'">
            {{ budgetPercent.toFixed(1) }}% 已使用
          </span>
          <span class="text-muted-foreground">
            剩余 {{ formatCurrency(data?.budget?.remaining || 0) }}
          </span>
        </div>
      </div>
      
      <!-- Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-card/50 rounded-xl p-4 border border-card-border">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-muted-foreground">今日消费</span>
            <TrendingUp size="14" class="text-green-400" />
          </div>
          <p class="text-xl font-bold font-mono">{{ formatCurrency(data?.today?.cost || 0) }}</p>
          <p class="text-xs text-muted-foreground mt-1">
            {{ formatNumber(data?.today?.tokens || 0) }} tokens
          </p>
        </div>
        
        <div class="bg-card/50 rounded-xl p-4 border border-card-border">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-muted-foreground">本周消费</span>
            <Calendar size="14" class="text-blue-400" />
          </div>
          <p class="text-xl font-bold font-mono">{{ formatCurrency(data?.week?.cost || 0) }}</p>
          <p class="text-xs text-muted-foreground mt-1">
            日均 {{ formatCurrency(data?.week?.avgDaily || 0) }}
          </p>
        </div>
        
        <div class="bg-card/50 rounded-xl p-4 border border-card-border">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-muted-foreground">本月消费</span>
            <BarChart2 size="14" class="text-amber-400" />
          </div>
          <p class="text-xl font-bold font-mono">{{ formatCurrency(data?.month?.cost || 0) }}</p>
          <p class="text-xs text-muted-foreground mt-1">
            较上月 {{ data?.month?.change > 0 ? '+' : '' }}{{ data?.month?.change || 0 }}%
          </p>
        </div>
        
        <div class="bg-card/50 rounded-xl p-4 border border-card-border">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-muted-foreground">预估月消费</span>
            <Calculator size="14" class="text-purple-400" />
          </div>
          <p class="text-xl font-bold font-mono" :class="estimatedExceeds ? 'text-red-400' : ''">
            {{ formatCurrency(data?.estimated?.cost || 0) }}
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            按当前使用率估算
          </p>
        </div>
      </div>
    </div>

    <!-- Alerts Settings -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle size="18" class="text-amber-400" />
          预算预警
        </h3>
        <label class="flex items-center cursor-pointer gap-2">
          <span class="text-xs text-muted-foreground">启用预警</span>
          <div class="relative">
            <input type="checkbox" v-model="alertsEnabled" @change="toggleAlerts" class="sr-only" />
            <div class="w-9 h-5 bg-muted rounded-full transition-colors" :class="{ 'bg-primary': alertsEnabled }"></div>
            <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform" :class="{ 'translate-x-4': alertsEnabled }"></div>
          </div>
        </label>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 bg-muted/30 rounded-xl border border-card-border">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">70% 预警线</span>
            <span class="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">警告</span>
          </div>
          <input type="number" v-model="alertThresholds.warn70" @change="saveThresholds"
                 class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm font-mono"
                 min="50" max="95" />
          <p class="text-xs text-muted-foreground mt-2">达到此比例时发送警告通知</p>
        </div>
        
        <div class="p-4 bg-muted/30 rounded-xl border border-card-border">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">90% 预警线</span>
            <span class="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">紧急</span>
          </div>
          <input type="number" v-model="alertThresholds.warn90" @change="saveThresholds"
                 class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm font-mono"
                 min="60" max="99" />
          <p class="text-xs text-muted-foreground mt-2">达到此比例时发送紧急通知</p>
        </div>
        
        <div class="p-4 bg-muted/30 rounded-xl border border-card-border">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">每日限额</span>
            <span class="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">限制</span>
          </div>
          <div class="flex items-center gap-2">
            <input type="number" v-model="dailyLimit" @change="saveThresholds"
                   class="flex-1 bg-background border border-card-border rounded-lg px-3 py-2 text-sm font-mono"
                   min="0" step="0.1" />
            <span class="text-sm text-muted-foreground">$</span>
          </div>
          <p class="text-xs text-muted-foreground mt-2">设为 0 表示不限制</p>
        </div>
      </div>
    </div>

    <!-- Cost by Provider -->
    <div class="glass-panel p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <PieChart size="18" class="text-primary" />
        按提供商分布
      </h3>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Provider List -->
        <div class="space-y-3">
          <div v-for="provider in data?.providerCosts" :key="provider.name" 
               class="p-4 bg-muted/30 rounded-xl border border-card-border">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-card-border">
                  <component :is="getProviderIcon(provider.name)" size="18" :class="provider.color" />
                </div>
                <div>
                  <p class="font-medium text-sm">{{ provider.displayName }}</p>
                  <p class="text-xs text-muted-foreground">{{ provider.model }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-mono font-semibold">{{ formatCurrency(provider.cost) }}</p>
                <p class="text-xs text-muted-foreground">{{ provider.percent.toFixed(1) }}%</p>
              </div>
            </div>
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all" :class="provider.barColor"
                   :style="{ width: provider.percent + '%' }"></div>
            </div>
          </div>
        </div>
        
        <!-- Usage Chart -->
        <div class="bg-card/30 rounded-xl p-4 border border-card-border">
          <h4 class="text-sm font-medium mb-4">消费趋势 (近7天)</h4>
          <div class="h-48 flex items-end gap-2">
            <div v-for="(day, index) in data?.dailyTrend" :key="index" class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-primary/20 rounded-t transition-all hover:bg-primary/40"
                   :style="{ height: (day.cost / maxDailyCost * 140) + 'px' }">
              </div>
              <span class="text-xs text-muted-foreground">{{ day.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cost by User -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Users size="18" class="text-primary" />
          按用户分布
        </h3>
        <span class="text-xs text-muted-foreground">Top 10 消费用户</span>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-card-border">
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">排名</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">用户</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">平台</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">会话数</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">Tokens</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">消费金额</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">占比</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in data?.topUsers" :key="user.id" class="border-b border-card-border/50 hover:bg-muted/30">
              <td class="py-3 px-4">
                <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      :class="index < 3 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'">
                  {{ index + 1 }}
                </span>
              </td>
              <td class="py-3 px-4 font-medium">{{ user.displayName }}</td>
              <td class="py-3 px-4 text-muted-foreground">{{ user.platform }}</td>
              <td class="py-3 px-4 font-mono">{{ formatNumber(user.sessions) }}</td>
              <td class="py-3 px-4 font-mono">{{ formatNumber(user.tokens) }}</td>
              <td class="py-3 px-4 font-mono font-semibold">{{ formatCurrency(user.cost) }}</td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <div class="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div class="h-full bg-primary rounded-full" :style="{ width: user.percent + '%' }"></div>
                  </div>
                  <span class="text-xs text-muted-foreground">{{ user.percent.toFixed(1) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Spending Limits -->
    <div class="glass-panel p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <ShieldCheck size="18" class="text-primary" />
        消费限制
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-muted/30 rounded-xl border border-card-border">
          <div class="flex items-center justify-between mb-3">
            <span class="font-medium text-sm">单次请求上限</span>
            <span class="text-xs text-muted-foreground">MAX_COST_PER_REQUEST</span>
          </div>
          <div class="flex items-center gap-2">
            <input type="number" v-model="limits.perRequest" step="0.01"
                   class="flex-1 bg-background border border-card-border rounded-lg px-3 py-2 text-sm font-mono" />
            <span class="text-sm text-muted-foreground">$</span>
          </div>
        </div>
        
        <div class="p-4 bg-muted/30 rounded-xl border border-card-border">
          <div class="flex items-center justify-between mb-3">
            <span class="font-medium text-sm">单会话上限</span>
            <span class="text-xs text-muted-foreground">MAX_COST_PER_SESSION</span>
          </div>
          <div class="flex items-center gap-2">
            <input type="number" v-model="limits.perSession" step="0.1"
                   class="flex-1 bg-background border border-card-border rounded-lg px-3 py-2 text-sm font-mono" />
            <span class="text-sm text-muted-foreground">$</span>
          </div>
        </div>
        
        <div class="p-4 bg-muted/30 rounded-xl border border-card-border">
          <div class="flex items-center justify-between mb-3">
            <span class="font-medium text-sm">超限行为</span>
            <span class="text-xs text-muted-foreground">ON_LIMIT_EXCEED</span>
          </div>
          <select v-model="limits.onExceed" class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm">
            <option value="stop">停止请求</option>
            <option value="warn">仅警告</option>
            <option value="fallback">切换到低成本模型</option>
          </select>
        </div>
        
        <div class="p-4 bg-muted/30 rounded-xl border border-card-border">
          <div class="flex items-center justify-between mb-3">
            <span class="font-medium text-sm">低成本模型</span>
            <span class="text-xs text-muted-foreground">FALLBACK_MODEL</span>
          </div>
          <select v-model="limits.fallbackModel" class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm">
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="claude-3-haiku">Claude 3 Haiku</option>
            <option value="glm-4-flash">GLM-4 Flash</option>
          </select>
        </div>
      </div>
      
      <div class="flex justify-end mt-4">
        <button @click="saveLimits" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">
          保存设置
        </button>
      </div>
    </div>

    <!-- Budget Modal -->
    <div v-if="showBudgetModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="showBudgetModal = false">
      <div class="glass-panel p-6 w-full max-w-md rounded-2xl">
        <h3 class="text-lg font-semibold mb-4">设置月度预算</h3>
        
        <div class="space-y-4">
          <div>
            <label class="text-xs text-muted-foreground block mb-2">月度预算 (USD)</label>
            <div class="flex items-center gap-2">
              <span class="text-lg text-muted-foreground">$</span>
              <input type="number" v-model="budgetForm.total" step="1" min="0"
                     class="flex-1 bg-background border border-card-border rounded-lg px-3 py-2 text-lg font-mono" />
            </div>
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">计费周期起始日</label>
            <select v-model="budgetForm.cycleStart" class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm">
              <option value="1">每月 1 日</option>
              <option value="15">每月 15 日</option>
              <option value="subscription">按订阅周期</option>
            </select>
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">预算重置时通知</label>
            <label class="flex items-center cursor-pointer">
              <div class="relative">
                <input type="checkbox" v-model="budgetForm.notifyOnReset" class="sr-only" />
                <div class="w-9 h-5 bg-muted rounded-full transition-colors" :class="{ 'bg-primary': budgetForm.notifyOnReset }"></div>
                <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform" :class="{ 'translate-x-4': budgetForm.notifyOnReset }"></div>
              </div>
              <span class="ml-2 text-sm text-muted-foreground">预算重置时发送通知</span>
            </label>
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-6">
          <button @click="showBudgetModal = false" class="px-4 py-2 text-sm bg-muted/50 rounded-lg border border-card-border">
            取消
          </button>
          <button @click="saveBudget" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">
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
import { ref, computed, reactive } from 'vue'
import { 
  Wallet, TrendingUp, Calendar, BarChart2, Calculator, AlertTriangle, PieChart,
  Users, ShieldCheck, Pencil, CheckCircle, AlertCircle, RefreshCw,
  CircleDollarSign, Cpu, Zap, Bot
} from 'lucide-vue-next'

const { data, refresh: refreshData } = await useFetch('/api/budget')
const isRefreshing = ref(false)
const statusMessage = ref<{ type: string, message: string } | null>(null)
const showBudgetModal = ref(false)
const alertsEnabled = ref(true)
const dailyLimit = ref(5)

const alertThresholds = reactive({
  warn70: 70,
  warn90: 90
})

const limits = reactive({
  perRequest: 0.5,
  perSession: 5,
  onExceed: 'warn',
  fallbackModel: 'gpt-4o-mini'
})

const budgetForm = reactive({
  total: 100,
  cycleStart: '1',
  notifyOnReset: true
})

const budgetPercent = computed(() => {
  if (!data.value?.budget?.total) return 0
  return (data.value.budget.used / data.value.budget.total) * 100
})

const estimatedExceeds = computed(() => {
  if (!data.value?.budget?.total || !data.value?.estimated?.cost) return false
  return data.value.estimated.cost > data.value.budget.total
})

const maxDailyCost = computed(() => {
  const trend = data.value?.dailyTrend || []
  return Math.max(...trend.map((d: any) => d.cost), 1)
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

const formatCurrency = (amount: number): string => {
  return '$' + (amount || 0).toFixed(2)
}

const formatNumber = (num: number): string => num?.toLocaleString() || '0'

const getProviderIcon = (provider: string) => {
  const icons: Record<string, any> = {
    'openai': CircleDollarSign,
    'anthropic': Bot,
    'jdcloud': Cpu,
    'default': Zap
  }
  return icons[provider] || icons['default']
}

const editBudget = () => {
  budgetForm.total = data.value?.budget?.total || 100
  showBudgetModal.value = true
}

const saveBudget = async () => {
  showStatus('success', '预算设置已保存')
  showBudgetModal.value = false
}

const toggleAlerts = async () => {
  showStatus('success', alertsEnabled.value ? '预算预警已启用' : '预算预警已禁用')
}

const saveThresholds = async () => {
  showStatus('success', '预警设置已保存')
}

const saveLimits = async () => {
  showStatus('success', '消费限制已保存')
}
</script>
