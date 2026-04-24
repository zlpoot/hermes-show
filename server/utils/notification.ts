import type { NotificationChannel, NotificationConfig, NotificationEvent, NotificationLevel } from '../types/notification'
import { getHermesPath } from './hermes'
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'yaml'
import { $fetch } from 'ofetch'

// Discord API URL
const DISCORD_API = 'https://discord.com/api/v10'

// 级别图标映射
const LEVEL_ICONS: Record<NotificationLevel, string> = {
  critical: '🚨',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️'
}

// 级别颜色映射 (Discord embed color)
const LEVEL_COLORS: Record<NotificationLevel, number> = {
  critical: 0xDC2626, // red-600
  error: 0xEF4444,    // red-500
  warning: 0xF59E0B,  // amber-500
  info: 0x3B82F6      // blue-500
}

/**
 * 加载通知配置
 */
export function loadNotificationConfig(): NotificationConfig {
  const configPath = path.join(getHermesPath(), 'notification_channels.json')
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8')
      return JSON.parse(content)
    }
  } catch (e) {
    console.error('[notification] Failed to load config', e)
  }
  
  // 返回默认配置
  return {
    channels: [],
    event_types: {
      critical: ['system_down', 'gateway_failed', 'budget_exceeded'],
      error: ['api_error', 'task_failed', 'cron_failed'],
      warning: ['budget_warning', 'rate_limit', 'disk_space'],
      info: ['task_complete', 'cron_complete', 'backup_complete']
    }
  }
}

/**
 * 保存通知配置
 */
export function saveNotificationConfig(config: NotificationConfig): boolean {
  const configPath = path.join(getHermesPath(), 'notification_channels.json')
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    return true
  } catch (e) {
    console.error('[notification] Failed to save config', e)
    return false
  }
}

/**
 * 从 config.yaml 读取 Discord Bot Token
 */
export function getDiscordToken(): string | null {
  const configPath = path.join(getHermesPath(), 'config.yaml')
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8')
      const config = yaml.parse(content)
      return config?.platforms?.discord?.token || null
    }
  } catch (e) {
    console.error('[notification] Failed to load config.yaml', e)
  }
  return null
}

/**
 * 获取事件级别
 */
export function getEventLevel(event: string): NotificationLevel {
  const config = loadNotificationConfig()
  
  for (const [level, events] of Object.entries(config.event_types)) {
    if ((events as string[]).includes(event)) {
      return level as NotificationLevel
    }
  }
  
  // 默认为 info
  return 'info'
}

/**
 * 匹配频道（支持通配符）
 */
export function matchChannels(event: string): NotificationChannel[] {
  const config = loadNotificationConfig()
  const matchedChannels: NotificationChannel[] = []
  
  for (const channel of config.channels) {
    if (!channel.enabled) continue
    
    // 检查事件匹配
    for (const pattern of channel.events) {
      if (pattern === '*') {
        matchedChannels.push(channel)
        break
      }
      
      // 支持通配符匹配，如 error:* 匹配所有 error 级别事件
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$')
        if (regex.test(event)) {
          matchedChannels.push(channel)
          break
        }
      } else if (pattern === event) {
        matchedChannels.push(channel)
        break
      }
    }
  }
  
  return matchedChannels
}

/**
 * 格式化 Discord 消息
 */
export function formatDiscordMessage(event: NotificationEvent): any {
  const level = event.level || getEventLevel(event.type)
  const icon = LEVEL_ICONS[level]
  const color = LEVEL_COLORS[level]
  
  const embed: any = {
    title: `${icon} ${event.title}`,
    description: event.message,
    color: color,
    timestamp: new Date().toISOString(),
    fields: []
  }
  
  // 添加来源
  if (event.source) {
    embed.fields.push({
      name: '来源',
      value: event.source,
      inline: true
    })
  }
  
  // 添加详情
  if (event.details) {
    embed.fields.push({
      name: '详情',
      value: typeof event.details === 'string' 
        ? event.details 
        : '```json\n' + JSON.stringify(event.details, null, 2) + '\n```',
      inline: false
    })
  }
  
  // 添加建议
  if (event.suggestion) {
    embed.fields.push({
      name: '建议操作',
      value: event.suggestion,
      inline: false
    })
  }
  
  // 添加 Footer
  embed.footer = {
    text: `事件类型: ${event.type}`
  }
  
  // 构建消息内容
  let content = ''
  if (event.mention === 'here') {
    content = '@here '
  } else if (event.mention === 'everyone') {
    content = '@everyone '
  }
  
  return {
    content: content || undefined,
    embeds: [embed]
  }
}

/**
 * 发送 Discord 通知
 */
export async function sendDiscordNotification(
  channelId: string,
  message: any
): Promise<{ success: boolean; error?: string }> {
  const token = getDiscordToken()
  if (!token) {
    return { success: false, error: 'Discord Bot Token not configured' }
  }
  
  try {
    // 检测代理
    const proxy = process.env.ALL_PROXY || process.env.HTTPS_PROXY || process.env.https_proxy
    
    let fetchOptions: any = {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    }
    
    // 如果有代理，使用 node-fetch 的 agent
    if (proxy) {
      const { ProxyAgent } = await import('undici')
      fetchOptions.dispatcher = new ProxyAgent(proxy)
    }
    
    const response = await $fetch(`${DISCORD_API}/channels/${channelId}/messages`, fetchOptions)
    
    return { success: true }
  } catch (error: any) {
    console.error('[notification] Discord API error:', error)
    return { 
      success: false, 
      error: error.message || 'Unknown error' 
    }
  }
}

/**
 * 发送通知到所有匹配的频道
 */
export async function sendNotification(event: NotificationEvent): Promise<{
  success: boolean
  sent: number
  failed: number
  channels: Array<{ id: string; name: string; success: boolean; error?: string }>
}> {
  const channels = matchChannels(event.type)
  const results: Array<{ id: string; name: string; success: boolean; error?: string }> = []
  
  for (const channel of channels) {
    if (channel.platform === 'discord') {
      const message = formatDiscordMessage(event)
      const result = await sendDiscordNotification(channel.channel_id, message)
      
      results.push({
        id: channel.id,
        name: channel.name,
        success: result.success,
        error: result.error
      })
    }
    // 可以扩展其他平台
  }
  
  // 记录历史
  await recordHistory(event, results)
  
  return {
    success: results.every(r => r.success),
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    channels: results
  }
}

/**
 * 记录通知历史
 */
async function recordHistory(
  event: NotificationEvent,
  results: Array<{ id: string; name: string; success: boolean; error?: string }>
): Promise<void> {
  const historyPath = path.join(getHermesPath(), 'notification_history.json')
  
  let history: any = { history: [] }
  try {
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'))
    }
  } catch (e) {
    // 忽略错误，使用空历史
  }
  
  history.history.unshift({
    timestamp: new Date().toISOString(),
    event,
    channels: results
  })
  
  // 只保留最近 100 条
  if (history.history.length > 100) {
    history.history = history.history.slice(0, 100)
  }
  
  try {
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8')
  } catch (e) {
    console.error('[notification] Failed to save history', e)
  }
}

/**
 * 获取通知历史
 */
export function getNotificationHistory(limit: number = 50): any[] {
  const historyPath = path.join(getHermesPath(), 'notification_history.json')
  
  try {
    if (fs.existsSync(historyPath)) {
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'))
      return history.history.slice(0, limit)
    }
  } catch (e) {
    console.error('[notification] Failed to load history', e)
  }
  
  return []
}
