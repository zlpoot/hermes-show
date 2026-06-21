import { formatDate, formatTime, formatTokens } from './formatters'
import { type UnifiedSession, isActiveSession } from './sessions'

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
  /** 数据源统计，前端可展示 "来源：JSONL 46，SQLite 6" */
  _sources?: {
    jsonl: number
    sqlite: number
    merged: number
  }
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
  sessions: UnifiedSession[],
  options: { now?: Date; cpuLoad?: string; latency?: string; sources?: { jsonl: number; sqlite: number; merged: number } } = {}
): DashboardData {
  const now = options.now ?? new Date()
  const nowMs = now.getTime()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTodayMs = startOfToday.getTime()
  const sevenDaysAgo = new Date(startOfToday)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  // 排序（最新的在前）
  const sorted = [...sessions].sort((a, b) => {
    const aTime = a.started_at ?? 0
    const bTime = b.started_at ?? 0
    return bTime - aTime
  })

  // 今日会话
  const todaySessions = sorted.filter(s => {
    return s.started_at != null && s.started_at >= startOfTodayMs && s.started_at <= nowMs
  })

  // 有 token 数据的会话（用于计算平均值）
  const tokenRows = sorted.filter(s => s.input_tokens > 0 || s.output_tokens > 0)

  // 活跃会话：使用时间窗口定义（5 小时内开始且未结束）
  const activeRows = sorted.filter(s => isActiveSession(s, nowMs))

  const stats: DashboardStats = {
    todayTokens: formatTokens(sumTokens(todaySessions)),
    totalSessions: sorted.length,
    todaySessions: todaySessions.length,
    cpuLoad: options.cpuLoad ?? '0%',
    activeAgents: activeRows.length,
    latency: options.latency ?? '0ms',
    avgTokensPerSession: tokenRows.length > 0
      ? formatTokens(sumTokens(tokenRows) / tokenRows.length)
      : '0'
  }

  // Token 趋势（近 7 天）
  const trendByDate = new Map<string, number>()
  for (const session of sorted) {
    if (!session.started_at) continue
    if (session.started_at < sevenDaysAgo.getTime() || session.started_at > nowMs) continue
    const key = toLocalDateKey(new Date(session.started_at))
    trendByDate.set(key, (trendByDate.get(key) ?? 0) + session.input_tokens + session.output_tokens)
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
    recentSessions: sorted.slice(0, 5).map(session => ({
      id: session.id,
      title: session.title || 'Unnamed Session',
      platform: session.source || 'Local',
      time: formatTime(session.started_at == null ? null : String(session.started_at)),
      tokens: session.input_tokens + session.output_tokens
    })),
    _sources: options.sources
  }
}

function sumTokens(rows: UnifiedSession[]): number {
  return rows.reduce((sum, row) => sum + row.input_tokens + row.output_tokens, 0)
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
