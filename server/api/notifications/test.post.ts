import { loadNotificationConfig, sendNotification, getDiscordToken } from '../../utils/notification'
import type { NotificationEvent } from '../../types/notification'

// POST /api/notifications/test - 测试通知渠道
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = loadNotificationConfig()
  
  // 查找目标频道
  let targetChannel = body.channelId 
    ? config.channels.find(c => c.id === body.channelId)
    : config.channels.find(c => c.enabled && c.platform === 'discord')
  
  if (!targetChannel) {
    // 没有配置任何频道，尝试使用默认频道
    const defaultChannel = config.channels[0]
    if (defaultChannel) {
      targetChannel = defaultChannel
    } else {
      return {
        success: false,
        error: '没有配置通知频道，请先在通知设置中添加频道'
      }
    }
  }
  
  // 构建测试事件
  const testEvent: NotificationEvent = {
    type: 'test',
    title: '🧪 Hermes 通知测试',
    message: `这是一条测试消息，通知系统工作正常！\n\n**频道名称**: ${targetChannel.name}\n**发送时间**: ${new Date().toLocaleString('zh-CN')}`,
    level: 'info',
    source: 'hermes-show',
    details: {
      channelId: targetChannel.id,
      platform: targetChannel.platform,
      events: targetChannel.events
    }
  }
  
  // 发送通知
  const result = await sendNotification(testEvent)
  
  return {
    success: result.success,
    channelId: targetChannel.id,
    channelName: targetChannel.name,
    sent: result.sent,
    failed: result.failed,
    channels: result.channels
  }
})
