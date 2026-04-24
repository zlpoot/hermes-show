import { defineEventHandler } from 'h3'
import { getHermesDB } from '../utils/hermes'

export default defineEventHandler(async (event) => {
  const prisma = getHermesDB()
  
  if (prisma) {
    try {
      // Get all sessions with token info
      // Note: started_at is stored as Unix timestamp in SECONDS, not milliseconds
      const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
      
      const sessions: any[] = await prisma.$queryRawUnsafe(
        `SELECT 
          id, source, started_at, ended_at, 
          input_tokens, output_tokens
         FROM sessions 
         WHERE started_at > ? 
         ORDER BY started_at DESC`,
        sevenDaysAgo
      )
      
      // If no sessions, return empty state (not mock data)
      if (sessions.length === 0) {
        return {
          summary: {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            successRate: 100,
            avgResponseTime: 0,
            minResponseTime: 0,
            maxResponseTime: 0,
            callsLast24h: 0,
            activeProviders: 0,
            activeModels: 0
          },
          providers: [],
          responseTimeDistribution: [],
          successRateTrend: [],
          errors: [],
          isRealHermesConnected: true
        }
      }
      
      // Calculate provider performance using source
      const providerStats = new Map<string, {
        calls: number
        successes: number
        failures: number
        platform: string
      }>()
      
      for (const session of sessions) {
        const platform = session.source || 'unknown'
        const key = platform
        
        const stats = providerStats.get(key) || {
          calls: 0,
          successes: 0,
          failures: 0,
          platform
        }
        
        stats.calls++
        // Success if we have output tokens
        if (session.output_tokens && session.output_tokens > 0) {
          stats.successes++
        } else {
          stats.failures++
        }
        
        providerStats.set(key, stats)
      }
      
      // Format provider data
      const providers = Array.from(providerStats.entries()).map(([key, stats]) => {
        return {
          provider: stats.platform,
          model: '-',  // Model info not available in current schema
          source: stats.platform,
          baseUrl: '',
          calls: stats.calls,
          successes: stats.successes,
          failures: stats.failures,
          successRate: stats.calls > 0 ? (stats.successes / stats.calls) * 100 : 100,
          avgResponseTime: 0,  // Not available without message-level timing
          p95ResponseTime: 0,
          recentCalls: []
        }
      }).sort((a, b) => b.calls - a.calls)
      
      // Calculate summary
      const totalCalls = providers.reduce((sum, p) => sum + p.calls, 0)
      const successfulCalls = providers.reduce((sum, p) => sum + p.successes, 0)
      const failedCalls = providers.reduce((sum, p) => sum + p.failures, 0)
      
      const summary = {
        totalCalls,
        successfulCalls,
        failedCalls,
        successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 100,
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        callsLast24h: sessions.filter(s => Number(s.started_at) > Math.floor(Date.now() / 1000) - 24 * 60 * 60).length,
        activeProviders: new Set(providers.map(p => p.provider)).size,
        activeModels: providers.length
      }
      
      // Response time distribution - not available without message-level timing
      const responseTimeBuckets: { label: string; count: number }[] = []
      
      // Success rate trend by hour
      const successRateTrend = []
      for (let i = 23; i >= 0; i--) {
        const hourStart = Math.floor(Date.now() / 1000) - (i + 1) * 60 * 60
        const hourEnd = Math.floor(Date.now() / 1000) - i * 60 * 60
        
        const hourSessions = sessions.filter(s => 
          Number(s.started_at) >= hourStart && Number(s.started_at) < hourEnd
        )
        const hourSuccesses = hourSessions.filter(s => s.output_tokens > 0).length
        const hourRate = hourSessions.length > 0 
          ? (hourSuccesses / hourSessions.length) * 100 
          : 100
        
        const hourDate = new Date((hourStart + hourEnd) / 2 * 1000)
        successRateTrend.push({
          hour: hourDate.getHours() + ':00',
          rate: hourRate,
          calls: hourSessions.length
        })
      }
      
      // Get recent errors (sessions with failures)
      const errors = sessions
        .filter(s => !s.output_tokens || s.output_tokens === 0)
        .slice(0, 10)
        .map(s => ({
          id: s.id,
          provider: s.source || 'unknown',
          model: '-',
          message: 'No output generated - possible API error or timeout',
          time: new Date(Number(s.started_at) * 1000).toLocaleString(),
          sessionId: s.id.slice(0, 12),
          responseTime: s.ended_at ? Math.round((Number(s.ended_at) - Number(s.started_at)) * 1000) : 0
        }))
      
      return {
        summary,
        providers,
        responseTimeDistribution: responseTimeBuckets,
        successRateTrend,
        errors,
        isRealHermesConnected: true
      }
    } catch (e) {
      console.log('[providers] Failed to fetch from DB:', e)
    }
  }
  
  // 无数据库连接，返回空数据
  console.log('[providers] No database connection')
  return {
    summary: {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      successRate: 100,
      avgResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      callsLast24h: 0,
      activeProviders: 0,
      activeModels: 0
    },
    providers: [],
    responseTimeDistribution: [],
    successRateTrend: [],
    errors: [],
    isRealHermesConnected: false
  }
})
