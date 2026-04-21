import fs from 'node:fs'
import path from 'node:path'
import { getHermesPath, getHermesDB, getHermesConfig } from '../utils/hermes'

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
  // GLM / JD Cloud (estimated)
  'glm-4': { input: 0.5, output: 1 },
  'glm-5': { input: 0.3, output: 0.6 },
  // 天翼云
  'ctyun': { input: 0.5, output: 1 },
  // Default
  'default': { input: 0.5, output: 1 }
}

function getModelPricing(model: string): { input: number; output: number } {
  const m = model.toLowerCase()
  if (m.includes('gpt-4o-mini')) return MODEL_PRICING['gpt-4o-mini'] ?? MODEL_PRICING['default']!
  if (m.includes('gpt-4o')) return MODEL_PRICING['gpt-4o'] ?? MODEL_PRICING['default']!
  if (m.includes('gpt-4-turbo')) return MODEL_PRICING['gpt-4-turbo'] ?? MODEL_PRICING['default']!
  if (m.includes('gpt-4')) return MODEL_PRICING['gpt-4'] ?? MODEL_PRICING['default']!
  if (m.includes('gpt-3.5')) return MODEL_PRICING['gpt-3.5-turbo'] ?? MODEL_PRICING['default']!
  if (m.includes('claude-3-opus')) return MODEL_PRICING['claude-3-opus'] ?? MODEL_PRICING['default']!
  if (m.includes('claude-3-sonnet') || m.includes('claude-sonnet-4')) return MODEL_PRICING['claude-3-sonnet'] ?? MODEL_PRICING['default']!
  if (m.includes('claude-3-haiku')) return MODEL_PRICING['claude-3-haiku'] ?? MODEL_PRICING['default']!
  if (m.includes('deepseek-coder')) return MODEL_PRICING['deepseek-coder'] ?? MODEL_PRICING['default']!
  if (m.includes('deepseek')) return MODEL_PRICING['deepseek-chat'] ?? MODEL_PRICING['default']!
  if (m.includes('glm-4')) return MODEL_PRICING['glm-4'] ?? MODEL_PRICING['default']!
  if (m.includes('glm-5') || m.includes('glm5')) return MODEL_PRICING['glm-5'] ?? MODEL_PRICING['default']!
  if (m.includes('ctyun') || m.includes('天翼')) return MODEL_PRICING['ctyun'] ?? MODEL_PRICING['default']!
  return MODEL_PRICING['default']!
}

export default defineEventHandler(async (event) => {
  const hermesPath = getHermesPath()
  const prisma = getHermesDB()
  const config = getHermesConfig()
  
  // 默认月度预算（可从配置中读取）
  const monthlyBudget = 100
  
  if (!prisma) {
    return getMockData(monthlyBudget)
  }
  
  try {
    // 获取今日日期范围
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStartTs = todayStart.getTime() / 1000
    
    // 获取本周开始
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekStartTs = weekStart.getTime() / 1000
    
    // 获取本月开始
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const monthStartTs = monthStart.getTime() / 1000
    
    // 获取上月开始和结束
    const lastMonthStart = new Date()
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
    lastMonthStart.setDate(1)
    lastMonthStart.setHours(0, 0, 0, 0)
    const lastMonthStartTs = lastMonthStart.getTime() / 1000
    
    const lastMonthEnd = new Date()
    lastMonthEnd.setDate(0)
    lastMonthEnd.setHours(23, 59, 59, 999)
    const lastMonthEndTs = lastMonthEnd.getTime() / 1000
    
    // 查询所有会话
    const sessions: any[] = await prisma.$queryRaw`
      SELECT 
        source, model, input_tokens, output_tokens, started_at
      FROM sessions
    `
    
    // 聚合计算
    let todayCost = 0, todayTokens = 0
    let weekCost = 0
    let monthCost = 0, lastMonthCost = 0
    
    const byProvider: Record<string, { cost: number; tokens: number; sessions: number; model: string }> = {}
    const byDate: Record<string, { cost: number; tokens: number }> = {}
    const byUser: Record<string, { cost: number; tokens: number; sessions: number; platform: string; displayName: string }> = {}
    
    for (const session of sessions) {
      const startedAt = session.started_at
      const model = session.model || 'default'
      const source = session.source || 'local'
      const inputTokens = session.input_tokens || 0
      const outputTokens = session.output_tokens || 0
      
      const pricing = getModelPricing(model)
      const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000000
      const tokens = inputTokens + outputTokens
      
      // 今日统计
      if (startedAt >= todayStartTs) {
        todayCost += cost
        todayTokens += tokens
      }
      
      // 本周统计
      if (startedAt >= weekStartTs) {
        weekCost += cost
      }
      
      // 本月统计
      if (startedAt >= monthStartTs) {
        monthCost += cost
        
        // 按提供商聚合
        const providerKey = source
        if (!byProvider[providerKey]) {
          byProvider[providerKey] = { cost: 0, tokens: 0, sessions: 0, model }
        }
        byProvider[providerKey].cost += cost
        byProvider[providerKey].tokens += tokens
        byProvider[providerKey].sessions++
        byProvider[providerKey].model = model // 更新为最新模型
        
        // 按日期聚合
        const dateObj = new Date(startedAt * 1000)
        const date = dateObj.toISOString().split('T')[0]
        if (date) {
          if (!byDate[date]) {
            byDate[date] = { cost: 0, tokens: 0 }
          }
          byDate[date].cost += cost
          byDate[date].tokens += tokens
        }
      }
      
      // 上月统计
      if (startedAt >= lastMonthStartTs && startedAt < monthStartTs) {
        lastMonthCost += cost
      }
    }
    
    // 计算预估月消费
    const daysInMonth = new Date().getDate()
    const avgDailyCost = daysInMonth > 0 ? monthCost / daysInMonth : 0
    const daysRemaining = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - daysInMonth
    const estimatedMonthCost = monthCost + (avgDailyCost * daysRemaining)
    
    // 提供商成本分布
    const providerCosts = Object.entries(byProvider)
      .map(([name, data]) => {
        const percent = monthCost > 0 ? (data.cost / monthCost) * 100 : 0
        const displayNames: Record<string, string> = {
          'cli': 'CLI',
          'discord': 'Discord',
          'telegram': 'Telegram',
          'weixin': '微信',
          'slack': 'Slack'
        }
        return {
          name,
          displayName: displayNames[name] || name,
          model: data.model,
          cost: parseFloat(data.cost.toFixed(4)),
          percent: parseFloat(percent.toFixed(1)),
          color: getProviderColor(name),
          barColor: getProviderBarColor(name)
        }
      })
      .sort((a, b) => b.cost - a.cost)
    
    // 近7天消费趋势
    const last7Days: { label: string; cost: number }[] = []
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0] ?? ''
      const dayIndex = d.getDay()
      last7Days.push({
        label: dayNames[dayIndex] ?? '',
        cost: parseFloat((dateStr && byDate[dateStr]?.cost ? byDate[dateStr].cost : 0).toFixed(4))
      })
    }
    
    // 计算月环比变化
    const monthChange = lastMonthCost > 0 
      ? ((monthCost - lastMonthCost) / lastMonthCost) * 100 
      : 0
    
    return {
      isRealHermesConnected: true,
      
      budget: {
        total: monthlyBudget,
        used: parseFloat(monthCost.toFixed(4)),
        remaining: parseFloat(Math.max(0, monthlyBudget - monthCost).toFixed(4))
      },
      
      today: {
        cost: parseFloat(todayCost.toFixed(4)),
        tokens: todayTokens
      },
      
      week: {
        cost: parseFloat(weekCost.toFixed(4)),
        avgDaily: parseFloat((weekCost / 7).toFixed(4))
      },
      
      month: {
        cost: parseFloat(monthCost.toFixed(4)),
        change: parseFloat(monthChange.toFixed(1))
      },
      
      estimated: {
        cost: parseFloat(estimatedMonthCost.toFixed(4))
      },
      
      providerCosts,
      dailyTrend: last7Days,
      topUsers: [] // 暂无用户维度数据
    }
    
  } catch (e) {
    console.error('Failed to query budget data', e)
    return getMockData(monthlyBudget)
  }
})

function getProviderColor(name: string): string {
  const colors: Record<string, string> = {
    'cli': 'text-gray-400',
    'discord': 'text-indigo-400',
    'telegram': 'text-blue-400',
    'weixin': 'text-green-400',
    'slack': 'text-purple-400'
  }
  return colors[name] || 'text-gray-400'
}

function getProviderBarColor(name: string): string {
  const colors: Record<string, string> = {
    'cli': 'bg-gray-400',
    'discord': 'bg-indigo-400',
    'telegram': 'bg-blue-400',
    'weixin': 'bg-green-400',
    'slack': 'bg-purple-400'
  }
  return colors[name] || 'bg-gray-400'
}

function getMockData(budget: number) {
  return {
    isRealHermesConnected: false,
    budget: { total: budget, used: 0, remaining: budget },
    today: { cost: 0, tokens: 0 },
    week: { cost: 0, avgDaily: 0 },
    month: { cost: 0, change: 0 },
    estimated: { cost: 0 },
    providerCosts: [],
    dailyTrend: [],
    topUsers: []
  }
}
