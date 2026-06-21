/**
 * Token count formatting: 0, 1.5K, 2.3M
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return (tokens / 1000000).toFixed(2) + 'M'
  } else if (tokens >= 1000) {
    return (tokens / 1000).toFixed(1) + 'K'
  }
  return tokens.toString()
}

/**
 * Session timestamp formatting.
 * Today: shows only time (HH:mm).
 * Older dates: shows short date + time.
 */
export function formatTime(startedAt: string | null): string {
  if (!startedAt) return 'Unknown Time'

  const isNumeric = !isNaN(Number(startedAt))
  let date: Date
  if (isNumeric) {
    const ts = Number(startedAt)
    date = new Date(ts < 10000000000 ? ts * 1000 : ts)
  } else {
    date = new Date(startedAt)
  }

  if (isNaN(date.getTime())) return 'Unknown Time'

  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return (
    date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) +
    ' ' +
    date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  )
}

/**
 * Relative date formatting — returns "N天前" / "今天" / "昨天" etc.
 */
export function formatRelativeDate(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400_000)

  if (diffDays < 0) return '刚刚'
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays <= 7) return `${diffDays}天前`
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)}周前`
  if (diffDays <= 365) return `${Math.floor(diffDays / 30)}个月前`
  return `${Math.floor(diffDays / 365)}年前`
}

/**
 * Chart date axis formatting (e.g. "1月15日")
 * Returns the input as-is when it can't be parsed as a date.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return dateStr
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}
