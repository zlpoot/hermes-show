import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import yaml from 'yaml'
import { PrismaClient } from '@prisma/client'

/**
 * 获取 Hermes 配置目录路径
 * 支持跨平台: Linux, macOS, Windows, WSL
 */
export const getHermesPath = (): string => {
  // 1. 优先使用环境变量 NUXT_HERMES_PATH
  const envPath = process.env.NUXT_HERMES_PATH
  if (envPath && fs.existsSync(envPath)) {
    return envPath
  }

  // 2. 根据平台自动检测
  const platform = process.platform
  
  // Windows 平台
  if (platform === 'win32') {
    // 尝试 WSL 路径 (常见 WSL 发行版名称)
    const wslDistros = ['Ubuntu-20.04', 'Ubuntu-22.04', 'Ubuntu', 'ubuntu']
    for (const distro of wslDistros) {
      const wslPath = `\\\\wsl$\\${distro}\\home`
      try {
        if (fs.existsSync(wslPath)) {
          // 找到 WSL，尝试获取用户名
          const users = fs.readdirSync(wslPath).filter(u => !u.startsWith('.'))
          if (users.length > 0) {
            const user = users[0]
            if (user) {
              const wslHermesPath = path.join(wslPath, user, '.hermes')
              if (fs.existsSync(wslHermesPath)) {
                return wslHermesPath
              }
            }
          }
        }
      } catch (e) {
        // 忽略权限错误，继续尝试其他路径
      }
    }
    
    // Windows 本地路径
    const winPath = path.join(os.homedir(), '.hermes')
    if (fs.existsSync(winPath)) {
      return winPath
    }
  }
  
  // Linux/macOS 默认路径
  const defaultPath = path.join(os.homedir(), '.hermes')
  if (fs.existsSync(defaultPath)) {
    return defaultPath
  }
  
  // 3. 返回默认路径（即使不存在，让调用方处理）
  return defaultPath
}

/**
 * 获取 Hermes 配置对象
 */
export const getHermesConfig = () => {
  const configPath = path.join(getHermesPath(), 'config.yaml')
  try {
    if (fs.existsSync(configPath)) {
      const file = fs.readFileSync(configPath, 'utf8')
      return yaml.parse(file)
    }
  } catch (e) {
    console.error('Failed to read config.yaml', e)
  }
  return null
}

let prisma: PrismaClient | null = null

/**
 * 获取 Hermes 数据库连接
 */
export const getHermesDB = () => {
  if (prisma) return prisma

  const dbPath = path.join(getHermesPath(), 'state.db')
  console.log('[hermes] Looking for DB at:', dbPath)
  console.log('[hermes] DB exists:', fs.existsSync(dbPath))
  
  try {
    if (fs.existsSync(dbPath)) {
      // Set DATABASE_URL environment variable for Prisma
      const dbUrl = `file:${dbPath}`
      process.env.DATABASE_URL = dbUrl
      console.log('[hermes] DATABASE_URL set to:', dbUrl)
      
      prisma = new PrismaClient()
      console.log('[hermes] Prisma client created successfully')
      return prisma
    }
  } catch (e) {
    console.error('[hermes] Failed to connect to state.db with Prisma', e)
  }
  console.log('[hermes] Returning null prisma')
  return null
}

/**
 * 获取 Hermes 日志内容
 */
export const getHermesLogs = (filename: string, linesCount: number = 100) => {
  const logPath = path.join(getHermesPath(), 'logs', filename)
  try {
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf8')
      const lines = content.split('\n').filter(Boolean)
      return lines.slice(-linesCount)
    }
  } catch (e) {
    console.error(`Failed to read ${filename}`, e)
  }
  return null
}

/**
 * 解析日志行
 */
export const parseLogLine = (line: string) => {
  // Try standard format: 2026-04-15 06:39:53,020 INFO module: message
  const standardMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3})\s+([A-Z]+)\s+([^:]+):\s+(.*)$/)
  if (standardMatch) {
    const timePart = standardMatch[1]?.split(' ')[1]?.split(',')[0] ?? ''
    const level = standardMatch[2] ?? 'INFO'
    const source = standardMatch[3]?.trim() ?? 'System'
    const message = standardMatch[4] ?? ''
    return {
      time: timePart, // Just the time part
      level,
      source,
      message
    }
  }
  
  // Try bracketed format: [14:30:01] [INFO] [Core] message
  const bracketMatch = line.match(/\[(.*?)\]\s*\[([A-Z]+)\]\s*\[(.*?)\]\s*(.*)/)
  if (bracketMatch) {
    return {
      time: bracketMatch[1],
      level: bracketMatch[2],
      source: bracketMatch[3],
      message: bracketMatch[4]
    }
  }
  
  // Fallback: just return the whole line as message
  return { time: '', level: 'INFO', source: 'System', message: line }
}

/**
 * 获取运行时配置（封装 Nuxt runtimeConfig 访问）
 */
export const getRuntimeConfig = () => {
  try {
    const config = useRuntimeConfig()
    return config
  } catch (e) {
    // 在 Nuxt 上下文外调用时返回默认值
    return {
      hermesPath: process.env.NUXT_HERMES_PATH || '',
      gatewayAllowAllUsers: process.env.NUXT_GATEWAY_ALLOW_ALL_USERS || 'false',
      weixinAllowAllUsers: process.env.NUXT_WEIXIN_ALLOW_ALL_USERS || 'false',
      weixinDmPolicy: process.env.NUXT_WEIXIN_DM_POLICY || 'pairing',
      workDir: process.env.NUXT_WORK_DIR || '',
    }
  }
}

/**
 * 检测当前运行平台信息
 */
export const getPlatformInfo = () => {
  const platform = process.platform
  const isWindows = platform === 'win32'
  const isMac = platform === 'darwin'
  const isLinux = platform === 'linux'
  
  // 检测是否在 WSL 中运行
  let isWSL = false
  if (isLinux) {
    try {
      const release = fs.readFileSync('/proc/version', 'utf8')
      isWSL = release.toLowerCase().includes('microsoft') || release.toLowerCase().includes('wsl')
    } catch (e) {
      // 忽略
    }
  }
  
  return {
    platform,
    isWindows,
    isMac,
    isLinux,
    isWSL,
    homedir: os.homedir(),
    hermesPath: getHermesPath()
  }
}
