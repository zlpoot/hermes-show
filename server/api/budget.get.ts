export default defineEventHandler(async (event) => {
  // Mock budget data
  const mockData = {
    isRealHermesConnected: false,
    
    budget: {
      total: 100,           // 月度预算 (USD)
      used: 67.32,          // 已使用
      remaining: 32.68      // 剩余
    },
    
    today: {
      cost: 3.45,
      tokens: 128543
    },
    
    week: {
      cost: 24.78,
      avgDaily: 3.54
    },
    
    month: {
      cost: 67.32,
      change: 12.5          // 较上月增长百分比
    },
    
    estimated: {
      cost: 89.76,          // 按当前使用率预估的月消费
    },
    
    // 按提供商分布
    providerCosts: [
      {
        name: 'jdcloud',
        displayName: '京东云',
        model: 'GLM-5',
        cost: 42.15,
        percent: 62.6,
        color: 'text-blue-400',
        barColor: 'bg-blue-400'
      },
      {
        name: 'openai',
        displayName: 'OpenAI',
        model: 'GPT-4o',
        cost: 15.82,
        percent: 23.5,
        color: 'text-green-400',
        barColor: 'bg-green-400'
      },
      {
        name: 'anthropic',
        displayName: 'Anthropic',
        model: 'Claude 3.5 Sonnet',
        cost: 9.35,
        percent: 13.9,
        color: 'text-orange-400',
        barColor: 'bg-orange-400'
      }
    ],
    
    // 近7天消费趋势
    dailyTrend: [
      { label: '周一', cost: 2.34 },
      { label: '周二', cost: 4.12 },
      { label: '周三', cost: 3.89 },
      { label: '周四', cost: 5.67 },
      { label: '周五', cost: 4.23 },
      { label: '周六', cost: 2.18 },
      { label: '周日', cost: 3.45 }
    ],
    
    // Top 10 消费用户
    topUsers: [
      {
        id: 'user_001',
        displayName: '张三',
        platform: '微信',
        sessions: 156,
        tokens: 245890,
        cost: 24.56,
        percent: 36.5
      },
      {
        id: 'user_002',
        displayName: '李四',
        platform: 'Discord',
        sessions: 89,
        tokens: 167432,
        cost: 16.74,
        percent: 24.9
      },
      {
        id: 'user_003',
        displayName: '王五',
        platform: 'Telegram',
        sessions: 67,
        tokens: 123456,
        cost: 12.35,
        percent: 18.3
      },
      {
        id: 'user_004',
        displayName: '赵六',
        platform: '微信',
        sessions: 45,
        tokens: 89234,
        cost: 8.92,
        percent: 13.3
      },
      {
        id: 'user_005',
        displayName: '孙七',
        platform: 'CLI',
        sessions: 23,
        tokens: 45678,
        cost: 4.57,
        percent: 6.8
      }
    ]
  }
  
  return mockData
})
