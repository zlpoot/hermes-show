import { formatTime, formatTokens, formatRelativeDate } from './formatters'
import { type UnifiedSession } from './sessions'

// ── API 返回类型 ──────────────────────────────────

export interface DashboardData {
  /** 运行状态 */
  status: {
    cpuLoad: string
    lastRefreshTime: string
    isHermesConnected: boolean
  }
  /** 数据覆盖概况 */
  coverage: {
    totalSessions: number
    hasTokenSessions: number
    platformDistribution: Record<string, number>
    lastActivityTime: string | null      // 格式化后的时间
    lastActivityDate: string | null      // 相对日期如 "3天前"
    hasRecentActivity: boolean           // 近 7 天是否有活动
    recent7DaySessions: number           // 近 7 天会话数
    todaySessions: number                // 今日会话数
  }
  /** 趋势图数据 */
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
    mode: 'tokens' | 'sessions' | 'empty'
    note?: string
  }
  /** 近期活跃会话（5h 窗口内的未结束会话） */
  recentActiveSessions: Array<{
    id: string
    name: string
    platform: string
    time: string
  }>
  /** 最近会话（最新 5 条） */
  recentSessions: Array<{
    id: string
    title: string      // 已脱敏截断
    platform: string
    time: string
    tokens: number
    hasTokens: boolean
  }>
}

// ── 空状态 ───────────────────────────────────────

export function createEmptyDashboardData(cpuLoad = '0%'): DashboardData {
  return {
    status: { cpuLoad, lastRefreshTime: new Date().toISOString(), isHermesConnected: false },
    coverage: {
      totalSessions: 0,
      hasTokenSessions: 0,
      platformDistribution: {},
      lastActivityTime: null,
      lastActivityDate: null,
      hasRecentActivity: false,
      recent7DaySessions: 0,
      todaySessions: 0,
    },
    chartData: { labels: [], datasets: [], mode: 'empty' },
    recentActiveSessions: [],
    recentSessions: [],
  }
}

// ── 构建函数 ─────────────────────────────────────

export function buildDashboardData(
  sessions: UnifiedSession[],
  options: { now?: Date; cpuLoad?: string } = {}
): DashboardData {
  const now = options.now ?? new Date()
  const nowMs = now.getTime()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTodayMs = startOfToday.getTime()
  const sevenDaysAgo = startOfTodayMs - 6 * 86400_000   // 包括今天共 7 天
  const thirtyDaysAgo = startOfTodayMs - 29 * 86400_000 // 包括今天共 30 天

  // 按时间排序（最新的在前）
  const sorted = [...sessions].sort((a, b) => {
    const aTime = a.started_at ?? 0
    const bTime = b.started_at ?? 0
    return bTime - aTime
  })

  const totalSessions = sorted.length

  // ── 今日会话 ─────────────────────────
  const todaySessions = sorted.filter(s =>
    s.started_at != null && s.started_at >= startOfTodayMs && s.started_at <= nowMs
  )

  // ── 近期7天会话 ────────────────────
  const recent7DaySessions = sorted.filter(s =>
    s.started_at != null && s.started_at >= sevenDaysAgo
  )

  // ── 最后活动时间 ────────────────────
  const latestSession = sorted.find(s => s.started_at != null)
  let lastActivityTime: string | null = null
  let lastActivityDate: string | null = null
  if (latestSession?.started_at) {
    lastActivityTime = formatTime(String(latestSession.started_at))
    lastActivityDate = formatRelativeDate(new Date(latestSession.started_at), now)
  }

  const hasRecentActivity = recent7DaySessions.length > 0

  // ── 平台分布 ────────────────────────
  const platformDistribution: Record<string, number> = {}
  for (const s of sorted) {
    const platform = s.source || 'Unknown'
    platformDistribution[platform] = (platformDistribution[platform] ?? 0) + 1
  }

  // ── Token 覆盖率 ────────────────────
  const hasTokenSessions = sorted.filter(s => s.input_tokens > 0 || s.output_tokens > 0).length

  // ── 活跃会话（5h 窗口内未结束） ─────
  const HOUR_MS = 3600_000
  const activeRows = sorted.filter(s => {
    if (!s.started_at) return false
    if (s.ended_at) return false
    return (nowMs - s.started_at) < 5 * HOUR_MS
  })

  // ── 趋势图（近 30 天） ───────────────
  const tokenTrendByDate = new Map<string, number>()
  const sessionTrendByDate = new Map<string, number>()
  let hasTokenInChart = false

  for (const session of sorted) {
    if (!session.started_at) continue
    if (session.started_at < thirtyDaysAgo || session.started_at > nowMs) continue
    const key = toLocalDateKey(new Date(session.started_at))
    const tokens = session.input_tokens + session.output_tokens
    if (tokens > 0) hasTokenInChart = true
    tokenTrendByDate.set(key, (tokenTrendByDate.get(key) ?? 0) + tokens)
    sessionTrendByDate.set(key, (sessionTrendByDate.get(key) ?? 0) + 1)
  }

  let chartNote: string | undefined
  let chartMode: 'tokens' | 'sessions' | 'empty' = 'empty'

  let chartData: DashboardData['chartData']

  if (hasTokenInChart) {
    chartMode = 'tokens'
    const entries = Array.from(tokenTrendByDate.entries()).sort(([a], [b]) => a.localeCompare(b))
    chartData = {
      labels: entries.map(([d]) => formatLocalDateLabel(d)),
      datasets: [{
        label: 'Tokens',
        data: entries.map(([, v]) => v),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }],
      mode: chartMode,
    }
  } else if (sessionTrendByDate.size > 0) {
    chartMode = 'sessions'
    chartNote = hasRecentActivity
      ? '当前数据源无 token 记录，展示会话数趋势'
      : '近 30 天无会话记录'
    const entries = Array.from(sessionTrendByDate.entries()).sort(([a], [b]) => a.localeCompare(b))
    chartData = {
      labels: entries.map(([d]) => formatLocalDateLabel(d)),
      datasets: [{
        label: '会话数',
        data: entries.map(([, v]) => v),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }],
      mode: chartMode,
      note: chartNote,
    }
  } else {
    // 没有任何 30 天内数据
    if (totalSessions > 0) {
      chartNote = `最近活动在 ${lastActivityTime ?? '未知时间'}，超过 30 天暂无新数据`
    } else {
      chartNote = '暂无会话记录'
    }
    chartData = {
      labels: [],
      datasets: [],
      mode: 'empty',
      note: chartNote,
    }
  }

  // ── 返回 ─────────────────────────────
  return {
    status: {
      cpuLoad: options.cpuLoad ?? '0%',
      lastRefreshTime: now.toISOString(),
      isHermesConnected: totalSessions > 0,
    },
    coverage: {
      totalSessions,
      hasTokenSessions,
      platformDistribution,
      lastActivityTime,
      lastActivityDate,
      hasRecentActivity,
      recent7DaySessions: recent7DaySessions.length,
      todaySessions: todaySessions.length,
    },
    chartData,
    recentActiveSessions: activeRows.slice(0, 10).map(s => ({
      id: s.id,
      name: sanitizeTitle(s.title || 'Unnamed Session'),
      platform: s.source || 'Local',
      time: formatTime(s.started_at == null ? null : String(s.started_at)),
    })),
    recentSessions: sorted.slice(0, 5).map(s => ({
      id: s.id,
      title: sanitizeTitle(s.title || 'Unnamed Session'),
      platform: s.source || 'Local',
      time: formatTime(s.started_at == null ? null : String(s.started_at)),
      tokens: s.input_tokens + s.output_tokens,
      hasTokens: (s.input_tokens + s.output_tokens) > 0,
    })),
  }
}

// ── 辅助函数 ─────────────────────────────────────

/** 脱敏可能包含密钥/敏感信息的会话标题 */
function sanitizeTitle(title: string, maxLen = 60): string {
  // 截断
  let result = title.slice(0, maxLen)
  if (title.length > maxLen) result += '…'

  // 脱敏明显密钥形态：sk-xxx, xoxp-xxx, eyJxxx (JWT)
  result = result.replace(
    /\b(sk-[-a-zA-Z0-9]{15,}|xox[baprs]-[a-zA-Z0-9]{8,}|eyJ[a-zA-Z0-9_-]{10,}\.(eyJ[a-zA-Z0-9_-]{10,}|[A-Za-z0-9_-]{10,})\.?)\b/g,
    (match) => match.slice(0, 8) + '…' + match.slice(-4)
  )

  return result
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatLocalDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    // 显示为 "M月D日"
    return `${d.getMonth() + 1}月${d.getDate()}日`
  } catch {
    return dateStr
  }
}
