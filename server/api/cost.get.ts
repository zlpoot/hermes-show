import { defineEventHandler, getQuery } from 'h3'
import { getHermesDB, getHermesPath } from '../utils/hermes'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

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
  // JD Cloud (京东云)
  'glm-5': { input: 0.5, output: 0.5 },  // GLM-5 pricing
  'glm-4.5-air': { input: 0.5, output: 0.5 },
  // 天翼云
  'ctyun': { input: 0.5, output: 1 },
  // Default
  'default': { input: 1, output: 2 }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const prisma = getHermesDB()
  
  // Session data from both sources
  interface SessionData {
    id: string
    source: string
    model: string
    input_tokens: number
    output_tokens: number
    started_at: number
  }
  
  let allSessions: SessionData[] = []
  
  // 1. 从 SQLite 读取会话数据
  if (prisma) {
    try {
      const dbSessions: any[] = await prisma.$queryRawUnsafe(`
        SELECT id, source, model, input_tokens, output_tokens, started_at
        FROM sessions
        ORDER BY started_at DESC
      `)
      
      for (const s of dbSessions) {
        allSessions.push({
          id: s.id,
          source: s.source || 'cli',
          model: s.model || 'default',
          input_tokens: s.input_tokens || 0,
          output_tokens: s.output_tokens || 0,
          started_at: s.started_at || 0
        })
      }
    } catch (e) {
      console.error('[cost] Database query failed:', e)
    }
  }
  
  // 2. 从 JSONL 文件读取并补充缺失的会话
  const dbSessionIds = new Set(allSessions.map(s => s.id))
  try {
    const jsonlSessions = await estimateTokensFromJsonl()
    
    for (const js of jsonlSessions) {
      if (!dbSessionIds.has(js.id)) {
        // JSONL 会话不在数据库中，添加它
        allSessions.push({
          id: js.id,
          source: js.platform,
          model: js.model,
          input_tokens: js.inputTokens,
          output_tokens: js.outputTokens,
          started_at: js.startedAt
        })
      } else {
        // 已存在，但如果数据库中的 token 为 0，使用 JSONL 估算值
        const existing = allSessions.find(s => s.id === js.id)
        if (existing && existing.input_tokens === 0 && existing.output_tokens === 0) {
          existing.input_tokens = js.inputTokens
          existing.output_tokens = js.outputTokens
        }
        // 如果数据库中 model 为空，使用 JSONL 的值
        if (existing && (!existing.model || existing.model === 'default')) {
          existing.model = js.model
        }
      }
    }
  } catch (e) {
    console.error('[cost] JSONL parsing failed:', e)
  }
  
  // 如果没有任何数据，返回空结果
  if (allSessions.length === 0) {
    return {
      summary: { totalSessions: 0, totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0, totalCost: 0, avgCostPerSession: 0 },
      byModel: [],
      byPlatform: [],
      chartData: { labels: [], datasets: [] },
      isRealHermesConnected: false
    }
  }
    
    // Aggregation containers
    const byModel: Record<string, { sessions: number; inputTokens: number; outputTokens: number; cost: number }> = {}
    const byDate: Record<string, { sessions: number; inputTokens: number; outputTokens: number; cost: number }> = {}
    const byPlatform: Record<string, { sessions: number; inputTokens: number; outputTokens: number; cost: number }> = {}
    
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let totalCost = 0
    let totalSessions = allSessions.length
    
    // Process each session
    for (const session of allSessions) {
      const inputTokens = session.input_tokens || 0
      const outputTokens = session.output_tokens || 0
      
      // Normalize model name
      const normalizedModel = normalizeModel(session.model || 'default')
      
      // Calculate cost
      const pricing = MODEL_PRICING[normalizedModel] || MODEL_PRICING['default']
      if (!pricing) continue // Skip if no pricing found
      const sessionCost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000000
      
      // Aggregate by model
      if (!byModel[normalizedModel]) {
        byModel[normalizedModel] = { sessions: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
      }
      byModel[normalizedModel].sessions++
      byModel[normalizedModel].inputTokens += inputTokens
      byModel[normalizedModel].outputTokens += outputTokens
      byModel[normalizedModel].cost += sessionCost
      
      // Aggregate by date
      if (session.started_at) {
        const ts = Number(session.started_at)
        const date = new Date(ts < 10000000000 ? ts * 1000 : ts)
        const dateStr = date.toISOString().split('T')[0]
        
        if (!dateStr) continue // Skip if invalid date
        if (!byDate[dateStr]) {
          byDate[dateStr] = { sessions: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
        }
        byDate[dateStr].sessions++
        byDate[dateStr].inputTokens += inputTokens
        byDate[dateStr].outputTokens += outputTokens
        byDate[dateStr].cost += sessionCost
      }
      
      // Aggregate by platform
      const platform = session.source || 'local'
      if (!byPlatform[platform]) {
        byPlatform[platform] = { sessions: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
      }
      byPlatform[platform].sessions++
      byPlatform[platform].inputTokens += inputTokens
      byPlatform[platform].outputTokens += outputTokens
      byPlatform[platform].cost += sessionCost
      
      totalInputTokens += inputTokens
      totalOutputTokens += outputTokens
      totalCost += sessionCost
    }
    
    // Sort by date and get last 30 days
    const sortedDates = Object.keys(byDate).sort().slice(-30)
    const chartData = {
      labels: sortedDates.map(d => formatDateShort(d)),
      datasets: [
        {
          label: '输入 Tokens',
          data: sortedDates.map(d => byDate[d]?.inputTokens ?? 0),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: '输出 Tokens',
          data: sortedDates.map(d => byDate[d]?.outputTokens ?? 0),
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
  if (!model) return 'default'
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
  if (m.includes('glm-5')) return 'glm-5'
  if (m.includes('glm-4.5')) return 'glm-4.5-air'
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

/**
 * 从 JSONL 文件中估算 token 数量
 * 由于 JSONL 文件中没有准确的 token 信息，我们通过字符数估算
 */
interface JsonlTokenInfo {
  id: string
  inputTokens: number
  outputTokens: number
  model: string
  platform: string
  startedAt: number
}

async function estimateTokensFromJsonl(): Promise<JsonlTokenInfo[]> {
  const hermesPath = getHermesPath()
  const sessionsPath = path.join(hermesPath, 'sessions')
  
  if (!fs.existsSync(sessionsPath)) {
    return []
  }
  
  const files = fs.readdirSync(sessionsPath)
    .filter(f => f.endsWith('.jsonl'))
    .sort((a, b) => b.localeCompare(a))
  
  const results: JsonlTokenInfo[] = []
  
  for (const file of files) {
    const filePath = path.join(sessionsPath, file)
    const sessionId = file.replace('.jsonl', '')
    
    try {
      const info = await parseJsonlTokens(filePath, sessionId)
      if (info) {
        results.push(info)
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  return results
}

async function parseJsonlTokens(filePath: string, sessionId: string): Promise<JsonlTokenInfo | null> {
  return new Promise((resolve) => {
    let totalChars = 0
    let assistantChars = 0
    let model = 'default'
    let platform = 'cli'
    let startedAt = 0
    let firstLine = true
    
    const fileStream = fs.createReadStream(filePath)
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    })
    
    rl.on('line', (line) => {
      if (!line.trim()) return
      
      try {
        const data = JSON.parse(line)
        
        // 第一行通常是 session_meta
        if (firstLine) {
          firstLine = false
          if (data.role === 'session_meta') {
            platform = data.platform || 'cli'
            model = data.model || 'default'
          }
        }
        
        // 提取时间戳
        if (data.timestamp) {
          const ts = new Date(data.timestamp).getTime() / 1000
          if (!startedAt || ts < startedAt) startedAt = ts
        }
        
        // 统计字符数
        const content = data.content || ''
        if (typeof content === 'string') {
          totalChars += content.length
        }
        
        if (data.role === 'assistant') {
          assistantChars += typeof content === 'string' ? content.length : 0
        }
      } catch (e) {
        // Ignore parse errors
      }
    })
    
    rl.on('close', () => {
      fileStream.destroy()
      
      // 粗略估算：1 token ≈ 4 chars (中文/混合)
      const inputTokens = Math.floor(totalChars / 4)
      const outputTokens = Math.floor(assistantChars / 4)
      
      resolve({
        id: sessionId,
        inputTokens,
        outputTokens,
        model,
        platform,
        startedAt
      })
    })
    
    rl.on('error', () => {
      fileStream.destroy()
      resolve(null)
    })
  })
}
