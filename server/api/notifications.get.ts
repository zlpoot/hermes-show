import fs from 'node:fs'
import path from 'node:path'
import { getHermesPath, getHermesConfig, getHermesDB } from '../utils/hermes'

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
function loadNotificationConfig(): NotificationConfig | null {
  const configPath = path.join(getHermesPath(), 'notification_channels.json')
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8')
      return JSON.parse(content)
    }
  } catch (e) {
    console.error('[notifications] Failed to load notification_channels.json', e)
  }
  return null
}

export default defineEventHandler(async (event) => {
  const hermesPath = getHermesPath()
  const config = getHermesConfig()
  const prisma = getHermesDB()
  
  // 加载新的频道配置
  const notificationConfig = loadNotificationConfig()
  
  // 从配置中获取通知相关设置
  const notifyInterval = config?.gateway_notify_interval || 600
  const backgroundNotify = config?.background_process_notifications || 'all'
  const quietMode = config?.quiet_mode || false
  
  // 构建频道列表（使用新配置）
  let channels: any[] = []
  
  if (notificationConfig && Object.keys(notificationConfig.channels).length > 0) {
    // 使用新的频道配置系统
    channels = Object.entries(notificationConfig.channels).map(([id, channel]) => ({
      id,
      type: channel.type,
      name: channel.name,
      description: channel.description || '',
      enabled: channel.enabled,
      status: channel.status,
      events: channel.events,
      isDefault: notificationConfig.defaultChannel === id,
      todaySent: 0 // TODO: 从日志统计
    }))
  } else {
    // 回退到旧配置（兼容性）
    const homeChannels: { type: string; id: string }[] = []
    if (config?.DISCORD_HOME_CHANNEL) {
      homeChannels.push({ type: 'discord', id: config.DISCORD_HOME_CHANNEL })
    }
    if (config?.TELEGRAM_HOME_CHAT) {
      homeChannels.push({ type: 'telegram', id: config.TELEGRAM_HOME_CHAT })
    }
    if (config?.WEIXIN_HOME_USER) {
      homeChannels.push({ type: 'weixin', id: config.WEIXIN_HOME_USER })
    }
    
    channels = homeChannels.map((ch, idx) => {
      const typeNames: Record<string, string> = {
        discord: 'Discord',
        telegram: 'Telegram',
        weixin: '微信'
      }
      return {
        id: `ch-${idx}`,
        type: ch.type,
        name: `${typeNames[ch.type] || ch.type} 通知`,
        description: ch.id,
        enabled: !quietMode,
        status: 'healthy' as const,
        events: [],
        isDefault: idx === 0,
        todaySent: 0
      }
    })
  }
  
  // 从数据库获取今日通知统计
  let todayCount = 0
  let errorAlerts = 0
  
  if (prisma) {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayStartTs = todayStart.getTime() / 1000
      
      const msgStats: any[] = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM messages 
        WHERE role = 'assistant' AND created_at >= ${todayStartTs}
      `
      todayCount = Number(msgStats[0]?.count || 0)
    } catch (e) {
      // 忽略错误
    }
  }
  
  // 构建通知规则（基于事件路由）
  const rules: any[] = []
  if (notificationConfig) {
    // 从事件路由生成规则
    const eventToRuleName: Record<string, string> = {
      'error': '错误告警',
      'critical': '严重告警',
      'warning': '性能警告',
      'task_complete': '任务完成',
      'task_start': '任务开始',
      'task_failed': '任务失败',
      'system': '系统事件',
      'config_change': '配置变更',
      'auth': '授权事件',
      'gateway': '网关事件',
      'connection': '连接事件',
      'info': '一般通知',
      'test': '测试通知',
      'daily': '日常消息'
    }
    
    const uniqueEvents = [...new Set(Object.values(notificationConfig.eventRouting))]
    for (const channelId of uniqueEvents) {
      const channel = notificationConfig.channels[channelId]
      if (!channel) continue
      
      const events = Object.entries(notificationConfig.eventRouting)
        .filter(([_, ch]) => ch === channelId)
        .map(([ev, _]) => ev)
      
      if (events.length > 0) {
        rules.push({
          id: `rule-${rules.length + 1}`,
          name: `${channel.name} 规则`,
          description: `处理事件: ${events.map(e => eventToRuleName[e] || e).join(', ')}`,
          eventType: events[0],
          events: events,
          severity: events.includes('error') || events.includes('critical') ? 'error' : 'info',
          channel: channelId,
          channelName: channel.name,
          enabled: channel.enabled
        })
      }
    }
  } else {
    // 默认规则（兼容性）
    rules.push(
      {
        id: 'rule-001',
        name: '后台任务通知',
        description: '后台进程完成时发送通知',
        eventType: 'task_complete',
        severity: 'info',
        channel: channels[0]?.id || 'default',
        channelName: channels[0]?.name || 'Default',
        enabled: backgroundNotify === 'all' || backgroundNotify === true
      },
      {
        id: 'rule-002',
        name: '网关状态通知',
        description: 'Gateway 连接状态变化时通知',
        eventType: 'gateway',
        severity: 'info',
        channel: channels[0]?.id || 'default',
        channelName: channels[0]?.name || 'Default',
        enabled: true
      }
    )
  }
  
  // 事件类型定义
  const eventTypes = [
    { id: 'error', name: '错误告警', description: 'API 错误、任务失败等严重问题', enabled: true, triggerCount: 0 },
    { id: 'warning', name: '性能警告', description: '高延迟、资源使用过高等警告', enabled: true, triggerCount: 0 },
    { id: 'task_complete', name: '任务完成', description: '定时任务、后台任务完成通知', enabled: backgroundNotify !== 'none', triggerCount: 0 },
    { id: 'system', name: '系统事件', description: '启动、关闭、配置变更等系统事件', enabled: true, triggerCount: 0 },
    { id: 'gateway', name: '网关事件', description: '平台连接状态变化、重连等', enabled: true, triggerCount: 0 }
  ]
  
  // 最近通知（从日志读取最后几条）
  const recentNotifications: any[] = []
  const logPath = path.join(hermesPath, 'logs', 'hermes.log')
  if (fs.existsSync(logPath)) {
    try {
      const content = fs.readFileSync(logPath, 'utf-8')
      const lines = content.split('\n').filter(l => l.trim()).slice(-20)
      
      for (const line of lines) {
        if (line.includes('NOTIFY') || line.includes('notify') || line.includes('sent to')) {
          const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/)
          recentNotifications.push({
            id: `notif-${recentNotifications.length}`,
            title: '系统通知',
            message: line.slice(0, 100),
            eventType: 'system',
            channel: channels[0]?.type || 'system',
            channelName: channels[0]?.name || 'System',
            status: 'sent',
            time: timeMatch ? timeMatch[1].slice(0, 5) : '--:--'
          })
        }
      }
    } catch (e) {
      // 忽略日志读取错误
    }
  }
  
  return {
    stats: {
      todayCount,
      yesterdayChange: 0,
      errorAlerts,
      activeRules: rules.filter(r => r.enabled).length,
      totalRules: rules.length,
      activeChannels: channels.filter(c => c.enabled).length
    },
    
    channels,
    rules,
    eventTypes,
    recentNotifications: recentNotifications.slice(0, 6),
    
    // 配置信息
    config: {
      notifyInterval,
      backgroundNotify,
      quietMode,
      // 新增：显示是否使用新配置系统
      useNewConfig: notificationConfig !== null
    },
    
    // 新增：事件路由信息
    eventRouting: notificationConfig?.eventRouting || {},
    severityOverrides: notificationConfig?.severityOverrides || {},
    defaultChannel: notificationConfig?.defaultChannel || channels[0]?.id || '',
    
    isRealHermesConnected: true
  }
})
