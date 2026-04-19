import { defineEventHandler } from 'h3'
import { getHermesPath } from '../utils/hermes'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execSync } from 'node:child_process'

export default defineEventHandler(async (event) => {
  const hermesPath = getHermesPath()
  
  // System info
  const systemInfo = {
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    uptime: formatUptime(os.uptime()),
    totalMemory: formatBytes(os.totalmem()),
    freeMemory: formatBytes(os.freemem()),
    usedMemoryPercent: Math.round((1 - os.freemem() / os.totalmem()) * 100),
    cpuCores: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'Unknown',
    loadAverage: os.loadavg().map(l => l.toFixed(2))
  }
  
  // Disk info
  let diskInfo = {
    total: 'Unknown',
    used: 'Unknown',
    free: 'Unknown',
    usedPercent: 0
  }
  
  try {
    if (os.platform() === 'linux') {
      const dfOutput = execSync('df -h / 2>/dev/null | tail -1', { encoding: 'utf-8' })
      const parts = dfOutput.trim().split(/\s+/)
      if (parts.length >= 5) {
        diskInfo = {
          total: parts[1],
          used: parts[2],
          free: parts[3],
          usedPercent: parseInt(parts[4]) || 0
        }
      }
    } else if (os.platform() === 'darwin') {
      const dfOutput = execSync('df -h / 2>/dev/null | tail -1', { encoding: 'utf-8' })
      const parts = dfOutput.trim().split(/\s+/)
      if (parts.length >= 5) {
        diskInfo = {
          total: parts[1],
          used: parts[2],
          free: parts[3],
          usedPercent: parseInt(parts[4]) || 0
        }
      }
    }
  } catch (e) {
    // Fallback
  }
  
  // Hermes directory info
  let hermesInfo = {
    path: hermesPath || 'Not found',
    exists: false,
    totalSize: '0 B',
    sessionCount: 0,
    skillCount: 0,
    dbSize: '0 B',
    logSize: '0 B',
    cacheSize: '0 B',
    breakdown: [] as { name: string; size: string; path: string }[]
  }
  
  if (hermesPath && fs.existsSync(hermesPath)) {
    hermesInfo.exists = true
    
    // Calculate directory sizes
    const sessionsPath = path.join(hermesPath, 'sessions')
    const skillsPath = path.join(hermesPath, 'skills')
    const dbPath = path.join(hermesPath, 'state.db')
    const logsPath = path.join(hermesPath, 'logs')
    const cachePath = path.join(hermesPath, 'cache')
    
    const breakdown: { name: string; size: string; path: string }[] = []
    
    // Sessions
    if (fs.existsSync(sessionsPath)) {
      const sessionSize = getDirSize(sessionsPath)
      const files = fs.readdirSync(sessionsPath).filter(f => f.endsWith('.jsonl'))
      hermesInfo.sessionCount = files.length
      breakdown.push({ name: '会话记录', size: formatBytes(sessionSize), path: 'sessions/' })
    }
    
    // Skills
    if (fs.existsSync(skillsPath)) {
      const skillSize = getDirSize(skillsPath)
      const skillDirs = fs.readdirSync(skillsPath, { withFileTypes: true })
        .filter(d => d.isDirectory())
      hermesInfo.skillCount = skillDirs.length
      breakdown.push({ name: 'Skills', size: formatBytes(skillSize), path: 'skills/' })
    }
    
    // Database
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath)
      hermesInfo.dbSize = formatBytes(stats.size)
      breakdown.push({ name: '数据库', size: hermesInfo.dbSize, path: 'state.db' })
    }
    
    // Logs
    if (fs.existsSync(logsPath)) {
      const logSize = getDirSize(logsPath)
      hermesInfo.logSize = formatBytes(logSize)
      breakdown.push({ name: '日志文件', size: hermesInfo.logSize, path: 'logs/' })
    }
    
    // Cache
    if (fs.existsSync(cachePath)) {
      const cacheSize = getDirSize(cachePath)
      hermesInfo.cacheSize = formatBytes(cacheSize)
      breakdown.push({ name: '缓存', size: hermesInfo.cacheSize, path: 'cache/' })
    }
    
    // Checkpoints
    const checkpointsPath = path.join(hermesPath, 'checkpoints')
    if (fs.existsSync(checkpointsPath)) {
      const checkpointSize = getDirSize(checkpointsPath)
      if (checkpointSize > 0) {
        breakdown.push({ name: '检查点', size: formatBytes(checkpointSize), path: 'checkpoints/' })
      }
    }
    
    // Memories
    const memoriesPath = path.join(hermesPath, 'memories')
    if (fs.existsSync(memoriesPath)) {
      const memorySize = getDirSize(memoriesPath)
      if (memorySize > 0) {
        breakdown.push({ name: '记忆存储', size: formatBytes(memorySize), path: 'memories/' })
      }
    }
    
    hermesInfo.breakdown = breakdown
    hermesInfo.totalSize = formatBytes(getDirSize(hermesPath))
  }
  
  // Gateway status
  let gatewayStatus = {
    running: false,
    pid: null as number | null,
    uptime: null as string | null
  }
  
  if (hermesPath) {
    const pidFile = path.join(hermesPath, 'gateway.pid')
    if (fs.existsSync(pidFile)) {
      try {
        const pid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim())
        if (!isNaN(pid)) {
          // Check if process is running
          try {
            process.kill(pid, 0)
            gatewayStatus.running = true
            gatewayStatus.pid = pid
            
            // Get process uptime
            try {
              const uptimeOutput = execSync(`ps -o etimes= -p ${pid} 2>/dev/null`, { encoding: 'utf-8' })
              const seconds = parseInt(uptimeOutput.trim())
              if (!isNaN(seconds)) {
                gatewayStatus.uptime = formatUptime(seconds)
              }
            } catch (e) {}
          } catch (e) {
            // Process not running
          }
        }
      } catch (e) {}
    }
  }
  
  // Health checks
  const healthChecks = {
    memory: {
      status: systemInfo.usedMemoryPercent < 90 ? 'healthy' : systemInfo.usedMemoryPercent < 95 ? 'warning' : 'critical',
      message: systemInfo.usedMemoryPercent < 90 ? '内存使用正常' : systemInfo.usedMemoryPercent < 95 ? '内存使用较高' : '内存严重不足'
    },
    disk: {
      status: diskInfo.usedPercent < 80 ? 'healthy' : diskInfo.usedPercent < 90 ? 'warning' : 'critical',
      message: diskInfo.usedPercent < 80 ? '磁盘空间充足' : diskInfo.usedPercent < 90 ? '磁盘空间紧张' : '磁盘空间严重不足'
    },
    hermes: {
      status: hermesInfo.exists ? 'healthy' : 'critical',
      message: hermesInfo.exists ? 'Hermes 目录正常' : '未找到 Hermes 目录'
    },
    gateway: {
      status: gatewayStatus.running ? 'healthy' : 'warning',
      message: gatewayStatus.running ? `Gateway 运行中 (PID: ${gatewayStatus.pid})` : 'Gateway 未运行'
    }
  }
  
  // Overall status
  const statuses = Object.values(healthChecks).map(h => h.status)
  let overallStatus = 'healthy'
  if (statuses.includes('critical')) {
    overallStatus = 'critical'
  } else if (statuses.includes('warning')) {
    overallStatus = 'warning'
  }
  
  return {
    systemInfo,
    diskInfo,
    hermesInfo,
    gatewayStatus,
    healthChecks,
    overallStatus,
    timestamp: new Date().toISOString(),
    isRealHermesConnected: !!hermesPath
  }
})

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) {
    return `${days}d ${hours}h ${mins}m`
  } else if (hours > 0) {
    return `${hours}h ${mins}m`
  } else {
    return `${mins}m`
  }
}

function getDirSize(dirPath: string): number {
  let size = 0
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const file of files) {
      const filePath = path.join(dirPath, file.name)
      if (file.isDirectory()) {
        size += getDirSize(filePath)
      } else if (file.isFile()) {
        try {
          size += fs.statSync(filePath).size
        } catch (e) {}
      }
    }
  } catch (e) {}
  return size
}
