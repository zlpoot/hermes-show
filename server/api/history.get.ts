import { defineEventHandler, getQuery, createError } from 'h3'
import { getHermesDB, getHermesPath } from '../utils/hermes'
import fs from 'node:fs'
import path from 'node:path'

// Session types with display names
const SESSION_TYPES: Record<string, string> = {
  'cli': 'CLI',
  'discord': 'Discord',
  'telegram': 'Telegram',
  'weixin': '微信',
  'slack': 'Slack',
  'matrix': 'Matrix',
  'web': 'Web',
  'cron': '定时任务',
  'api': 'API',
  'homeassistant': 'Home Assistant',
}

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
          
          // Generate title for cron sessions
          let title = sessionRow.title
          if (!title && sessionRow.id.startsWith('cron_')) {
            title = generateCronTitle(sessionRow.id)
          }
          
          return {
            session: {
              id: sessionRow.id,
              title: title || 'Untitled',
              platform: sessionRow.platform || 'Local',
              platformDisplay: SESSION_TYPES[sessionRow.platform] || sessionRow.platform || 'Local',
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
        // Fetch list of sessions with optional FTS5 search and type filter
        const searchQuery = query.q as string || ''
        const platform = query.platform as string || ''
        const typesParam = query.types as string || ''  // comma-separated types
        const limit = Math.min(Number(query.limit) || 50, 100)
        const offset = Number(query.offset) || 0
        
        // Parse types filter (default: exclude cron)
        let types: string[] = []
        if (typesParam) {
          types = typesParam.split(',').map(t => t.trim()).filter(Boolean)
        }
        
        let sessions: any[] = []
        
        // Build WHERE conditions
        const whereConditions: string[] = []
        const params: any[] = []
        
        // Use table alias for FTS search, no alias for simple list
        const useAlias = !!searchQuery
        const prefix = useAlias ? 's.' : ''
        
        if (searchQuery) {
          // FTS5 search - need to join with messages
          const likePattern = `%${searchQuery}%`
          whereConditions.push(`(s.title LIKE ? OR m.content LIKE ?)`)
          params.push(likePattern, likePattern)
        }
        
        if (platform) {
          whereConditions.push(`${prefix}source = ?`)
          params.push(platform)
        }
        
        // Type filter (include only specified types)
        if (types.length > 0) {
          const placeholders = types.map(() => '?').join(', ')
          whereConditions.push(`${prefix}source IN (${placeholders})`)
          params.push(...types)
        }
        
        const whereClause = whereConditions.length > 0 
          ? 'WHERE ' + whereConditions.join(' AND ')
          : ''
        
        if (searchQuery) {
          // FTS5 search on message content with JOIN
          try {
            sessions = await prisma.$queryRawUnsafe(
              `SELECT DISTINCT s.id, s.title, s.source as platform, s.started_at as date, 
                      (s.input_tokens + s.output_tokens) as tokens
               FROM sessions s
               LEFT JOIN messages m ON s.id = m.session_id
               ${whereClause}
               ORDER BY s.started_at DESC
               LIMIT ? OFFSET ?`,
              ...params, limit, offset
            )
          } catch (e) {
            console.log('[history] Search failed:', e)
          }
        } else {
          // List sessions with type filter
          const sql = `SELECT id, title, source as platform, started_at as date, 
                       (input_tokens + output_tokens) as tokens 
                       FROM sessions 
                       ${whereClause}
                       ORDER BY started_at DESC 
                       LIMIT ? OFFSET ?`
          
          sessions = await prisma.$queryRawUnsafe(sql, ...params, limit, offset)
        }
        
        // Get all available platforms for filter
        let platforms: { platform: string; count: number }[] = []
        try {
          platforms = await prisma.$queryRawUnsafe(
            `SELECT source as platform, COUNT(*) as count 
             FROM sessions 
             GROUP BY source 
             ORDER BY count DESC`
          )
        } catch (e) {
          console.log('[history] Failed to get platforms:', e)
        }
        
        return {
          sessions: sessions.map((s: any) => {
            // Generate title for cron sessions
            let title = s.title
            if (!title && s.id.startsWith('cron_')) {
              title = generateCronTitle(s.id)
            }
            
            return {
              id: s.id,
              title: title || 'Untitled',
              platform: s.platform || 'Local',
              platformDisplay: SESSION_TYPES[s.platform] || s.platform || 'Local',
              date: formatDate(s.date),
              tokens: s.tokens ? Number(s.tokens).toLocaleString() : '0'
            }
          }),
          platforms: platforms.map((p: any) => ({
            id: p.platform || 'unknown',
            name: SESSION_TYPES[p.platform] || p.platform || 'Unknown',
            count: Number(p.count)
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
    { id: 'sess-a1b2', title: '项目结构重构建议', date: '2026-04-17 14:32', platform: 'CLI', platformDisplay: 'CLI', tokens: '4,210' },
    { id: 'sess-c3d4', title: '配置 S3 每日自动备份', date: '2026-04-16 09:15', platform: 'Telegram', platformDisplay: 'Telegram', tokens: '1,504' },
    { id: 'sess-e5f6', title: '生成并审核代码 PR', date: '2026-04-15 16:45', platform: 'GitHub', platformDisplay: 'GitHub', tokens: '8,920' },
    { id: 'sess-g7h8', title: '查询服务器日志错误', date: '2026-04-15 10:20', platform: 'Discord', platformDisplay: 'Discord', tokens: '2,341' },
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
    platforms: [
      { id: 'cli', name: 'CLI', count: 15 },
      { id: 'discord', name: 'Discord', count: 8 },
      { id: 'telegram', name: 'Telegram', count: 5 },
    ],
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

// Generate readable title for cron sessions
function generateCronTitle(sessionId: string): string {
  // Format: cron_cron_task_worker_mh7c_20260419_222603
  // Extract: task_worker, date/time
  const parts = sessionId.split('_')
  if (parts.length >= 4 && parts[0] === 'cron') {
    // Find the job name part (between cron_ and the timestamp)
    const dateIdx = parts.findIndex(p => /^\d{8}$/.test(p))
    if (dateIdx > 1) {
      const jobName = parts.slice(1, dateIdx).join('_')
      // Clean up job name
      const cleanName = jobName
        .replace(/^cron_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
      return `定时任务: ${cleanName}`
    }
  }
  return '定时任务'
}
