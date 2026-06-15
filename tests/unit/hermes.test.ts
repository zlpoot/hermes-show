import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { parseLogLine, getPlatformInfo, getHermesLogFiles, getHermesStatus, getHermesLogs } from '../../server/utils/hermes'
import path from 'node:path'
import os from 'node:os'

// Fixture paths
const fixtureHermesPath = path.resolve(__dirname, '../fixtures/hermes-history')
const fixtureNoLogsPath = path.resolve(__dirname, '../fixtures/hermes-null-logs')
const nonexistentPath = path.join(os.tmpdir(), '__hermes_test_does_not_exist__')

describe('hermes 工具函数', () => {
  // Save original env value
  const originalEnv = process.env.NUXT_HERMES_PATH

  beforeEach(() => {
    process.env.NUXT_HERMES_PATH = fixtureHermesPath
  })

  afterEach(() => {
    if (originalEnv) {
      process.env.NUXT_HERMES_PATH = originalEnv
    } else {
      delete process.env.NUXT_HERMES_PATH
    }
  })

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

  describe('getHermesLogFiles', () => {
    it('返回按修改时间降序排列的日志文件列表', () => {
      const files = getHermesLogFiles()

      expect(files.length).toBeGreaterThanOrEqual(2)
      expect(files).toContain('agent.log')
      expect(files).toContain('gateway.log')
      // First file should be the most recently modified
      expect(files[0]).toBeTruthy()
    })

    it('只返回 .log 后缀的文件', () => {
      const files = getHermesLogFiles()
      files.forEach(f => {
        expect(f.endsWith('.log')).toBe(true)
      })
    })

    it('日志目录不存在时返回空数组', () => {
      process.env.NUXT_HERMES_PATH = fixtureNoLogsPath
      const files = getHermesLogFiles()
      expect(files).toEqual([])
    })
  })

  describe('getHermesStatus', () => {
    it('Hermes 路径存在且有日志目录时返回 ok', () => {
      const status = getHermesStatus()
      expect(status).toBe('ok')
    })

    it('Hermes 路径存在但无 logs 目录时返回 no-logs-dir', () => {
      process.env.NUXT_HERMES_PATH = fixtureNoLogsPath
      const status = getHermesStatus()
      expect(status).toBe('no-logs-dir')
    })
  })

  describe('getHermesLogs', () => {
    it('读取指定日志文件的后 N 行', () => {
      const lines = getHermesLogs('agent.log', 5)
      expect(lines).not.toBeNull()
      expect(lines!.length).toBeLessThanOrEqual(5)
      expect(lines!.length).toBeGreaterThan(0)
      // Last line should mention memory consolidation
      const lastLine = lines![lines!.length - 1]
      expect(lastLine).toContain('Memory')
    })

    it('不存在的文件返回 null', () => {
      const result = getHermesLogs('nonexistent.log', 100)
      expect(result).toBeNull()
    })

    it('linesCount 参数控制返回行数', () => {
      const allLines = getHermesLogs('agent.log', 100)
      const fewLines = getHermesLogs('agent.log', 3)
      expect(allLines!.length).toBeGreaterThan(fewLines!.length)
      expect(fewLines!.length).toBe(3)
    })

    it('gateway.log 文件也能正常读取', () => {
      const lines = getHermesLogs('gateway.log', 50)
      expect(lines).not.toBeNull()
      expect(lines!.length).toBeGreaterThan(0)
      // First line should contain Gateway
      expect(lines![0]).toContain('Gateway:')
      const lastLine = lines![lines!.length - 1]
      expect(lastLine).toContain('Gateway:')
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
