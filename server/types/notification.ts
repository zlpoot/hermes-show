/**
 * 通知系统类型定义
 */

export type NotificationLevel = 'critical' | 'error' | 'warning' | 'info'
export type NotificationPlatform = 'discord' | 'telegram' | 'weixin'

/**
 * 通知频道
 */
export interface NotificationChannel {
  id: string
  name: string
  platform: NotificationPlatform
  channel_id: string
  events: string[]  // 支持通配符，如 '*' 匹配所有，'error:*' 匹配所有错误
  enabled: boolean
  webhook_url?: string  // Telegram/微信用
}

/**
 * 通知事件
 */
export interface NotificationEvent {
  type: string           // 事件类型，如 'cron_failed', 'task_complete'
  title: string          // 标题
  message: string        // 消息内容
  level?: NotificationLevel  // 可选，不填则根据 event_types 自动推断
  source?: string        // 来源，如 'hermes-agent', 'cron-job-1'
  details?: any          // 详细信息
  suggestion?: string    // 建议操作
  mention?: 'here' | 'everyone'  // 是否提及
}

/**
 * 通知配置
 */
export interface NotificationConfig {
  channels: NotificationChannel[]
  event_types: {
    critical: string[]
    error: string[]
    warning: string[]
    info: string[]
  }
}

/**
 * 通知历史记录
 */
export interface NotificationHistoryEntry {
  timestamp: string
  event: NotificationEvent
  channels: Array<{
    id: string
    name: string
    success: boolean
    error?: string
  }>
}
