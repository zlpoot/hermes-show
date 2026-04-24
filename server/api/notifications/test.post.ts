import fs from 'node:fs'
import path from 'node:path'
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

// 加载频道配置
function loadNotificationConfig(): NotificationConfig {
  const configPath = path.join(getHermesPath(), 'notification_channels.json')
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8')
      return JSON.parse(content)
    }
  } catch (e) {
    console.error('[notify-test] Failed to load config', e)
  }
  
  return {
    channels: {},
    defaultChannel: '',
    eventRouting: {},
    severityOverrides: {}
  }
}

// Discord Bot Token 从 config.yaml 获取
function getDiscordConfig() {
  const config = getHermesConfig()
  const botToken = config?.platforms?.discord?.token || ''
  const proxy = config?.discord?.proxy || process.env.DISCORD_PROXY || ''
  return { botToken, proxy }
}

// 发送测试消息到 Discord
async function sendTestMessage(
  channel: NotificationChannel
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const { botToken, proxy } = getDiscordConfig()
  
  if (!botToken) {
    return { success: false, error: 'Discord Bot Token 未配置 (config.yaml: platforms.discord.token)' }
  }
  
  if (!channel.channelId) {
    return { success: false, error: '频道 ID 未配置' }
  }
  
  try {
    const embed = {
      title: '🧪 Hermes 通知测试',
      description: '这是一条测试消息，通知系统工作正常！',
      color: 0x2ecc71, // 绿色
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Hermes Agent • test'
      },
      fields: [
        {
          name: '频道名称',
          value: channel.name,
          inline: true
        },
        {
          name: '事件类型',
          value: channel.events.join(', ') || '无',
          inline: true
        }
      ]
    }
    
    const discordApiUrl = `https://discord.com/api/v10/channels/${channel.channelId}/messages`
    
    // 使用 curl 发送（支持代理）
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
    
    const { spawn } = await import('node:child_process')
    const result = await new Promise<{ success: boolean; error?: string; messageId?: string }>((resolve) => {
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
            resolve({ success: true, messageId: response.id })
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

// POST /api/notifications/test - 测试通知渠道
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const config = loadNotificationConfig()
  
  // 测试指定频道
  let targetChannelId = body.channelId
  
  // 如果没有指定，测试默认频道
  if (!targetChannelId) {
    targetChannelId = config.defaultChannel
  }
  
  // 如果还是没有，测试第一个启用的频道
  if (!targetChannelId) {
    const enabledChannels = Object.entries(config.channels)
      .filter(([, ch]) => ch.enabled && ch.type === 'discord')
    if (enabledChannels.length > 0) {
      targetChannelId = enabledChannels[0][0]
    }
  }
  
  if (!targetChannelId) {
    // 没有配置任何频道，尝试发送到 home channel
    const hermesConfig = getHermesConfig()
    const homeChannel = hermesConfig?.discord?.home_channel || ''
    
    if (homeChannel) {
      // 创建临时频道配置
      const tempChannel: NotificationChannel = {
        type: 'discord',
        name: 'Home Channel',
        channelId: homeChannel.split(':')[1] || homeChannel,
        events: [],
        enabled: true,
        status: 'healthy'
      }
      
      const result = await sendTestMessage(tempChannel)
      return {
        success: result.success,
        channelId: 'home',
        channelName: 'Home Channel',
        ...result,
        note: '使用 config.yaml 中的 discord.home_channel'
      }
    }
    
    return {
      success: false,
      error: '没有配置通知频道，请先在通知设置中添加频道',
      hint: '或在 config.yaml 中配置 discord.home_channel'
    }
  }
  
  const channel = config.channels[targetChannelId]
  
  if (!channel) {
    return {
      success: false,
      error: `频道不存在: ${targetChannelId}`
    }
  }
  
  if (channel.type !== 'discord') {
    return {
      success: false,
      error: `暂不支持测试 ${channel.type} 类型的频道`
    }
  }
  
  const result = await sendTestMessage(channel)
  
  // 更新频道状态
  if (result.success) {
    channel.status = 'healthy'
  } else {
    channel.status = 'error'
  }
  
  // 保存配置
  const configPath = path.join(getHermesPath(), 'notification_channels.json')
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  
  return {
    success: result.success,
    channelId: targetChannelId,
    channelName: channel.name,
    ...result
  }
})
