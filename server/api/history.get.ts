import { defineEventHandler, getQuery, createError } from 'h3'
import { getHermesDB, getHermesPath } from '../utils/hermes'
import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const prisma = getHermesDB()
  
  console.log('[history] Prisma connected:', !!prisma)
  console.log('[history] Query:', query)

  if (prisma) {
    try {
      if (query.id) {
        // Fetch detailed session with messages using raw SQL
        console.log('[history] Fetching session:', query.id)
        
        // Use source column (not source_platform) - actual DB schema
        const sessionRows: any[] = await prisma.$queryRawUnsafe(
          `SELECT id, title, source as platform, started_at, ended_at, input_tokens, output_tokens 
           FROM sessions WHERE id = ?`,
          String(query.id)
        )
        
        if (sessionRows && sessionRows.length > 0) {
          const sessionRow = sessionRows[0]
          
          let messages: any[] = []
          try {
            messages = await prisma.$queryRawUnsafe(
              `SELECT session_id, timestamp, role, tool_name, content 
               FROM messages WHERE session_id = ? 
               ORDER BY timestamp ASC`,
              String(query.id)
            )
          } catch (e) {
            console.log('[history] Failed to fetch messages:', e)
          }
          
          // Format date
          let dateStr = 'Unknown'
          if (sessionRow.started_at) {
            const ts = Number(sessionRow.started_at)
            dateStr = new Date(ts < 10000000000 ? ts * 1000 : ts).toLocaleString()
          }
          
          return {
            session: {
              id: sessionRow.id,
              title: sessionRow.title || 'Untitled',
              platform: sessionRow.platform || 'Local',
              date: dateStr,
              tokens: ((sessionRow.input_tokens || 0) + (sessionRow.output_tokens || 0)).toLocaleString()
            },
            messages: messages.map((m: any) => ({
              role: m.role,
              content: m.content || '',
              tool_name: m.tool_name,
              timestamp: m.timestamp
            })),
            isRealHermesConnected: true
          }
        }
        
        throw createError({
          statusCode: 404,
          message: 'Session not found'
        })
      } else {
        // Fetch list of sessions with optional FTS5 search
        const searchQuery = query.q as string || ''
        const platform = query.platform as string || ''
        const limit = Math.min(Number(query.limit) || 50, 100)
        const offset = Number(query.offset) || 0
        
        let sessions: any[] = []
        
        if (searchQuery) {
          // FTS5 search on message content
          try {
            const likePattern = `%${searchQuery}%`
            sessions = await prisma.$queryRawUnsafe(
              `SELECT DISTINCT s.id, s.title, s.source as platform, s.started_at as date, 
                      (s.input_tokens + s.output_tokens) as tokens
               FROM sessions s
               LEFT JOIN messages m ON s.id = m.session_id
               WHERE s.title LIKE ? OR m.content LIKE ?
               ORDER BY s.started_at DESC
               LIMIT ? OFFSET ?`,
              likePattern, likePattern, limit, offset
            )
          } catch (e) {
            console.log('[history] Search failed:', e)
          }
        } else {
          // List all sessions
          let sql = `SELECT id, title, source as platform, started_at as date, 
                     (input_tokens + output_tokens) as tokens 
                     FROM sessions 
                     ORDER BY started_at DESC 
                     LIMIT ? OFFSET ?`
          
          const params: any[] = [limit, offset]
          
          if (platform) {
            sql = `SELECT id, title, source as platform, started_at as date, 
                   (input_tokens + output_tokens) as tokens 
                   FROM sessions 
                   WHERE source = ?
                   ORDER BY started_at DESC 
                   LIMIT ? OFFSET ?`
            params.unshift(platform)
          }
          
          sessions = await prisma.$queryRawUnsafe(sql, ...params)
        }
        
        return {
          sessions: sessions.map((s: any) => ({
            id: s.id,
            title: s.title || 'Untitled',
            platform: s.platform || 'Local',
            date: formatDate(s.date),
            tokens: s.tokens ? Number(s.tokens).toLocaleString() : '0'
          })),
          total: sessions.length,
          hasMore: sessions.length === limit,
          isRealHermesConnected: true
        }
      }
    } catch (e) {
      console.log('[history] Failed to fetch from DB:', e)
    }
  }

  // Mock data fallback
  const mockSessions = [
    { id: 'sess-a1b2', title: '项目结构重构建议', date: '2026-04-17 14:32', platform: 'CLI', tokens: '4,210' },
    { id: 'sess-c3d4', title: '配置 S3 每日自动备份', date: '2026-04-16 09:15', platform: 'Telegram', tokens: '1,504' },
    { id: 'sess-e5f6', title: '生成并审核代码 PR', date: '2026-04-15 16:45', platform: 'GitHub', tokens: '8,920' },
    { id: 'sess-g7h8', title: '查询服务器日志错误', date: '2026-04-15 10:20', platform: 'Discord', tokens: '2,341' },
  ]
  
  if (query.id) {
    const mockSession = mockSessions.find(s => s.id === query.id) || mockSessions[0]
    return {
      session: {
        ...mockSession,
        id: query.id
      },
      messages: [
        { role: 'user', content: '帮助我分析一下当前项目的目录结构' },
        { role: 'tool', tool_name: 'terminal', content: 'drwxr-xr-x components\npages' },
        { role: 'assistant', content: '建议进行如下重构...' }
      ],
      isRealHermesConnected: false
    }
  }

  return {
    sessions: mockSessions,
    total: mockSessions.length,
    hasMore: false,
    isRealHermesConnected: false
  }
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  
  const isNumeric = !isNaN(Number(dateStr))
  if (isNumeric) {
    const ts = Number(dateStr)
    return new Date(ts < 10000000000 ? ts * 1000 : ts).toLocaleString()
  }
  return new Date(dateStr).toLocaleString()
}
