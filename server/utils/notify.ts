import fs from 'node:fs'
import path from 'node:path'
import { getHermesPath } from './hermes'

// 通知频道配置类型定义
export interface NotificationChannel {
  type: 'discord' | 'telegram' | 'weixin'
  name: string
  description?: string
  channelId?: string
  webhookUrl?: string
  events: string[]
  enabled: boolean
  status: 'healthy' | 'degraded' | 'error'
}

export interface NotificationConfig {
  channels: Record<string, NotificationChannel>
  defaultChannel: string
  eventRouting: Record<string, string>
  severityOverrides: Record<string, string>
}

export interface NotifyRequest {
  event: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  channels?: string[]
  metadata?: Record<string, any>
}

export interface NotifyResult {
  success: boolean
  event: string
  severity: string
  routedChannels: string[]
  results: Array<{ success: boolean; channel: string; error?: string }>
  summary: {
    total: number
    succeeded: number
    failed: number
  }
}

/**
 * 加载通知频道配置
 */
export function loadNotificationConfig(): NotificationConfig {
  const configPath = path.join(getHermesPath(), 'notification_channels.json')
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8')
      return JSON.parse(content)
    }
  } catch (e) {
    console.error('[notify] Failed to load notification_channels.json', e)
  }
  
  // 返回默认配置
  return {
    channels: {},
    defaultChannel: '',
    eventRouting: {},
    severityOverrides: {}
  }
}

/**
 * 保存通知频道配置
 */
export function saveNotificationConfig(config: NotificationConfig): boolean {
  const configPath = path.join(getHermesPath(), 'notification_channels.json')
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    return true
  } catch (e) {
    console.error('[notify] Failed to save notification_channels.json', e)
    return false
  }
}

/**
 * 根据事件类型路由到频道
 */
export function routeEventToChannel(event: string, severity: string, config: NotificationConfig): string[] {
  // 1. 严重性覆盖
  if (config.severityOverrides[severity]) {
    return [config.severityOverrides[severity]]
  }
  
  // 2. 事件路由映射
  if (config.eventRouting[event]) {
    return [config.eventRouting[event]]
  }
  
  // 3. 默认频道
  if (config.defaultChannel) {
    return [config.defaultChannel]
  }
  
  return []
}

/**
 * 发送Discord通知
 */
async function sendDiscordNotification(
  channel: NotificationChannel,
  request: NotifyRequest
): Promise<{ success: boolean; error?: string }> {
  if (!channel.webhookUrl && !channel.channelId) {
    return { success: false, error: 'No webhook URL or channel ID configured' }
  }
  
  try {
    // 构建Discord embed消息
    const colorMap: Record<string, number> = {
      info: 0x3498db,      // 蓝色
      warning: 0xf39c12,   // 橙色
      error: 0xe74c3c,     // 红色
      critical: 0x9b59b6   // 紫色
    }
    
    const embed: any = {
      title: request.title,
      description: request.message,
      color: colorMap[request.severity] || 0x3498db,
      timestamp: new Date().toISOString(),
      footer: {
        text: `Hermes Agent • ${request.event}`
      }
    }
    
    // 添加metadata字段
    if (request.metadata && Object.keys(request.metadata).length > 0) {
      embed.fields = Object.entries(request.metadata)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => ({
          name: key,
          value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
          inline: true
        }))
    }
    
    const payload = {
      embeds: [embed]
    }
    
    // 使用webhook发送
    if (channel.webhookUrl) {
      const response = await fetch(channel.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const text = await response.text()
        return { success: false, error: `Discord API error: ${response.status} ${text}` }
      }
      
      return { success: true }
    }
    
    // 如果只有channelId，暂时返回错误（需要bot token支持）
    return { success: false, error: 'Webhook URL required for Discord notifications' }
  } catch (e: any) {
    return { success: false, error: e.message || 'Unknown error' }
  }
}

/**
 * 发送Telegram通知
 */
async function sendTelegramNotification(
  channel: NotificationChannel,
  request: NotifyRequest
): Promise<{ success: boolean; error?: string }> {
  // TODO: 实现Telegram通知
  return { success: false, error: 'Telegram notifications not yet implemented' }
}

/**
 * 发送微信通知
 */
async function sendWeixinNotification(
  channel: NotificationChannel,
  request: NotifyRequest
): Promise<{ success: boolean; error?: string }> {
  // TODO: 实现微信通知
  return { success: false, error: 'WeChat notifications not yet implemented' }
}

/**
 * 发送通知到指定频道
 */
async function sendNotificationToChannel(
  channelId: string,
  request: NotifyRequest,
  config: NotificationConfig
): Promise<{ success: boolean; channel: string; error?: string }> {
  const channel = config.channels[channelId]
  
  if (!channel) {
    return { success: false, channel: channelId, error: 'Channel not found' }
  }
  
  if (!channel.enabled) {
    return { success: false, channel: channelId, error: 'Channel is disabled' }
  }
  
  // 根据频道类型发送
  switch (channel.type) {
    case 'discord':
      return { ...await sendDiscordNotification(channel, request), channel: channelId }
    case 'telegram':
      return { ...await sendTelegramNotification(channel, request), channel: channelId }
    case 'weixin':
      return { ...await sendWeixinNotification(channel, request), channel: channelId }
    default:
      return { success: false, channel: channelId, error: 'Unknown channel type' }
  }
}

/**
 * 发送通知 (核心函数)
 * 
 * 用法示例:
 * ```typescript
 * import { notify } from '~/server/utils/notify'
 * 
 * // 任务完成通知
 * await notify({
 *   event: 'task_complete',
 *   severity: 'info',
 *   title: '任务完成',
 *   message: `任务 #${taskId} 已成功完成`,
 *   metadata: { taskId, duration: '5m' }
 * })
 * 
 * // 错误告警
 * await notify({
 *   event: 'error',
 *   severity: 'error',
 *   title: 'API错误',
 *   message: '模型调用失败',
 *   metadata: { error: error.message }
 * })
 * ```
 */
export async function notify(request: NotifyRequest): Promise<NotifyResult> {
  // 验证请求
  if (!request.event || !request.title || !request.message) {
    return {
      success: false,
      event: request.event || '',
      severity: request.severity || 'info',
      routedChannels: [],
      results: [],
      summary: { total: 0, succeeded: 0, failed: 0 }
    }
  }
  
  // 默认严重性
  if (!request.severity || !['info', 'warning', 'error', 'critical'].includes(request.severity)) {
    request.severity = 'info'
  }
  
  // 加载配置
  const config = loadNotificationConfig()
  
  // 确定目标频道
  let targetChannels = request.channels
  
  if (!targetChannels || targetChannels.length === 0) {
    // 根据事件类型自动路由
    targetChannels = routeEventToChannel(request.event, request.severity, config)
  }
  
  if (targetChannels.length === 0) {
    return {
      success: false,
      event: request.event,
      severity: request.severity,
      routedChannels: [],
      results: [],
      summary: { total: 0, succeeded: 0, failed: 0 }
    }
  }
  
  // 发送通知到所有目标频道
  const results = await Promise.all(
    targetChannels.map(channelId => 
      sendNotificationToChannel(channelId, request, config)
    )
  )
  
  // 统计结果
  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length
  
  return {
    success: successCount > 0,
    event: request.event,
    severity: request.severity,
    routedChannels: targetChannels,
    results: results,
    summary: {
      total: results.length,
      succeeded: successCount,
      failed: failCount
    }
  }
}

/**
 * 快捷方法：任务完成通知
 */
export async function notifyTaskComplete(taskId: number, title: string, result?: string, metadata?: Record<string, any>): Promise<NotifyResult> {
  return notify({
    event: 'task_complete',
    severity: 'info',
    title: `任务完成 #${taskId}`,
    message: `**${title}**\n${result || '任务已成功完成'}`,
    metadata: { taskId, ...metadata }
  })
}

/**
 * 快捷方法：任务失败通知
 */
export async function notifyTaskFailed(taskId: number, title: string, error: string, metadata?: Record<string, any>): Promise<NotifyResult> {
  return notify({
    event: 'task_failed',
    severity: 'error',
    title: `任务失败 #${taskId}`,
    message: `**${title}**\n错误: ${error}`,
    metadata: { taskId, error, ...metadata }
  })
}

/**
 * 快捷方法：网关状态通知
 */
export async function notifyGatewayStatus(platform: string, status: 'connected' | 'disconnected' | 'error', message?: string, metadata?: Record<string, any>): Promise<NotifyResult> {
  const severity = status === 'connected' ? 'info' : status === 'error' ? 'error' : 'warning'
  return notify({
    event: 'gateway',
    severity,
    title: `Gateway ${status === 'connected' ? '已连接' : status === 'error' ? '错误' : '已断开'}`,
    message: `平台: **${platform}**\n${message || ''}`,
    metadata: { platform, status, ...metadata }
  })
}

/**
 * 快捷方法：系统事件通知
 */
export async function notifySystemEvent(eventType: string, title: string, message: string, metadata?: Record<string, any>): Promise<NotifyResult> {
  return notify({
    event: eventType,
    severity: 'info',
    title,
    message,
    metadata
  })
}
