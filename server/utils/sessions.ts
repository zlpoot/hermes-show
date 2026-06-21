import { getHermesDB } from './hermes'
import { listJsonlSessions, type JsonlSessionMeta } from './jsonl'

/**
 * 统一会话格式 — 从 JSONL 和 SQLite 合并后的标准化会话
 */
export interface UnifiedSession {
  id: string
  title: string
  source: string         // 平台来源（JSONL platform / SQLite source）
  started_at: number | null
  ended_at: number | null
  input_tokens: number
  output_tokens: number
  _origin: 'jsonl' | 'sqlite' | 'merged'
}

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS

/**
 * JSONL → UnifiedSession
 */
function jsonlToUnified(m: JsonlSessionMeta): UnifiedSession {
  return {
    id: m.id,
    title: m.title || 'Untitled',
    source: m.platform || 'Local',
    started_at: m.started_at ?? null,
    ended_at: m.ended_at ?? null,
    input_tokens: m.input_tokens ?? 0,
    output_tokens: m.output_tokens ?? 0,
    _origin: 'jsonl',
  }
}

/**
 * SQLite 行 → UnifiedSession
 */
export function sqliteRowToUnified(row: any): UnifiedSession {
  const startedAt = row.started_at
    ? parseNumericTs(row.started_at)
    : null
  const endedAt = row.ended_at
    ? parseNumericTs(row.ended_at)
    : null

  return {
    id: String(row.id),
    title: String(row.title || '') || 'Untitled',
    source: String(row.source || row.platform || 'Local'),
    started_at: startedAt,
    ended_at: endedAt,
    input_tokens: Number(row.input_tokens ?? 0) || 0,
    output_tokens: Number(row.output_tokens ?? 0) || 0,
    _origin: 'sqlite',
  }
}

function parseNumericTs(value: string | number | null | undefined): number | null {
  if (value == null) return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return n < 10000000000 ? n * 1000 : n
}

/**
 * 加载全部会话 — JSONL 优先，SQLite 补充合并，按 id 去重。
 *
 * 合并策略：
 *  - JSONL 字段覆盖 SQLite（JSONL 是实时写入的，更新更及时）
 *  - title: JSONL > SQLite
 *  - started_at: 取两者中较早的
 *  - ended_at: 取两者中较晚的
 *  - tokens: JSONL > SQLite（JSONL 逐行累加更精确）
 *  - source: JSONL > SQLite
 */
export async function loadAllSessions(): Promise<{
  sessions: UnifiedSession[]
  sources: { jsonl: number; sqlite: number; merged: number }
}> {
  // 1) 加载 JSONL
  let jsonlSessions: JsonlSessionMeta[] = []
  try {
    jsonlSessions = await listJsonlSessions()
  } catch (e) {
    console.error('[sessions] Failed to load JSONL sessions:', e)
  }

  // 2) 加载 SQLite
  const prisma = getHermesDB()
  let sqliteRows: any[] = []
  if (prisma) {
    try {
      sqliteRows = await prisma.$queryRawUnsafe(
        `SELECT id, title, source, started_at, ended_at, input_tokens, output_tokens FROM sessions`
      )
    } catch (e) {
      console.error('[sessions] Failed to load SQLite sessions:', e)
    }
  }

  // 3) 构建 id → UnifiedSession Map
  const map = new Map<string, UnifiedSession>()

  // 先插入 JSONL
  for (const j of jsonlSessions) {
    const u = jsonlToUnified(j)
    map.set(u.id, u)
  }

  // 再插入 SQLite — 如果 id 已存在则合并
  for (const r of sqliteRows) {
    const id = String(r.id)
    const existing = map.get(id)
    const sqlite = sqliteRowToUnified(r)

    if (!existing) {
      map.set(id, sqlite)
    } else {
      // 合并：JSONL 为主，SQLite 补充空缺字段
      map.set(id, {
        id,
        title: existing.title || sqlite.title || 'Untitled',
        source: existing.source || sqlite.source || 'Local',
        started_at: existing.started_at ?? sqlite.started_at,
        ended_at: existing.ended_at ?? sqlite.ended_at,
        input_tokens: existing.input_tokens || sqlite.input_tokens,
        output_tokens: existing.output_tokens || sqlite.output_tokens,
        _origin: 'merged' as const,
      })
    }
  }

  const sessions = Array.from(map.values()).sort((a, b) => {
    const aTime = a.started_at ?? 0
    const bTime = b.started_at ?? 0
    return bTime - aTime
  })

  // 统计来源
  let jsonl = 0, sqlite = 0, merged = 0
  for (const s of sessions) {
    if (s._origin === 'jsonl') jsonl++
    else if (s._origin === 'sqlite') sqlite++
    else merged++
  }

  return { sessions, sources: { jsonl, sqlite, merged } }
}

/**
 * 是否为"真正活跃"的会话
 * 定义：5 小时内开始且没有结束时间戳的会话
 */
export function isActiveSession(session: UnifiedSession, now: number = Date.now()): boolean {
  if (!session.started_at) return false
  if (session.ended_at) return false
  // 超过 5 小时还没结束的会话视为异常/陈旧，不标为活跃
  return (now - session.started_at) < 5 * HOUR_MS
}
