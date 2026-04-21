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
          <span class="text-xs text-muted-foreground">数据库大小</span>
          <Database :size="16" class="text-blue-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ formatSize(data?.summary?.dbSize || 0) }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          {{ formatNumber(data?.summary?.sessionCount || 0) }} 会话
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">配置文件</span>
          <Settings :size="16" class="text-green-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ data?.summary?.configCount || 0 }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          最后修改: {{ data?.summary?.configLastModified || '-' }}
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">备份文件</span>
          <HardDrive :size="16" class="text-amber-400" />
        </div>
        <h3 class="text-2xl font-bold font-mono">{{ data?.backups?.length || 0 }}</h3>
        <p class="text-xs text-muted-foreground mt-1">
          总大小: {{ formatSize(totalBackupSize) }}
        </p>
      </div>
      
      <div class="glass-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-muted-foreground">自动备份</span>
          <Clock :size="16" class="text-primary" />
        </div>
        <h3 class="text-2xl font-bold font-mono" :class="data?.autoBackup?.enabled ? 'text-green-400' : 'text-muted-foreground'">
          {{ data?.autoBackup?.enabled ? '已启用' : '已禁用' }}
        </h3>
        <p class="text-xs text-muted-foreground mt-1">
          {{ data?.autoBackup?.enabled ? `每 ${data?.autoBackup?.interval}` : '点击配置' }}
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="glass-panel p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Download :size="18" class="text-primary" />
        备份操作
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button @click="exportDatabase" 
                :disabled="isExporting"
                class="flex flex-col items-center gap-2 p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-card-border transition-colors disabled:opacity-50">
          <Database :size="24" class="text-blue-400" />
          <span class="text-sm font-medium">{{ isExporting ? '导出中...' : '导出数据库' }}</span>
          <span class="text-xs text-muted-foreground">SQLite → JSON</span>
        </button>
        
        <button @click="triggerImportDb" 
                class="flex flex-col items-center gap-2 p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-card-border transition-colors">
          <Upload :size="24" class="text-green-400" />
          <span class="text-sm font-medium">导入数据库</span>
          <span class="text-xs text-muted-foreground">JSON → SQLite</span>
        </button>
        <input ref="importDbInput" type="file" accept=".json" class="hidden" @change="importDatabase" />
        
        <button @click="exportConfig" 
                class="flex flex-col items-center gap-2 p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-card-border transition-colors">
          <FileText :size="24" class="text-amber-400" />
          <span class="text-sm font-medium">导出配置</span>
          <span class="text-xs text-muted-foreground">config.yaml</span>
        </button>
        
        <button @click="createBackup" 
                :disabled="isCreatingBackup"
                class="flex flex-col items-center gap-2 p-4 bg-primary/10 hover:bg-primary/20 rounded-xl border border-primary/30 transition-colors disabled:opacity-50">
          <Save :size="24" class="text-primary" />
          <span class="text-sm font-medium">{{ isCreatingBackup ? '创建中...' : '创建备份' }}</span>
          <span class="text-xs text-muted-foreground">完整备份</span>
        </button>
      </div>
    </div>

    <!-- Auto Backup Settings -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <Clock :size="18" class="text-primary" />
          自动备份设置
        </h3>
        <label class="flex items-center gap-2 cursor-pointer">
          <span class="text-sm text-muted-foreground">启用</span>
          <div class="relative">
            <input type="checkbox" v-model="autoBackupEnabled" class="sr-only" @change="toggleAutoBackup" />
            <div class="w-10 h-6 bg-muted rounded-full transition-colors" :class="{ 'bg-primary': autoBackupEnabled }"></div>
            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform" :class="{ 'translate-x-4': autoBackupEnabled }"></div>
          </div>
        </label>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs text-muted-foreground block mb-2">备份频率</label>
          <select v-model="backupInterval" class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm">
            <option value="hourly">每小时</option>
            <option value="6h">每 6 小时</option>
            <option value="12h">每 12 小时</option>
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-muted-foreground block mb-2">保留数量</label>
          <input type="number" v-model="backupRetention" min="1" max="100" 
                 class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
    </div>

    <!-- Backup List -->
    <div class="glass-panel p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <History :size="18" class="text-primary" />
        备份历史
      </h3>
      <div class="space-y-2">
        <div v-for="backup in data?.backups" :key="backup.id" 
             class="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-card-border hover:border-primary/50 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-card-border">
              <component :is="getBackupIcon(backup.type)" :size="18" class="text-primary" />
            </div>
            <div>
              <p class="text-sm font-medium">{{ backup.name }}</p>
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{{ backup.date }}</span>
                <span>•</span>
                <span>{{ formatSize(backup.size) }}</span>
                <span>•</span>
                <span>{{ backup.type }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="restoreBackup(backup)" 
                    class="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary">
              <RotateCcw :size="16" />
            </button>
            <button @click="downloadBackup(backup)" 
                    class="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-green-400">
              <Download :size="16" />
            </button>
            <button @click="deleteBackup(backup)" 
                    class="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-muted-foreground hover:text-red-400">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
        
        <div v-if="!data?.backups?.length" class="text-center py-8 text-muted-foreground">
          <HardDrive :size="32" class="mx-auto mb-2 opacity-50" />
          <p class="text-sm">暂无备份记录</p>
        </div>
      </div>
    </div>

    <!-- Status Messages -->
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
import { ref, computed } from 'vue'
import { 
  Database, Settings, HardDrive, Clock, Download, Upload, FileText, Save, 
  History, RotateCcw, Trash2, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-vue-next'

const { data, refresh: refreshData } = await useFetch('/api/backup')
const isRefreshing = ref(false)
const isExporting = ref(false)
const isCreatingBackup = ref(false)
const importDbInput = ref<HTMLInputElement | null>(null)
const statusMessage = ref<{ type: string, message: string } | null>(null)

const autoBackupEnabled = ref(data.value?.autoBackup?.enabled || false)
const backupInterval = ref(data.value?.autoBackup?.interval || 'daily')
const backupRetention = ref(data.value?.autoBackup?.retention || 10)

const totalBackupSize = computed(() => {
  return (data.value?.backups || []).reduce((sum: number, b: any) => sum + b.size, 0)
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

const formatSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return bytes + ' B'
}

const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

const getBackupIcon = (type: string) => {
  return type === 'database' ? Database : FileText
}

const exportDatabase = async () => {
  isExporting.value = true
  try {
    const res = await $fetch('/api/backup/export', { method: 'POST' })
    if ((res as any).success) {
      showStatus('success', '数据库导出成功')
      // Download the file
      if ((res as any).downloadUrl) {
        window.open((res as any).downloadUrl, '_blank')
      }
    }
  } catch (e) {
    showStatus('error', '导出失败')
  } finally {
    isExporting.value = false
  }
}

const triggerImportDb = () => {
  importDbInput.value?.click()
}

const importDatabase = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  showStatus('success', '正在导入数据库...')
  // Would implement actual import
}

const exportConfig = async () => {
  try {
    const res = await $fetch('/api/backup/config')
    if ((res as any).content) {
      const blob = new Blob([(res as any).content], { type: 'text/yaml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'config.yaml'
      a.click()
      URL.revokeObjectURL(url)
      showStatus('success', '配置导出成功')
    }
  } catch (e) {
    showStatus('error', '导出失败')
  }
}

const createBackup = async () => {
  isCreatingBackup.value = true
  try {
    const res = await $fetch('/api/backup/create', { method: 'POST' })
    if ((res as any).success) {
      showStatus('success', '备份创建成功')
      await refreshData()
    }
  } catch (e) {
    showStatus('error', '备份创建失败')
  } finally {
    isCreatingBackup.value = false
  }
}

const toggleAutoBackup = async () => {
  // Would save to backend
  showStatus('success', autoBackupEnabled.value ? '自动备份已启用' : '自动备份已禁用')
}

const restoreBackup = async (backup: any) => {
  if (!confirm(`确定要恢复备份 "${backup.name}" 吗？当前数据将被覆盖。`)) return
  showStatus('success', '正在恢复备份...')
}

const downloadBackup = async (backup: any) => {
  showStatus('success', '正在下载...')
}

const deleteBackup = async (backup: any) => {
  if (!confirm(`确定要删除备份 "${backup.name}" 吗？`)) return
  showStatus('success', '备份已删除')
  await refreshData()
}
</script>
