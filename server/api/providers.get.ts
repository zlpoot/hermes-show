import { defineEventHandler } from 'h3'
import { getHermesDB } from '../utils/hermes'

export default defineEventHandler(async (event) => {
  const prisma = getHermesDB()
  
  if (prisma) {
    try {
      // Get all sessions with token info
      const sessions: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, source, started_at, ended_at, input_tokens, output_tokens, model
         FROM sessions 
         WHERE started_at > ? 
         ORDER BY started_at DESC`,
        Date.now() - 7 * 24 * 60 * 60 * 1000 // Last 7 days
      )
      
      // Calculate provider performance
      const providerStats = new Map<string, {
        calls: number
        successes: number
        failures: number
        responseTimes: number[]
        model: string
      }>()
      
      for (const session of sessions) {
        // Extract provider from model or source
        const provider = session.source || 'local'
        const model = session.model || 'unknown'
        const key = `${provider}:${model}`
        
        const stats = providerStats.get(key) || {
          calls: 0,
          successes: 0,
          failures: 0,
          responseTimes: [],
          model
        }
        
        stats.calls++
        // Assume success if we have output tokens
        if (session.output_tokens && session.output_tokens > 0) {
          stats.successes++
        } else {
          stats.failures++
        }
        
        // Estimate response time from session duration
        if (session.started_at && session.ended_at) {
          const duration = Number(session.ended_at) - Number(session.started_at)
          if (duration > 0 && duration < 300000) { // Less than 5 minutes
            stats.responseTimes.push(duration)
          }
        }
        
        providerStats.set(key, stats)
      }
      
      // Format provider data
      const providers = Array.from(providerStats.entries()).map(([key, stats]) => {
        const [provider] = key.split(':')
        const avgResponseTime = stats.responseTimes.length > 0
          ? stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
          : 0
        
        // Calculate P95
        const sortedTimes = [...stats.responseTimes].sort((a, b) => a - b)
        const p95Index = Math.floor(sortedTimes.length * 0.95)
        const p95ResponseTime = sortedTimes[p95Index] || avgResponseTime
        
        return {
          provider,
          model: stats.model,
          calls: stats.calls,
          successes: stats.successes,
          failures: stats.failures,
          successRate: stats.calls > 0 ? (stats.successes / stats.calls) * 100 : 100,
          avgResponseTime,
          p95ResponseTime,
          recentCalls: [] // Would need message-level data for this
        }
      }).sort((a, b) => b.calls - a.calls)
      
      // Calculate summary
      const totalCalls = providers.reduce((sum, p) => sum + p.calls, 0)
      const successfulCalls = providers.reduce((sum, p) => sum + p.successes, 0)
      const failedCalls = providers.reduce((sum, p) => sum + p.failures, 0)
      const allResponseTimes = providers.flatMap(p => p.avgResponseTime ? [p.avgResponseTime] : [])
      
      const summary = {
        totalCalls,
        successfulCalls,
        failedCalls,
        successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 100,
        avgResponseTime: allResponseTimes.length > 0 
          ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length 
          : 0,
        minResponseTime: allResponseTimes.length > 0 ? Math.min(...allResponseTimes) : 0,
        maxResponseTime: allResponseTimes.length > 0 ? Math.max(...allResponseTimes) : 0,
        callsLast24h: sessions.filter(s => Number(s.started_at) > Date.now() - 24 * 60 * 60 * 1000).length,
        activeProviders: new Set(providers.map(p => p.provider)).size,
        activeModels: providers.length
      }
      
      // Response time distribution
      const responseTimeBuckets = [
        { label: '0-100ms', min: 0, max: 100, count: 0 },
        { label: '100-500ms', min: 100, max: 500, count: 0 },
        { label: '500ms-1s', min: 500, max: 1000, count: 0 },
        { label: '1-2s', min: 1000, max: 2000, count: 0 },
        { label: '2-5s', min: 2000, max: 5000, count: 0 },
        { label: '>5s', min: 5000, max: Infinity, count: 0 }
      ]
      
      for (const p of providers) {
        if (p.avgResponseTime > 0) {
          for (const bucket of responseTimeBuckets) {
            if (p.avgResponseTime >= bucket.min && p.avgResponseTime < bucket.max) {
              bucket.count += p.calls
              break
            }
          }
        }
      }
      
      // Success rate trend (mock for now - would need hourly data)
      const successRateTrend = []
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(Date.now() - i * 60 * 60 * 1000)
        successRateTrend.push({
          hour: hour.getHours() + ':00',
          rate: 95 + Math.random() * 5 // Mock: 95-100%
        })
      }
      
      // Get recent errors (sessions with failures)
      const errors = sessions
        .filter(s => !s.output_tokens || s.output_tokens === 0)
        .slice(0, 10)
        .map(s => ({
          id: s.id,
          provider: s.source || 'local',
          model: s.model || 'unknown',
          message: 'No output generated - possible API error or timeout',
          time: new Date(Number(s.started_at)).toLocaleString(),
          sessionId: s.id.slice(0, 12),
          responseTime: 0
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
  
  // Mock data fallback
  return {
    summary: {
      totalCalls: 1250,
      successfulCalls: 1235,
      failedCalls: 15,
      successRate: 98.8,
      avgResponseTime: 1250,
      minResponseTime: 180,
      maxResponseTime: 8500,
      callsLast24h: 342,
      activeProviders: 3,
      activeModels: 5
    },
    providers: [
      { provider: 'ctyun', model: 'GLM-5', calls: 520, successes: 518, failures: 2, successRate: 99.6, avgResponseTime: 980, p95ResponseTime: 2100, recentCalls: [] },
      { provider: 'jdcloud', model: 'GLM-5', calls: 380, successes: 375, failures: 5, successRate: 98.7, avgResponseTime: 1450, p95ResponseTime: 3200, recentCalls: [] },
      { provider: 'openai', model: 'gpt-4o-mini', calls: 200, successes: 198, failures: 2, successRate: 99.0, avgResponseTime: 850, p95ResponseTime: 1800, recentCalls: [] },
      { provider: 'deepseek', model: 'deepseek-chat', calls: 150, successes: 144, failures: 6, successRate: 96.0, avgResponseTime: 1200, p95ResponseTime: 2800, recentCalls: [] }
    ],
    responseTimeDistribution: [
      { label: '0-100ms', count: 45 },
      { label: '100-500ms', count: 180 },
      { label: '500ms-1s', count: 320 },
      { label: '1-2s', count: 450 },
      { label: '2-5s', count: 220 },
      { label: '>5s', count: 35 }
    ],
    successRateTrend: Array.from({ length: 24 }, (_, i) => ({
      hour: `${23 - i}:00`,
      rate: 95 + Math.random() * 5
    })),
    errors: [
      { id: 'err-1', provider: 'deepseek', model: 'deepseek-chat', message: 'Connection timeout after 30s', time: '2026-04-19 16:30:45', sessionId: 'sess-abc123', responseTime: 30000 },
      { id: 'err-2', provider: 'jdcloud', model: 'GLM-5', message: 'Rate limit exceeded', time: '2026-04-19 15:22:10', sessionId: 'sess-def456', responseTime: 150 }
    ],
    isRealHermesConnected: false
  }
})
