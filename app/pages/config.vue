<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <div class="glass-panel p-8">
      <div class="flex items-center gap-4 mb-6 pb-6 border-b border-card-border">
        <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <Cpu class="text-primary" size="24" />
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold tracking-tight">模型热切换 (Live Model Switching)</h2>
            <div v-if="data?.isRealHermesConnected" class="text-xs px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded">已连接本地 Hermes</div>
            <div v-else class="text-xs px-2 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded">Mock 数据展示</div>
          </div>
          <p class="text-muted-foreground text-sm mt-1">无需重启，即可实时更改底层推理模型，支持 OpenRouter 及各类提供商。</p>
        </div>
      </div>

      <div class="space-y-6">
        <!-- Provider Selection -->
        <div class="space-y-3">
          <label class="block text-sm font-medium">当前模型提供商 (Provider)</label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button v-for="prov in providers" :key="prov.id" 
              @click="activeProvider = prov.id"
              class="px-4 py-3 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200"
              :class="activeProvider === prov.id ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-card-border bg-background hover:bg-muted/50'">
              <component :is="prov.icon" size="20" />
              <span class="text-xs font-medium">{{ prov.name }}</span>
            </button>
          </div>
        </div>

        <!-- Model Selection -->
        <div class="space-y-3">
          <label class="block text-sm font-medium">语言模型 (LLM)</label>
          <select v-model="activeModel" class="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none">
            <option value="anthropic/claude-3.5-sonnet">anthropic/claude-3.5-sonnet</option>
            <option value="anthropic/claude-3-opus">anthropic/claude-3-opus</option>
            <option value="openai/gpt-4o">openai/gpt-4o</option>
            <option value="nousresearch/hermes-2-pro">nousresearch/hermes-2-pro</option>
            <option value="google/gemini-1.5-pro">google/gemini-1.5-pro</option>
          </select>
          <p class="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Info size="14" />
            <span>聚合器将尝试优先使用 OpenRouter，如失败将自动 Fallback 至直连 API。</span>
          </p>
        </div>

        <!-- Toggles -->
        <div class="space-y-4 pt-6 border-t border-card-border">
          <h3 class="text-lg font-semibold">运行时配置</h3>
          
          <div v-for="(setting, key) in toggles" :key="key" class="flex items-center justify-between p-4 rounded-xl border border-card-border bg-muted/20">
            <div>
              <p class="font-medium text-sm">{{ setting.label }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ setting.desc }}</p>
            </div>
            <!-- Toggle Switch -->
            <button @click="setting.value = !setting.value" 
              class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              :class="setting.value ? 'bg-primary' : 'bg-muted'">
              <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="setting.value ? 'translate-x-5' : 'translate-x-0'"></span>
            </button>
          </div>
        </div>
      </div>

      <div class="mt-8 flex justify-end gap-3">
        <button class="btn-outline">取消更改</button>
        <button class="btn-primary flex items-center gap-2" @click="saveConfig">
          <Save size="16" />
          <span>保存并热重载</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Cpu, Server, Cloud, Globe, Box, Info, Save } from 'lucide-vue-next'

const { data } = await useFetch('/api/config')

const providers = [
  { id: 'openrouter', name: 'OpenRouter', icon: Globe },
  { id: 'openai', name: 'OpenAI', icon: Cloud },
  { id: 'anthropic', name: 'Anthropic', icon: Box },
  { id: 'local', name: 'Local / Ollama', icon: Server },
]

const activeProvider = ref(data.value?.activeProvider || 'openrouter')
const activeModel = ref(data.value?.activeModel || 'anthropic/claude-3.5-sonnet')

const toggles = ref({
  streaming: { label: '开启流式传输 (Streaming)', desc: 'CLI 及网关平台将使用流式逐字输出。', value: data.value?.toggles?.streaming ?? true },
  saveTrajectories: { label: '保存训练轨迹 (ShareGPT)', desc: '将会话数据保存至 trajectory_samples.jsonl 用于后续训练。', value: data.value?.toggles?.saveTrajectories ?? false },
  quietMode: { label: '静默模式 (Quiet Mode)', desc: '禁用终端中的加载动画与进度条，适合日志重定向。', value: data.value?.toggles?.quietMode ?? false },
  mcpScanning: { label: 'MCP OSV 恶意扫描', desc: '安装 MCP 插件前自动检查 OSV 漏洞数据库。', value: data.value?.toggles?.mcpScanning ?? true },
})

const saveConfig = () => {
  alert('配置已保存并通知 Agent 重载！(需对接后台 POST 接口)')
}
</script>
