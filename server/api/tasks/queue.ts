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

function saveData(data: TaskQueue) {
  writeFileSync(dataFile, JSON.stringify(data, null, 2))
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const query = getQuery(event)
  
  if (method === 'GET') {
    const data = getData()
    const status = query.status as string
    const priority = query.priority as string
    const search = query.search as string
    const page = parseInt(query.page as string) || 1
    const pageSize = parseInt(query.pageSize as string) || 20
    
    let filtered = data.tasks
    
    if (status && status !== 'all') {
      filtered = filtered.filter(t => t.status === status)
    }
    if (priority && priority !== 'all') {
      filtered = filtered.filter(t => t.priority === parseInt(priority))
    }
    if (search) {
      const s = search.toLowerCase()
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(s) || 
        (t.description && t.description.toLowerCase().includes(s))
      )
    }
    
    // Sort by priority then created_at
    filtered.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    
    const total = filtered.length
    const totalPages = Math.ceil(total / pageSize)
    const offset = (page - 1) * pageSize
    const paged = filtered.slice(offset, offset + pageSize)
    
    return {
      tasks: paged,
      total,
      page,
      pageSize,
      totalPages
    }
  }
  
  if (method === 'POST') {
    const body = await readBody(event)
    const data = getData()
    
    const task: Task = {
      id: data.nextId,
      title: body.title,
      description: body.description || '',
      status: 'pending',
      priority: body.priority || 5,
      parent_id: body.parent_id,
      notify_discord: body.notify_discord !== false,
      created_at: new Date().toISOString()
    }
    
    data.tasks.push(task)
    data.nextId++
    saveData(data)
    
    return { success: true, taskId: task.id }
  }
  
  if (method === 'PUT') {
    const body = await readBody(event)
    const data = getData()
    
    const task = data.tasks.find(t => t.id === body.id)
    if (!task) {
      return { error: 'Task not found' }
    }
    
    if (body.title) task.title = body.title
    if (body.status) {
      task.status = body.status
      if (body.status === 'in_progress') {
        task.started_at = new Date().toISOString()
      } else if (body.status === 'completed' || body.status === 'failed') {
        task.completed_at = new Date().toISOString()
        if (body.result) task.result = body.result
      }
    }
    if (body.priority) task.priority = body.priority
    
    saveData(data)
    return { success: true }
  }
  
  if (method === 'DELETE') {
    const id = parseInt(query.id as string)
    const data = getData()
    
    const index = data.tasks.findIndex(t => t.id === id)
    if (index === -1) {
      return { error: 'Task not found' }
    }
    
    if (data.tasks[index].status === 'in_progress') {
      return { error: 'Cannot delete running task' }
    }
    
    data.tasks.splice(index, 1)
    saveData(data)
    return { success: true }
  }
  
  return { error: 'Method not allowed' }
})
