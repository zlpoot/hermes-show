export default defineEventHandler(async (event) => {
  const mockData = {
    stats: {
      todayCount: 47,
      yesterdayChange: 12,
      errorAlerts: 3,
      activeRules: 8,
      totalRules: 12,
      activeChannels: 3
    },
    
    channels: [
      {
        id: 'ch-001',
        type: 'telegram',
        name: 'Telegram 管理员',
        description: '@admin_notifications',
        enabled: true,
        todaySent: 23
      },
      {
        id: 'ch-002',
        type: 'wechat',
        name: '微信通知',
        description: '运维群',
        enabled: true,
        todaySent: 15
      },
      {
        id: 'ch-003',
        type: 'discord',
        name: 'Discord 告警',
        description: '#alerts',
        enabled: true,
        todaySent: 9
      },
      {
        id: 'ch-004',
        type: 'email',
        name: '邮件通知',
        description: 'admin@example.com',
        enabled: false,
        todaySent: 0
      },
      {
        id: 'ch-005',
        type: 'webhook',
        name: '自定义 Webhook',
        description: '内网告警系统',
        enabled: false,
        todaySent: 0
      }
    ],
    
    rules: [
      {
        id: 'rule-001',
        name: 'API 错误告警',
        description: 'API 调用失败时发送通知',
        eventType: 'error',
        severity: 'critical',
        channel: 'telegram',
        channelName: 'Telegram 管理员',
        enabled: true
      },
      {
        id: 'rule-002',
        name: '网关断开告警',
        description: 'Gateway 连接断开时通知',
        eventType: 'gateway',
        severity: 'critical',
        channel: 'wechat',
        channelName: '微信通知',
        enabled: true
      },
      {
        id: 'rule-003',
        name: '任务完成通知',
        description: '定时任务执行完成时通知',
        eventType: 'task_complete',
        severity: 'info',
        channel: 'telegram',
        channelName: 'Telegram 管理员',
        enabled: true
      },
      {
        id: 'rule-004',
        name: '高延迟警告',
        description: 'API 响应超过 5 秒时警告',
        eventType: 'warning',
        severity: 'warning',
        channel: 'discord',
        channelName: 'Discord 告警',
        enabled: true
      },
      {
        id: 'rule-005',
        name: 'Token 使用预警',
        description: '日 Token 超过限额 80% 时警告',
        eventType: 'warning',
        severity: 'warning',
        channel: 'telegram',
        channelName: 'Telegram 管理员',
        enabled: false
      },
      {
        id: 'rule-006',
        name: '系统启动通知',
        description: 'Hermes Agent 启动时通知',
        eventType: 'system',
        severity: 'info',
        channel: 'wechat',
        channelName: '微信通知',
        enabled: true
      }
    ],
    
    eventTypes: [
      {
        id: 'error',
        name: '错误告警',
        description: 'API 错误、任务失败等严重问题',
        enabled: true,
        triggerCount: 127
      },
      {
        id: 'warning',
        name: '性能警告',
        description: '高延迟、资源使用过高等警告',
        enabled: true,
        triggerCount: 45
      },
      {
        id: 'task_complete',
        name: '任务完成',
        description: '定时任务、后台任务完成通知',
        enabled: true,
        triggerCount: 892
      },
      {
        id: 'system',
        name: '系统事件',
        description: '启动、关闭、配置变更等系统事件',
        enabled: true,
        triggerCount: 34
      },
      {
        id: 'gateway',
        name: '网关事件',
        description: '平台连接状态变化、重连等',
        enabled: true,
        triggerCount: 56
      },
      {
        id: 'cron',
        name: '定时任务',
        description: 'Cron 任务相关通知',
        enabled: false,
        triggerCount: 234
      }
    ],
    
    recentNotifications: [
      {
        id: 'notif-001',
        title: 'API 调用失败',
        message: 'OpenAI API 返回 429 错误: Rate limit exceeded. 重试中...',
        eventType: 'error',
        channel: 'telegram',
        channelName: 'Telegram 管理员',
        status: 'sent',
        time: '14:32'
      },
      {
        id: 'notif-002',
        title: '网关重连成功',
        message: '微信 Gateway 已重新连接，耗时 2.3 秒',
        eventType: 'gateway',
        channel: 'wechat',
        channelName: '微信通知',
        status: 'sent',
        time: '14:28'
      },
      {
        id: 'notif-003',
        title: '定时任务完成',
        message: '任务 "每日备份" 已成功完成，耗时 45 秒',
        eventType: 'task_complete',
        channel: 'telegram',
        channelName: 'Telegram 管理员',
        status: 'sent',
        time: '12:00'
      },
      {
        id: 'notif-004',
        title: '高延迟警告',
        message: 'Claude API 响应时间 6.2 秒，超过阈值',
        eventType: 'warning',
        channel: 'discord',
        channelName: 'Discord 告警',
        status: 'sent',
        time: '11:45'
      },
      {
        id: 'notif-005',
        title: 'Discord 网关断开',
        message: 'Discord Gateway 连接已断开: Token expired',
        eventType: 'gateway',
        channel: 'wechat',
        channelName: '微信通知',
        status: 'sent',
        time: '10:15'
      },
      {
        id: 'notif-006',
        title: 'API 调用失败',
        message: 'Telegram API 错误: Bot was blocked by the user',
        eventType: 'error',
        channel: 'wechat',
        channelName: '微信通知',
        status: 'failed',
        time: '09:32'
      }
    ],
    
    isRealHermesConnected: false
  }

  return mockData
})
