import { describe, it, expect } from 'vitest'
import { buildDashboardData, createEmptyDashboardData } from '../../server/utils/dashboard'
import { isActiveSession, type UnifiedSession } from '../../server/utils/sessions'
import { formatTokens, formatTime, formatDate } from '../../server/utils/formatters'

function u(overrides: Partial<UnifiedSession> & { id: string }): UnifiedSession {
  return {
    id: overrides.id,
    title: overrides.title || 'Test Session',
    source: overrides.source || 'cli',
    started_at: overrides.started_at ?? null,
    ended_at: overrides.ended_at ?? null,
    input_tokens: overrides.input_tokens ?? 0,
    output_tokens: overrides.output_tokens ?? 0,
    _origin: overrides._origin ?? 'jsonl',
  }
}

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
      expect(result).toMatch(/^\d{2}:\d{2}$/)
    })

    it('handles numeric Unix timestamp in milliseconds (today) as HH:mm', () => {
      const now = new Date()
      const ts = now.getTime()
      const result = formatTime(String(ts))
      expect(result).toMatch(/^\d{2}:\d{2}$/)
    })

    it('shows date+time for yesterday timestamp', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(10, 0, 0, 0)
      const ts = Math.floor(yesterday.getTime() / 1000)
      const result = formatTime(String(ts))
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

describe('createEmptyDashboardData', () => {
  it('returns stable empty dashboard data', () => {
    const data = createEmptyDashboardData('11%')

    expect(data.stats).toMatchObject({
      todayTokens: '0',
      totalSessions: 0,
      todaySessions: 0,
      cpuLoad: '11%',
      activeAgents: 0,
      avgTokensPerSession: '0'
    })
    expect(data.activeTasks).toEqual([])
    expect(data.chartData.labels).toEqual([])
    expect(data.recentSessions).toEqual([])
    expect(data.lastRefreshTime).toBeDefined()
    // 不应包含调试字段
    expect(data).not.toHaveProperty('_sources')
  })
})

describe('buildDashboardData', () => {
  const now = new Date('2026-06-14T12:00:00')
  const nowMs = now.getTime()

  // 辅助：生成毫秒时间戳
  const ms = (daysOffset: number, hours = 12) => {
    const d = new Date('2026-06-14')
    d.setDate(d.getDate() + daysOffset)
    d.setHours(hours, 0, 0, 0)
    return d.getTime()
  }

  it('returns stable empty dashboard data', () => {
    const data = buildDashboardData([], { now, cpuLoad: '11%' })

    expect(data.stats).toMatchObject({
      todayTokens: '0',
      totalSessions: 0,
      todaySessions: 0,
      cpuLoad: '11%',
      activeAgents: 0,
      avgTokensPerSession: '0'
    })
    expect(data.activeTasks).toEqual([])
    expect(data.chartData.labels).toEqual([])
    expect(data.recentSessions).toEqual([])
    expect(data.lastRefreshTime).toBeDefined()
  })

  it('calculates dashboard totals from synthetic sessions', () => {
    const todayMs = ms(0, 9)   // today 09:00
    const todayMs2 = ms(0, 10) // today 10:00
    const yesterdayMs = ms(-1, 8) // yesterday 08:00

    const data = buildDashboardData([
      u({ id: 'active-today', title: 'Active today', source: 'cli', started_at: todayMs, ended_at: null, input_tokens: 1000, output_tokens: 500 }),
      u({ id: 'done-today', title: 'Done today', source: 'web', started_at: todayMs2, ended_at: todayMs2 + 1000, input_tokens: 200, output_tokens: 300 }),
      u({ id: 'active-yesterday', title: 'Active yesterday', source: 'cron', started_at: yesterdayMs, ended_at: null, input_tokens: 50, output_tokens: 50 }),
    ], { now })

    expect(data.stats.totalSessions).toBe(3)
    expect(data.stats.todaySessions).toBe(2)
    expect(data.stats.todayTokens).toBe('2.0K')
    expect(data.stats.avgTokensPerSession).toBe('700')
    // active-today 在今天 09:00，仍在 5h 窗口内 => 活跃
    // active-yesterday 昨天 08:00，超过 5h 窗口 => 不活跃
    expect(data.stats.activeAgents).toBe(1)
    expect(data.activeTasks.map(task => task.id)).toEqual(['active-today'])
    expect(data.recentSessions.map(s => s.id)).toEqual(['done-today', 'active-today', 'active-yesterday'])
    expect(data.recentSessions[0]?.tokens).toBe(500)
    expect(data.chartData.datasets[0]?.data).toEqual([100, 2000])
  })

  it('does not count old un-ended sessions as active', () => {
    const oldMs = ms(-2, 10) // 2 days ago, 10:00 → 50h ago, far past 5h window

    const data = buildDashboardData([
      u({ id: 'old-stale', title: 'Stale session', started_at: oldMs, ended_at: null }),
    ], { now })

    expect(data.stats.activeAgents).toBe(0)
    expect(data.activeTasks).toEqual([])
  })

  it('counts recent un-ended sessions as active (within 5h)', () => {
    const recentMs = nowMs - 60 * 60 * 1000 // 1 hour ago

    const data = buildDashboardData([
      u({ id: 'recent-unended', title: 'Recent session', started_at: recentMs, ended_at: null }),
    ], { now })

    expect(data.stats.activeAgents).toBe(1)
    expect(data.activeTasks).toHaveLength(1)
    expect(data.activeTasks[0]?.id).toBe('recent-unended')
  })

  it('handles sessions with no token data', () => {
    const data = buildDashboardData([
      u({ id: 'no-tokens', title: 'No tokens', started_at: ms(0, 9) }),
    ], { now })

    expect(data.stats.todayTokens).toBe('0')
    expect(data.stats.avgTokensPerSession).toBe('0')
  })

  it('handles sessions from jsonl+sqlite merge (duplicate IDs)', () => {
    // 模拟 JSONL 和 SQLite 都有相同 id 的会话
    const sessionMs = ms(0, 9)
    const merged = u({
      id: 'merged-session',
      title: 'Merged Title',
      source: 'discord',
      started_at: sessionMs,
      ended_at: null,
      input_tokens: 500,
      output_tokens: 300,
      _origin: 'merged',
    })

    const data = buildDashboardData([merged], { now })

    expect(data.stats.totalSessions).toBe(1)
    expect(data.stats.todaySessions).toBe(1)
    expect(data.stats.activeAgents).toBe(1) // within 5h, un-ended
    expect(data.recentSessions[0]?.id).toBe('merged-session')
    expect(data.recentSessions[0]?.tokens).toBe(800)
  })

  it('generates 7-day token trend chart when token data exists', () => {
    // Sessions spread across 7 days
    const sessions = [-6, -4, -2, 0].map((offset, i) =>
      u({
        id: `day-${offset}`,
        started_at: ms(offset, 10),
        input_tokens: 100,
        output_tokens: 0,
      })
    )

    const data = buildDashboardData(sessions, { now })
    expect(data.chartData.labels.length).toBeGreaterThan(0)
    expect(data.chartData.datasets[0]?.data.length).toBeGreaterThan(0)
    // chartFallbackNote 应为 undefined，因为存在 token 数据
    expect(data.chartFallbackNote).toBeUndefined()
  })

  it('excludes sessions older than 7 days from trend', () => {
    const oldMs = ms(-10, 10) // 10 days ago, outside 7-day window
    const todayMs = ms(0, 10)

    const data = buildDashboardData([
      u({ id: 'old', started_at: oldMs, input_tokens: 9999 }),
      u({ id: 'today', started_at: todayMs, input_tokens: 100 }),
    ], { now })

    // Only today's session should appear in trend
    expect(data.chartData.datasets[0]?.data).toEqual([100])
  })

  it('uses session count trend when no token data exists', () => {
    // Sessions with zero tokens across multiple days
    const sessions = [-6, -3, 0].map((offset, i) =>
      u({
        id: `session-${offset}`,
        started_at: ms(offset, 10),
        input_tokens: 0,
        output_tokens: 0,
      })
    )

    const data = buildDashboardData(sessions, { now })
    // 应该有 chart data（会话数趋势）
    expect(data.chartData.labels.length).toBeGreaterThan(0)
    expect(data.chartData.datasets[0]?.label).toBe('会话数')
    expect(data.chartFallbackNote).toBe('当前数据源无 token 记录，展示会话数趋势')
    // 每天的会话数应为 1
    expect(data.chartData.datasets[0]?.data.every((v: number) => v === 1)).toBe(true)
  })

  it('does not include _sources debug metadata in result', () => {
    const data = buildDashboardData([], { now })
    expect(data).not.toHaveProperty('_sources')
  })

  it('includes lastRefreshTime in result', () => {
    const data = buildDashboardData([], { now })
    expect(data.lastRefreshTime).toBe(now.toISOString())
  })
})

describe('isActiveSession', () => {
  const now = new Date('2026-06-14T12:00:00').getTime()

  it('returns false when started_at is null', () => {
    expect(isActiveSession(u({ id: 'x', started_at: null }), now)).toBe(false)
  })

  it('returns false when ended_at is set', () => {
    expect(isActiveSession(u({ id: 'x', started_at: now - 1000, ended_at: now }), now)).toBe(false)
  })

  it('returns true when un-ended and within 5h', () => {
    expect(isActiveSession(u({ id: 'x', started_at: now - 60 * 60 * 1000 }), now)).toBe(true) // 1h ago
    expect(isActiveSession(u({ id: 'y', started_at: now - 4 * 60 * 60 * 1000 }), now)).toBe(true) // 4h ago
  })

  it('returns false when un-ended but older than 5h', () => {
    expect(isActiveSession(u({ id: 'x', started_at: now - 6 * 60 * 60 * 1000 }), now)).toBe(false) // 6h ago
    expect(isActiveSession(u({ id: 'y', started_at: now - 24 * 60 * 60 * 1000 }), now)).toBe(false) // 1 day ago
  })
})
