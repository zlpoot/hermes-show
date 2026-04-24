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
}

/**
 * JSONL 消息行
 */
export interface JsonlMessage {
  role: 'session_meta' | 'user' | 'assistant' | 'tool'
  content?: string
  timestamp?: string
  model?: string
  platform?: string
  tool_name?: string
  tool_call_id?: string
  tool_calls?: any[]
  reasoning?: string
  finish_reason?: string
  tools?: any[]
}

/**
 * 获取 JSONL 会话目录路径
 */
export const getJsonlSessionsPath = (): string => {
  return path.join(getHermesPath(), 'sessions')
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
    const stat = fs.statSync(filePath)
    
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

    let firstLine = true
    let messageCount = 0
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
        messageCount++

        // 第一行通常是 session_meta
        if (firstLine) {
          firstLine = false
          if (data.role === 'session_meta') {
            meta.platform = data.platform
            meta.model = data.model
          }
        }

        // 提取时间戳
        if (data.timestamp) {
          const ts = new Date(data.timestamp).getTime()
          if (!startedAt || ts < startedAt) startedAt = ts
          if (!endedAt || ts > endedAt) endedAt = ts
        }

        // 提取第一条用户消息作为标题
        if (data.role === 'user' && !firstUserContent && data.content) {
          firstUserContent = data.content.slice(0, 100)
        }

        // 统计 token（如果有）
        // TODO: 从消息中提取 token 信息

      } catch (e) {
        // 忽略解析错误
      }
    }

    rl.close()
    fileStream.destroy()

    meta.message_count = messageCount
    meta.started_at = startedAt
    meta.ended_at = endedAt
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
  const filePath = path.join(sessionsPath, `${sessionId}.jsonl`)

  if (!fs.existsSync(filePath)) {
    console.log('[jsonl] Session file not found:', filePath)
    return null
  }

  const meta = await parseJsonlSessionMeta(filePath, sessionId)
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
        messages.push(data)
      }
    } catch (e) {
      // 忽略解析错误
    }
  }

  rl.close()
  fileStream.destroy()

  return { session: meta, messages }
}

/**
 * 搜索 JSONL 会话内容
 */
export const searchJsonlSessions = async (query: string): Promise<JsonlSessionMeta[]> => {
  const sessions = await listJsonlSessions()
  
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
    const data = await readJsonlSession(session.id)
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
