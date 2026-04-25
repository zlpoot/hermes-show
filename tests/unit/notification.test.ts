import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getEventLevel,
  matchChannels,
  formatDiscordMessage,
  type NotificationChannel,
  type NotificationConfig,
  type NotificationEvent
} from '../../server/utils/notification'

// Mock getHermesPath
vi.mock('../../server/utils/hermes', () => ({
  getHermesPath: () => '/tmp/.hermes-test'
}))

describe('notification 工具函数', () => {
  describe('getEventLevel', () => {
    it('根据事件类型返回正确级别', () => {
      // 测试默认配置下的事件级别映射
      expect(getEventLevel('system_down')).toBe('critical')
      expect(getEventLevel('gateway_failed')).toBe('critical')
      expect(getEventLevel('budget_exceeded')).toBe('critical')
      
      expect(getEventLevel('api_error')).toBe('error')
      expect(getEventLevel('task_failed')).toBe('error')
      expect(getEventLevel('cron_failed')).toBe('error')
      
      expect(getEventLevel('budget_warning')).toBe('warning')
      expect(getEventLevel('rate_limit')).toBe('warning')
      
      expect(getEventLevel('task_complete')).toBe('info')
      expect(getEventLevel('cron_complete')).toBe('info')
      expect(getEventLevel('backup_complete')).toBe('info')
    })

    it('未知事件类型返回 info 级别', () => {
      expect(getEventLevel('unknown_event')).toBe('info')
      expect(getEventLevel('random_event')).toBe('info')
    })
  })

  describe('formatDiscordMessage', () => {
    it('格式化基本信息', () => {
      const event: NotificationEvent = {
        type: 'task_complete',
        title: '任务完成',
        message: '备份任务已成功完成',
      }
      
      const message = formatDiscordMessage(event)
      
      expect(message.embeds).toBeDefined()
      expect(message.embeds).toHaveLength(1)
      expect(message.embeds[0].title).toContain('任务完成')
      expect(message.embeds[0].description).toBe('备份任务已成功完成')
    })

    it('根据级别设置正确的颜色', () => {
      const criticalEvent: NotificationEvent = {
        type: 'system_down',
        title: '系统宕机',
        message: '系统严重故障',
        level: 'critical'
      }
      expect(formatDiscordMessage(criticalEvent).embeds[0].color).toBe(0xDC2626) // red-600

      const errorEvent: NotificationEvent = {
        type: 'task_failed',
        title: '任务失败',
        message: '任务执行失败',
        level: 'error'
      }
      expect(formatDiscordMessage(errorEvent).embeds[0].color).toBe(0xEF4444) // red-500

      const warningEvent: NotificationEvent = {
        type: 'budget_warning',
        title: '预算警告',
        message: '预算即将耗尽',
        level: 'warning'
      }
      expect(formatDiscordMessage(warningEvent).embeds[0].color).toBe(0xF59E0B) // amber-500

      const infoEvent: NotificationEvent = {
        type: 'task_complete',
        title: '任务完成',
        message: '任务已完成',
        level: 'info'
      }
      expect(formatDiscordMessage(infoEvent).embeds[0].color).toBe(0x3B82F6) // blue-500
    })

    it('添加来源字段', () => {
      const event: NotificationEvent = {
        type: 'task_complete',
        title: '任务完成',
        message: '任务已完成',
        source: 'cron-backup'
      }
      
      const message = formatDiscordMessage(event)
      
      expect(message.embeds[0].fields).toContainEqual({
        name: '来源',
        value: 'cron-backup',
        inline: true
      })
    })

    it('添加详情字段 (字符串)', () => {
      const event: NotificationEvent = {
        type: 'task_complete',
        title: '任务完成',
        message: '任务已完成',
        details: '处理了 100 个文件'
      }
      
      const message = formatDiscordMessage(event)
      
      expect(message.embeds[0].fields).toContainEqual({
        name: '详情',
        value: '处理了 100 个文件',
        inline: false
      })
    })

    it('添加详情字段 (对象)', () => {
      const event: NotificationEvent = {
        type: 'task_complete',
        title: '任务完成',
        message: '任务已完成',
        details: { files: 100, time: '5s' }
      }
      
      const message = formatDiscordMessage(event)
      
      expect(message.embeds[0].fields.some(f => 
        f.name === '详情' && 
        f.value.includes('files') && 
        f.value.includes('100')
      )).toBe(true)
    })

    it('添加建议操作字段', () => {
      const event: NotificationEvent = {
        type: 'budget_warning',
        title: '预算警告',
        message: '预算即将耗尽',
        suggestion: '请检查预算设置或增加预算限额'
      }
      
      const message = formatDiscordMessage(event)
      
      expect(message.embeds[0].fields).toContainEqual({
        name: '建议操作',
        value: '请检查预算设置或增加预算限额',
        inline: false
      })
    })

    it('处理 @here 提及', () => {
      const event: NotificationEvent = {
        type: 'system_down',
        title: '系统宕机',
        message: '系统严重故障',
        level: 'critical',
        mention: 'here'
      }
      
      const message = formatDiscordMessage(event)
      
      expect(message.content).toBe('@here ')
    })

    it('处理 @everyone 提及', () => {
      const event: NotificationEvent = {
        type: 'system_down',
        title: '系统宕机',
        message: '系统严重故障',
        level: 'critical',
        mention: 'everyone'
      }
      
      const message = formatDiscordMessage(event)
      
      expect(message.content).toBe('@everyone ')
    })

    it('添加事件类型 Footer', () => {
      const event: NotificationEvent = {
        type: 'task_complete',
        title: '任务完成',
        message: '任务已完成'
      }
      
      const message = formatDiscordMessage(event)
      
      expect(message.embeds[0].footer.text).toBe('事件类型: task_complete')
    })

    it('包含时间戳', () => {
      const event: NotificationEvent = {
        type: 'task_complete',
        title: '任务完成',
        message: '任务已完成'
      }
      
      const message = formatDiscordMessage(event)
      
      expect(message.embeds[0].timestamp).toBeDefined()
      // 验证是 ISO 格式时间戳
      expect(() => new Date(message.embeds[0].timestamp)).not.toThrow()
    })
  })
})
