export default defineEventHandler(async (event) => {
  // Mock data for gateway status
  const mockData = {
    status: 'running',
    uptime: '5天 12小时 34分钟',
    reconnectCount: 3,
    queueCapacity: 100,
    
    connections: [
      {
        platform: 'wechat',
        displayName: '微信',
        accountId: '27af88324922@im.bot',
        connected: true,
        latency: 45,
        messageCount: 1247
      },
      {
        platform: 'telegram',
        displayName: 'Telegram',
        accountId: '@hermes_bot',
        connected: true,
        latency: 120,
        messageCount: 523
      },
      {
        platform: 'discord',
        displayName: 'Discord',
        accountId: 'Hermes#1234',
        connected: false,
        latency: 0,
        messageCount: 89
      }
    ],
    
    messageQueue: [
      {
        platform: 'wechat',
        sender: '用户A',
        preview: '帮我分析一下这个代码的性能问题...',
        priority: 'normal',
        timestamp: '14:32:15'
      },
      {
        platform: 'telegram',
        sender: 'user_123',
        preview: '生成一份项目报告',
        priority: 'high',
        timestamp: '14:31:48'
      },
      {
        platform: 'wechat',
        sender: '用户B',
        preview: '今天天气怎么样？',
        priority: 'normal',
        timestamp: '14:30:22'
      }
    ],
    
    reconnectHistory: [
      {
        timestamp: '2026-04-19 10:15:32',
        platform: 'Discord',
        reason: 'WebSocket 连接超时',
        duration: '2.3s',
        success: true
      },
      {
        timestamp: '2026-04-19 08:42:18',
        platform: '微信',
        reason: '网络切换',
        duration: '1.5s',
        success: true
      },
      {
        timestamp: '2026-04-18 22:10:05',
        platform: 'Telegram',
        reason: 'API 限流',
        duration: '5.0s',
        success: true
      },
      {
        timestamp: '2026-04-18 15:33:41',
        platform: 'Discord',
        reason: 'Token 过期',
        duration: '-',
        success: false
      },
      {
        timestamp: '2026-04-18 09:21:12',
        platform: '微信',
        reason: '服务重启',
        duration: '3.2s',
        success: true
      }
    ],
    
    isRealHermesConnected: false
  }

  return mockData
})
