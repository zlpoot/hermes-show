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

    it('returns "Unknown Time" for empty input', () => {
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
  it('returns stable empty dashboard data without zero stat cards', () => {
    const data = createEmptyDashboardData('11%')

    expect(data.status.cpuLoad).toBe('11%')
    expect(data.status.isHermesConnected).toBe(false)
    expect(data.status.lastRefreshTime).toBeDefined()

    expect(data.coverage.totalSessions).toBe(0)
    expect(data.coverage.hasTokenSessions).toBe(0)
    expect(data.coverage.platformDistribution).toEqual({})
    expect(data.coverage.lastActivityTime).toBeNull()
    expect(data.coverage.lastActivityDate).toBeNull()
    expect(data.coverage.hasRecentActivity).toBe(false)

    expect(data.chartData.mode).toBe('empty')
    expect(data.chartData.labels).toEqual([])

    expect(data.recentActiveSessions).toEqual([])
    expect(data.recentSessions).toEqual([])

    expect(data).not.toHaveProperty('stats')
    expect(data).not.toHaveProperty('_sources')
    expect(data).not.toHaveProperty('activeTasks')
    expect(data).not.toHaveProperty('chartFallbackNote')
  })
})

describe('buildDashboardData', () => {
  const now = new Date('2026-06-14T12:00:00')
  const nowMs = now.getTime()

  const ms = (daysOffset: number, hours = 12) => {
    const d = new Date('2026-06-14')
    d.setDate(d.getDate() + daysOffset)
    d.setHours(hours, 0, 0, 0)
    return d.getTime()
  }

  it('returns empty dashboard data for empty sessions', () => {
    const data = buildDashboardData([], { now, cpuLoad: '11%' })

    expect(data.status.cpuLoad).toBe('11%')
    expect(data.status.isHermesConnected).toBe(false)
    expect(data.coverage.totalSessions).toBe(0)
    expect(data.coverage.hasTokenSessions).toBe(0)
    expect(data.coverage.lastActivityTime).toBeNull()
    expect(data.chartData.mode).toBe('empty')
    expect(data.recentActiveSessions).toEqual([])
    expect(data.recentSessions).toEqual([])
  })

  it('calculates dashboard totals and coverage', () => {
    const todayMs = ms(0, 9)
    const todayMs2 = ms(0, 10)
    const yesterdayMs = ms(-1, 8)

    const data = buildDashboardData([
      u({ id: 'active-today', title: 'Active today', source: 'cli', started_at: todayMs, ended_at: null, input_tokens: 1000, output_tokens: 500 }),
      u({ id: 'done-today', title: 'Done today', source: 'web', started_at: todayMs2, ended_at: todayMs2 + 1000, input_tokens: 200, output_tokens: 300 }),
      u({ id: 'active-yesterday', title: 'Active yesterday', source: 'cron', started_at: yesterdayMs, ended_at: null, input_tokens: 50, output_tokens: 50 }),
    ], { now })

    expect(data.status.isHermesConnected).toBe(true)
    expect(data.coverage.totalSessions).toBe(3)
    expect(data.coverage.todaySessions).toBe(2)
    expect(data.coverage.hasRecentActivity).toBe(true)
    expect(data.coverage.hasTokenSessions).toBe(3)
    expect(data.coverage.lastActivityTime).toBeDefined()
    expect(data.coverage.lastActivityDate).toBe('今天')
    expect(data.coverage.platformDistribution).toEqual({ cli: 1, web: 1, cron: 1 })
    expect(data.recentActiveSessions.map(s => s.id)).toEqual(['active-today'])
    expect(data.recentSessions.map(s => s.id)).toEqual(['done-today', 'active-today', 'active-yesterday'])
    expect(data.recentSessions[0]?.hasTokens).toBe(true)
  })

  it('does not count old un-ended sessions as active', () => {
    const oldMs = ms(-2, 10)
    const data = buildDashboardData([
      u({ id: 'old-stale', title: 'Stale session', started_at: oldMs, ended_at: null }),
    ], { now })
    expect(data.recentActiveSessions).toEqual([])
  })

  it('counts recent un-ended sessions as active (within 5h)', () => {
    const recentMs = nowMs - 60 * 60 * 1000
    const data = buildDashboardData([
      u({ id: 'recent-unended', title: 'Recent session', started_at: recentMs, ended_at: null }),
    ], { now })
    expect(data.recentActiveSessions).toHaveLength(1)
    expect(data.recentActiveSessions[0]?.id).toBe('recent-unended')
  })

  it('handles sessions with no token data', () => {
    const data = buildDashboardData([
      u({ id: 'no-tokens', title: 'No tokens', started_at: ms(0, 9) }),
    ], { now })
    expect(data.coverage.hasTokenSessions).toBe(0)
    expect(data.coverage.totalSessions).toBe(1)
    expect(data.recentSessions[0]?.hasTokens).toBe(false)
  })

  it('handles sessions from jsonl+sqlite merge (duplicate IDs)', () => {
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
    expect(data.coverage.totalSessions).toBe(1)
    expect(data.coverage.todaySessions).toBe(1)
    expect(data.coverage.hasTokenSessions).toBe(1)
    expect(data.recentActiveSessions).toHaveLength(1)
    expect(data.recentSessions[0]?.id).toBe('merged-session')
    expect(data.recentSessions[0]?.tokens).toBe(800)
  })

  it('generates trend chart with 30-day window when token data exists', () => {
    const sessions = [-28, -14, -2, 0].map((offset, i) =>
      u({ id: `day-${offset}`, started_at: ms(offset, 10), input_tokens: 100, output_tokens: 0 })
    )

    const data = buildDashboardData(sessions, { now })
    expect(data.chartData.mode).toBe('tokens')
    expect(data.chartData.labels.length).toBeGreaterThan(0)
    expect(data.chartData.datasets[0]?.data.length).toBeGreaterThan(0)
    expect(data.chartData.note).toBeUndefined()
  })

  it('excludes sessions older than 30 days from trend', () => {
    const oldMs = ms(-35, 10)
    const todayMs = ms(0, 10)

    const data = buildDashboardData([
      u({ id: 'old', started_at: oldMs, input_tokens: 9999 }),
      u({ id: 'today', started_at: todayMs, input_tokens: 100 }),
    ], { now })

    expect(data.chartData.mode).toBe('tokens')
    expect(data.chartData.datasets[0]?.data).toEqual([100])
  })

  it('uses session count trend when no token data exists', () => {
    const sessions = [-6, -3, 0].map((offset, i) =>
      u({ id: `session-${offset}`, started_at: ms(offset, 10), input_tokens: 0, output_tokens: 0 })
    )

    const data = buildDashboardData(sessions, { now })
    expect(data.chartData.mode).toBe('sessions')
    expect(data.chartData.datasets[0]?.label).toBe('会话数')
    expect(data.chartData.note).toContain('无 token')
    expect(data.chartData.datasets[0]?.data.every((v: number) => v === 1)).toBe(true)
  })

  it('shows empty chart with note when no 30-day activity', () => {
    const oldMs = ms(-100, 10)
    const data = buildDashboardData([
      u({ id: 'old-only', started_at: oldMs, input_tokens: 100 }),
    ], { now })

    expect(data.chartData.mode).toBe('empty')
    expect(data.chartData.note).toContain('最近活动')
  })

  it('does not include _sources debug metadata', () => {
    const data = buildDashboardData([], { now })
    expect(data).not.toHaveProperty('_sources')
    expect(data).not.toHaveProperty('stats')
    expect(data).not.toHaveProperty('activeTasks')
    expect(data).not.toHaveProperty('chartFallbackNote')
  })

  it('includes lastRefreshTime in status', () => {
    const data = buildDashboardData([], { now })
    expect(data.status.lastRefreshTime).toBe(now.toISOString())
  })

  it('sanitizes session titles with sk- API key pattern', () => {
    const data = buildDashboardData([
      u({ id: 'secret', title: 'sk-ant-xJ3kL9mQ2pR5vW8n', started_at: ms(0, 9) }),
    ], { now })

    const title = data.recentSessions[0]?.title ?? ''
    expect(title).toMatch(/^sk-ant-/)
    expect(title).toContain('…')
    expect(title).not.toBe('sk-ant-xJ3kL9mQ2pR5vW8n')
    expect(title.length).toBeLessThan('sk-ant-xJ3kL9mQ2pR5vW8n'.length)
  })

  it('truncates long session titles', () => {
    const longTitle = 'A'.repeat(200)
    const data = buildDashboardData([
      u({ id: 'long', title: longTitle, started_at: ms(0, 9) }),
    ], { now })

    expect(data.recentSessions[0]?.title.length).toBeLessThan(70)
    expect(data.recentSessions[0]?.title).toMatch(/…$/)
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
    expect(isActiveSession(u({ id: 'x', started_at: now - 60 * 60 * 1000 }), now)).toBe(true)
    expect(isActiveSession(u({ id: 'y', started_at: now - 4 * 60 * 60 * 1000 }), now)).toBe(true)
  })

  it('returns false when un-ended but older than 5h', () => {
    expect(isActiveSession(u({ id: 'x', started_at: now - 6 * 60 * 60 * 1000 }), now)).toBe(false)
    expect(isActiveSession(u({ id: 'y', started_at: now - 24 * 60 * 60 * 1000 }), now)).toBe(false)
  })
})
