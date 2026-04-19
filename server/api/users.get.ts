export default defineEventHandler(async (event) => {
  const mockData = {
    stats: {
      authorizedUsers: 12,
      pendingPairings: 2,
      activeToday: 8,
      blacklisted: 3
    },
    
    allowAllUsers: false,
    pairingMode: 'pairing',
    
    pendingPairings: [
      {
        id: 'new_user_001@im.wechat',
        displayName: '新用户A',
        platform: 'wechat',
        requestTime: '10 分钟前'
      },
      {
        id: '123456789@telegram',
        displayName: 'Telegram User',
        platform: 'telegram',
        requestTime: '25 分钟前'
      }
    ],
    
    authorizedUsers: [
      {
        id: 'o9cq8071ueKj60zUJ8WHaw_QJl7M@im.wechat',
        displayName: '管理员',
        platform: 'wechat',
        role: 'admin',
        lastActive: '刚刚',
        sessionCount: 156,
        status: 'active'
      },
      {
        id: 'user_002@im.wechat',
        displayName: '张三',
        platform: 'wechat',
        role: 'user',
        lastActive: '5 分钟前',
        sessionCount: 89,
        status: 'active'
      },
      {
        id: 'user_003@im.wechat',
        displayName: '李四',
        platform: 'wechat',
        role: 'user',
        lastActive: '1 小时前',
        sessionCount: 45,
        status: 'offline'
      },
      {
        id: '987654321@telegram',
        displayName: 'Dev User',
        platform: 'telegram',
        role: 'admin',
        lastActive: '30 分钟前',
        sessionCount: 234,
        status: 'active'
      },
      {
        id: 'discord_user_001',
        displayName: 'Discord Admin',
        platform: 'discord',
        role: 'admin',
        lastActive: '2 小时前',
        sessionCount: 67,
        status: 'offline'
      },
      {
        id: 'user_004@im.wechat',
        displayName: '王五',
        platform: 'wechat',
        role: 'user',
        lastActive: '3 小时前',
        sessionCount: 23,
        status: 'offline'
      },
      {
        id: 'telegram_user_002@telegram',
        displayName: '测试用户',
        platform: 'telegram',
        role: 'user',
        lastActive: '1 天前',
        sessionCount: 12,
        status: 'offline'
      },
      {
        id: 'user_005@im.wechat',
        displayName: '赵六',
        platform: 'wechat',
        role: 'user',
        lastActive: '15 分钟前',
        sessionCount: 78,
        status: 'active'
      }
    ],
    
    blacklist: [
      {
        id: 'blocked_001@im.wechat',
        displayName: '恶意用户A',
        platform: 'wechat',
        reason: '频繁发送垃圾消息',
        blockedTime: '2026-04-15'
      },
      {
        id: 'blocked_002@telegram',
        displayName: 'Spam User',
        platform: 'telegram',
        reason: '滥用 API',
        blockedTime: '2026-04-10'
      },
      {
        id: 'blocked_003@im.wechat',
        displayName: '封禁用户C',
        platform: 'wechat',
        reason: '违规内容',
        blockedTime: '2026-04-08'
      }
    ],
    
    isRealHermesConnected: false
  }

  return mockData
})
