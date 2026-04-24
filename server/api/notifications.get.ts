import { loadNotificationConfig, getNotificationHistory } from '../utils/notification'

// GET /api/notifications - 获取通知页面所有数据
export default defineEventHandler(async (event) => {
  const config = loadNotificationConfig()
  const history = getNotificationHistory(20)
  
  // 计算统计数据
  const today = new Date().toDateString()
  let todaySent = 0
  let todayFailed = 0
  
  for (const entry of history) {
    if (new Date(entry.timestamp).toDateString() === today) {
      for (const ch of entry.channels) {
        if (ch.success) todaySent++
        else todayFailed++
      }
    }
  }
  
  // 事件类型定义
  const eventTypes = [
    { id: 'critical', name: '严重', description: '系统级严重问题', triggerCount: history.filter(h => h.event.level === 'critical' || config.event_types.critical.includes(h.event.type)).length },
    { id: 'error', name: '错误', description: '操作失败、任务失败', triggerCount: history.filter(h => h.event.level === 'error' || config.event_types.error.includes(h.event.type)).length },
    { id: 'warning', name: '警告', description: '预算警告、限流提醒', triggerCount: history.filter(h => h.event.level === 'warning' || config.event_types.warning.includes(h.event.type)).length },
    { id: 'info', name: '信息', description: '任务完成、定时任务', triggerCount: history.filter(h => h.event.level === 'info' || config.event_types.info.includes(h.event.type)).length },
    { id: 'cron', name: '定时任务', description: 'Cron 任务相关', triggerCount: history.filter(h => h.event.type.includes('cron')).length },
    { id: 'task', name: '任务', description: '任务执行相关', triggerCount: history.filter(h => h.event.type.includes('task')).length },
    { id: 'system', name: '系统', description: '系统状态变化', triggerCount: history.filter(h => h.event.type.includes('system') || h.event.type.includes('gateway')).length },
    { id: 'budget', name: '预算', description: '预算使用相关', triggerCount: history.filter(h => h.event.type.includes('budget')).length }
  ]
  
  // 转换历史记录为前端格式
  const recentNotifications = history.slice(0, 20).map((entry: any) => ({
    id: entry.timestamp,
    title: entry.event.title,
    message: entry.event.message,
    eventType: entry.event.type,
    level: entry.event.level,
    status: entry.channels.every((c: any) => c.success) ? 'sent' : 'failed',
    time: new Date(entry.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    channelName: entry.channels.map((c: any) => c.name).join(', '),
    channelId: entry.channels[0]?.id,
    error: entry.channels.find((c: any) => c.error)?.error
  }))
  
  // 路由规则 - 从频道配置生成
  const rules = config.channels.map(channel => ({
    id: channel.id,
    name: channel.name,
    channel: channel.id,
    channelType: channel.platform,
    events: channel.events,
    enabled: channel.enabled
  }))
  
  return {
    success: true,
    stats: {
      todayCount: todaySent + todayFailed,
      todaySent,
      todayFailed,
      yesterdayCount: 0,
      yesterdayChange: 0,
      errorAlerts: todayFailed,
      activeRules: rules.filter(r => r.enabled).length,
      totalRules: rules.length,
      activeChannels: config.channels.filter(c => c.enabled).length,
      totalChannels: config.channels.length
    },
    channels: config.channels.map(ch => ({
      ...ch,
      type: ch.platform, // 兼容前端
      channelId: ch.channel_id, // 兼容前端
      todaySent: 0,
      todayFailed: 0,
      status: 'healthy'
    })),
    rules,
    eventTypes,
    recentNotifications
  }
})
