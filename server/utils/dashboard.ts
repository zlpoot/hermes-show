import { formatDate, formatTime, formatTokens } from './formatters'

export interface DashboardSessionRow {
  id: string
  title?: string | null
  source?: string | null
  started_at?: string | number | null
  ended_at?: string | number | null
  input_tokens?: number | null
  output_tokens?: number | null
}

export interface DashboardStats {
  todayTokens: string
  totalSessions: number
  todaySessions: number
  cpuLoad: string
  activeAgents: number
  latency: string
  avgTokensPerSession: string
}

export interface DashboardData {
  stats: DashboardStats
  activeTasks: Array<{
    id: string
    name: string
    agent: string
    platform: string
    time: string
  }>
  chartData: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
      fill: boolean
      tension: number
    }>
  }
  recentSessions: Array<{
    id: string
    title: string
    platform: string
    time: string
    tokens: number
  }>
}

export function createEmptyDashboardData(
  cpuLoad = '0%',
  latency = '0ms'
): DashboardData {
  return {
    stats: {
      todayTokens: '0',
      totalSessions: 0,
      todaySessions: 0,
      cpuLoad,
      activeAgents: 0,
      latency,
      avgTokensPerSession: '0'
    },
    activeTasks: [],
    chartData: { labels: [], datasets: [] },
    recentSessions: []
  }
}

export function buildDashboardData(
  sessions: DashboardSessionRow[],
  options: { now?: Date; cpuLoad?: string; latency?: string } = {}
): DashboardData {
  const now = options.now ?? new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(startOfToday)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const normalized = sessions
    .map(session => {
      const startedAt = parseTimestamp(session.started_at)
      const inputTokens = Number(session.input_tokens ?? 0) || 0
      const outputTokens = Number(session.output_tokens ?? 0) || 0
      return {
        ...session,
        startedAt,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      }
    })
    .sort((a, b) => {
      const aTime = a.startedAt?.getTime() ?? 0
      const bTime = b.startedAt?.getTime() ?? 0
      return bTime - aTime
    })

  const todaySessions = normalized.filter(session => {
    return !!session.startedAt && session.startedAt >= startOfToday && session.startedAt <= now
  })

  const tokenRows = normalized.filter(session => {
    return session.input_tokens != null || session.output_tokens != null
  })

  const activeRows = normalized.filter(session => session.ended_at == null)

  const stats: DashboardStats = {
    todayTokens: formatTokens(sumTokens(todaySessions)),
    totalSessions: normalized.length,
    todaySessions: todaySessions.length,
    cpuLoad: options.cpuLoad ?? '0%',
    activeAgents: activeRows.length,
    latency: options.latency ?? '0ms',
    avgTokensPerSession: tokenRows.length > 0
      ? formatTokens(sumTokens(tokenRows) / tokenRows.length)
      : '0'
  }

  const trendByDate = new Map<string, number>()
  for (const session of normalized) {
    if (!session.startedAt) continue
    if (session.startedAt < sevenDaysAgo || session.startedAt > now) continue
    const key = toLocalDateKey(session.startedAt)
    trendByDate.set(key, (trendByDate.get(key) ?? 0) + session.totalTokens)
  }

  const trendEntries = Array.from(trendByDate.entries()).sort(([a], [b]) => a.localeCompare(b))
  const chartData = trendEntries.length > 0
    ? {
        labels: trendEntries.map(([date]) => formatDate(date)),
        datasets: [
          {
            label: 'Tokens',
            data: trendEntries.map(([, total]) => total),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      }
    : { labels: [], datasets: [] }

  return {
    stats,
    activeTasks: activeRows.slice(0, 10).map(session => ({
      id: session.id,
      name: session.title || 'Unnamed Task',
      agent: 'hermes-core',
      platform: session.source || 'Local',
      time: formatTime(session.started_at == null ? null : String(session.started_at))
    })),
    chartData,
    recentSessions: normalized.slice(0, 5).map(session => ({
      id: session.id,
      title: session.title || 'Unnamed Session',
      platform: session.source || 'Local',
      time: formatTime(session.started_at == null ? null : String(session.started_at)),
      tokens: session.totalTokens
    }))
  }
}

export function parseTimestamp(value: string | number | null | undefined): Date | null {
  if (value == null || value === '') return null

  const numeric = Number(value)
  const date = Number.isFinite(numeric)
    ? new Date(numeric < 10000000000 ? numeric * 1000 : numeric)
    : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function sumTokens(rows: Array<{ totalTokens: number }>): number {
  return rows.reduce((sum, row) => sum + row.totalTokens, 0)
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
