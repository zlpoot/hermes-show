import fs from 'node:fs'
import path from 'node:path'
import { getHermesPath, getHermesConfig, getHermesDB } from '../utils/hermes'

export default defineEventHandler(async (event) => {
  const hermesPath = getHermesPath()
  const config = getHermesConfig()
  const prisma = getHermesDB()
  
  // 从配置中获取通知相关设置
  const notifyInterval = config?.gateway_notify_interval || 600
  const backgroundNotify = config?.background_process_notifications || 'all'
  const quietMode = config?.quiet_mode || false
  
  // 获取网关 home channel 配置
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
  
  // 构建渠道列表
  const channels = homeChannels.map((ch, idx) => {
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
      todaySent: 0 // 需要从日志统计
    }
  })
  
  // 从数据库获取今日通知统计
  let todayCount = 0
  let errorAlerts = 0
  
  if (prisma) {
    try {
      // 统计今日消息数作为通知近似
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
  
  // 默认通知规则
  const rules = [
    {
      id: 'rule-001',
      name: '后台任务通知',
      description: '后台进程完成时发送通知',
      eventType: 'task_complete',
      severity: 'info',
      channel: channels[0]?.type || 'discord',
      channelName: channels[0]?.name || 'Discord',
      enabled: backgroundNotify === 'all' || backgroundNotify === true
    },
    {
      id: 'rule-002',
      name: '网关状态通知',
      description: 'Gateway 连接状态变化时通知',
      eventType: 'gateway',
      severity: 'info',
      channel: channels[0]?.type || 'discord',
      channelName: channels[0]?.name || 'Discord',
      enabled: true
    }
  ]
  
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
        // 解析日志中的通知事件
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
      quietMode
    },
    
    isRealHermesConnected: true
  }
})
