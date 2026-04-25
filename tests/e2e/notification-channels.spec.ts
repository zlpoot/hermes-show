import { test, expect } from '@playwright/test'

test.describe('通知渠道 API', () => {
  test('GET /api/notification-channels 返回正确的数据结构', async ({ request }) => {
    const response = await request.get('/api/notification-channels')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    
    // 验证基本数据结构
    expect(data.success).toBe(true)
    expect(data).toHaveProperty('channels')
    expect(data).toHaveProperty('stats')
    
    // 验证 stats 结构
    expect(data.stats).toHaveProperty('total')
    expect(data.stats).toHaveProperty('enabled')
    expect(data.stats).toHaveProperty('platforms')
    
    // 验证 platforms 结构
    expect(data.stats.platforms).toHaveProperty('discord')
    expect(data.stats.platforms).toHaveProperty('telegram')
    expect(data.stats.platforms).toHaveProperty('weixin')
  })
  
  test('GET /api/notification-channels 返回 channels 数组', async ({ request }) => {
    const response = await request.get('/api/notification-channels')
    const data = await response.json()
    
    expect(Array.isArray(data.channels)).toBe(true)
    
    // 如果有频道，验证频道结构
    if (data.channels.length > 0) {
      const channel = data.channels[0]
      expect(channel).toHaveProperty('id')
      expect(channel).toHaveProperty('name')
      expect(channel).toHaveProperty('platform')
      expect(channel).toHaveProperty('channel_id')
      expect(channel).toHaveProperty('events')
      expect(channel).toHaveProperty('enabled')
    }
  })
  
  test('GET /api/notification-channels 返回 event_types（如果存在）', async ({ request }) => {
    const response = await request.get('/api/notification-channels')
    const data = await response.json()
    
    // event_types 可选存在，如果存在则验证结构
    if (data.event_types) {
      expect(data.event_types).toHaveProperty('critical')
      expect(data.event_types).toHaveProperty('error')
      expect(data.event_types).toHaveProperty('warning')
      expect(data.event_types).toHaveProperty('info')
      
      expect(Array.isArray(data.event_types.critical)).toBe(true)
      expect(Array.isArray(data.event_types.error)).toBe(true)
      expect(Array.isArray(data.event_types.warning)).toBe(true)
      expect(Array.isArray(data.event_types.info)).toBe(true)
    } else {
      // 如果没有 event_types，测试也应该通过
      expect(data.success).toBe(true)
    }
  })
  
  test('GET /api/notification-channels?channelId=xxx 返回 404 如果频道不存在', async ({ request }) => {
    const response = await request.get('/api/notification-channels?channelId=non-existent-channel')
    
    expect(response.status()).toBe(404)
  })
})

test.describe('通知 API', () => {
  test('GET /api/notifications 返回正确的数据结构', async ({ request }) => {
    const response = await request.get('/api/notifications')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    
    // 验证基本数据结构
    expect(data.success).toBe(true)
    expect(data).toHaveProperty('stats')
    expect(data).toHaveProperty('channels')
    expect(data).toHaveProperty('rules')
    expect(data).toHaveProperty('eventTypes')
    expect(data).toHaveProperty('recentNotifications')
    
    // 验证 stats 结构
    expect(data.stats).toHaveProperty('todayCount')
    expect(data.stats).toHaveProperty('todaySent')
    expect(data.stats).toHaveProperty('todayFailed')
    expect(data.stats).toHaveProperty('activeRules')
    expect(data.stats).toHaveProperty('totalRules')
    expect(data.stats).toHaveProperty('activeChannels')
    expect(data.stats).toHaveProperty('totalChannels')
  })
  
  test('GET /api/notifications 返回 eventTypes 数组', async ({ request }) => {
    const response = await request.get('/api/notifications')
    const data = await response.json()
    
    expect(Array.isArray(data.eventTypes)).toBe(true)
    
    // 验证事件类型结构
    if (data.eventTypes.length > 0) {
      const eventType = data.eventTypes[0]
      expect(eventType).toHaveProperty('id')
      expect(eventType).toHaveProperty('name')
      expect(eventType).toHaveProperty('description')
      expect(eventType).toHaveProperty('triggerCount')
    }
  })
  
  test('GET /api/notifications 返回 recentNotifications 数组', async ({ request }) => {
    const response = await request.get('/api/notifications')
    const data = await response.json()
    
    expect(Array.isArray(data.recentNotifications)).toBe(true)
    
    // 验证通知结构
    if (data.recentNotifications.length > 0) {
      const notification = data.recentNotifications[0]
      expect(notification).toHaveProperty('id')
      expect(notification).toHaveProperty('title')
      expect(notification).toHaveProperty('message')
      expect(notification).toHaveProperty('eventType')
      expect(notification).toHaveProperty('level')
      expect(notification).toHaveProperty('status')
      expect(notification).toHaveProperty('time')
    }
  })
})

test.describe('通知历史 API', () => {
  test('GET /api/notifications/history 返回历史记录对象', async ({ request }) => {
    const response = await request.get('/api/notifications/history')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    // API 返回 { success: true, history: [], total: number }
    expect(data.success).toBe(true)
    expect(data).toHaveProperty('history')
    expect(data).toHaveProperty('total')
    expect(Array.isArray(data.history)).toBe(true)
  })
})
