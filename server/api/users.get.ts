import fs from 'node:fs'
import path from 'node:path'
import { getHermesPath, getHermesConfig, getHermesDB, getRuntimeConfig } from '../utils/hermes'

export default defineEventHandler(async (event) => {
  const hermesPath = getHermesPath()
  const config = getHermesConfig()
  const prisma = getHermesDB()
  const runtimeConfig = getRuntimeConfig()
  
  // 从运行时配置或 Hermes config.yaml 获取授权策略
  const allowAllUsers = runtimeConfig.gatewayAllowAllUsers === 'true' || 
                        runtimeConfig.weixinAllowAllUsers === 'true'
  const pairingMode = runtimeConfig.weixinDmPolicy || config?.weixin?.dm_policy || 'pairing'
  
  // 读取授权用户列表
  const authorizedUsers: any[] = []
  const pendingPairings: any[] = []
  const blacklist: any[] = []
  
  // 从数据库获取用户统计
  if (prisma) {
    try {
      const userStats: any[] = await prisma.$queryRaw`
        SELECT 
          user_id, 
          COUNT(*) as sessions,
          SUM(input_tokens) as input_tokens,
          SUM(output_tokens) as output_tokens,
          MAX(started_at) as last_session,
          MAX(source) as source
        FROM sessions 
        GROUP BY user_id
      `
      
      const now = Date.now() / 1000
      
      for (const stat of userStats) {
        if (!stat.user_id) continue
        
        const userId = stat.user_id
        const platform = detectPlatform(userId)
        const lastSessionTs = Number(stat.last_session) || 0
        const lastActive = formatTimeAgo(now - lastSessionTs)
        const sessionCount = Number(stat.sessions) || 0
        
        // 判断活跃状态
        const isActive = (now - lastSessionTs) < 3600 // 1小时内活跃
        
        authorizedUsers.push({
          id: userId,
          displayName: getDisplayName(userId, platform),
          platform,
          role: 'user', // 可以从配置中读取管理员列表
          lastActive,
          sessionCount,
          status: isActive ? 'active' : 'offline',
          tokens: {
            input: Number(stat.input_tokens) || 0,
            output: Number(stat.output_tokens) || 0
          }
        })
      }
    } catch (e) {
      console.error('Failed to query user stats', e)
    }
  }
  
  // 读取配对请求（如果有）
  const pairingPath = path.join(hermesPath, 'pairing_requests.json')
  if (fs.existsSync(pairingPath)) {
    try {
      const pairingData = JSON.parse(fs.readFileSync(pairingPath, 'utf-8'))
      for (const req of pairingData) {
        pendingPairings.push({
          id: req.user_id,
          displayName: req.display_name || '未知用户',
          platform: detectPlatform(req.user_id),
          requestTime: formatTimeAgo(Date.now() / 1000 - (req.timestamp || 0))
        })
      }
    } catch (e) {
      // 忽略
    }
  }
  
  // 读取黑名单（如果有）
  const blacklistPath = path.join(hermesPath, 'blacklist.json')
  if (fs.existsSync(blacklistPath)) {
    try {
      const blacklistData = JSON.parse(fs.readFileSync(blacklistPath, 'utf-8'))
      for (const item of blacklistData) {
        blacklist.push({
          id: item.user_id,
          displayName: item.display_name || '未知用户',
          platform: detectPlatform(item.user_id),
          reason: item.reason || '未说明',
          blockedTime: item.blocked_at || '未知'
        })
      }
    } catch (e) {
      // 忽略
    }
  }
  
  // 统计今日活跃用户
  let activeToday = 0
  if (prisma) {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayStartTs = todayStart.getTime() / 1000
      
      const activeUsers: any[] = await prisma.$queryRaw`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM sessions 
        WHERE started_at >= ${todayStartTs}
      `
      activeToday = Number(activeUsers[0]?.count || 0)
    } catch (e) {
      // 忽略
    }
  }
  
  return {
    stats: {
      authorizedUsers: authorizedUsers.length,
      pendingPairings: pendingPairings.length,
      activeToday,
      blacklisted: blacklist.length
    },
    
    allowAllUsers,
    pairingMode,
    
    pendingPairings,
    authorizedUsers: authorizedUsers.sort((a, b) => b.sessionCount - a.sessionCount),
    blacklist,
    
    isRealHermesConnected: true
  }
})

function detectPlatform(userId: string): string {
  if (userId.includes('@im.wechat') || userId.includes('@im.weixin')) return 'wechat'
  if (userId.includes('@telegram')) return 'telegram'
  if (userId.includes('@discord') || /^\d{17,20}$/.test(userId)) return 'discord'
  if (userId.includes('@slack')) return 'slack'
  return 'unknown'
}

function getDisplayName(userId: string, platform: string): string {
  // Discord 用户 ID 是纯数字
  if (platform === 'discord' && /^\d{17,20}$/.test(userId)) {
    return `Discord用户 ${userId.slice(-4)}`
  }
  // 微信用户
  if (platform === 'wechat') {
    const match = userId.match(/^([^@]+)/)
    if (match) {
      return `微信用户 ${match[1].slice(-4)}`
    }
  }
  // Telegram 用户
  if (platform === 'telegram') {
    const match = userId.match(/^(\d+)@/)
    if (match) {
      return `Telegram用户 ${match[1].slice(-4)}`
    }
  }
  return userId.split('@')[0].slice(0, 8)
}

function formatTimeAgo(seconds: number): string {
  if (seconds < 60) return '刚刚'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} 天前`
  return `${Math.floor(seconds / 604800)} 周前`
}
