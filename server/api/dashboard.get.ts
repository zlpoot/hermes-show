import { defineEventHandler } from 'h3'
import { getHermesDB } from '../utils/hermes'
import os from 'node:os'

export default defineEventHandler(async (event) => {
  const prisma = getHermesDB()
  
  // Calculate today's start timestamp (midnight local time)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayStartTs = Math.floor(startOfToday.getTime() / 1000)
  
  // Default stats
  const stats = {
    todayTokens: '0',
    totalSessions: 0,
    todaySessions: 0,
    cpuLoad: '0%',
    activeAgents: 0,
    latency: '0ms',
    avgTokensPerSession: '0'
  }
  
  let activeTasks: any[] = []
  let chartData = { labels: [] as string[], datasets: [] as any[] }
  let recentSessions: any[] = []
  
  if (prisma) {
    try {
      // Total sessions count
      try {
        const totalResult: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sessions`
        stats.totalSessions = Number(totalResult[0]?.count || 0)
      } catch(e) {}
      
      // Today's sessions count (started_at is Unix timestamp)
      // Use JavaScript-calculated today's start time (local timezone)
      try {
        const todayResult: any[] = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM sessions 
          WHERE started_at >= ${todayStartTs}
        `
        stats.todaySessions = Number(todayResult[0]?.count || 0)
      } catch(e) {}
      
      // Today's tokens (started_at is Unix timestamp)
      // Use JavaScript-calculated today's start time (local timezone)
      try {
        const totalTokensRow: any[] = await prisma.$queryRaw`
          SELECT SUM(input_tokens + output_tokens) as total
          FROM sessions
          WHERE started_at >= ${todayStartTs}
        `
        if (totalTokensRow && totalTokensRow.length > 0 && totalTokensRow[0].total) {
          stats.todayTokens = formatTokens(Number(totalTokensRow[0].total))
        }
        
        // Average tokens per session
        if (stats.totalSessions > 0) {
          const avgResult: any[] = await prisma.$queryRaw`
            SELECT AVG(input_tokens + output_tokens) as avg 
            FROM sessions 
            WHERE input_tokens IS NOT NULL OR output_tokens IS NOT NULL
          `
          if (avgResult && avgResult.length > 0 && avgResult[0].avg) {
            stats.avgTokensPerSession = formatTokens(Number(avgResult[0].avg))
          }
        }
        
        // Get tokens for the last 7 days for the chart (started_at is Unix timestamp)
        const tokenTrend: any[] = await prisma.$queryRaw`
          SELECT date(started_at, 'unixepoch', 'localtime') as date, 
                 SUM(input_tokens + output_tokens) as total,
                 COUNT(*) as session_count
          FROM sessions 
          WHERE started_at > (strftime('%s', 'now', '-7 days')) 
          GROUP BY date(started_at, 'unixepoch', 'localtime') 
          ORDER BY date(started_at, 'unixepoch', 'localtime') ASC
        `
        
        if (tokenTrend && tokenTrend.length > 0) {
          chartData = {
            labels: tokenTrend.map(t => formatDate(t.date)),
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
      } catch(e) { /* ignore */ }
      
      // Get active agents
      try {
        const activeCount = await prisma.session.count({
          where: { ended_at: null }
        })
        stats.activeAgents = activeCount
        
        // Get active tasks list
        const activeTasksData = await prisma.session.findMany({
          where: { ended_at: null },
          take: 10,
          select: { id: true, title: true, source: true, started_at: true }
        })
        
        activeTasks = activeTasksData.map((t: any) => ({
          id: t.id,
          name: t.title || 'Unnamed Task',
          agent: 'hermes-core',
          platform: t.source || 'Local',
          time: formatTime(t.started_at)
        }))
      } catch(e) {
        // Fallback
        try {
          const countResult: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sessions WHERE ended_at IS NULL`
          stats.activeAgents = Number(countResult[0]?.count || 0)
          
          const fallbackTasks: any[] = await prisma.$queryRaw`
            SELECT id, title, source, started_at 
            FROM sessions WHERE ended_at IS NULL LIMIT 10
          `
          activeTasks = fallbackTasks.map((t: any) => ({
            id: t.id,
            name: t.title || 'Unnamed Task',
            agent: 'hermes-core',
            platform: t.source || 'Local',
            time: formatTime(t.started_at)
          }))
        } catch(err) {}
      }
      
      // Get recent sessions for the sidebar
      try {
        const recent: any[] = await prisma.$queryRaw`
          SELECT id, title, source, started_at, input_tokens, output_tokens 
          FROM sessions 
          ORDER BY started_at DESC 
          LIMIT 5
        `
        
        recentSessions = recent.map((s: any) => ({
          id: s.id,
          title: s.title || 'Unnamed Session',
          platform: s.source || 'Local',
          time: formatTime(s.started_at),
          tokens: (s.input_tokens || 0) + (s.output_tokens || 0)
        }))
      } catch(e) {}
      
      // CPU load
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
      
      // API latency
      const start = performance.now()
      await prisma.$queryRaw`SELECT 1`
      const end = performance.now()
      stats.latency = `${Math.round(end - start + 5)}ms`
      
    } catch (e) {
      console.log('Error reading from real DB', e)
    }
  } else {
    // Mock data
    stats.todayTokens = '1.24M'
    stats.totalSessions = 156
    stats.todaySessions = 12
    stats.cpuLoad = '18.4%'
    stats.activeAgents = 4
    stats.latency = '245ms'
    stats.avgTokensPerSession = '8.5K'
    
    activeTasks = [
      { id: '1', name: '数据备份到 S3', agent: 'sys-admin-01', platform: 'Background', time: '10:30 AM' },
      { id: '2', name: '总结 GitHub Issues', agent: 'research-bot', platform: 'Telegram', time: '11:15 AM' },
      { id: '3', name: '代码审查', agent: 'hermes-core', platform: 'Local', time: '11:42 AM' },
    ]
    
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
    
    recentSessions = [
      { id: '1', title: 'Introduction', platform: 'Local', time: '10:50 AM', tokens: 1250 },
      { id: '2', title: 'Code Review', platform: 'Telegram', time: '09:30 AM', tokens: 8420 },
      { id: '3', title: 'Bug Fix', platform: 'Local', time: 'Yesterday', tokens: 3560 },
    ]
  }
  
  return {
    stats,
    activeTasks,
    chartData,
    recentSessions,
    isRealHermesConnected: !!prisma
  }
})

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return (tokens / 1000000).toFixed(2) + 'M'
  } else if (tokens >= 1000) {
    return (tokens / 1000).toFixed(1) + 'K'
  }
  return tokens.toString()
}

function formatTime(startedAt: string | null): string {
  if (!startedAt) return 'Unknown Time'
  
  const isNumeric = !isNaN(Number(startedAt))
  if (isNumeric) {
    const ts = Number(startedAt)
    return new Date(ts < 10000000000 ? ts * 1000 : ts).toLocaleTimeString()
  }
  return new Date(startedAt).toLocaleTimeString()
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}
