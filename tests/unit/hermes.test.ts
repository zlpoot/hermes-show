import { describe, it, expect } from 'vitest'
import { parseLogLine, getPlatformInfo } from '../../server/utils/hermes'

describe('hermes 工具函数', () => {
  describe('parseLogLine', () => {
    it('解析标准格式日志行', () => {
      const line = '2026-04-15 06:39:53,020 INFO Core: Application started'
      const result = parseLogLine(line)
      
      expect(result).toEqual({
        time: '06:39:53',
        level: 'INFO',
        source: 'Core',
        message: 'Application started'
      })
    })

    it('解析带时间戳的标准格式日志', () => {
      const line = '2026-04-21 12:30:45,123 ERROR Database: Connection failed'
      const result = parseLogLine(line)
      
      expect(result.time).toBe('12:30:45')
      expect(result.level).toBe('ERROR')
      expect(result.source).toBe('Database')
      expect(result.message).toBe('Connection failed')
    })

    it('解析方括号格式日志行', () => {
      const line = '[14:30:01] [INFO] [Core] Application initialized'
      const result = parseLogLine(line)
      
      expect(result).toEqual({
        time: '14:30:01',
        level: 'INFO',
        source: 'Core',
        message: 'Application initialized'
      })
    })

    it('解析带多个空格的方括号格式', () => {
      const line = '[10:00:00]   [WARNING]   [Network]   Timeout occurred'
      const result = parseLogLine(line)
      
      expect(result.time).toBe('10:00:00')
      expect(result.level).toBe('WARNING')
      expect(result.source).toBe('Network')
      expect(result.message).toBe('Timeout occurred')
    })

    it('对未知格式返回默认值', () => {
      const line = 'This is a plain message without format'
      const result = parseLogLine(line)
      
      expect(result).toEqual({
        time: '',
        level: 'INFO',
        source: 'System',
        message: 'This is a plain message without format'
      })
    })

    it('处理空行', () => {
      const result = parseLogLine('')
      
      expect(result).toEqual({
        time: '',
        level: 'INFO',
        source: 'System',
        message: ''
      })
    })

    it('解析不同日志级别', () => {
      const levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
      
      levels.forEach(level => {
        const line = `2026-04-21 10:00:00,000 ${level} Module: Test message`
        const result = parseLogLine(line)
        expect(result.level).toBe(level)
      })
    })
  })

  describe('getPlatformInfo', () => {
    it('返回平台信息对象', () => {
      const info = getPlatformInfo()
      
      expect(info).toHaveProperty('platform')
      expect(info).toHaveProperty('isWindows')
      expect(info).toHaveProperty('isMac')
      expect(info).toHaveProperty('isLinux')
      expect(info).toHaveProperty('isWSL')
      expect(info).toHaveProperty('homedir')
      expect(info).toHaveProperty('hermesPath')
    })

    it('平台检测是互斥的', () => {
      const info = getPlatformInfo()
      
      // 只有一个平台应该是 true
      const platformCount = [info.isWindows, info.isMac, info.isLinux].filter(Boolean).length
      expect(platformCount).toBe(1)
    })

    it('homedir 是有效路径', () => {
      const info = getPlatformInfo()
      
      expect(typeof info.homedir).toBe('string')
      expect(info.homedir.length).toBeGreaterThan(0)
    })
  })
})
