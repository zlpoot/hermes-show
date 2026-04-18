import { defineEventHandler, getQuery } from 'h3'
import { getHermesDB } from '../utils/hermes'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const db = getHermesDB()

  if (db) {
    try {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[]
      const tableNames = tables.map(t => t.name)
      
      if (tableNames.includes('sessions')) {
        if (query.id) {
          // Fetch detailed session
          const sessionRow = db.prepare('SELECT * FROM sessions WHERE id = ?').get(query.id)
          if (sessionRow) {
            let messages = []
            if (tableNames.includes('messages')) {
              messages = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC').all(query.id)
            }
            return {
              session: sessionRow,
              messages,
              isRealHermesConnected: true
            }
          }
        } else {
          // Fetch list of sessions
          const search = query.q ? `%${query.q}%` : '%'
          // Add try-catch for tokens columns as they might be different in actual schema
          let sessions = []
          try {
            sessions = db.prepare(`
              SELECT id, title, source_platform as platform, started_at as date, (input_tokens + output_tokens) as tokens 
              FROM sessions 
              WHERE title LIKE ? 
              ORDER BY started_at DESC LIMIT 50
            `).all(search)
          } catch(e) {
            // Fallback query if tokens columns or source_platform don't exist
            sessions = db.prepare(`
              SELECT id, title, 'Local' as platform, started_at as date, 0 as tokens 
              FROM sessions 
              WHERE title LIKE ? 
              ORDER BY started_at DESC LIMIT 50
            `).all(search)
          }
          
          return {
            sessions: sessions.map((s: any) => {
              let parsedDate = 'Unknown Date'
              if (s.date) {
                // Check if it's a unix timestamp (number or string of numbers)
                const isNumeric = !isNaN(Number(s.date))
                if (isNumeric) {
                  // If it's in seconds (typical for python/sqlite unix epoch), multiply by 1000 for JS
                  const ts = Number(s.date)
                  parsedDate = new Date(ts < 10000000000 ? ts * 1000 : ts).toLocaleString()
                } else {
                  // Otherwise parse as normal ISO string
                  parsedDate = new Date(s.date).toLocaleString()
                }
              }
              
              return {
                ...s,
                date: parsedDate,
                tokens: s.tokens ? s.tokens.toLocaleString() : '0'
              }
            }),
            isRealHermesConnected: true
          }
        }
      }
    } catch (e) {
      console.log('Failed to fetch from DB', e)
    } finally {
      db.close()
    }
  }
  
  // Mock data fallback
  const mockSessions = [
    { id: 'sess-a1b2', title: '项目结构重构建议', date: '2026-04-17 14:32', platform: 'CLI', tokens: '4,210' },
    { id: 'sess-c3d4', title: '配置 S3 每日自动备份', date: '2026-04-16 09:15', platform: 'Telegram', tokens: '1,504' },
    { id: 'sess-e5f6', title: '生成并审核代码 PR', date: '2026-04-15 16:45', platform: 'GitHub Copilot', tokens: '8,920' },
    { id: 'sess-g7h8', title: '查询上周的服务器日志错误', date: '2026-04-15 10:20', platform: 'Discord', tokens: '2,341' },
  ]
  
  if (query.id) {
    return {
      session: mockSessions.find(s => s.id === query.id),
      messages: [
        { role: 'user', content: '帮助我分析一下当前项目的目录结构，并给出一份重构建议。' },
        { role: 'tool', tool_name: 'run_command', content: 'drwxr-xr-x 1 root root 4096 Apr 17 08:00 components\ndrwxr-xr-x 1 root root 4096 Apr 17 08:00 pages' },
        { role: 'assistant', content: '根据 `src/` 目录的输出，我建议进行如下重构以提升可维护性：\n\n1. **拆分 Components**：将 `components` 按照业务领域进行分类。\n2. **引入 Composables/Hooks**：将页面逻辑抽离到独立的 `composables` 目录中。\n3. **API 隔离**：在 `src/` 外层或内部建立 `api` 目录统一管理请求逻辑。' }
      ],
      isRealHermesConnected: false
    }
  }

  return {
    sessions: mockSessions,
    isRealHermesConnected: false
  }
})
