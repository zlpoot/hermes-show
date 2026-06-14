import { describe, it, expect } from 'vitest'
import { buildDashboardData, parseTimestamp } from '../../server/utils/dashboard'
import { formatTokens, formatTime, formatDate } from '../../server/utils/formatters'

describe('dashboard formatters', () => {
  describe('formatTokens', () => {
    it('returns "0" for zero tokens', () => {
      expect(formatTokens(0)).toBe('0')
    })

    it('returns raw number for values < 1000', () => {
      expect(formatTokens(42)).toBe('42')
      expect(formatTokens(999)).toBe('999')
    })

    it('formats thousands as K with one decimal', () => {
      expect(formatTokens(1000)).toBe('1.0K')
      expect(formatTokens(1500)).toBe('1.5K')
      expect(formatTokens(12345)).toBe('12.3K')
    })

    it('formats millions as M with two decimals', () => {
      expect(formatTokens(1000000)).toBe('1.00M')
      expect(formatTokens(2500000)).toBe('2.50M')
    })

    it('handles edge case 999999 -> 1000.0K', () => {
      expect(formatTokens(999999)).toBe('1000.0K')
    })
  })

  describe('formatTime', () => {
    it('returns "Unknown Time" for null input', () => {
      expect(formatTime(null)).toBe('Unknown Time')
    })

    it('returns "Unknown Time" for undefined-like falsy input', () => {
      expect(formatTime('')).toBe('Unknown Time')
    })

    it('handles numeric Unix timestamp in seconds (today) as HH:mm', () => {
      const now = new Date()
      const todayTs = Math.floor(now.getTime() / 1000)
      const result = formatTime(String(todayTs))
      // Should match HH:mm pattern
      expect(result).toMatch(/^\d{2}:\d{2}$/)
    })

    it('handles numeric Unix timestamp in milliseconds (today) as HH:mm', () => {
      const now = new Date()
      const ts = now.getTime() // ms
      const result = formatTime(String(ts))
      expect(result).toMatch(/^\d{2}:\d{2}$/)
    })

    it('shows date+time for yesterday timestamp', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(10, 0, 0, 0)
      const ts = Math.floor(yesterday.getTime() / 1000)
      const result = formatTime(String(ts))
      // Should include date and time
      expect(result).toMatch(/\d{1,2}月\d{1,2}日 \d{2}:\d{2}/)
    })

    it('handles ISO string date', () => {
      const dateStr = '2026-06-14T10:30:00.000Z'
      const result = formatTime(dateStr)
      expect(result).not.toBe('Unknown Time')
    })

    it('returns "Unknown Time" for invalid date strings', () => {
      expect(formatTime('not-a-date')).toBe('Unknown Time')
    })
  })

  describe('formatDate', () => {
    it('formats an ISO date string to zh-CN short format', () => {
      const result = formatDate('2026-06-14')
      expect(result).toMatch(/\d{1,2}月\d{1,2}日/)
    })

    it('formats a date string with time component', () => {
      const result = formatDate('2026-06-14T10:30:00')
      expect(result).toMatch(/\d{1,2}月\d{1,2}日/)
    })

    it('returns the original string on parse failure', () => {
      const result = formatDate('not-a-date')
      expect(result).toBe('not-a-date')
    })

    it('returns the original string for empty input', () => {
      const result = formatDate('')
      expect(result).toBe('')
    })
  })
})

describe('buildDashboardData', () => {
  const now = new Date('2026-06-14T12:00:00')

  it('returns stable empty dashboard data', () => {
    const data = buildDashboardData([], { now, cpuLoad: '11%', latency: '7ms' })

    expect(data.stats).toMatchObject({
      todayTokens: '0',
      totalSessions: 0,
      todaySessions: 0,
      cpuLoad: '11%',
      activeAgents: 0,
      latency: '7ms',
      avgTokensPerSession: '0'
    })
    expect(data.activeTasks).toEqual([])
    expect(data.chartData.labels).toEqual([])
    expect(data.recentSessions).toEqual([])
  })

  it('calculates dashboard totals from synthetic session rows', () => {
    const todaySeconds = Math.floor(new Date('2026-06-14T09:00:00').getTime() / 1000)
    const todayMillis = new Date('2026-06-14T10:00:00').getTime()
    const yesterdayIso = '2026-06-13T08:30:00'

    const data = buildDashboardData([
      {
        id: 'active-seconds',
        title: 'Active seconds',
        source: 'cli',
        started_at: todaySeconds,
        ended_at: null,
        input_tokens: 1000,
        output_tokens: 500
      },
      {
        id: 'done-millis',
        title: 'Done millis',
        source: 'web',
        started_at: todayMillis,
        ended_at: todayMillis + 1000,
        input_tokens: 200,
        output_tokens: 300
      },
      {
        id: 'active-iso',
        title: 'Active ISO',
        source: 'cron',
        started_at: yesterdayIso,
        ended_at: null,
        input_tokens: 50,
        output_tokens: 50
      }
    ], { now, cpuLoad: '20%', latency: '9ms' })

    expect(data.stats.totalSessions).toBe(3)
    expect(data.stats.todaySessions).toBe(2)
    expect(data.stats.todayTokens).toBe('2.0K')
    expect(data.stats.avgTokensPerSession).toBe('700')
    expect(data.stats.activeAgents).toBe(2)
    expect(data.activeTasks.map(task => task.id)).toEqual(['active-seconds', 'active-iso'])
    expect(data.recentSessions.map(session => session.id)).toEqual([
      'done-millis',
      'active-seconds',
      'active-iso'
    ])
    expect(data.recentSessions[0]?.tokens).toBe(500)
    expect(data.chartData.datasets[0]?.data).toEqual([100, 2000])
  })

  it('ignores invalid timestamps for today counts and trend but keeps sessions', () => {
    const data = buildDashboardData([
      {
        id: 'bad-time',
        title: 'Bad time',
        started_at: 'not-a-date',
        ended_at: 'done',
        input_tokens: 10,
        output_tokens: 20
      }
    ], { now })

    expect(data.stats.totalSessions).toBe(1)
    expect(data.stats.todaySessions).toBe(0)
    expect(data.stats.todayTokens).toBe('0')
    expect(data.chartData.labels).toEqual([])
    expect(data.recentSessions[0]?.id).toBe('bad-time')
  })
})

describe('parseTimestamp', () => {
  it('supports unix seconds, unix milliseconds, and ISO strings', () => {
    expect(parseTimestamp(1770897600)?.toISOString()).toBe('2026-02-12T12:00:00.000Z')
    expect(parseTimestamp(1770897600000)?.toISOString()).toBe('2026-02-12T12:00:00.000Z')
    expect(parseTimestamp('2026-02-12T12:00:00.000Z')?.toISOString()).toBe('2026-02-12T12:00:00.000Z')
  })

  it('returns null for missing or invalid values', () => {
    expect(parseTimestamp(null)).toBeNull()
    expect(parseTimestamp(undefined)).toBeNull()
    expect(parseTimestamp('not-a-date')).toBeNull()
  })
})
