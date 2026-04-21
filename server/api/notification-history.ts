import fs from 'node:fs'
import path from 'node:path'
import { getHermesPath } from '../utils/hermes'

// 通知历史记录类型
interface NotificationHistory {
  id: string
  timestamp: number
  event: string
  severity: string
  title: string
  message: string
  channelId: string
  channelName: string
  channelType: string
  status: 'sent' | 'failed'
  error?: string
  metadata?: Record<string, any>
}

// 历史记录文件路径
function getHistoryPath(): string {
  return path.join(getHermesPath(), 'notification_history.json')
}

// 加载历史记录
function loadHistory(): NotificationHistory[] {
  const historyPath = getHistoryPath()
  try {
    if (fs.existsSync(historyPath)) {
      const content = fs.readFileSync(historyPath, 'utf-8')
      return JSON.parse(content)
    }
  } catch (e) {
    console.error('[notification-history] Failed to load history', e)
  }
  return []
}

// 保存历史记录
function saveHistory(history: NotificationHistory[]): void {
  const historyPath = getHistoryPath()
  try {
    // 只保留最近1000条记录
    const trimmed = history.slice(-1000)
    fs.writeFileSync(historyPath, JSON.stringify(trimmed, null, 2), 'utf-8')
  } catch (e) {
    console.error('[notification-history] Failed to save history', e)
  }
}

// 添加历史记录
export function addNotificationHistory(record: Omit<NotificationHistory, 'id' | 'timestamp'>): void {
  const history = loadHistory()
  history.push({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    ...record
  })
  saveHistory(history)
}

// GET /api/notification-history - 查询通知历史
export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const query = getQuery(event)
  
  if (method === 'GET') {
    let history = loadHistory()
    
    // 按频道筛选
    if (query.channelId) {
      history = history.filter(h => h.channelId === query.channelId)
    }
    
    // 按事件类型筛选
    if (query.eventType) {
      history = history.filter(h => h.event === query.eventType)
    }
    
    // 按状态筛选
    if (query.status) {
      history = history.filter(h => h.status === query.status)
    }
    
    // 按时间范围筛选
    if (query.since) {
      const since = Number(query.since)
      history = history.filter(h => h.timestamp >= since)
    }
    
    if (query.until) {
      const until = Number(query.until)
      history = history.filter(h => h.timestamp <= until)
    }
    
    // 按时间倒序排列
    history.sort((a, b) => b.timestamp - a.timestamp)
    
    // 分页
    const limit = Number(query.limit) || 50
    const offset = Number(query.offset) || 0
    const paginated = history.slice(offset, offset + limit)
    
    // 格式化时间
    const formatted = paginated.map(h => ({
      ...h,
      time: new Date(h.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      date: new Date(h.timestamp).toLocaleDateString('zh-CN'),
      datetime: new Date(h.timestamp).toLocaleString('zh-CN')
    }))
    
    return {
      success: true,
      history: formatted,
      pagination: {
        total: history.length,
        limit,
        offset,
        hasMore: offset + limit < history.length
      },
      stats: {
        total: history.length,
        sent: history.filter(h => h.status === 'sent').length,
        failed: history.filter(h => h.status === 'failed').length,
        byChannel: history.reduce((acc, h) => {
          acc[h.channelId] = (acc[h.channelId] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byEvent: history.reduce((acc, h) => {
          acc[h.event] = (acc[h.event] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }
  }
  
  if (method === 'DELETE') {
    // 清空历史
    if (query.clear === 'true') {
      saveHistory([])
      return {
        success: true,
        message: 'History cleared'
      }
    }
    
    // 删除特定记录
    if (query.id) {
      const history = loadHistory()
      const filtered = history.filter(h => h.id !== query.id)
      saveHistory(filtered)
      return {
        success: true,
        message: 'Record deleted',
        deletedId: query.id
      }
    }
    
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing query parameter: clear or id'
    })
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})
