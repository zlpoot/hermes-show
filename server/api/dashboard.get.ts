import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const db = getHermesDB()
  
  // Basic mock defaults if hermes not found locally
  const stats = {
    todayTokens: '1.24M',
    cpuLoad: '18.4%',
    activeAgents: 4,
    latency: '245ms'
  }
  
  const activeTasks = [
    { id: 1, name: '数据备份到 S3 (Cron)', agent: 'sys-admin-01', platform: 'Background', time: '10:30 AM' },
    { id: 2, name: '总结 GitHub Issues', agent: 'research-bot', platform: 'Telegram', time: '11:15 AM' },
    { id: 3, name: '训练轨迹压缩 (MiMo v2)', agent: 'hermes-core', platform: 'Local', time: '11:42 AM' },
  ]

  if (db) {
    try {
      // Trying to guess Hermes DB schema from documentation (sessions table)
      // We will read the real data if it exists
      const totalTokensRow = db.prepare("SELECT SUM(input_tokens + output_tokens) as total FROM sessions WHERE started_at > datetime('now', '-1 day')").get() as any
      if (totalTokensRow && totalTokensRow.total) {
        stats.todayTokens = (totalTokensRow.total / 1000).toFixed(1) + 'K'
      }
      
      const activeRows = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE ended_at IS NULL").get() as any
      if (activeRows) {
        stats.activeAgents = activeRows.count
      }
    } catch (e) {
      console.log('Using mock dashboard data due to schema mismatch', e)
    } finally {
      db.close()
    }
  }
  
  return {
    stats,
    activeTasks,
    isRealHermesConnected: !!db
  }
})
