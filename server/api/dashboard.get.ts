import { defineEventHandler } from 'h3'
import { getHermesDB } from '../utils/hermes'
import os from 'node:os'

export default defineEventHandler(async (event) => {
  const prisma = getHermesDB()
  
  // Basic mock defaults if hermes not found locally
  const stats = {
    todayTokens: '0',
    cpuLoad: '0%',
    activeAgents: 0,
    latency: '0ms'
  }
  
  let activeTasks: any[] = []
  let chartData = { labels: [] as string[], datasets: [] as any[] }

  if (prisma) {
    try {
      // Get total tokens today via raw query because we need date functions and sum
      try {
        const totalTokensRow: any[] = await prisma.$queryRaw`SELECT SUM(input_tokens + output_tokens) as total FROM sessions WHERE started_at > datetime('now', '-1 day')`
        if (totalTokensRow && totalTokensRow.length > 0 && totalTokensRow[0].total) {
          stats.todayTokens = (Number(totalTokensRow[0].total) / 1000).toFixed(1) + 'K'
        }
        
        // Get tokens for the last 7 days for the chart
        const tokenTrend: any[] = await prisma.$queryRaw`
          SELECT date(started_at) as date, SUM(input_tokens + output_tokens) as total 
          FROM sessions 
          WHERE started_at > datetime('now', '-7 days') 
          GROUP BY date(started_at) 
          ORDER BY date(started_at) ASC
        `
        
        if (tokenTrend && tokenTrend.length > 0) {
          chartData = {
            labels: tokenTrend.map(t => t.date),
            datasets: [
              {
                label: 'Tokens',
                data: tokenTrend.map(t => Number(t.total)),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
              }
            ]
          }
        }
      } catch(e) { /* ignore missing columns or tables */ }
      
      // Get active agents using Prisma Client
      try {
        const activeCount = await prisma.session.count({
          where: { ended_at: null }
        })
        stats.activeAgents = activeCount
        
        // Get active tasks list
        const activeTasksData = await prisma.session.findMany({
          where: { ended_at: null },
          take: 10,
          select: { id: true, title: true, source_platform: true, started_at: true }
        })
        
        activeTasks = activeTasksData.map((t: any) => {
          let parsedTime = 'Unknown Time'
          if (t.started_at) {
            const isNumeric = !isNaN(Number(t.started_at))
            if (isNumeric) {
              const ts = Number(t.started_at)
              parsedTime = new Date(ts < 10000000000 ? ts * 1000 : ts).toLocaleTimeString()
            } else {
              parsedTime = new Date(t.started_at).toLocaleTimeString()
            }
          }
          
          return {
            id: t.id,
            name: t.title || 'Unnamed Task',
            agent: 'hermes-core',
            platform: t.source_platform || 'Local',
            time: parsedTime
          }
        })
      } catch(e) { 
        // Fallback using raw query if Prisma schema validation fails for some reason
        try {
          const fallbackTasks: any[] = await prisma.$queryRaw`SELECT id, title, 'Local' as source_platform, started_at FROM sessions WHERE ended_at IS NULL LIMIT 10`
          activeTasks = fallbackTasks.map((t: any) => {
            let parsedTime = 'Unknown Time'
            if (t.started_at) {
              const isNumeric = !isNaN(Number(t.started_at))
              if (isNumeric) {
                const ts = Number(t.started_at)
                parsedTime = new Date(ts < 10000000000 ? ts * 1000 : ts).toLocaleTimeString()
              } else {
                parsedTime = new Date(t.started_at).toLocaleTimeString()
              }
            }
            return {
              id: t.id,
              name: t.title || 'Unnamed Task',
              agent: 'hermes-core',
              platform: t.source_platform || 'Local',
              time: parsedTime
            }
          })
        } catch(err) {}
      }
      
      // Calculate real CPU load based on OS module
      const cpus = os.cpus()
      let idle = 0
      let total = 0
      for (let cpu of cpus) {
        for (let type in cpu.times) {
          total += (cpu.times as any)[type]
        }
        idle += cpu.times.idle
      }
      const cpuUsage = 100 - ~~(100 * idle / total)
      stats.cpuLoad = `${cpuUsage}%`
      
      // Simulate real API latency via simple local check
      const start = performance.now()
      await prisma.$queryRaw`SELECT 1`
      const end = performance.now()
      stats.latency = `${Math.round(end - start + 5)}ms`
      
    } catch (e) {
      console.log('Error reading from real DB', e)
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
    isRealHermesConnected: !!prisma
  }
})
