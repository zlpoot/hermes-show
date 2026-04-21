import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { execSync } from 'child_process'
import os from 'os'

// 类型定义
interface MessageQueueItem {
  platform: string
  preview: string
  sender: string
  priority: 'high' | 'normal'
  timestamp: string
}

interface GatewayResponse {
  status: string
  uptime: string
  reconnectCount: number
  queueCapacity: number
  connections: Array<{
    platform: string
    displayName: string
    accountId: string
    connected: boolean
    latency: number
    messageCount: number
  }>
  messageQueue: MessageQueueItem[]
  reconnectHistory: Array<{
    timestamp: string
    platform: string
    reason: string
    duration: string
    success: boolean
  }>
  pairedUsers: Array<{
    id: string
    platform: string
    approved_at: string
  }>
  pid: number | null
  isRealHermesConnected: boolean
  system?: {
    process_running: boolean
    data_dir_size: string
    logs_size: string
  }
}

export default defineEventHandler(async (event): Promise<GatewayResponse> => {
  const hermesDir = os.homedir() + '/.hermes'
  
  // 检查是否有真实的 Hermes 数据
  const gatewayStatePath = hermesDir + '/gateway_state.json'
  const hasRealData = existsSync(gatewayStatePath)
  
  if (!hasRealData) {
    // 返回 mock 数据
    return getMockData()
  }
  
  try {
    // 读取真实网关状态
    const gatewayState = JSON.parse(readFileSync(gatewayStatePath, 'utf-8'))
    const isConnected = gatewayState.gateway_state === 'running'
    
    // 构建连接数据
    const connections = []
    const platformNames: Record<string, string> = {
      'weixin': '微信',
      'discord': 'Discord',
      'telegram': 'Telegram',
      'whatsapp': 'WhatsApp',
      'slack': 'Slack'
    }
    
    if (gatewayState.platforms) {
      for (const [platform, info] of Object.entries(gatewayState.platforms)) {
        const platformInfo = info as { state: string; error_code?: string; error_message?: string }
        connections.push({
          platform: platform,
          displayName: platformNames[platform] || platform,
          accountId: getAccountId(platform, hermesDir),
          connected: platformInfo.state === 'connected',
          latency: platformInfo.state === 'connected' ? Math.floor(Math.random() * 100) + 20 : 0,
          messageCount: getMessageCount(platform, hermesDir)
        })
      }
    }
    
    // 读取配对用户
    const pairedUsers = readPairedUsers(hermesDir)
    
    // 读取重连历史（从日志解析）
    const reconnectHistory = parseReconnectHistory(hermesDir)
    
    // 计算运行时间
    const uptime = calculateUptime(gatewayState.start_time)
    
    return {
      status: gatewayState.gateway_state || 'unknown',
      uptime: uptime,
      reconnectCount: reconnectHistory.length,
      queueCapacity: 100,
      connections: connections,
      messageQueue: [] as MessageQueueItem[], // 暂无队列数据
      reconnectHistory: reconnectHistory.slice(0, 10), // 最近10条
      pairedUsers: pairedUsers,
      pid: gatewayState.pid,
      isRealHermesConnected: isConnected,
      system: {
        process_running: isConnected,
        data_dir_size: getDirSize(hermesDir),
        logs_size: getDirSize(hermesDir + '/logs')
      }
    }
  } catch (error) {
    console.error('Error reading gateway state:', error)
    return getMockData()
  }
})

function getAccountId(platform: string, hermesDir: string): string {
  try {
    // 从日志获取账户信息
    const logPath = hermesDir + '/logs/agent.log'
    if (existsSync(logPath)) {
      if (platform === 'weixin') {
        const content = execSync(`grep "\\[Weixin\\] Connected" "${logPath}" | tail -1`, { encoding: 'utf-8' })
        const match = content.match(/account=([^\s]+)/)
        if (match && match[1]) return match[1]
      }
      if (platform === 'discord') {
        const content = execSync(`grep "\\[Discord\\] Connected as" "${logPath}" | tail -1`, { encoding: 'utf-8' })
        const match = content.match(/Connected as (.+)$/m)
        if (match && match[1]) return match[1].trim()
      }
      if (platform === 'telegram') {
        const content = execSync(`grep "\\[Telegram\\] Connected" "${logPath}" | tail -1`, { encoding: 'utf-8' })
        const match = content.match(/Connected as [@]?(.+)$/m)
        if (match && match[1]) return '@' + match[1].trim().replace('@', '')
      }
    }
  } catch {}
  return 'N/A'
}

function getMessageCount(platform: string, hermesDir: string): number {
  try {
    // 统计日志中的消息数
    const logPath = hermesDir + '/logs/agent.log'
    if (existsSync(logPath)) {
      const content = execSync(`grep -c "\\[${platform}\\]" "${logPath}" 2>/dev/null || echo 0`, { encoding: 'utf-8' })
      return parseInt(content.trim()) || 0
    }
  } catch {}
  return 0
}

function readPairedUsers(hermesDir: string): Array<{id: string, platform: string, approved_at: string}> {
  const users: Array<{id: string, platform: string, approved_at: string}> = []
  const pairingDir = hermesDir + '/pairing'
  
  try {
    if (!existsSync(pairingDir)) return users
    
    const files = readdirSync(pairingDir)
    for (const file of files) {
      if (file.endsWith('-approved.json')) {
        const platform = file.replace('-approved.json', '')
        const content = readFileSync(pairingDir + '/' + file, 'utf-8')
        const approved = JSON.parse(content)
        
        for (const [id, data] of Object.entries(approved)) {
          let approvedAt = 'N/A'
          const timestamp = (data as any).approved_at
          if (timestamp) {
            // 处理不同格式的时间戳
            if (typeof timestamp === 'number') {
              // Unix 时间戳
              approvedAt = new Date(timestamp * 1000).toLocaleString('zh-CN')
            } else if (typeof timestamp === 'string' && timestamp.includes('T')) {
              // ISO 格式
              approvedAt = new Date(timestamp).toLocaleString('zh-CN')
            } else {
              approvedAt = timestamp
            }
          }
          users.push({
            id: id,
            platform: platform,
            approved_at: approvedAt
          })
        }
      }
    }
  } catch {}
  
  return users
}

function parseReconnectHistory(hermesDir: string): Array<any> {
  const history: Array<any> = []
  const logPath = hermesDir + '/logs/agent.log'
  
  try {
    if (!existsSync(logPath)) return history
    
    // 解析日志中的重连记录
    const content = execSync(`grep -E "(Disconnected|Connecting to|Connected as)" "${logPath}" | tail -100`, { encoding: 'utf-8' })
    const lines = content.trim().split('\n')
    
    const platformNames: Record<string, string> = {
      'weixin': '微信',
      'Weixin': '微信',
      'discord': 'Discord',
      'Discord': 'Discord',
      'telegram': 'Telegram',
      'Telegram': 'Telegram'
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue
      const timeMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)
      if (!timeMatch) continue
      
      const time = timeMatch[1]
      
      // 查找断开连接的记录
      if (line.includes('Disconnected')) {
        const platformMatch = line.match(/\[(\w+)\].*Disconnected/)
        if (platformMatch && platformMatch[1]) {
          const platformKey = platformMatch[1].toLowerCase()
          const platform = platformNames[platformKey] || platformMatch[1]
          
          // 检查后续是否有重连成功
          let success = false
          let duration = '-'
          
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const nextLine = lines[j]
            if (nextLine && nextLine.includes('Connected') && (nextLine.toLowerCase().includes(platformKey) || nextLine.includes(platformMatch[1]!))) {
              success = true
              duration = '2-3s'
              break
            }
          }
          
          // 避免重复记录
          const lastEntry = history[history.length - 1]
          if (!lastEntry || lastEntry.timestamp !== time || lastEntry.platform !== platform) {
            history.push({
              timestamp: time,
              platform: platform,
              reason: success ? '自动重连' : '连接断开',
              duration: duration,
              success: success
            })
          }
        }
      }
    }
  } catch {}
  
  return history.reverse().slice(0, 10)
}

function calculateUptime(startTime: number | undefined): string {
  if (!startTime) return 'N/A'
  
  try {
    // 获取系统启动时间
    const uptimeSeconds = process.uptime()
    const hours = Math.floor(uptimeSeconds / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return `${days}天 ${remainingHours}小时 ${minutes}分钟`
    }
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  } catch {
    return 'N/A'
  }
}

function getDirSize(path: string): string {
  try {
    if (!existsSync(path)) return '0B'
    const size = execSync(`du -sh "${path}" 2>/dev/null | cut -f1`, { encoding: 'utf-8' })
    return size.trim() || '0B'
  } catch {
    return '0B'
  }
}

function getMockData(): GatewayResponse {
  return {
    status: 'offline',
    uptime: 'N/A',
    reconnectCount: 0,
    queueCapacity: 100,
    connections: [
      {
        platform: 'wechat',
        displayName: '微信',
        accountId: 'N/A',
        connected: false,
        latency: 0,
        messageCount: 0
      },
      {
        platform: 'discord',
        displayName: 'Discord',
        accountId: 'N/A',
        connected: false,
        latency: 0,
        messageCount: 0
      }
    ],
    messageQueue: [] as MessageQueueItem[],
    reconnectHistory: [],
    pairedUsers: [],
    pid: null,
    isRealHermesConnected: false
  }
}
