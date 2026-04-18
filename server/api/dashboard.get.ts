import { defineEventHandler } from 'h3'
import { getHermesDB } from '../utils/hermes'
import os from 'node:os'

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
  let chartData = { labels: [], datasets: [] }

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
          
          // Get tokens for the last 7 days for the chart
          const tokenTrend = db.prepare(`
            SELECT date(started_at) as date, SUM(input_tokens + output_tokens) as total 
            FROM sessions 
            WHERE started_at > datetime('now', '-7 days') 
            GROUP BY date(started_at) 
            ORDER BY date(started_at) ASC
          `).all() as any[]
          
          if (tokenTrend && tokenTrend.length > 0) {
            chartData = {
              labels: tokenTrend.map(t => t.date),
              datasets: [
                {
                  label: 'Tokens',
                  data: tokenTrend.map(t => t.total),
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  fill: true,
                  tension: 0.4
                }
              ]
            }
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
      
      // Calculate real CPU load based on OS module
      const cpus = os.cpus()
      let idle = 0
      let total = 0
      for (let cpu of cpus) {
        for (let type in cpu.times) {
          total += cpu.times[type]
        }
        idle += cpu.times.idle
      }
      const cpuUsage = 100 - ~~(100 * idle / total)
      stats.cpuLoad = `${cpuUsage}%`
      
      // Simulate real API latency via simple local check
      const start = performance.now()
      db.prepare("SELECT 1").get()
      const end = performance.now()
      stats.latency = `${Math.round(end - start + 5)}ms`
      
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
    
    // Mock chart data
    chartData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Tokens',
          data: [120000, 190000, 150000, 250000, 220000, 300000, 280000],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    }
  }
  
  return {
    stats,
    activeTasks,
    chartData,
    isRealHermesConnected: !!db
  }
})
