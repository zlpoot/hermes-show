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
          <span class="text-xs text-muted-foreground">授权用户</span>
          <Users :size="16" class="text-primary" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ data?.stats?.authorizedUsers || 0 }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          {{ data?.stats?.pendingPairings || 0 }} 待审批
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">今日活跃</span>
          <Activity :size="16" class="text-green-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ data?.stats?.activeToday || 0 }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          占 {{ activeRate }}%
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">黑名单</span>
          <Ban :size="16" class="text-red-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ data?.stats?.blacklisted || 0 }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          已封禁用户
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">配对模式</span>
          <Shield :size="16" class="text-blue-400" />
        </div>
        <h3 class="text-xl font-bold" :class="(data as any)?.pairingMode === 'open' ? 'text-green-400' : 'text-amber-400'">
          {{ (data as any)?.pairingMode === 'open' ? '开放模式' : '配对模式' }}
        </h3>
        <p class="text-xs text-muted-foreground mt-1">
          {{ (data as any)?.pairingMode === 'open' ? '所有用户可访问' : '需审批访问' }}
        </p>
      </div>
    </div>

    <!-- Global Settings -->
    <div class="glass-panel p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Settings2 :size="18" class="text-primary" />
        全局设置
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-card-border">
            <div>
              <p class="font-medium text-sm">允许所有用户</p>
              <p class="text-xs text-muted-foreground mt-0.5">GATEWAY_ALLOW_ALL_USERS</p>
            </div>
            <label class="flex items-center cursor-pointer">
              <div class="relative">
                <input type="checkbox" v-model="allowAllUsers" @change="toggleAllowAll" class="sr-only" />
                <div class="w-11 h-6 bg-muted rounded-full transition-colors" :class="{ 'bg-primary': allowAllUsers }"></div>
                <div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform" :class="{ 'translate-x-5': allowAllUsers }"></div>
              </div>
            </label>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-card-border">
            <div>
              <p class="font-medium text-sm">配对模式</p>
              <p class="text-xs text-muted-foreground mt-0.5">WEIXIN_DM_POLICY</p>
            </div>
            <select v-model="pairingMode" @change="changePairingMode" class="bg-background border border-card-border rounded-lg px-3 py-1.5 text-sm">
              <option value="open">开放 (open)</option>
              <option value="pairing">配对 (pairing)</option>
            </select>
          </div>
        </div>
        
        <div class="p-4 bg-muted/30 rounded-xl border border-card-border">
          <p class="font-medium text-sm mb-3">权限说明</p>
          <div class="space-y-2 text-xs text-muted-foreground">
            <div class="flex items-start gap-2">
              <CheckCircle2 :size="14" class="text-green-400 shrink-0 mt-0.5" />
              <span><strong class="text-foreground">开放模式</strong>: 所有用户均可与 Agent 对话</span>
            </div>
            <div class="flex items-start gap-2">
              <Shield :size="14" class="text-amber-400 shrink-0 mt-0.5" />
              <span><strong class="text-foreground">配对模式</strong>: 新用户需管理员审批</span>
            </div>
            <div class="flex items-start gap-2">
              <Ban :size="14" class="text-red-400 shrink-0 mt-0.5" />
              <span><strong class="text-foreground">黑名单</strong>: 黑名单用户无法使用任何功能</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending Pairings -->
    <div v-if="data?.pendingPairings?.length" class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <UserPlus :size="18" class="text-amber-400" />
          待审批用户
          <span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
            {{ data?.pendingPairings?.length }}
          </span>
        </h3>
      </div>
      
      <div class="space-y-3">
        <div v-for="user in data?.pendingPairings" :key="user.id" 
             class="flex items-center justify-between p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <User :size="18" class="text-amber-400" />
            </div>
            <div>
              <p class="font-medium text-sm">{{ user.displayName || user.id }}</p>
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <span class="flex items-center gap-1">
                  <component :is="getPlatformIcon(user.platform)" :size="12" />
                  {{ user.platform }}
                </span>
                <span>•</span>
                <span>{{ user.requestTime }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="approveUser(user)" 
                    class="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg border border-green-500/30 hover:bg-green-500/20 transition-colors text-sm flex items-center gap-1">
              <Check :size="14" />
              批准
            </button>
            <button @click="rejectUser(user)" 
                    class="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/20 transition-colors text-sm flex items-center gap-1">
              <X :size="14" />
              拒绝
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Authorized Users -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <UserCheck :size="18" class="text-primary" />
          授权用户
        </h3>
        <div class="flex items-center gap-2">
          <input type="text" v-model="userSearch" placeholder="搜索用户..." 
                 class="text-xs bg-background border border-card-border rounded-lg px-3 py-1.5 w-40" />
          <button @click="addUser" class="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-1">
            <Plus :size="14" />
            添加用户
          </button>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-card-border">
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">用户</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">平台</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">权限</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">最后活跃</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">会话数</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">状态</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id" class="border-b border-card-border/50 hover:bg-muted/30">
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <User :size="14" class="text-primary" />
                  </div>
                  <div>
                    <p class="font-medium">{{ user.displayName || user.id }}</p>
                    <p class="text-xs text-muted-foreground font-mono">{{ user.id }}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-1.5">
                  <component :is="getPlatformIcon(user.platform)" :size="14" />
                  <span>{{ user.platform }}</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <select v-model="user.role" @change="changeRole(user)" 
                        class="bg-background border border-card-border rounded px-2 py-1 text-xs">
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </td>
              <td class="py-3 px-4 text-muted-foreground">{{ user.lastActive }}</td>
              <td class="py-3 px-4 font-mono">{{ user.sessionCount }}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-md text-xs"
                      :class="user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'">
                  {{ user.status === 'active' ? '活跃' : '离线' }}
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-1">
                  <button @click="viewUserDetail(user)" 
                          class="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-primary">
                    <Eye :size="14" />
                  </button>
                  <button @click="blockUser(user)" 
                          class="p-1.5 hover:bg-red-500/10 rounded transition-colors text-muted-foreground hover:text-red-400">
                    <Ban :size="14" />
                  </button>
                  <button @click="removeUser(user)" 
                          class="p-1.5 hover:bg-red-500/10 rounded transition-colors text-muted-foreground hover:text-red-400">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Blacklist -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Ban :size="18" class="text-red-400" />
          黑名单
        </h3>
      </div>
      
      <div class="space-y-2">
        <div v-for="user in data?.blacklist" :key="user.id" 
             class="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/20">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <UserX :size="14" class="text-red-400" />
            </div>
            <div>
              <p class="font-medium text-sm">{{ user.displayName || user.id }}</p>
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{{ user.platform }}</span>
                <span>•</span>
                <span>封禁原因: {{ user.reason }}</span>
                <span>•</span>
                <span>{{ user.blockedTime }}</span>
              </div>
            </div>
          </div>
          <button @click="unblockUser(user)" 
                  class="px-3 py-1 text-xs bg-muted/50 rounded-lg border border-card-border hover:bg-muted transition-colors">
            解除封禁
          </button>
        </div>
        
        <div v-if="!data?.blacklist?.length" class="text-center py-8 text-muted-foreground">
          <Ban :size="32" class="mx-auto mb-2 opacity-50" />
          <p class="text-sm">黑名单为空</p>
        </div>
      </div>
    </div>

    <!-- Add User Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="showAddModal = false">
      <div class="glass-panel p-6 w-full max-w-md rounded-2xl">
        <h3 class="text-lg font-semibold mb-4">添加授权用户</h3>
        
        <div class="space-y-4">
          <div>
            <label class="text-xs text-muted-foreground block mb-2">用户 ID</label>
            <input type="text" v-model="addForm.userId" placeholder="例如: o9cq8071ueKj60zUJ8WHaw_QJl7M@im.wechat"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">平台</label>
            <select v-model="addForm.platform" class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm">
              <option value="wechat">微信</option>
              <option value="telegram">Telegram</option>
              <option value="discord">Discord</option>
            </select>
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">显示名称 (可选)</label>
            <input type="text" v-model="addForm.displayName" placeholder="用户昵称"
                   class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm" />
          </div>
          
          <div>
            <label class="text-xs text-muted-foreground block mb-2">权限</label>
            <select v-model="addForm.role" class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-6">
          <button @click="showAddModal = false" class="px-4 py-2 text-sm bg-muted/50 rounded-lg border border-card-border">
            取消
          </button>
          <button @click="saveUser" class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">
            添加
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
  Users, Activity, Ban, Shield, Settings2, UserPlus, UserCheck, User, UserX,
  Plus, Check, X, Eye, Trash2, CheckCircle, AlertCircle, RefreshCw, CheckCircle2,
  MessageCircle, Send
} from 'lucide-vue-next'

const { data, refresh: refreshData } = await useFetch('/api/users')
const isRefreshing = ref(false)
const statusMessage = ref<{ type: string, message: string } | null>(null)
const showAddModal = ref(false)
const userSearch = ref('')
const allowAllUsers = ref((data.value as any)?.allowAllUsers || false)
const pairingMode = ref((data.value as any)?.pairingMode || 'pairing')

const addForm = reactive({
  userId: '',
  platform: 'wechat',
  displayName: '',
  role: 'user'
})

const activeRate = computed(() => {
  if (!data.value?.stats?.authorizedUsers) return 0
  return Math.round((data.value.stats.activeToday / data.value.stats.authorizedUsers) * 100)
})

const filteredUsers = computed(() => {
  let users = data.value?.authorizedUsers || []
  if (userSearch.value) {
    const search = userSearch.value.toLowerCase()
    users = users.filter((u: any) => 
      u.id?.toLowerCase().includes(search) || 
      u.displayName?.toLowerCase().includes(search)
    )
  }
  return users
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

const getPlatformIcon = (platform: string) => {
  const icons: Record<string, any> = {
    'wechat': MessageCircle,
    'telegram': Send,
    'discord': Users,
    'default': User
  }
  return icons[platform] || icons['default']
}

const toggleAllowAll = async () => {
  showStatus('success', allowAllUsers.value ? '已开启允许所有用户' : '已关闭允许所有用户')
}

const changePairingMode = async () => {
  showStatus('success', `配对模式已切换为: ${pairingMode.value}`)
}

const approveUser = async (user: any) => {
  showStatus('success', `已批准用户: ${user.displayName || user.id}`)
}

const rejectUser = async (user: any) => {
  if (!confirm(`确定拒绝用户 "${user.displayName || user.id}" 的访问请求吗？`)) return
  showStatus('success', '已拒绝访问请求')
}

const addUser = () => {
  Object.assign(addForm, { userId: '', platform: 'wechat', displayName: '', role: 'user' })
  showAddModal.value = true
}

const saveUser = async () => {
  if (!addForm.userId) {
    showStatus('error', '请输入用户 ID')
    return
  }
  showStatus('success', '用户已添加')
  showAddModal.value = false
}

const changeRole = async (user: any) => {
  showStatus('success', `已将 ${user.displayName || user.id} 设置为${user.role === 'admin' ? '管理员' : '普通用户'}`)
}

const viewUserDetail = (user: any) => {
  navigateTo(`/history?user=${user.id}`)
}

const blockUser = async (user: any) => {
  if (!confirm(`确定要将 "${user.displayName || user.id}" 加入黑名单吗？`)) return
  showStatus('success', '用户已加入黑名单')
}

const removeUser = async (user: any) => {
  if (!confirm(`确定要移除用户 "${user.displayName || user.id}" 吗？`)) return
  showStatus('success', '用户已移除')
}

const unblockUser = async (user: any) => {
  showStatus('success', `已解除 ${user.displayName || user.id} 的封禁`)
}
</script>
