import fs from 'node:fs'
import path from 'node:path'
import { getHermesPath } from '../../utils/hermes'

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
function loadNotificationConfig(): NotificationConfig {
  const configPath = path.join(getHermesPath(), 'notification_channels.json')
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8')
      return JSON.parse(content)
    }
  } catch (e) {
    console.error('[notification-channels] Failed to load config', e)
  }
  
  return {
    channels: {},
    defaultChannel: '',
    eventRouting: {},
    severityOverrides: {}
  }
}

// 保存频道配置
function saveNotificationConfig(config: NotificationConfig): boolean {
  const configPath = path.join(getHermesPath(), 'notification_channels.json')
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    return true
  } catch (e) {
    console.error('[notification-channels] Failed to save config', e)
    return false
  }
}

// GET /api/notification-channels - 获取所有频道配置
export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const config = loadNotificationConfig()
  
  if (method === 'GET') {
    // 查询参数
    const query = getQuery(event)
    
    // 返回特定频道
    if (query.channelId) {
      const channel = config.channels[query.channelId as string]
      if (!channel) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Channel not found'
        })
      }
      return {
        success: true,
        channel: {
          id: query.channelId,
          ...channel
        }
      }
    }
    
    // 返回所有频道
    const channelsList = Object.entries(config.channels).map(([id, channel]) => ({
      id,
      ...channel,
      // 隐藏敏感信息
      webhookUrl: channel.webhookUrl ? '***configured***' : undefined
    }))
    
    return {
      success: true,
      channels: channelsList,
      defaultChannel: config.defaultChannel,
      eventRouting: config.eventRouting,
      severityOverrides: config.severityOverrides,
      stats: {
        total: channelsList.length,
        enabled: channelsList.filter(c => c.enabled).length,
        healthy: channelsList.filter(c => c.status === 'healthy').length
      }
    }
  }
  
  if (method === 'POST') {
    // 创建新频道
    const body = await readBody(event)
    
    if (!body.id || !body.type || !body.name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: id, type, name'
      })
    }
    
    if (config.channels[body.id]) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Channel already exists'
      })
    }
    
    // 创建新频道
    const newChannel: NotificationChannel = {
      type: body.type,
      name: body.name,
      description: body.description || '',
      channelId: body.channelId || '',
      webhookUrl: body.webhookUrl || '',
      events: body.events || [],
      enabled: body.enabled !== false,
      status: 'healthy'
    }
    
    config.channels[body.id] = newChannel
    
    // 设置为默认频道（如果是第一个）
    if (Object.keys(config.channels).length === 1) {
      config.defaultChannel = body.id
    }
    
    // 更新事件路由
    for (const event of newChannel.events) {
      config.eventRouting[event] = body.id
    }
    
    if (!saveNotificationConfig(config)) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save configuration'
      })
    }
    
    return {
      success: true,
      channel: {
        id: body.id,
        ...newChannel,
        webhookUrl: newChannel.webhookUrl ? '***configured***' : undefined
      },
      message: 'Channel created successfully'
    }
  }
  
  if (method === 'PUT') {
    // 更新频道
    const body = await readBody(event)
    
    if (!body.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required field: id'
      })
    }
    
    const existingChannel = config.channels[body.id]
    if (!existingChannel) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Channel not found'
      })
    }
    
    // 更新频道配置
    if (body.name) existingChannel.name = body.name
    if (body.description !== undefined) existingChannel.description = body.description
    if (body.channelId !== undefined) existingChannel.channelId = body.channelId
    if (body.webhookUrl !== undefined) existingChannel.webhookUrl = body.webhookUrl
    if (body.events) existingChannel.events = body.events
    if (body.enabled !== undefined) existingChannel.enabled = body.enabled
    if (body.status) existingChannel.status = body.status
    
    // 更新事件路由
    if (body.events) {
      // 移除旧的路由
      for (const key of Object.keys(config.eventRouting)) {
        if (config.eventRouting[key] === body.id && !body.events.includes(key)) {
          delete config.eventRouting[key]
        }
      }
      // 添加新的路由
      for (const event of body.events) {
        config.eventRouting[event] = body.id
      }
    }
    
    // 更新默认频道
    if (body.isDefault) {
      config.defaultChannel = body.id
    }
    
    if (!saveNotificationConfig(config)) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save configuration'
      })
    }
    
    return {
      success: true,
      channel: {
        id: body.id,
        ...existingChannel,
        webhookUrl: existingChannel.webhookUrl ? '***configured***' : undefined
      },
      message: 'Channel updated successfully'
    }
  }
  
  if (method === 'DELETE') {
    // 删除频道
    const query = getQuery(event)
    const channelId = query.channelId as string
    
    if (!channelId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required query parameter: channelId'
      })
    }
    
    if (!config.channels[channelId]) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Channel not found'
      })
    }
    
    // 删除频道
    delete config.channels[channelId]
    
    // 移除相关的事件路由
    for (const key of Object.keys(config.eventRouting)) {
      if (config.eventRouting[key] === channelId) {
        delete config.eventRouting[key]
      }
    }
    
    // 更新默认频道
    if (config.defaultChannel === channelId) {
      const remainingChannels = Object.keys(config.channels)
      config.defaultChannel = remainingChannels[0] || ''
    }
    
    if (!saveNotificationConfig(config)) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save configuration'
      })
    }
    
    return {
      success: true,
      message: 'Channel deleted successfully',
      deletedChannelId: channelId
    }
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})
