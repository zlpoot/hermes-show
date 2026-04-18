import { defineEventHandler } from 'h3'
import { getHermesDB } from '../utils/hermes'

export default defineEventHandler(async (event) => {
  const db = getHermesDB()
  
  // Basic mock defaults if hermes not found locally
  const stats = {
    todayTokens: '0',
    cpuLoad: '0%',
    activeAgents: 0,
    latency: '0ms'
  }
  
  let activeTasks = []

  if (db) {
    try {
      // Get table info to check what we're working with
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[]
      const tableNames = tables.map(t => t.name)
      
      // If we have a sessions table
      if (tableNames.includes('sessions')) {
        // Get total tokens today
        try {
          const totalTokensRow = db.prepare("SELECT SUM(input_tokens + output_tokens) as total FROM sessions WHERE started_at > datetime('now', '-1 day')").get() as any
          if (totalTokensRow && totalTokensRow.total) {
            stats.todayTokens = (totalTokensRow.total / 1000).toFixed(1) + 'K'
          }
        } catch(e) { /* ignore missing columns */ }
        
        // Get active agents
        try {
          const activeRows = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE ended_at IS NULL").get() as any
          if (activeRows) {
            stats.activeAgents = activeRows.count
          }
          
          // Get active tasks list
          const activeTasksData = db.prepare("SELECT id, title as name, source_platform as platform, started_at as time FROM sessions WHERE ended_at IS NULL LIMIT 10").all() as any[]
          activeTasks = activeTasksData.map(t => ({
            id: t.id,
            name: t.name || 'Unnamed Task',
            agent: 'hermes-core',
            platform: t.platform || 'Local',
            time: new Date(t.time).toLocaleTimeString()
          }))
        } catch(e) { /* ignore missing columns */ }
      }
      
      // If no active tasks found in DB, we'll return empty array rather than mock data
      // since we are connected to the real DB
      
      // Get some system stats if possible
      stats.cpuLoad = (Math.random() * 30 + 10).toFixed(1) + '%' // Mock CPU for now as it's not in DB
      stats.latency = Math.floor(Math.random() * 200 + 50) + 'ms' // Mock latency
      
    } catch (e) {
      console.log('Error reading from real DB', e)
    } finally {
      db.close()
    }
  } else {
    // Return mock data if not connected
    stats.todayTokens = '1.24M'
    stats.cpuLoad = '18.4%'
    stats.activeAgents = 4
    stats.latency = '245ms'
    
    activeTasks = [
      { id: 1, name: '数据备份到 S3 (Cron)', agent: 'sys-admin-01', platform: 'Background', time: '10:30 AM' },
      { id: 2, name: '总结 GitHub Issues', agent: 'research-bot', platform: 'Telegram', time: '11:15 AM' },
      { id: 3, name: '训练轨迹压缩 (MiMo v2)', agent: 'hermes-core', platform: 'Local', time: '11:42 AM' },
    ]
  }
  
  return {
    stats,
    activeTasks,
    isRealHermesConnected: !!db
  }
})
