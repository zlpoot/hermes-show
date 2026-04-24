import fs from 'node:fs'
import path from 'node:path'
import { getHermesPath } from '../../utils/hermes'
import type { NotificationChannel, NotificationConfig } from '../../types/notification'

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
  
  // 返回默认配置
  return {
    channels: [],
    event_types: {
      critical: ['system_down', 'gateway_failed', 'budget_exceeded'],
      error: ['api_error', 'task_failed', 'cron_failed'],
      warning: ['budget_warning', 'rate_limit', 'disk_space'],
      info: ['task_complete', 'cron_complete', 'backup_complete']
    }
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
      const channel = config.channels.find(c => c.id === query.channelId)
      if (!channel) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Channel not found'
        })
      }
      return {
        success: true,
        channel
      }
    }
    
    // 返回所有频道
    return {
      success: true,
      channels: config.channels,
      event_types: config.event_types,
      stats: {
        total: config.channels.length,
        enabled: config.channels.filter(c => c.enabled).length,
        platforms: {
          discord: config.channels.filter(c => c.platform === 'discord').length,
          telegram: config.channels.filter(c => c.platform === 'telegram').length,
          weixin: config.channels.filter(c => c.platform === 'weixin').length
        }
      }
    }
  }
  
  if (method === 'POST') {
    // 创建新频道
    const body = await readBody(event)
    
    if (!body.id || !body.platform || !body.name || !body.channel_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: id, platform, name, channel_id'
      })
    }
    
    if (config.channels.find(c => c.id === body.id)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Channel already exists'
      })
    }
    
    // 创建新频道
    const newChannel: NotificationChannel = {
      id: body.id,
      name: body.name,
      platform: body.platform,
      channel_id: body.channel_id,
      events: body.events || ['*'],
      enabled: body.enabled !== false
    }
    
    config.channels.push(newChannel)
    
    if (!saveNotificationConfig(config)) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save configuration'
      })
    }
    
    return {
      success: true,
      channel: newChannel,
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
    
    const channelIndex = config.channels.findIndex(c => c.id === body.id)
    if (channelIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Channel not found'
      })
    }
    
    // 更新频道配置
    const channel = config.channels[channelIndex]
    if (body.name) channel.name = body.name
    if (body.platform) channel.platform = body.platform
    if (body.channel_id) channel.channel_id = body.channel_id
    if (body.events) channel.events = body.events
    if (body.enabled !== undefined) channel.enabled = body.enabled
    
    if (!saveNotificationConfig(config)) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save configuration'
      })
    }
    
    return {
      success: true,
      channel,
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
    
    const channelIndex = config.channels.findIndex(c => c.id === channelId)
    if (channelIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Channel not found'
      })
    }
    
    // 删除频道
    config.channels.splice(channelIndex, 1)
    
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
