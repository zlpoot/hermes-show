import { execSync } from 'node:child_process'
import path from 'node:path'
import { getHermesPath } from './hermes'

const DB_PATH = path.join(getHermesPath(), 'state.db')

/**
 * 执行 SQL 查询并返回结果
 */
function query<T = any>(sql: string, params: any[] = []): T[] {
  const paramsStr = params.length > 0 
    ? params.map(p => {
        if (p === null || p === undefined) return 'NULL'
        if (typeof p === 'string') return `'${p.replace(/'/g, "''")}'`
        return String(p)
      }).join(', ')
    : ''
  
  const fullSql = params.length > 0 
    ? sql.replace(/\?/g, () => params.shift() ?? 'NULL')
    : sql
  
  try {
    const result = execSync(
      `sqlite3 "${DB_PATH}" -json "${fullSql.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', timeout: 5000 }
    )
    return result.trim() ? JSON.parse(result) : []
  } catch (error) {
    console.error('SQL Error:', error)
    return []
  }
}

/**
 * 执行 SQL 命令（INSERT/UPDATE/DELETE）
 */
function run(sql: string, params: any[] = []): { changes: number, lastInsertRowid: number } {
  // 替换参数
  let finalSql = sql
  const paramsCopy = [...params]
  finalSql = sql.replace(/\?/g, () => {
    const p = paramsCopy.shift()
    if (p === null || p === undefined) return 'NULL'
    if (typeof p === 'string') return `'${p.replace(/'/g, "''")}'`
    return String(p)
  })
  
  try {
    execSync(
      `sqlite3 "${DB_PATH}" "${finalSql.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', timeout: 5000 }
    )
    
    // 获取 lastInsertRowid
    const lastIdResult = execSync(
      `sqlite3 "${DB_PATH}" "SELECT last_insert_rowid();"`,
      { encoding: 'utf-8', timeout: 5000 }
    )
    
    return { 
      changes: 1, 
      lastInsertRowid: parseInt(lastIdResult.trim()) || 0 
    }
  } catch (error) {
    console.error('SQL Error:', error)
    return { changes: 0, lastInsertRowid: 0 }
  }
}

// ============ Task 类型定义 ============

export interface Task {
  id: number
  title: string
  description: string | null
  type: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  priority: number
  parent_id: number | null
  notify_channels: string[]
  notify_discord: boolean
  created_at: string
  started_at: string | null
  completed_at: string | null
  result: string | null
}

// ============ Task 操作函数 ============

/**
 * 解析任务数据（处理 JSON 字段）
 */
function parseTask(task: any): Task {
  return {
    ...task,
    notify_channels: task.notify_channels ? JSON.parse(task.notify_channels) : [],
    notify_discord: task.notify_discord === 1 || task.notify_discord === true
  }
}

/**
 * 获取所有任务
 */
export function getAllTasks(): Task[] {
  const tasks = query<any>('SELECT * FROM tasks ORDER BY priority, created_at DESC')
  return tasks.map(parseTask)
}

/**
 * 根据 ID 获取任务
 */
export function getTaskById(id: number): Task | null {
  const tasks = query<any>(`SELECT * FROM tasks WHERE id = ${id}`)
  return tasks[0] ? parseTask(tasks[0]) : null
}

/**
 * 创建任务
 */
export function createTask(data: {
  title: string
  description?: string
  type?: string
  status?: string
  priority?: number
  parent_id?: number
  notify_channels?: string[]
  notify_discord?: boolean
}): Task {
  const now = new Date().toISOString()
  const result = run(
    `INSERT INTO tasks (title, description, type, status, priority, parent_id, notify_channels, notify_discord, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.description || null,
      data.type || 'general',
      data.status || 'pending',
      data.priority || 3,
      data.parent_id || null,
      data.notify_channels ? JSON.stringify(data.notify_channels) : null,
      data.notify_discord !== undefined ? (data.notify_discord ? 1 : 0) : 1,
      now
    ]
  )
  
  return getTaskById(result.lastInsertRowid)!
}

/**
 * 更新任务
 */
export function updateTask(id: number, data: Partial<Task>): Task | null {
  const updates: string[] = []
  const values: any[] = []
  
  const allowedFields = ['title', 'description', 'type', 'status', 'priority', 'parent_id', 'notify_channels', 'notify_discord', 'started_at', 'completed_at', 'result']
  
  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`)
      values.push(value)
    }
  }
  
  if (updates.length === 0) return getTaskById(id)
  
  run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ${id}`, values)
  return getTaskById(id)
}

/**
 * 删除任务
 */
export function deleteTask(id: number): boolean {
  run(`DELETE FROM tasks WHERE id = ${id}`)
  return true
}

/**
 * 获取任务统计
 */
export function getTaskStats(): {
  pending: number
  in_progress: number
  completed: number
  failed: number
  cancelled: number
  total: number
} {
  const stats = query<{ status: string, count: number }>(
    'SELECT status, COUNT(*) as count FROM tasks GROUP BY status'
  )
  
  const result = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    total: 0
  }
  
  for (const row of stats) {
    result[row.status as keyof typeof result] = row.count
    result.total += row.count
  }
  
  return result
}

/**
 * 获取正在执行的任务
 */
export function getInProgressTask(): Task | null {
  const tasks = query<Task>("SELECT * FROM tasks WHERE status = 'in_progress' LIMIT 1")
  return tasks[0] || null
}
