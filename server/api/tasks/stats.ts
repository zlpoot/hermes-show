import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const dataFile = join(process.env.HOME || '/home/zlpoot', '.hermes', 'task_queue.json')

interface Task {
  id: number
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  priority: number
  parent_id?: number
  notify_discord: boolean
  created_at: string
  started_at?: string
  completed_at?: string
  result?: string
}

interface TaskQueue {
  tasks: Task[]
  currentTaskId: number | null
  nextId: number
}

function getData(): TaskQueue {
  if (!existsSync(dataFile)) {
    const initial: TaskQueue = { tasks: [], currentTaskId: null, nextId: 1 }
    writeFileSync(dataFile, JSON.stringify(initial, null, 2))
    return initial
  }
  return JSON.parse(readFileSync(dataFile, 'utf-8'))
}

export default defineEventHandler(() => {
  const data = getData()
  
  const stats = {
    pending: data.tasks.filter(t => t.status === 'pending').length,
    in_progress: data.tasks.filter(t => t.status === 'in_progress').length,
    completed: data.tasks.filter(t => t.status === 'completed').length,
    failed: data.tasks.filter(t => t.status === 'failed').length,
    cancelled: data.tasks.filter(t => t.status === 'cancelled').length,
    total: data.tasks.length,
    currentTask: null as any
  }
  
  const current = data.tasks.find(t => t.status === 'in_progress')
  if (current) {
    let duration = 0
    if (current.started_at) {
      duration = Math.round((Date.now() - new Date(current.started_at).getTime()) / 60000)
    }
    stats.currentTask = {
      id: current.id,
      title: current.title,
      started_at: current.started_at,
      duration
    }
  }
  
  return stats
})
