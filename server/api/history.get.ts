import { defineEventHandler, getQuery, createError } from 'h3'
import { getHermesDB, getHermesPath } from '../utils/hermes'
import { listJsonlSessions, readJsonlSession, searchJsonlSessions } from '../utils/jsonl'
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
  
  console.log('[history] Query:', query)

  // 优先从 JSONL 文件读取
  if (query.id) {
    // 读取单个会话详情
    console.log('[history] Fetching JSONL session:', query.id)
    
    const jsonData = await readJsonlSession(String(query.id))
    if (jsonData) {
      const { session, messages } = jsonData
      
      // 格式化日期
      let dateStr = 'Unknown'
      if (session.started_at) {
        dateStr = new Date(session.started_at).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }

      return {
        session: {
          id: session.id,
          title: session.title || 'Untitled',
          platform: session.platform || 'Local',
          platformDisplay: SESSION_TYPES[session.platform || ''] || session.platform || 'Local',
          date: dateStr,
          tokens: ((session.input_tokens || 0) + (session.output_tokens || 0)).toLocaleString(),
          model: session.model
        },
        messages: messages.map(m => ({
          role: m.role,
          content: m.content || '',
          tool_name: m.tool_name,
          tool_call_id: m.tool_call_id,
          timestamp: m.timestamp,
          reasoning: m.reasoning,
          finish_reason: m.finish_reason
        })),
        isRealHermesConnected: true,
        source: 'jsonl'
      }
    }

    // 如果 JSONL 没找到，尝试从 SQLite 读取
    if (prisma) {
      try {
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
          
          let dateStr = 'Unknown'
          if (sessionRow.started_at) {
            const ts = Number(sessionRow.started_at)
            dateStr = new Date(ts < 10000000000 ? ts * 1000 : ts).toLocaleString()
          }
          
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
            isRealHermesConnected: true,
            source: 'sqlite'
          }
        }
      } catch (e) {
        console.log('[history] SQLite fallback failed:', e)
      }
    }
    
    throw createError({
      statusCode: 404,
      message: 'Session not found'
    })
  }

  // 列出会话列表 - 优先从 JSONL 读取
  const searchQuery = query.q as string || ''
  const platform = query.platform as string || ''
  const typesParam = query.types as string || ''
  const limit = Math.min(Number(query.limit) || 50, 100)
  const offset = Number(query.offset) || 0
  
  // Parse types filter
  let types: string[] = []
  if (typesParam) {
    types = typesParam.split(',').map(t => t.trim()).filter(Boolean)
  }

  try {
    // 从 JSONL 文件读取
    console.log('[history] Loading from JSONL files')
    
    let jsonlSessions = searchQuery 
      ? await searchJsonlSessions(searchQuery)
      : await listJsonlSessions()
    
    // 应用过滤器
    if (platform) {
      jsonlSessions = jsonlSessions.filter(s => s.platform === platform)
    }
    
    if (types.length > 0) {
      jsonlSessions = jsonlSessions.filter(s => s.platform && types.includes(s.platform))
    }
    
    // 统计平台分布
    const platformCounts: Record<string, number> = {}
    for (const s of jsonlSessions) {
      const p = s.platform || 'unknown'
      platformCounts[p] = (platformCounts[p] || 0) + 1
    }
    
    const platforms = Object.entries(platformCounts)
      .map(([id, count]) => ({
        id,
        name: SESSION_TYPES[id] || id || 'Unknown',
        count
      }))
      .sort((a, b) => b.count - a.count)

    // 分页
    const totalCount = jsonlSessions.length
    const pagedSessions = jsonlSessions.slice(offset, offset + limit)
    
    return {
      sessions: pagedSessions.map(s => {
        let dateStr = 'Unknown'
        if (s.started_at) {
          dateStr = new Date(s.started_at).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
        
        return {
          id: s.id,
          title: s.title || 'Untitled',
          platform: s.platform || 'Local',
          platformDisplay: SESSION_TYPES[s.platform || ''] || s.platform || 'Local',
          date: dateStr,
          tokens: ((s.input_tokens || 0) + (s.output_tokens || 0)).toLocaleString(),
          messageCount: s.message_count
        }
      }),
      platforms,
      total: totalCount,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + pagedSessions.length < totalCount,
      isRealHermesConnected: true,
      source: 'jsonl'
    }
  } catch (e) {
    console.error('[history] Failed to load JSONL sessions:', e)
  }

  // SQLite fallback (如果 JSONL 失败)
  if (prisma) {
    try {
      console.log('[history] Falling back to SQLite')
      
      const whereConditions: string[] = []
      const params: any[] = []
      const useAlias = !!searchQuery
      const prefix = useAlias ? 's.' : ''
      
      if (searchQuery) {
        const likePattern = `%${searchQuery}%`
        whereConditions.push(`(s.title LIKE ? OR m.content LIKE ?)`)
        params.push(likePattern, likePattern)
      }
      
      if (platform) {
        whereConditions.push(`${prefix}source = ?`)
        params.push(platform)
      }
      
      if (types.length > 0) {
        const placeholders = types.map(() => '?').join(', ')
        whereConditions.push(`${prefix}source IN (${placeholders})`)
        params.push(...types)
      }
      
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : ''
      
      let sessions: any[] = []
      
      if (searchQuery) {
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
      } else {
        const sql = `SELECT id, title, source as platform, started_at as date, 
                     (input_tokens + output_tokens) as tokens 
                     FROM sessions 
                     ${whereClause}
                     ORDER BY started_at DESC 
                     LIMIT ? OFFSET ?`
        
        sessions = await prisma.$queryRawUnsafe(sql, ...params, limit, offset)
      }
      
      let platforms: { platform: string; count: number }[] = []
      platforms = await prisma.$queryRawUnsafe(
        `SELECT source as platform, COUNT(*) as count 
         FROM sessions 
         GROUP BY source 
         ORDER BY count DESC`
      )
      
      let totalCount = 0
      const countWhere = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''
      if (searchQuery) {
        const countResult = await prisma.$queryRawUnsafe<{ total: bigint | number }[]>(
          `SELECT COUNT(DISTINCT s.id) as total
           FROM sessions s
           LEFT JOIN messages m ON s.id = m.session_id
           ${countWhere}`,
          ...params
        )
        totalCount = Number(countResult[0]?.total || 0)
      } else {
        const countResult = await prisma.$queryRawUnsafe<{ total: bigint | number }[]>(
          `SELECT COUNT(*) as total FROM sessions ${countWhere}`,
          ...params
        )
        totalCount = Number(countResult[0]?.total || 0)
      }
      
      return {
        sessions: sessions.map((s: any) => {
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
        total: totalCount,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        hasMore: offset + sessions.length < totalCount,
        isRealHermesConnected: true,
        source: 'sqlite'
      }
    } catch (e) {
      console.log('[history] Failed to fetch from DB:', e)
    }
  }

  // 无数据，返回空状态
  console.log('[history] No data available')
  return {
    sessions: [],
    platforms: [],
    total: 0,
    hasMore: false,
    isRealHermesConnected: false,
    source: 'none'
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

function generateCronTitle(sessionId: string): string {
  const parts = sessionId.split('_')
  if (parts.length >= 4 && parts[0] === 'cron') {
    const dateIdx = parts.findIndex(p => /^\d{8}$/.test(p))
    if (dateIdx > 1) {
      const jobName = parts.slice(1, dateIdx).join('_')
      const cleanName = jobName
        .replace(/^cron_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
      return `定时任务: ${cleanName}`
    }
  }
  return '定时任务'
}
