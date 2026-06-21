import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { getHermesPath } from './hermes'

/**
 * JSONL 会话文件的元数据
 */
export interface JsonlSessionMeta {
  id: string
  title?: string
  platform?: string
  model?: string
  started_at?: number
  ended_at?: number
  message_count: number
  input_tokens?: number
  output_tokens?: number
  file_path: string
  file_size: number
  storage?: 'jsonl' | 'json'
}

/**
 * JSONL 消息行
 */
export interface JsonlMessage {
  role: 'session_meta' | 'user' | 'assistant' | 'tool'
  content?: unknown
  timestamp?: string | number
  model?: string
  platform?: string
  tool_name?: string
  tool_call_id?: string
  tool_calls?: any[]
  reasoning?: string
  finish_reason?: string
  tools?: any[]
  input_tokens?: number
  output_tokens?: number
  usage?: {
    input_tokens?: number
    output_tokens?: number
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  token_usage?: {
    input_tokens?: number
    output_tokens?: number
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

interface HermesSessionIndexEntry {
  session_id?: string
  platform?: string
  display_name?: string
  created_at?: string | number
  updated_at?: string | number
  expiry_finalized?: boolean
  metadata?: Record<string, unknown>
  origin?: Record<string, unknown>
}

interface HermesJsonSessionFile {
  session_id?: string
  platform?: string
  model?: string
  session_start?: string | number
  last_updated?: string | number
  message_count?: number
  messages?: JsonlMessage[]
}

export const parseJsonlTimestamp = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 10000000000 ? value * 1000 : value
  }

  if (typeof value !== 'string' || !value.trim()) return undefined

  const numericValue = Number(value)
  if (Number.isFinite(numericValue)) {
    return numericValue < 10000000000 ? numericValue * 1000 : numericValue
  }

  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? undefined : parsed
}

export const normalizeJsonlContent = (content: unknown): string => {
  if (typeof content === 'string') return content
  if (content === null || content === undefined) return ''

  try {
    return JSON.stringify(content)
  } catch {
    return String(content)
  }
}

export const getJsonlTokenCounts = (message: JsonlMessage): { input: number; output: number } => {
  const usage = message.usage || message.token_usage || {}
  const input = Number(message.input_tokens ?? usage.input_tokens ?? usage.prompt_tokens ?? 0)
  const output = Number(message.output_tokens ?? usage.output_tokens ?? usage.completion_tokens ?? 0)

  if ((input || output) || !usage.total_tokens) {
    return {
      input: Number.isFinite(input) ? input : 0,
      output: Number.isFinite(output) ? output : 0
    }
  }

  const total = Number(usage.total_tokens)
  return {
    input: Number.isFinite(total) ? total : 0,
    output: 0
  }
}

/**
 * 获取 JSONL 会话目录路径
 */
export const getJsonlSessionsPath = (): string => {
  return path.join(getHermesPath(), 'sessions')
}

const sessionJsonName = (sessionId: string): string => `session_${sessionId}.json`

const normalizeSessionTitle = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 100)
  return fallback
}

const getMessageTimestamp = (message: JsonlMessage): number | undefined => {
  return parseJsonlTimestamp(message.timestamp)
}

/**
 * 列出所有 JSONL 会话文件
 */
export const listJsonlSessions = async (): Promise<JsonlSessionMeta[]> => {
  const sessionsPath = getJsonlSessionsPath()
  
  if (!fs.existsSync(sessionsPath)) {
    console.log('[jsonl] Sessions directory not found:', sessionsPath)
    return []
  }

  const files = fs.readdirSync(sessionsPath)
    .filter(f => f.endsWith('.jsonl'))
    .sort((a, b) => b.localeCompare(a)) // 按文件名倒序（最新的在前）

  const sessions: JsonlSessionMeta[] = []

  for (const file of files) {
    const filePath = path.join(sessionsPath, file)
    
    // 从文件名提取 session ID: 20260424_000440_e5ee13d4.jsonl -> 20260424_000440_e5ee13d4
    const sessionId = file.replace('.jsonl', '')
    
    // 解析会话元数据
    const meta = await parseJsonlSessionMeta(filePath, sessionId)
    if (meta) {
      sessions.push(meta)
    }
  }

  return sessions
}

/**
 * 列出 Hermes 新版 JSON 会话。
 *
 * 新版 Hermes 会额外写入 sessions.json 索引和 session_<id>.json 详情文件。
 * 这些文件通常比历史 JSONL/SQLite 更新，Slack 等平台的近期对话会优先出现在这里。
 */
export const listJsonSessions = async (): Promise<JsonlSessionMeta[]> => {
  const sessionsPath = getJsonlSessionsPath()

  if (!fs.existsSync(sessionsPath)) {
    console.log('[jsonl] Sessions directory not found:', sessionsPath)
    return []
  }

  const map = new Map<string, JsonlSessionMeta>()

  for (const file of fs.readdirSync(sessionsPath).filter(f => /^session_.+\.json$/.test(f))) {
    const filePath = path.join(sessionsPath, file)
    const sessionId = file.replace(/^session_/, '').replace(/\.json$/, '')
    const meta = await parseJsonSessionMeta(filePath, sessionId)
    if (meta) map.set(meta.id, meta)
  }

  const indexPath = path.join(sessionsPath, 'sessions.json')
  if (fs.existsSync(indexPath)) {
    try {
      const raw = fs.readFileSync(indexPath, 'utf8')
      const index = JSON.parse(raw) as Record<string, HermesSessionIndexEntry>
      const stat = fs.statSync(indexPath)

      for (const [key, entry] of Object.entries(index)) {
        const sessionId = entry?.session_id
        if (!sessionId || map.has(sessionId)) continue

        const platform = entry.platform
          || (typeof entry.origin?.platform === 'string' ? entry.origin.platform : undefined)
          || key.split(':')[2]
        const startedAt = parseJsonlTimestamp(entry.created_at)
        const updatedAt = parseJsonlTimestamp(entry.updated_at)

        map.set(sessionId, {
          id: sessionId,
          title: normalizeSessionTitle(entry.display_name, `Session ${sessionId}`),
          platform,
          started_at: startedAt ?? updatedAt,
          ended_at: entry.expiry_finalized ? (updatedAt ?? startedAt) : undefined,
          message_count: 0,
          input_tokens: 0,
          output_tokens: 0,
          file_path: indexPath,
          file_size: stat.size,
          storage: 'json',
        })
      }
    } catch (e) {
      console.error('[jsonl] Failed to parse sessions.json:', e)
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const aTime = Math.max(a.started_at ?? 0, a.ended_at ?? 0)
    const bTime = Math.max(b.started_at ?? 0, b.ended_at ?? 0)
    return bTime - aTime
  })
}

export const listAllFileSessions = async (): Promise<JsonlSessionMeta[]> => {
  const map = new Map<string, JsonlSessionMeta>()

  for (const session of await listJsonlSessions()) {
    map.set(session.id, session)
  }

  for (const session of await listJsonSessions()) {
    const existing = map.get(session.id)
    if (!existing) {
      map.set(session.id, session)
      continue
    }

    map.set(session.id, mergeFileSessionMeta(existing, session))
  }

  return Array.from(map.values()).sort((a, b) => {
    const aTime = Math.max(a.started_at ?? 0, a.ended_at ?? 0)
    const bTime = Math.max(b.started_at ?? 0, b.ended_at ?? 0)
    return bTime - aTime
  })
}

export const parseJsonSessionMeta = async (
  filePath: string,
  sessionId: string
): Promise<JsonlSessionMeta | null> => {
  try {
    const stat = fs.statSync(filePath)
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as HermesJsonSessionFile
    const messages = Array.isArray(data.messages) ? data.messages : []

    let messageCount = 0
    let inputTokens = 0
    let outputTokens = 0
    let firstUserContent = ''
    let startedAt = parseJsonlTimestamp(data.session_start)
    let endedAt = parseJsonlTimestamp(data.last_updated)

    for (const message of messages) {
      if (message.role === 'session_meta') continue

      messageCount++

      const ts = getMessageTimestamp(message)
      if (ts !== undefined) {
        if (!startedAt || ts < startedAt) startedAt = ts
        if (!endedAt || ts > endedAt) endedAt = ts
      }

      const tokenCounts = getJsonlTokenCounts(message)
      inputTokens += tokenCounts.input
      outputTokens += tokenCounts.output

      if (message.role === 'user' && !firstUserContent && message.content) {
        firstUserContent = normalizeJsonlContent(message.content).slice(0, 100)
      }
    }

    return {
      id: data.session_id || sessionId,
      title: firstUserContent || `Session ${data.session_id || sessionId}`,
      platform: data.platform,
      model: data.model,
      started_at: startedAt,
      ended_at: endedAt,
      message_count: Number(data.message_count ?? messageCount) || messageCount,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      file_path: filePath,
      file_size: stat.size,
      storage: 'json',
    }
  } catch (e) {
    console.error('[jsonl] Failed to parse JSON session meta:', filePath, e)
    return null
  }
}

function mergeFileSessionMeta(left: JsonlSessionMeta, right: JsonlSessionMeta): JsonlSessionMeta {
  const leftTime = Math.max(left.started_at ?? 0, left.ended_at ?? 0)
  const rightTime = Math.max(right.started_at ?? 0, right.ended_at ?? 0)
  const preferred = rightTime >= leftTime ? right : left
  const fallback = preferred === right ? left : right

  return {
    ...fallback,
    ...preferred,
    title: preferred.title || fallback.title,
    platform: preferred.platform || fallback.platform,
    model: preferred.model || fallback.model,
    started_at: minDefined(preferred.started_at, fallback.started_at),
    ended_at: maxDefined(preferred.ended_at, fallback.ended_at),
    message_count: Math.max(preferred.message_count || 0, fallback.message_count || 0),
    input_tokens: preferred.input_tokens || fallback.input_tokens || 0,
    output_tokens: preferred.output_tokens || fallback.output_tokens || 0,
  }
}

function minDefined(a?: number, b?: number): number | undefined {
  if (a === undefined) return b
  if (b === undefined) return a
  return Math.min(a, b)
}

function maxDefined(a?: number, b?: number): number | undefined {
  if (a === undefined) return b
  if (b === undefined) return a
  return Math.max(a, b)
}

/**
 * 解析单个 JSONL 会话文件的元数据
 */
export const parseJsonlSessionMeta = async (
  filePath: string,
  sessionId: string
): Promise<JsonlSessionMeta | null> => {
  try {
    const stat = fs.statSync(filePath)
    const fileStream = fs.createReadStream(filePath)
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    })

    let messageCount = 0
    let inputTokens = 0
    let outputTokens = 0
    let meta: Partial<JsonlSessionMeta> = {
      id: sessionId,
      file_path: filePath,
      file_size: stat.size,
      message_count: 0
    }

    let startedAt: number | undefined
    let endedAt: number | undefined
    let firstUserContent = ''

    for await (const line of rl) {
      if (!line.trim()) continue
      
      try {
        const data: JsonlMessage = JSON.parse(line)

        if (data.platform && !meta.platform) {
          meta.platform = data.platform
        }
        if (data.model && !meta.model) {
          meta.model = data.model
        }

        // 提取时间戳
        if (data.timestamp) {
          const ts = parseJsonlTimestamp(data.timestamp)
          if (ts !== undefined) {
            if (!startedAt || ts < startedAt) startedAt = ts
            if (!endedAt || ts > endedAt) endedAt = ts
          }
        }

        const tokenCounts = getJsonlTokenCounts(data)
        inputTokens += tokenCounts.input
        outputTokens += tokenCounts.output

        if (data.role === 'session_meta') {
          continue
        }

        messageCount++

        // 提取第一条用户消息作为标题
        if (data.role === 'user' && !firstUserContent && data.content) {
          firstUserContent = normalizeJsonlContent(data.content).slice(0, 100)
        }

      } catch (e) {
        // 忽略解析错误
      }
    }

    rl.close()
    fileStream.destroy()

    meta.message_count = messageCount
    meta.started_at = startedAt
    meta.ended_at = endedAt
    meta.input_tokens = inputTokens
    meta.output_tokens = outputTokens
    meta.title = firstUserContent || `Session ${sessionId}`

    return meta as JsonlSessionMeta
  } catch (e) {
    console.error('[jsonl] Failed to parse session meta:', filePath, e)
    return null
  }
}

/**
 * 读取 JSONL 会话的所有消息
 */
export const readJsonlSession = async (sessionId: string): Promise<{
  session: JsonlSessionMeta
  messages: JsonlMessage[]
} | null> => {
  const sessionsPath = getJsonlSessionsPath()
  const safeSessionId = path.basename(sessionId)
  const filePath = path.join(sessionsPath, `${safeSessionId}.jsonl`)

  if (!fs.existsSync(filePath)) {
    console.log('[jsonl] Session file not found:', filePath)
    return null
  }

  const meta = await parseJsonlSessionMeta(filePath, safeSessionId)
  if (!meta) return null

  const fileStream = fs.createReadStream(filePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  const messages: JsonlMessage[] = []

  for await (const line of rl) {
    if (!line.trim()) continue
    
    try {
      const data: JsonlMessage = JSON.parse(line)
      // 跳过 session_meta 行
      if (data.role !== 'session_meta') {
        messages.push({
          ...data,
          content: normalizeJsonlContent(data.content)
        })
      }
    } catch (e) {
      // 忽略解析错误
    }
  }

  rl.close()
  fileStream.destroy()

  return { session: meta, messages }
}

export const readJsonSession = async (sessionId: string): Promise<{
  session: JsonlSessionMeta
  messages: JsonlMessage[]
} | null> => {
  const sessionsPath = getJsonlSessionsPath()
  const safeSessionId = path.basename(sessionId)
  const filePath = path.join(sessionsPath, sessionJsonName(safeSessionId))

  if (!fs.existsSync(filePath)) {
    console.log('[jsonl] JSON session file not found:', filePath)
    return null
  }

  const meta = await parseJsonSessionMeta(filePath, safeSessionId)
  if (!meta) return null

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as HermesJsonSessionFile
    const messages = Array.isArray(data.messages)
      ? data.messages
          .filter((message) => message.role !== 'session_meta')
          .map((message) => ({ ...message, content: normalizeJsonlContent(message.content) }))
      : []

    return { session: meta, messages }
  } catch (e) {
    console.error('[jsonl] Failed to read JSON session:', filePath, e)
    return null
  }
}

export const readFileSession = async (sessionId: string): Promise<{
  session: JsonlSessionMeta
  messages: JsonlMessage[]
} | null> => {
  return await readJsonSession(sessionId) || await readJsonlSession(sessionId)
}

/**
 * 搜索 JSONL 会话内容
 */
export const searchJsonlSessions = async (query: string): Promise<JsonlSessionMeta[]> => {
  const sessions = await listAllFileSessions()
  
  if (!query) return sessions

  const lowerQuery = query.toLowerCase()
  const results: JsonlSessionMeta[] = []

  for (const session of sessions) {
    // 先在元数据中搜索
    if (session.title?.toLowerCase().includes(lowerQuery)) {
      results.push(session)
      continue
    }

    // 再在消息内容中搜索
    const data = await readFileSession(session.id)
    if (data) {
      for (const msg of data.messages) {
        if (msg.content?.toLowerCase().includes(lowerQuery)) {
          results.push(session)
          break
        }
      }
    }
  }

  return results
}
