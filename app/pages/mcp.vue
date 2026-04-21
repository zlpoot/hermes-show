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

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">MCP 服务器</span>
          <Server :size="16" class="text-primary" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ data?.servers?.length || 0 }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          {{ connectedCount }} 已连接
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">可用工具</span>
          <Wrench :size="16" class="text-blue-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ totalTools }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          {{ enabledTools }} 已启用
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">今日调用</span>
          <Zap :size="16" class="text-amber-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ formatNumber(data?.stats?.todayCalls || 0) }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          成功率 {{ data?.stats?.successRate || 0 }}%
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">平均延迟</span>
          <Timer :size="16" class="text-green-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ data?.stats?.avgLatency || 0 }}ms</h3>
        <p class="text-xs text-muted-foreground mt-1">
          P99: {{ data?.stats?.p99Latency || 0 }}ms
        </p>
      </div>
    </div>

    <!-- MCP Servers -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Server :size="18" class="text-primary" />
          MCP 服务器
        </h3>
        <button @click="addServer" class="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-1">
          <Plus :size="14" />
          添加服务器
        </button>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div v-for="server in data?.servers" :key="server.id" 
             class="p-4 bg-muted/30 rounded-xl border border-card-border hover:border-primary/50 transition-colors">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-card flex items-center justify-center border border-card-border">
                <Box :size="24" :class="server.connected ? 'text-primary' : 'text-muted-foreground'" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="font-semibold">{{ server.name }}</p>
                  <span class="px-2 py-0.5 rounded-md text-xs" 
                        :class="server.connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'">
                    {{ server.connected ? '已连接' : '断开' }}
                  </span>
                </div>
                <p class="text-xs text-muted-foreground font-mono">{{ (server as any).command }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button @click="toggleServer(server)" 
                      class="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-primary">
                <Power :size="16" />
              </button>
              <button @click="editServer(server)" 
                      class="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-blue-400">
                <Pencil :size="16" />
              </button>
              <button @click="deleteServer(server)" 
                      class="p-1.5 hover:bg-red-500/10 rounded transition-colors text-muted-foreground hover:text-red-400">
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-3 text-xs mb-3">
            <div class="bg-card/50 rounded-lg p-2 border border-card-border">
              <span class="text-muted-foreground">工具数</span>
              <p class="font-mono font-semibold mt-0.5">{{ server.toolCount }}</p>
            </div>
            <div class="bg-card/50 rounded-lg p-2 border border-card-border">
              <span class="text-muted-foreground">调用次数</span>
              <p class="font-mono font-semibold mt-0.5">{{ formatNumber(server.callCount) }}</p>
            </div>
            <div class="bg-card/50 rounded-lg p-2 border border-card-border">
              <span class="text-muted-foreground">延迟</span>
              <p class="font-mono font-semibold mt-0.5">{{ server.latency }}ms</p>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-1">
            <span v-for="tool in (server as any).tools?.slice(0, 4)" :key="tool" 
                  class="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs border border-primary/20">
              {{ tool }}
            </span>
            <span v-if="(server as any).tools?.length > 4" 
                  class="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
              +{{ (server as any).tools.length - 4 }} 更多
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tools List -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Wrench :size="18" class="text-primary" />
          工具列表
        </h3>
        <div class="flex items-center gap-2">
          <select v-model="toolFilter" class="text-xs bg-background border border-card-border rounded-lg px-3 py-1.5">
            <option value="all">全部工具</option>
            <option value="enabled">已启用</option>
            <option value="disabled">已禁用</option>
          </select>
          <input type="text" v-model="toolSearch" placeholder="搜索工具..." 
                 class="text-xs bg-background border border-card-border rounded-lg px-3 py-1.5 w-40" />
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-card-border">
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">工具名称</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">所属服务器</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">描述</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">调用次数</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">平均耗时</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tool in filteredTools" :key="tool.name" class="border-b border-card-border/50 hover:bg-muted/30">
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                    <component :is="getToolIcon(tool.category)" :size="12" class="text-primary" />
                  </div>
                  <span class="font-mono font-medium">{{ tool.name }}</span>
                </div>
              </td>
              <td class="py-3 px-4 text-muted-foreground">{{ tool.server }}</td>
              <td class="py-3 px-4 text-muted-foreground max-w-xs truncate">{{ tool.description }}</td>
              <td class="py-3 px-4 font-mono">{{ formatNumber(tool.callCount) }}</td>
              <td class="py-3 px-4 font-mono">{{ tool.avgTime }}ms</td>
              <td class="py-3 px-4">
                <label class="flex items-center cursor-pointer">
                  <div class="relative">
                    <input type="checkbox" v-model="tool.enabled" @change="toggleTool(tool)" class="sr-only" />
                    <div class="w-8 h-4 bg-muted rounded-full transition-colors" :class="{ 'bg-primary': tool.enabled }"></div>
                    <div class="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform" :class="{ 'translate-x-4': tool.enabled }"></div>
                  </div>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Call Statistics -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <BarChart2 :size="18" class="text-primary" />
          调用统计 (今日)
        </h3>
        <div class="flex items-center gap-2 text-xs">
          <button @click="statPeriod = 'today'" 
                  :class="statPeriod === 'today' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted/50 border-card-border'"
                  class="px-3 py-1 rounded-lg border transition-colors">
            今日
          </button>
          <button @click="statPeriod = 'week'" 
                  :class="statPeriod === 'week' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted/50 border-card-border'"
                  class="px-3 py-1 rounded-lg border transition-colors">
            本周
          </button>
          <button @click="statPeriod = 'month'" 
                  :class="statPeriod === 'month' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted/50 border-card-border'"
                  class="px-3 py-1 rounded-lg border transition-colors">
            本月
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-card/50 rounded-xl p-4 border border-card-border">
          <p class="text-xs text-muted-foreground mb-1">总调用次数</p>
          <p class="text-2xl font-bold font-mono">{{ formatNumber(data?.callStats?.total || 0) }}</p>
        </div>
        <div class="bg-card/50 rounded-xl p-4 border border-card-border">
          <p class="text-xs text-muted-foreground mb-1">成功调用</p>
          <p class="text-2xl font-bold font-mono text-green-400">{{ formatNumber(data?.callStats?.success || 0) }}</p>
        </div>
        <div class="bg-card/50 rounded-xl p-4 border border-card-border">
          <p class="text-xs text-muted-foreground mb-1">失败调用</p>
          <p class="text-2xl font-bold font-mono text-red-400">{{ formatNumber(data?.callStats?.failed || 0) }}</p>
        </div>
        <div class="bg-card/50 rounded-xl p-4 border border-card-border">
          <p class="text-xs text-muted-foreground mb-1">超时调用</p>
          <p class="text-2xl font-bold font-mono text-amber-400">{{ formatNumber(data?.callStats?.timeout || 0) }}</p>
        </div>
      </div>
      
      <!-- Top Tools -->
      <h4 class="text-sm font-semibold mb-3">热门工具 Top 5</h4>
      <div class="space-y-2">
        <div v-for="(item, index) in data?.callStats?.topTools" :key="(item as any).tool" 
             class="flex items-center gap-4">
          <span class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {{ index + 1 }}
          </span>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <span class="font-mono text-sm">{{ (item as any).tool }}</span>
              <span class="text-xs text-muted-foreground">{{ formatNumber((item as any).calls) }} 次</span>
            </div>
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all" 
                   :style="{ width: ((item as any).calls / (data?.callStats?.total || 1) * 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Server Modal -->
    <div v-if="showServerModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="showServerModal = false">
      <div class="glass-panel p-6 w-full max-w-lg rounded-2xl">
        <h3 class="text-lg font-semibold mb-4">{{ editingServer?.id ? '编辑服务器' : '添加 MCP 服务器' }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="text-xs text-muted-foreground block mb-2">服务器名称</label>
            <input type="text" v-model="serverForm.name" placeholder="例如: filesystem"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm" />
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">命令</label>
            <input type="text" v-model="serverForm.command" placeholder="例如: npx -y @modelcontextprotocol/server-filesystem"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">参数 (每行一个)</label>
            <textarea v-model="serverForm.args" placeholder="/home/user&#10;/home/user/documents"
                      class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm font-mono h-20 resize-none"></textarea>
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">环境变量 (每行一个 KEY=VALUE)</label>
            <textarea v-model="serverForm.env" placeholder="API_KEY=xxx&#10;DEBUG=true"
                      class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm font-mono h-20 resize-none"></textarea>
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-6">
          <button @click="showServerModal = false" class="px-4 py-2 text-sm bg-muted/50 rounded-lg border border-card-border">
            取消
          </button>
          <button @click="saveServer" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">
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
        <CheckCircle v-if="statusMessage.type === 'success'" :size="16" />
        <AlertCircle v-else :size="16" />
        <span class="text-sm">{{ statusMessage.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { 
  Server, Wrench, Zap, Timer, Plus, Pencil, Trash2, Power, Box, BarChart2,
  CheckCircle, AlertCircle, RefreshCw, FileText, Globe, Database, Code, Terminal
} from 'lucide-vue-next'

const { data, refresh: refreshData } = await useFetch('/api/mcp')
const isRefreshing = ref(false)
const statusMessage = ref<{ type: string, message: string } | null>(null)
const showServerModal = ref(false)
const editingServer = ref<any>(null)
const toolFilter = ref('all')
const toolSearch = ref('')
const statPeriod = ref('today')

const serverForm = reactive({
  name: '',
  command: '',
  args: '',
  env: ''
})

const connectedCount = computed(() => (data.value?.servers || []).filter((s: any) => s.connected).length)
const totalTools = computed(() => data.value?.tools?.length || 0)
const enabledTools = computed(() => (data.value?.tools || []).filter((t: any) => t.enabled).length)

const filteredTools = computed(() => {
  let tools = data.value?.tools || []
  if (toolFilter.value === 'enabled') tools = tools.filter((t: any) => t.enabled)
  if (toolFilter.value === 'disabled') tools = tools.filter((t: any) => !t.enabled)
  if (toolSearch.value) {
    const search = toolSearch.value.toLowerCase()
    tools = tools.filter((t: any) => t.name.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search))
  }
  return tools
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

const formatNumber = (num: number): string => num?.toLocaleString() || '0'

const getToolIcon = (category: string) => {
  const icons: Record<string, any> = {
    'file': FileText,
    'web': Globe,
    'database': Database,
    'code': Code,
    'terminal': Terminal,
    'default': Wrench
  }
  return icons[category] || icons['default']
}

const toggleServer = async (server: any) => {
  showStatus('success', server.connected ? '正在断开服务器...' : '正在连接服务器...')
}

const addServer = () => {
  editingServer.value = null
  Object.assign(serverForm, { name: '', command: '', args: '', env: '' })
  showServerModal.value = true
}

const editServer = (server: any) => {
  editingServer.value = server
  Object.assign(serverForm, {
    name: server.name,
    command: server.command,
    args: server.args?.join('\n') || '',
    env: Object.entries(server.env || {}).map(([k, v]) => `${k}=${v}`).join('\n')
  })
  showServerModal.value = true
}

const saveServer = async () => {
  showStatus('success', editingServer.value ? '服务器已更新' : '服务器已添加')
  showServerModal.value = false
}

const deleteServer = async (server: any) => {
  if (!confirm(`确定要删除服务器 "${server.name}" 吗？`)) return
  showStatus('success', '服务器已删除')
}

const toggleTool = async (tool: any) => {
  showStatus('success', tool.enabled ? '工具已启用' : '工具已禁用')
}
</script>
