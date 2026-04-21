import { 
  getAllTasks, 
  getTaskById, 
  createTask, 
  updateTask, 
  deleteTask, 
  Task 
} from '../../utils/db'
import { 
  notifyTaskComplete, 
  notifyTaskFailed, 
  loadNotificationConfig 
} from '../../utils/notify'

/**
 * 解析任务的通知频道配置
 */
function resolveNotifyChannels(task: Task): string[] {
  if (task.notify_channels && task.notify_channels.length > 0) {
    return task.notify_channels
  }
  
  if (task.notify_discord !== false) {
    const config = loadNotificationConfig()
    if (config.eventRouting['task_complete']) {
      return [config.eventRouting['task_complete']]
    }
    if (config.defaultChannel) {
      return [config.defaultChannel]
    }
  }
  
  return []
}

/**
 * 发送任务完成通知
 */
async function sendTaskCompletionNotification(task: Task) {
  const channels = resolveNotifyChannels(task)
  if (channels.length === 0) return
  
  const duration = task.started_at && task.completed_at
    ? Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 60000)
    : 0
  
  await notifyTaskComplete({
    taskId: task.id,
    title: task.title,
    result: task.result || '任务已成功完成',
    duration: duration > 0 ? `${duration} 分钟` : '未知',
    channels
  })
}

/**
 * 发送任务失败通知
 */
async function sendTaskFailureNotification(task: Task) {
  const channels = resolveNotifyChannels(task)
  if (channels.length === 0) return
  
  await notifyTaskFailed({
    taskId: task.id,
    title: task.title,
    error: task.result || '未知错误',
    channels
  })
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const query = getQuery(event)
  
  // GET - 获取任务列表
  if (method === 'GET') {
    const status = query.status as string
    const priority = query.priority as string
    const search = query.search as string
    const page = parseInt(query.page as string) || 1
    const pageSize = parseInt(query.pageSize as string) || 20
    
    let tasks = getAllTasks()
    
    // 过滤
    if (status && status !== 'all') {
      tasks = tasks.filter(t => t.status === status)
    }
    if (priority && priority !== 'all') {
      tasks = tasks.filter(t => t.priority === parseInt(priority))
    }
    if (search) {
      const s = search.toLowerCase()
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(s) || 
        (t.description && t.description.toLowerCase().includes(s))
      )
    }
    
    // 排序
    tasks.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    
    // 分页
    const total = tasks.length
    const totalPages = Math.ceil(total / pageSize)
    const offset = (page - 1) * pageSize
    const paged = tasks.slice(offset, offset + pageSize)
    
    return {
      tasks: paged,
      total,
      page,
      pageSize,
      totalPages
    }
  }
  
  // POST - 创建任务
  if (method === 'POST') {
    const body = await readBody(event)
    
    const result = createTask({
      title: body.title,
      description: body.description || '',
      status: 'pending',
      priority: body.priority || 5,
      parent_id: body.parent_id,
      notify_channels: body.notify_channels || [],
      notify_discord: body.notify_discord !== false
    })
    
    return { success: true, taskId: result.id }
  }
  
  // PUT - 更新任务
  if (method === 'PUT') {
    const body = await readBody(event)
    
    const task = getTaskById(body.id)
    if (!task) {
      return { error: 'Task not found' }
    }
    
    const updates: Partial<Task> = {}
    
    if (body.title) updates.title = body.title
    if (body.status) {
      updates.status = body.status
      if (body.status === 'in_progress') {
        updates.started_at = new Date().toISOString()
      } else if (body.status === 'completed' || body.status === 'failed') {
        updates.completed_at = new Date().toISOString()
        if (body.result) updates.result = body.result
        
        // 异步发送通知
        const updatedTask = { ...task, ...updates, result: body.result }
        if (body.status === 'completed') {
          sendTaskCompletionNotification(updatedTask as Task).catch(e => 
            console.error('[task-queue] Failed to send completion notification:', e)
          )
        } else if (body.status === 'failed') {
          sendTaskFailureNotification(updatedTask as Task).catch(e => 
            console.error('[task-queue] Failed to send failure notification:', e)
          )
        }
      }
    }
    if (body.priority) updates.priority = body.priority
    if (body.notify_channels) updates.notify_channels = body.notify_channels
    if (body.notify_discord !== undefined) updates.notify_discord = body.notify_discord
    if (body.result) updates.result = body.result
    
    const success = updateTask(body.id, updates)
    return { success }
  }
  
  // DELETE - 删除任务
  if (method === 'DELETE') {
    const id = parseInt(query.id as string)
    
    const task = getTaskById(id)
    if (!task) {
      return { error: 'Task not found' }
    }
    
    if (task.status === 'in_progress') {
      return { error: 'Cannot delete running task' }
    }
    
    const success = deleteTask(id)
    return { success }
  }
  
  return { error: 'Method not allowed' }
})
