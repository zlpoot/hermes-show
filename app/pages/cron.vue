<template>
  <div class="h-[calc(100vh-10rem)] flex flex-col gap-6">
    <!-- Header Actions -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-semibold">定时任务</h3>
        <span class="text-sm text-muted-foreground">{{ jobs.length }} 个任务</span>
      </div>
      <button @click="showCreateModal = true"
        class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
        <Plus size="16" />
        新建任务
      </button>
    </div>

    <!-- Jobs List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="jobs.length === 0" class="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Clock size="48" class="mb-4 opacity-20" />
        <p>暂无定时任务</p>
        <p class="text-sm mt-1">点击"新建任务"创建第一个定时任务</p>
      </div>

      <div v-else class="grid gap-4">
        <div v-for="job in jobs" :key="job.id"
          class="glass-panel p-4 rounded-xl hover:border-primary/30 transition-colors cursor-pointer"
          @click="selectJob(job)">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h4 class="font-medium" :class="job.enabled === false ? 'text-muted-foreground' : ''">
                  {{ job.name || job.id }}
                </h4>
                <span class="text-xs px-2 py-0.5 rounded-full"
                  :class="getStateClass(job)">
                  {{ getStateLabel(job) }}
                </span>
              </div>
              <div class="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span class="flex items-center gap-1">
                  <Clock size="14" />
                  {{ job.schedule?.display || job.schedule?.value || '-' }}
                </span>
                <span v-if="job.repeat?.times" class="flex items-center gap-1">
                  <Repeat size="14" />
                  {{ job.repeat.completed || 0 }}/{{ job.repeat.times }}
                </span>
              </div>
              <p v-if="job.prompt" class="text-sm text-muted-foreground mt-2 line-clamp-2">{{ job.prompt }}</p>
              <div class="flex items-center gap-3 mt-2">
                <span v-if="job.skills?.length" class="text-xs text-primary flex items-center gap-1">
                  <BookOpen size="12" /> {{ job.skills.join(', ') }}
                </span>
                <span v-if="job.script" class="text-xs text-amber-400 flex items-center gap-1">
                  <TerminalSquare size="12" /> {{ job.script }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2 ml-4">
              <button @click.stop="toggleJob(job)" 
                class="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                :title="job.enabled === false ? '启用' : '暂停'">
                <component :is="job.enabled === false ? Play : Pause" size="16" class="text-muted-foreground" />
              </button>
              <button @click.stop="runJob(job)" 
                class="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                title="立即执行">
                <Rocket size="16" class="text-muted-foreground" />
              </button>
              <button @click.stop="deleteJob(job)" 
                class="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                title="删除">
                <Trash2 size="16" class="text-destructive" />
              </button>
            </div>
          </div>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-card-border text-xs text-muted-foreground">
            <span>下次执行: {{ job.next_run_at || '-' }}</span>
            <span v-if="job.last_run_at">上次执行: {{ job.last_run_at }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || editingJob" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeModal">
      <div class="glass-panel w-full max-w-lg mx-4 p-6 rounded-2xl">
        <h3 class="text-lg font-semibold mb-4">{{ editingJob ? '编辑任务' : '新建任务' }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="text-sm text-muted-foreground block mb-1">任务名称</label>
            <input v-model="form.name" type="text" 
              class="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
              placeholder="例如: 每日报告" />
          </div>

          <div>
            <label class="text-sm text-muted-foreground block mb-1">执行计划 *</label>
            <input v-model="form.schedule" type="text" 
              class="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
              placeholder="例如: every 30m, 0 9 * * *" />
            <p class="text-xs text-muted-foreground mt-1">
              支持: "every 30m" (每30分钟), "0 9 * * *" (每天9点), "2026-01-01T00:00" (指定时间)
            </p>
          </div>

          <div>
            <label class="text-sm text-muted-foreground block mb-1">任务提示词 *</label>
            <textarea v-model="form.prompt" rows="3"
              class="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary resize-none"
              placeholder="输入任务描述..."></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-muted-foreground block mb-1">重复次数</label>
              <input v-model.number="form.repeatTimes" type="number" min="0"
                class="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                placeholder="留空表示无限" />
            </div>
            <div>
              <label class="text-sm text-muted-foreground block mb-1">交付目标</label>
              <select v-model="form.deliver"
                class="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary">
                <option value="local">本地</option>
                <option value="origin">原始对话</option>
                <option value="telegram">Telegram</option>
                <option value="discord">Discord</option>
              </select>
            </div>
          </div>

          <div>
            <label class="text-sm text-muted-foreground block mb-1">绑定技能 (可选)</label>
            <input v-model="form.skillsInput" type="text"
              class="w-full bg-background border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
              placeholder="多个技能用逗号分隔, 例如: github-issues, plan" />
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button @click="closeModal"
            class="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors">
            取消
          </button>
          <button @click="saveJob"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            {{ editingJob ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Job Detail Modal -->
    <div v-if="selectedJob" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="selectedJob = null">
      <div class="glass-panel w-full max-w-2xl mx-4 p-6 rounded-2xl max-h-[80vh] overflow-y-auto">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold">{{ selectedJob.name || selectedJob.id }}</h3>
            <p class="text-sm text-muted-foreground mt-1">{{ selectedJob.schedule?.display }}</p>
          </div>
          <button @click="selectedJob = null" class="p-2 hover:bg-muted/50 rounded-lg">
            <X size="16" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <h4 class="text-sm font-medium text-muted-foreground mb-2">任务提示词</h4>
            <pre class="text-sm bg-muted/30 p-3 rounded-lg whitespace-pre-wrap">{{ selectedJob.prompt || '无' }}</pre>
          </div>

          <div v-if="selectedJob.skills?.length">
            <h4 class="text-sm font-medium text-muted-foreground mb-2">绑定技能</h4>
            <div class="flex flex-wrap gap-2">
              <span v-for="skill in selectedJob.skills" :key="skill"
                class="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                {{ skill }}
              </span>
            </div>
          </div>

          <div v-if="jobOutputs.length">
            <h4 class="text-sm font-medium text-muted-foreground mb-2">执行记录 (最近 {{ jobOutputs.length }} 次)</h4>
            <div class="space-y-2">
              <div v-for="output in jobOutputs" :key="output.timestamp"
                class="bg-muted/30 p-3 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-muted-foreground">{{ output.timestamp }}</span>
                </div>
                <pre class="text-xs whitespace-pre-wrap line-clamp-4">{{ output.preview || '无输出' }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Clock, Plus, Play, Pause, Rocket, Trash2, BookOpen, TerminalSquare, Repeat, X } from 'lucide-vue-next'

interface CronJob {
  id: string
  name?: string
  schedule: {
    kind: string
    display: string
    value?: string
  }
  prompt?: string
  skills?: string[]
  script?: string
  deliver?: string
  repeat?: {
    times?: number
    completed?: number
  }
  enabled?: boolean
  state?: string
  next_run_at?: string
  last_run_at?: string
  last_status?: string
}

const jobs = ref<CronJob[]>([])
const showCreateModal = ref(false)
const editingJob = ref<CronJob | null>(null)
const selectedJob = ref<CronJob | null>(null)
const jobOutputs = ref<any[]>([])

const form = ref({
  name: '',
  schedule: '',
  prompt: '',
  repeatTimes: null as number | null,
  deliver: 'local',
  skillsInput: ''
})

const loadJobs = async () => {
  try {
    const data = await $fetch('/api/cron')
    jobs.value = data.jobs || []
  } catch (e) {
    console.error('Failed to load jobs:', e)
  }
}

const selectJob = async (job: CronJob) => {
  selectedJob.value = job
  try {
    const data = await $fetch(`/api/cron?id=${job.id}`)
    jobOutputs.value = data.outputs || []
  } catch (e) {
    jobOutputs.value = []
  }
}

const getStateClass = (job: CronJob) => {
  if (job.enabled === false) return 'bg-yellow-500/20 text-yellow-400'
  if (job.state === 'completed') return 'bg-blue-500/20 text-blue-400'
  return 'bg-green-500/20 text-green-400'
}

const getStateLabel = (job: CronJob) => {
  if (job.enabled === false) return '已暂停'
  if (job.state === 'completed') return '已完成'
  return '运行中'
}

const toggleJob = async (job: CronJob) => {
  try {
    await $fetch('/api/cron', {
      method: 'PUT',
      body: {
        id: job.id,
        enabled: !job.enabled
      }
    })
    await loadJobs()
  } catch (e) {
    console.error('Failed to toggle job:', e)
  }
}

const runJob = async (job: CronJob) => {
  try {
    // Run job immediately via API
    await $fetch('/api/cron', {
      method: 'PUT',
      body: {
        id: job.id,
        run_now: true
      }
    })
    // Refresh to show updated status
    await loadJobs()
  } catch (e) {
    console.error('Failed to run job:', e)
  }
}

const deleteJob = async (job: CronJob) => {
  if (!confirm(`确定删除任务 "${job.name || job.id}"?`)) return
  
  try {
    await $fetch('/api/cron', {
      method: 'DELETE',
      body: { id: job.id }
    })
    await loadJobs()
  } catch (e) {
    console.error('Failed to delete job:', e)
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingJob.value = null
  form.value = {
    name: '',
    schedule: '',
    prompt: '',
    repeatTimes: null,
    deliver: 'local',
    skillsInput: ''
  }
}

const saveJob = async () => {
  if (!form.value.schedule || !form.value.prompt) {
    alert('请填写执行计划和任务提示词')
    return
  }

  const skills = form.value.skillsInput
    .split(',')
    .map(s => s.trim())
    .filter(s => s)

  const payload: any = {
    name: form.value.name,
    schedule: form.value.schedule,
    prompt: form.value.prompt,
    deliver: form.value.deliver,
    skills
  }

  if (form.value.repeatTimes) {
    payload.repeat = { times: form.value.repeatTimes }
  }

  try {
    if (editingJob.value) {
      payload.id = editingJob.value.id
      await $fetch('/api/cron', {
        method: 'PUT',
        body: payload
      })
    } else {
      await $fetch('/api/cron', {
        method: 'POST',
        body: payload
      })
    }
    closeModal()
    await loadJobs()
  } catch (e) {
    console.error('Failed to save job:', e)
    alert('保存失败')
  }
}

onMounted(() => {
  loadJobs()
  // Refresh every 30 seconds
  setInterval(loadJobs, 30000)
})
</script>
