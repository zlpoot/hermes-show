import fs from 'node:fs'
import path from 'node:path'
import { getHermesPath, getHermesConfig, getHermesDB } from '../utils/hermes'

export default defineEventHandler(async (event) => {
  const hermesPath = getHermesPath()
  const config = getHermesConfig()
  const prisma = getHermesDB()
  
  // 从配置中获取 MCP 服务器配置
  const mcpServers = config?.mcp_servers || {}
  
  // 统计数据
  let todayCalls = 0
  let successCalls = 0
  let failedCalls = 0
  
  // 从数据库获取调用统计（如果有）
  if (prisma) {
    try {
      // 检查是否有 mcp_calls 表
      const tables: any[] = await prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' AND name='mcp_calls'
      `
      if (tables.length > 0) {
        const stats: any[] = await prisma.$queryRaw`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
          FROM mcp_calls
          WHERE date(created_at) = date('now')
        `
        if (stats[0]) {
          todayCalls = Number(stats[0].total || 0)
          successCalls = Number(stats[0].success || 0)
          failedCalls = Number(stats[0].failed || 0)
        }
      }
    } catch (e) {
      // 表不存在，忽略
    }
  }
  
  // 构建服务器列表
  const servers = Object.entries(mcpServers).map(([name, cfg]: [string, any]) => {
    const enabled = cfg.enabled !== false
    return {
      id: `mcp-${name}`,
      name,
      command: cfg.command || cfg.url || '',
      args: cfg.args || [],
      env: maskEnvVars(cfg.env || {}),
      connected: enabled, // 假设已配置即为已连接
      toolCount: 0, // 需要运行时获取
      callCount: 0,
      latency: 0,
      tools: cfg.tools?.include || [],
      enabled
    }
  })
  
  // 如果没有配置任何 MCP 服务器，显示默认提示
  const hasServers = servers.length > 0
  
  // 计算统计指标
  const successRate = todayCalls > 0 ? (successCalls / todayCalls) * 100 : 100
  
  return {
    stats: {
      todayCalls,
      successRate: parseFloat(successRate.toFixed(1)),
      avgLatency: 0,
      p99Latency: 0
    },
    
    servers,
    
    // 工具列表（从配置中提取）
    tools: servers.flatMap(s => 
      s.tools.map(t => ({
        name: t,
        server: s.name,
        description: `${s.name} 提供的工具`,
        category: getToolCategory(t),
        callCount: 0,
        avgTime: 0,
        enabled: true
      }))
    ),
    
    callStats: {
      total: todayCalls,
      success: successCalls,
      failed: failedCalls,
      timeout: 0,
      topTools: []
    },
    
    // 配置提示
    configHint: hasServers ? null : {
      message: '尚未配置 MCP 服务器',
      doc: '在 config.yaml 中添加 mcp_servers 配置来启用 MCP 工具',
      example: `mcp_servers:
  filesystem:
    command: npx
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/user']
  github:
    url: https://mcp.github.com
    env:
      GITHUB_TOKEN: your-token`
    },
    
    isRealHermesConnected: true
  }
})

function maskEnvVars(env: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {}
  for (const [key, value] of Object.entries(env)) {
    // 敏感信息脱敏
    if (key.toLowerCase().includes('token') || 
        key.toLowerCase().includes('key') || 
        key.toLowerCase().includes('secret')) {
      masked[key] = '***'
    } else {
      masked[key] = value
    }
  }
  return masked
}

function getToolCategory(toolName: string): string {
  if (toolName.includes('file') || toolName.includes('read') || toolName.includes('write')) {
    return 'file'
  }
  if (toolName.includes('search') || toolName.includes('web')) {
    return 'web'
  }
  if (toolName.includes('query') || toolName.includes('table') || toolName.includes('sql')) {
    return 'database'
  }
  if (toolName.includes('repo') || toolName.includes('issue') || toolName.includes('pr')) {
    return 'code'
  }
  return 'other'
}
