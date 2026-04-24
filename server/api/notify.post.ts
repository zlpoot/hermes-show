import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { getHermesPath, getHermesConfig } from '../utils/hermes'

// 通知频道配置类型定义
interface NotificationChannel {
  type: 'discord' | 'telegram' | 'weixin'
  name: string
  description?: string
  channelId?: string
  webhookUrl?: string
  events: string[]
  enabled: boolean
  status: 'healthy' | 'degraded' | 'error'
}

interface NotificationConfig {
  channels: Record<string, NotificationChannel>
  defaultChannel: string
  eventRouting: Record<string, string>
  severityOverrides: Record<string, string>
}

interface NotifyRequest {
  event: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  channels?: string[]
  metadata?: Record<string, any>
}

// 加载频道配置
function loadNotificationConfig(): NotificationConfig {
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

// 保存频道配置
function saveNotificationConfig(config: NotificationConfig): boolean {
  const configPath = path.join(getHermesPath(), 'notification_channels.json')
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    return true
  } catch (e) {
    console.error('[notify] Failed to save notification_channels.json', e)
    return false
  }
}

// 根据事件类型路由到频道
function routeEventToChannel(event: string, severity: string, config: NotificationConfig): string[] {
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

// Discord Bot Token 从 config.yaml 获取
function getDiscordConfig() {
  const config = getHermesConfig()
  
  // 从 config.yaml 的 platforms.discord.token 获取
  const botToken = config?.platforms?.discord?.token || ''
  
  // 代理配置（如果需要）
  const proxy = config?.discord?.proxy || process.env.DISCORD_PROXY || ''
  
  return { botToken, proxy }
}

// 发送Discord通知
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
    
    const embed = {
      title: request.title,
      description: request.message,
      color: colorMap[request.severity] || 0x3498db,
      timestamp: new Date().toISOString(),
      footer: {
        text: `Hermes Agent • ${request.event}`
      },
      fields: request.metadata ? Object.entries(request.metadata).map(([key, value]) => ({
        name: key,
        value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
        inline: true
      })) : []
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
    
    // 使用 Bot Token 发送到指定频道
    const { botToken, proxy } = getDiscordConfig()
    if (channel.channelId && botToken) {
      const discordApiUrl = `https://discord.com/api/v10/channels/${channel.channelId}/messages`
      
      // 使用 curl 命令发送（支持代理）
      const args = ['-s', '-X', 'POST', '-m', '30']
      if (proxy) {
        args.push('-x', proxy)
      }
      args.push(
        '-H', `Authorization: Bot ${botToken}`,
        '-H', 'Content-Type: application/json',
        '-d', JSON.stringify({ embeds: [embed] }),
        discordApiUrl
      )
      
      try {
        const { spawn } = await import('node:child_process')
        const result = await new Promise<{ success: boolean; error?: string }>((resolve) => {
          const proc = spawn('curl', args, { timeout: 35000 })
          let stdout = ''
          let stderr = ''
          
          proc.stdout.on('data', (data) => { stdout += data })
          proc.stderr.on('data', (data) => { stderr += data })
          
          proc.on('close', (code) => {
            if (code !== 0) {
              resolve({ success: false, error: `curl exit ${code}: ${stderr || stdout}` })
              return
            }
            
            try {
              const response = JSON.parse(stdout || '{}')
              if (response.id) {
                resolve({ success: true })
              } else if (response.message) {
                resolve({ success: false, error: `Discord API: ${response.message}` })
              } else {
                resolve({ success: true })
              }
            } catch (e: any) {
              resolve({ success: false, error: `JSON parse error: ${e.message}` })
            }
          })
          
          proc.on('error', (e) => {
            resolve({ success: false, error: e.message })
          })
        })
        
        return result
      } catch (e: any) {
        return { success: false, error: e.message || 'Unknown error' }
      }
    }
    
    return { success: false, error: 'No valid Discord configuration' }
  } catch (e: any) {
    return { success: false, error: e.message || 'Unknown error' }
  }
}

// 发送Telegram通知
async function sendTelegramNotification(
  channel: NotificationChannel,
  request: NotifyRequest
): Promise<{ success: boolean; error?: string }> {
  // TODO: 实现Telegram通知
  return { success: false, error: 'Telegram notifications not yet implemented' }
}

// 发送微信通知
async function sendWeixinNotification(
  channel: NotificationChannel,
  request: NotifyRequest
): Promise<{ success: boolean; error?: string }> {
  // TODO: 实现微信通知
  return { success: false, error: 'WeChat notifications not yet implemented' }
}

// 发送通知到指定频道
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

// POST /api/notify - 发送通知
export default defineEventHandler(async (event) => {
  const body = await readBody<NotifyRequest>(event)
  
  // 验证请求
  if (!body.event || !body.title || !body.message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: event, title, message'
    })
  }
  
  if (!body.severity || !['info', 'warning', 'error', 'critical'].includes(body.severity)) {
    body.severity = 'info'
  }
  
  // 加载配置
  const config = loadNotificationConfig()
  
  // 确定目标频道
  let targetChannels = body.channels
  
  if (!targetChannels || targetChannels.length === 0) {
    // 根据事件类型自动路由
    targetChannels = routeEventToChannel(body.event, body.severity, config)
  }
  
  if (targetChannels.length === 0) {
    return {
      success: false,
      error: 'No target channels determined',
      event: body.event,
      routedChannels: []
    }
  }
  
  // 发送通知到所有目标频道
  const results = await Promise.all(
    targetChannels.map(channelId =>
      sendNotificationToChannel(channelId, body, config)
    )
  )
  
  // 统计结果
  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length
  
  // 记录通知历史
  try {
    const historyPath = path.join(getHermesPath(), 'notification_history.json')
    let history: any[] = []
    
    try {
      if (fs.existsSync(historyPath)) {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'))
      }
    } catch (e) {
      // ignore
    }
    
    for (const result of results) {
      const channel = config.channels[result.channel]
      history.push({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        event: body.event,
        severity: body.severity,
        title: body.title,
        message: body.message.slice(0, 200),
        channelId: result.channel,
        channelName: channel?.name || result.channel,
        channelType: channel?.type || 'unknown',
        status: result.success ? 'sent' : 'failed',
        error: result.error
      })
    }
    
    // 只保留最近1000条
    history = history.slice(-1000)
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8')
  } catch (e) {
    console.error('[notify] Failed to record history', e)
  }
  
  // 更新频道状态
  if (failCount > 0) {
    const updatedConfig = { ...config }
    for (const result of results) {
      if (!result.success && result.channel) {
        const channel = updatedConfig.channels[result.channel]
        if (channel) {
          channel.status = 'error'
        }
      }
    }
    saveNotificationConfig(updatedConfig)
  }
  
  return {
    success: successCount > 0,
    event: body.event,
    severity: body.severity,
    routedChannels: targetChannels,
    results: results,
    summary: {
      total: results.length,
      succeeded: successCount,
      failed: failCount
    }
  }
})
