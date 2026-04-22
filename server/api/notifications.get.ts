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
  errorMessage?: string
}

interface NotificationConfig {
  channels: Record<string, NotificationChannel>
  defaultChannel: string
  eventRouting: Record<string, string>
  severityOverrides: Record<string, string>
}

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

// 加载通知历史
function loadNotificationHistory(): NotificationHistory[] {
  const historyPath = path.join(getHermesPath(), 'notification_history.json')
  try {
    if (fs.existsSync(historyPath)) {
      const content = fs.readFileSync(historyPath, 'utf-8')
      return JSON.parse(content)
    }
  } catch (e) {
    console.error('[notifications] Failed to load notification_history.json', e)
  }
  return []
}

// 计算统计数据
function calculateStats(history: NotificationHistory[]) {
  const now = Date.now()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartTs = todayStart.getTime()
  
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const yesterdayStartTs = yesterdayStart.getTime()
  
  // 今日通知
  const todayNotifications = history.filter(h => h.timestamp >= todayStartTs)
  const todayCount = todayNotifications.length
  const todaySent = todayNotifications.filter(h => h.status === 'sent').length
  const todayFailed = todayNotifications.filter(h => h.status === 'failed').length
  
  // 昨日通知
  const yesterdayNotifications = history.filter(h => 
    h.timestamp >= yesterdayStartTs && h.timestamp < todayStartTs
  )
  const yesterdayCount = yesterdayNotifications.length
  
  // 较昨日变化百分比
  const yesterdayChange = yesterdayCount > 0 
    ? Math.round((todayCount - yesterdayCount) / yesterdayCount * 100)
    : (todayCount > 0 ? 100 : 0)
  
  // 错误告警（今日失败的）
  const errorAlerts = todayFailed
  
  // 按渠道统计今日发送数
  const byChannel: Record<string, { sent: number; failed: number }> = {}
  for (const h of todayNotifications) {
    if (!byChannel[h.channelId]) {
      byChannel[h.channelId] = { sent: 0, failed: 0 }
    }
    if (h.status === 'sent') {
      byChannel[h.channelId].sent++
    } else {
      byChannel[h.channelId].failed++
    }
  }
  
  // 按事件类型统计触发次数
  const byEvent: Record<string, number> = {}
  for (const h of history) {
    byEvent[h.event] = (byEvent[h.event] || 0) + 1
  }
  
  return {
    todayCount,
    todaySent,
    todayFailed,
    yesterdayCount,
    yesterdayChange,
    errorAlerts,
    byChannel,
    byEvent
  }
}

export default defineEventHandler(async (event) => {
  const hermesPath = getHermesPath()
  const config = getHermesConfig()
  
  // 加载频道配置
  const notificationConfig = loadNotificationConfig()
  
  // 加载通知历史
  const history = loadNotificationHistory()
  const stats = calculateStats(history)
  
  // 从配置中获取通知相关设置
  const notifyInterval = config?.gateway_notify_interval || 600
  const backgroundNotify = config?.background_process_notifications || 'all'
  const quietMode = config?.quiet_mode || false
  
  // 构建频道列表
  let channels: any[] = []
  
  if (notificationConfig && Object.keys(notificationConfig.channels).length > 0) {
    channels = Object.entries(notificationConfig.channels).map(([id, channel]) => {
      const channelStats = stats.byChannel[id] || { sent: 0, failed: 0 }
      return {
        id,
        type: channel.type,
        name: channel.name,
        description: channel.description || '',
        enabled: channel.enabled,
        status: channel.status,
        errorMessage: channel.errorMessage,
        events: channel.events,
        isDefault: notificationConfig.defaultChannel === id,
        todaySent: channelStats.sent,
        todayFailed: channelStats.failed
      }
    })
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
        todaySent: 0,
        todayFailed: 0
      }
    })
  }
  
  // 构建通知规则（清晰展示事件→频道路由）
  const rules: any[] = []
  if (notificationConfig && Object.keys(notificationConfig.eventRouting).length > 0) {
    // 按频道分组显示路由规则
    const channelEvents: Record<string, string[]> = {}
    for (const [event, channelId] of Object.entries(notificationConfig.eventRouting)) {
      if (!channelEvents[channelId]) {
        channelEvents[channelId] = []
      }
      channelEvents[channelId].push(event)
    }
    
    const eventToName: Record<string, string> = {
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
      'cron': '定时任务',
      'budget': '预算告警',
      'backup': '备份通知',
      'info': '一般通知',
      'test': '测试通知',
      'daily': '日常消息'
    }
    
    for (const [channelId, events] of Object.entries(channelEvents)) {
      const channel = notificationConfig.channels[channelId]
      if (!channel) continue
      
      rules.push({
        id: `rule-${channelId}`,
        name: channel.name,
        description: events.map(e => eventToName[e] || e).join('、'),
        events: events,
        eventType: events[0],
        severity: events.includes('error') || events.includes('critical') ? 'error' : 
                 events.includes('warning') ? 'warning' : 'info',
        channel: channelId,
        channelType: channel.type,
        channelName: channel.name,
        enabled: channel.enabled
      })
    }
  } else {
    // 默认规则
    rules.push(
      {
        id: 'rule-001',
        name: '后台任务通知',
        description: '后台进程完成时发送通知',
        eventType: 'task_complete',
        events: ['task_complete'],
        severity: 'info',
        channel: channels[0]?.id || 'default',
        channelType: channels[0]?.type || 'discord',
        channelName: channels[0]?.name || 'Default',
        enabled: backgroundNotify === 'all' || backgroundNotify === true
      }
    )
  }
  
  // 事件类型定义（带触发统计）
  const eventTypes = [
    { id: 'error', name: '错误告警', description: 'API 错误、任务失败等严重问题', enabled: true, triggerCount: stats.byEvent['error'] || 0 },
    { id: 'warning', name: '性能警告', description: '高延迟、资源使用过高等警告', enabled: true, triggerCount: stats.byEvent['warning'] || 0 },
    { id: 'critical', name: '严重告警', description: '系统崩溃、服务不可用等严重问题', enabled: true, triggerCount: stats.byEvent['critical'] || 0 },
    { id: 'task_complete', name: '任务完成', description: '后台任务、异步任务完成通知', enabled: backgroundNotify !== 'none', triggerCount: stats.byEvent['task_complete'] || 0 },
    { id: 'task_start', name: '任务开始', description: '后台任务、异步任务开始执行', enabled: backgroundNotify !== 'none', triggerCount: stats.byEvent['task_start'] || 0 },
    { id: 'task_failed', name: '任务失败', description: '任务执行失败通知', enabled: true, triggerCount: stats.byEvent['task_failed'] || 0 },
    { id: 'system', name: '系统事件', description: '启动、关闭、配置变更等系统事件', enabled: true, triggerCount: stats.byEvent['system'] || 0 },
    { id: 'config_change', name: '配置变更', description: '系统配置修改通知', enabled: true, triggerCount: stats.byEvent['config_change'] || 0 },
    { id: 'auth', name: '授权事件', description: '用户授权、权限变更通知', enabled: true, triggerCount: stats.byEvent['auth'] || 0 },
    { id: 'gateway', name: '网关事件', description: '平台连接状态变化、重连等', enabled: true, triggerCount: stats.byEvent['gateway'] || 0 },
    { id: 'connection', name: '连接事件', description: 'Discord/Telegram/WeChat 连接状态', enabled: true, triggerCount: stats.byEvent['connection'] || 0 },
    { id: 'cron', name: '定时任务', description: 'Cron 任务执行结果通知', enabled: true, triggerCount: stats.byEvent['cron'] || 0 },
    { id: 'budget', name: '预算告警', description: '预算超支、费用异常警告', enabled: true, triggerCount: stats.byEvent['budget'] || 0 },
    { id: 'backup', name: '备份通知', description: '数据库备份完成/失败通知', enabled: true, triggerCount: stats.byEvent['backup'] || 0 },
    { id: 'info', name: '一般通知', description: '日常消息、低优先级事件', enabled: true, triggerCount: stats.byEvent['info'] || 0 },
    { id: 'test', name: '测试通知', description: '测试消息、调试通知', enabled: false, triggerCount: stats.byEvent['test'] || 0 },
    { id: 'daily', name: '日常消息', description: '每日摘要、例行通知', enabled: true, triggerCount: stats.byEvent['daily'] || 0 }
  ]
  
  // 最近通知（从历史记录获取，格式化显示）
  const recentNotifications = history
    .slice(-20)
    .reverse()
    .map(h => ({
      id: h.id,
      title: h.title,
      message: h.message,
      eventType: h.event,
      severity: h.severity,
      channelId: h.channelId,
      channelName: h.channelName,
      channelType: h.channelType,
      status: h.status,
      error: h.error,
      time: new Date(h.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      date: new Date(h.timestamp).toLocaleDateString('zh-CN'),
      timestamp: h.timestamp
    }))
    .slice(0, 10)
  
  return {
    stats: {
      todayCount: stats.todayCount,
      todaySent: stats.todaySent,
      todayFailed: stats.todayFailed,
      yesterdayCount: stats.yesterdayCount,
      yesterdayChange: stats.yesterdayChange,
      errorAlerts: stats.errorAlerts,
      activeRules: rules.filter(r => r.enabled).length,
      totalRules: rules.length,
      activeChannels: channels.filter(c => c.enabled && c.status === 'healthy').length,
      totalChannels: channels.length
    },
    
    channels,
    rules,
    eventTypes,
    recentNotifications,
    
    // 配置信息
    config: {
      notifyInterval,
      backgroundNotify,
      quietMode,
      useNewConfig: notificationConfig !== null
    },
    
    // 事件路由信息
    eventRouting: notificationConfig?.eventRouting || {},
    severityOverrides: notificationConfig?.severityOverrides || {},
    defaultChannel: notificationConfig?.defaultChannel || channels[0]?.id || '',
    
    isRealHermesConnected: true
  }
})
