import { defineEventHandler, getQuery } from 'h3'
import fs from 'node:fs'
import path from 'node:path'
import { getHermesPath } from '../utils/hermes'

// Model pricing (USD per 1M tokens)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4': { input: 30, output: 60 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  // Anthropic
  'claude-3-opus': { input: 15, output: 75 },
  'claude-3-sonnet': { input: 3, output: 15 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  'claude-sonnet-4': { input: 3, output: 15 },
  // DeepSeek
  'deepseek-chat': { input: 0.14, output: 0.28 },
  'deepseek-coder': { input: 0.14, output: 0.28 },
  // 天翼云
  'ctyun': { input: 0.5, output: 1 },
  // Default
  'default': { input: 1, output: 2 }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const hermesPath = getHermesPath()
  
  if (!hermesPath) {
    return getMockData()
  }
  
  const sessionsDir = path.join(hermesPath, 'sessions')
  
  if (!fs.existsSync(sessionsDir)) {
    return getMockData()
  }
  
  const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'))
  
  // Aggregation containers
  const byModel: Record<string, { sessions: number; inputTokens: number; outputTokens: number; cost: number }> = {}
  const byDate: Record<string, { sessions: number; inputTokens: number; outputTokens: number; cost: number }> = {}
  const byPlatform: Record<string, { sessions: number; inputTokens: number; outputTokens: number; cost: number }> = {}
  
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let totalCost = 0
  let totalSessions = files.length
  
  // Process each session file
  for (const file of files) {
    const filePath = path.join(sessionsDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.trim().split('\n')
    
    let sessionModel = 'default'
    let sessionPlatform = 'local'
    let sessionDate = ''
    let sessionInputTokens = 0
    let sessionOutputTokens = 0
    
    // Parse session
    for (const line of lines) {
      try {
        const msg = JSON.parse(line)
        
        // Get metadata from first line
        if (msg.role === 'session_meta') {
          sessionModel = msg.model || 'default'
          sessionPlatform = msg.platform || 'local'
          sessionDate = msg.timestamp ? msg.timestamp.split('T')[0] : ''
        }
        
        // Count tokens (approximate from content length if not available)
        if (msg.role === 'user') {
          sessionInputTokens += Math.ceil((msg.content?.length || 0) / 4)
        } else if (msg.role === 'assistant') {
          sessionOutputTokens += Math.ceil((msg.content?.length || 0) / 4)
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
    
    // Normalize model name
    const normalizedModel = normalizeModel(sessionModel)
    
    // Calculate cost
    const pricing = MODEL_PRICING[normalizedModel] || MODEL_PRICING['default']
    const sessionCost = (sessionInputTokens * pricing.input + sessionOutputTokens * pricing.output) / 1000000
    
    // Aggregate by model
    if (!byModel[normalizedModel]) {
      byModel[normalizedModel] = { sessions: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
    }
    byModel[normalizedModel].sessions++
    byModel[normalizedModel].inputTokens += sessionInputTokens
    byModel[normalizedModel].outputTokens += sessionOutputTokens
    byModel[normalizedModel].cost += sessionCost
    
    // Aggregate by date
    if (sessionDate) {
      if (!byDate[sessionDate]) {
        byDate[sessionDate] = { sessions: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
      }
      byDate[sessionDate].sessions++
      byDate[sessionDate].inputTokens += sessionInputTokens
      byDate[sessionDate].outputTokens += sessionOutputTokens
      byDate[sessionDate].cost += sessionCost
    }
    
    // Aggregate by platform
    if (!byPlatform[sessionPlatform]) {
      byPlatform[sessionPlatform] = { sessions: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
    }
    byPlatform[sessionPlatform].sessions++
    byPlatform[sessionPlatform].inputTokens += sessionInputTokens
    byPlatform[sessionPlatform].outputTokens += sessionOutputTokens
    byPlatform[sessionPlatform].cost += sessionCost
    
    totalInputTokens += sessionInputTokens
    totalOutputTokens += sessionOutputTokens
    totalCost += sessionCost
  }
  
  // Sort by date and get last 30 days
  const sortedDates = Object.keys(byDate).sort().slice(-30)
  const chartData = {
    labels: sortedDates.map(d => formatDateShort(d)),
    datasets: [
      {
        label: '输入 Tokens',
        data: sortedDates.map(d => byDate[d].inputTokens),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: '输出 Tokens',
        data: sortedDates.map(d => byDate[d].outputTokens),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }
  
  // Cost by model chart (pie)
  const costByModel = Object.entries(byModel)
    .map(([model, data]) => ({
      model,
      ...data,
      avgCostPerSession: data.sessions > 0 ? data.cost / data.sessions : 0
    }))
    .sort((a, b) => b.cost - a.cost)
  
  // Cost by platform chart
  const costByPlatform = Object.entries(byPlatform)
    .map(([platform, data]) => ({
      platform,
      ...data
    }))
    .sort((a, b) => b.cost - a.cost)
  
  return {
    summary: {
      totalSessions,
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      totalCost,
      avgCostPerSession: totalSessions > 0 ? totalCost / totalSessions : 0
    },
    byModel: costByModel,
    byPlatform: costByPlatform,
    chartData,
    isRealHermesConnected: true
  }
})

function normalizeModel(model: string): string {
  const m = model.toLowerCase()
  if (m.includes('gpt-4o-mini')) return 'gpt-4o-mini'
  if (m.includes('gpt-4o')) return 'gpt-4o'
  if (m.includes('gpt-4-turbo')) return 'gpt-4-turbo'
  if (m.includes('gpt-4')) return 'gpt-4'
  if (m.includes('gpt-3.5')) return 'gpt-3.5-turbo'
  if (m.includes('claude-3-opus')) return 'claude-3-opus'
  if (m.includes('claude-3-sonnet')) return 'claude-3-sonnet'
  if (m.includes('claude-3-haiku')) return 'claude-3-haiku'
  if (m.includes('claude-sonnet-4')) return 'claude-sonnet-4'
  if (m.includes('deepseek-coder')) return 'deepseek-coder'
  if (m.includes('deepseek')) return 'deepseek-chat'
  if (m.includes('ctyun') || m.includes('天翼')) return 'ctyun'
  return 'default'
}

function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function getMockData() {
  const chartData = {
    labels: ['4/13', '4/14', '4/15', '4/16', '4/17', '4/18', '4/19'],
    datasets: [
      {
        label: '输入 Tokens',
        data: [50000, 75000, 60000, 90000, 85000, 100000, 95000],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: '输出 Tokens',
        data: [30000, 45000, 38000, 55000, 50000, 65000, 60000],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }
  
  return {
    summary: {
      totalSessions: 156,
      totalInputTokens: 555000,
      totalOutputTokens: 343000,
      totalTokens: 898000,
      totalCost: 12.45,
      avgCostPerSession: 0.08
    },
    byModel: [
      { model: 'deepseek-chat', sessions: 89, inputTokens: 320000, outputTokens: 180000, cost: 4.76, avgCostPerSession: 0.05 },
      { model: 'gpt-4o', sessions: 34, inputTokens: 150000, outputTokens: 95000, cost: 5.75, avgCostPerSession: 0.17 },
      { model: 'claude-3-sonnet', sessions: 23, inputTokens: 65000, outputTokens: 52000, cost: 1.69, avgCostPerSession: 0.07 },
      { model: 'ctyun', sessions: 10, inputTokens: 20000, outputTokens: 16000, cost: 0.26, avgCostPerSession: 0.03 }
    ],
    byPlatform: [
      { platform: 'weixin', sessions: 78, inputTokens: 280000, outputTokens: 170000, cost: 7.10 },
      { platform: 'cli', sessions: 52, inputTokens: 185000, outputTokens: 120000, cost: 3.85 },
      { platform: 'telegram', sessions: 26, inputTokens: 90000, outputTokens: 53000, cost: 1.50 }
    ],
    chartData,
    isRealHermesConnected: false
  }
}
