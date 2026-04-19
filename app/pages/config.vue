<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="glass-panel p-6">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Cpu class="text-primary" size="24" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-3">
            <h2 class="text-2xl font-bold">配置中心</h2>
            <span v-if="initialData?.isRealHermesConnected" class="text-xs px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded">已连接</span>
            <span v-else class="text-xs px-2 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded">Mock 模式</span>
          </div>
          <p class="text-muted-foreground text-sm mt-1">{{ initialData?.configPath || '未检测到配置文件' }}</p>
        </div>
      </div>
    </div>

    <!-- Model Settings -->
    <div class="glass-panel p-6">
      <div class="flex items-center gap-2 mb-6">
        <Zap size="18" class="text-primary" />
        <h3 class="text-lg font-semibold">模型配置</h3>
      </div>

      <!-- Current Provider -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="space-y-2">
          <label class="block text-sm font-medium">当前提供商</label>
          <select v-model="form.model.provider" 
            class="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option v-for="(cfg, id) in initialData?.providers" :key="id" :value="id">
              {{ cfg.name }} ({{ id }})
            </option>
          </select>
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium">模型名称</label>
          <input type="text" v-model="form.model.default" 
            class="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            :placeholder="currentProviderConfig?.default_model || '输入模型名称'" />
        </div>
      </div>

      <!-- Provider Details -->
      <div v-if="currentProviderConfig" class="p-4 bg-muted/30 rounded-xl border border-card-border">
        <h4 class="text-sm font-medium mb-3 text-muted-foreground">提供商详情</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <span class="text-muted-foreground">API 端点:</span>
            <span class="ml-2 font-mono text-xs">{{ currentProviderConfig.base_url }}</span>
          </div>
          <div>
            <span class="text-muted-foreground">API 模式:</span>
            <span class="ml-2">{{ currentProviderConfig.api_mode }}</span>
          </div>
          <div>
            <span class="text-muted-foreground">密钥环境变量:</span>
            <span class="ml-2 font-mono text-xs">{{ currentProviderConfig.key_env || '无' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Agent Settings -->
    <div class="glass-panel p-6">
      <div class="flex items-center gap-2 mb-6">
        <Settings size="18" class="text-primary" />
        <h3 class="text-lg font-semibold">Agent 设置</h3>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium">Max Tokens</label>
          <input type="number" v-model="form.agent.max_tokens" 
            class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm" />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium">Max Turns</label>
          <input type="number" v-model="form.agent.max_turns" 
            class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm" />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium">Gateway Timeout</label>
          <input type="number" v-model="form.agent.gateway_timeout" 
            class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm" />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium">Reasoning Effort</label>
          <select v-model="form.agent.reasoning_effort" 
            class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div class="flex flex-wrap gap-6 mt-6 pt-6 border-t border-card-border">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.streaming.enabled" class="w-4 h-4 rounded border-card-border text-primary" />
          <span class="text-sm">流式输出 (Streaming)</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.agent.save_trajectories" class="w-4 h-4 rounded border-card-border text-primary" />
          <span class="text-sm">保存训练轨迹</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.agent.verbose" class="w-4 h-4 rounded border-card-border text-primary" />
          <span class="text-sm">详细日志 (Verbose)</span>
        </label>
      </div>
    </div>

    <!-- Terminal Settings -->
    <div class="glass-panel p-6">
      <div class="flex items-center gap-2 mb-6">
        <TerminalSquare size="18" class="text-primary" />
        <h3 class="text-lg font-semibold">终端配置</h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium">后端类型</label>
          <select v-model="form.terminal.backend" 
            class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
            <option value="local">Local</option>
            <option value="docker">Docker</option>
            <option value="modal">Modal</option>
          </select>
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium">默认超时 (秒)</label>
          <input type="number" v-model="form.terminal.timeout" 
            class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm" />
        </div>
        <div class="space-y-2 flex items-end">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.terminal.persistent_shell" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">持久化 Shell</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Security & Logging -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Security -->
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <Shield size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">安全设置</h3>
        </div>
        
        <div class="space-y-4">
          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <p class="text-sm font-medium">隐藏敏感信息</p>
              <p class="text-xs text-muted-foreground">在日志中自动脱敏密钥等</p>
            </div>
            <input type="checkbox" v-model="form.security.redact_secrets" class="w-4 h-4 rounded border-card-border text-primary" />
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <p class="text-sm font-medium">MCP 安全扫描</p>
              <p class="text-xs text-muted-foreground">安装插件前检查漏洞</p>
            </div>
            <input type="checkbox" v-model="form.mcp.osv_scanning" class="w-4 h-4 rounded border-card-border text-primary" />
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <p class="text-sm font-medium">Tirith 启用</p>
              <p class="text-xs text-muted-foreground">策略检查引擎</p>
            </div>
            <input type="checkbox" v-model="form.security.tirith_enabled" class="w-4 h-4 rounded border-card-border text-primary" />
          </label>
        </div>
      </div>

      <!-- Logging & Display -->
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <FileText size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">日志与显示</h3>
        </div>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">日志级别</label>
            <select v-model="form.logging.level" 
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">人格风格</label>
            <select v-model="form.display.personality" 
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
              <option value="helpful">Helpful</option>
              <option value="concise">Concise</option>
              <option value="technical">Technical</option>
              <option value="creative">Creative</option>
              <option value="teacher">Teacher</option>
              <option value="kawaii">Kawaii</option>
              <option value="catgirl">Catgirl</option>
              <option value="pirate">Pirate</option>
              <option value="shakespeare">Shakespeare</option>
              <option value="surfer">Surfer</option>
              <option value="noir">Noir</option>
              <option value="uwu">UwU</option>
              <option value="philosopher">Philosopher</option>
              <option value="hype">Hype</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">审批模式</label>
            <select v-model="form.approvals.mode" 
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
              <option value="manual">Manual (手动审批)</option>
              <option value="auto">Auto (自动批准)</option>
              <option value="suggest">Suggest (建议模式)</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3">
      <button @click="resetForm" class="btn-outline">重置</button>
      <button @click="saveConfig" :disabled="isSaving" class="btn-primary flex items-center gap-2">
        <Loader2 v-if="isSaving" size="16" class="animate-spin" />
        <Save v-else size="16" />
        <span>{{ isSaving ? '保存中...' : '保存配置' }}</span>
      </button>
    </div>

    <!-- Message -->
    <div v-if="message" class="glass-panel p-4 rounded-xl flex items-center gap-3"
      :class="message.type === 'success' ? 'bg-primary/10 border border-primary/30' : 'bg-red-500/10 border border-red-500/30'">
      <CheckCircle2 v-if="message.type === 'success'" class="text-primary" size="20" />
      <AlertCircle v-else class="text-red-500" size="20" />
      <span class="text-sm" :class="message.type === 'success' ? 'text-primary' : 'text-red-500'">{{ message.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Cpu, Zap, Settings, TerminalSquare, Shield, FileText, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-vue-next'

const { data: initialData } = await useFetch('/api/config')

const currentProviderConfig = computed(() => {
  const providerId = form.model.provider
  return initialData.value?.providers?.[providerId]
})

const form = reactive({
  model: {
    provider: '',
    default: ''
  },
  agent: {
    max_tokens: 8000,
    max_turns: 90,
    reasoning_effort: 'medium',
    save_trajectories: false,
    gateway_timeout: 1800,
    verbose: false
  },
  streaming: {
    enabled: false
  },
  terminal: {
    backend: 'local',
    timeout: 180,
    persistent_shell: true
  },
  logging: {
    level: 'INFO'
  },
  display: {
    personality: 'helpful'
  },
  mcp: {
    osv_scanning: true
  },
  security: {
    redact_secrets: true,
    tirith_enabled: true
  },
  approvals: {
    mode: 'manual',
    timeout: 60
  }
})

const isSaving = ref(false)
const message = ref<{ type: 'success' | 'error', text: string } | null>(null)

onMounted(() => {
  if (initialData.value) {
    form.model.provider = initialData.value.model?.provider || ''
    form.model.default = initialData.value.model?.default || ''
    Object.assign(form.agent, initialData.value.agent || {})
    Object.assign(form.streaming, initialData.value.streaming || {})
    Object.assign(form.terminal, initialData.value.terminal || {})
    Object.assign(form.logging, initialData.value.logging || {})
    Object.assign(form.display, initialData.value.display || {})
    Object.assign(form.mcp, initialData.value.mcp || {})
    Object.assign(form.security, initialData.value.security || {})
    Object.assign(form.approvals, initialData.value.approvals || {})
  }
})

const resetForm = () => {
  if (initialData.value) {
    form.model.provider = initialData.value.model?.provider || ''
    form.model.default = initialData.value.model?.default || ''
    Object.assign(form.agent, initialData.value.agent || {})
    Object.assign(form.streaming, initialData.value.streaming || {})
    Object.assign(form.terminal, initialData.value.terminal || {})
    Object.assign(form.logging, initialData.value.logging || {})
    Object.assign(form.display, initialData.value.display || {})
    Object.assign(form.mcp, initialData.value.mcp || {})
    Object.assign(form.security, initialData.value.security || {})
    Object.assign(form.approvals, initialData.value.approvals || {})
  }
  message.value = null
}

const saveConfig = async () => {
  isSaving.value = true
  message.value = null
  
  try {
    await $fetch('/api/config', {
      method: 'PUT',
      body: form
    })
    message.value = { type: 'success', text: '配置已保存！部分设置需要重启 Hermes Agent 才能生效。' }
  } catch (e: any) {
    message.value = { type: 'error', text: e.data?.message || '保存失败，请重试' }
  } finally {
    isSaving.value = false
  }
}
</script>
