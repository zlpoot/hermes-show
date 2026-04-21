import { describe, it, expect } from 'vitest'
import { routeEventToChannel, type NotificationConfig } from '../../server/utils/notify'

describe('notify 工具函数', () => {
  describe('routeEventToChannel', () => {
    const createMockConfig = (overrides: Partial<NotificationConfig> = {}): NotificationConfig => ({
      channels: {},
      defaultChannel: '',
      eventRouting: {},
      severityOverrides: {},
      ...overrides
    })

    it('严重性覆盖优先级最高', () => {
      const config = createMockConfig({
        severityOverrides: { error: 'alerts-channel' },
        eventRouting: { 'task_failed': 'tasks-channel' },
        defaultChannel: 'default-channel'
      })
      
      const result = routeEventToChannel('task_failed', 'error', config)
      
      expect(result).toEqual(['alerts-channel'])
    })

    it('事件路由次优先', () => {
      const config = createMockConfig({
        eventRouting: { 'task_complete': 'tasks-channel' },
        defaultChannel: 'default-channel'
      })
      
      const result = routeEventToChannel('task_complete', 'info', config)
      
      expect(result).toEqual(['tasks-channel'])
    })

    it('默认频道作为兜底', () => {
      const config = createMockConfig({
        defaultChannel: 'default-channel'
      })
      
      const result = routeEventToChannel('unknown_event', 'info', config)
      
      expect(result).toEqual(['default-channel'])
    })

    it('无配置时返回空数组', () => {
      const config = createMockConfig()
      
      const result = routeEventToChannel('any_event', 'info', config)
      
      expect(result).toEqual([])
    })

    it('支持不同的严重性级别', () => {
      const config = createMockConfig({
        severityOverrides: {
          critical: 'critical-channel',
          error: 'error-channel',
          warning: 'warning-channel'
        }
      })
      
      expect(routeEventToChannel('event', 'critical', config)).toEqual(['critical-channel'])
      expect(routeEventToChannel('event', 'error', config)).toEqual(['error-channel'])
      expect(routeEventToChannel('event', 'warning', config)).toEqual(['warning-channel'])
    })

    it('支持多种事件路由', () => {
      const config = createMockConfig({
        eventRouting: {
          'task_complete': 'tasks',
          'gateway': 'gateway-alerts',
          'backup': 'backup-alerts'
        },
        defaultChannel: 'general'
      })
      
      expect(routeEventToChannel('task_complete', 'info', config)).toEqual(['tasks'])
      expect(routeEventToChannel('gateway', 'info', config)).toEqual(['gateway-alerts'])
      expect(routeEventToChannel('backup', 'info', config)).toEqual(['backup-alerts'])
      expect(routeEventToChannel('unknown', 'info', config)).toEqual(['general'])
    })
  })
})
