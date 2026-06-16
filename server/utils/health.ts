import fs from 'node:fs'
import path from 'node:path'

export type HealthStatus = 'healthy' | 'warning' | 'critical'

export interface HealthCheck {
  status: HealthStatus
  message: string
}

export interface DiskInfo {
  total: string
  used: string
  free: string
  usedPercent: number
}

export interface GatewayStatus {
  running: boolean
  pid: number | null
  uptime: string | null
  pidFileExists: boolean
  pidFileFormat: 'json' | 'text' | 'invalid' | 'missing'
  message: string
}

export interface HermesHealthInfo {
  path: string
  exists: boolean
  totalSize: string
  sessionCount: number
  skillCount: number
  dbSize: string
  logSize: string
  cacheSize: string
  configExists: boolean
  dbExists: boolean
  logsExists: boolean
  sessionsExists: boolean
  gatewayPidExists: boolean
  breakdown: { name: string; size: string; path: string }[]
  checks: Record<string, HealthCheck>
}

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export const getDirSize = (dirPath: string): number => {
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
        } catch {}
      }
    }
  } catch {}
  return size
}

export const parseDfOutput = (output: string): DiskInfo | null => {
  const lines = output.trim().split('\n').filter(Boolean)
  const dataLine = lines.length > 1 ? lines[lines.length - 1] : lines[0]
  if (!dataLine) return null

  const parts = dataLine.trim().split(/\s+/)
  if (parts.length < 5) return null

  return {
    total: parts[1] || 'Unknown',
    used: parts[2] || 'Unknown',
    free: parts[3] || 'Unknown',
    usedPercent: parseInt((parts[4] || '0').replace('%', ''), 10) || 0
  }
}

export const resourceStatus = (
  usedPercent: number,
  warningThreshold: number,
  criticalThreshold: number
): HealthStatus => {
  if (usedPercent >= criticalThreshold) return 'critical'
  if (usedPercent >= warningThreshold) return 'warning'
  return 'healthy'
}

export const parseGatewayPid = (content: string): {
  pid: number | null
  format: GatewayStatus['pidFileFormat']
} => {
  const trimmed = content.trim()
  if (!trimmed) return { pid: null, format: 'invalid' }

  try {
    const parsed = JSON.parse(trimmed)
    if (typeof parsed === 'number') {
      return Number.isInteger(parsed) && parsed > 0
        ? { pid: parsed, format: 'text' }
        : { pid: null, format: 'invalid' }
    }
    const pid = Number(parsed?.pid)
    return Number.isInteger(pid) && pid > 0
      ? { pid, format: 'json' }
      : { pid: null, format: 'invalid' }
  } catch {
    const pid = Number(trimmed)
    return Number.isInteger(pid) && pid > 0
      ? { pid, format: 'text' }
      : { pid: null, format: 'invalid' }
  }
}

export const inspectGatewayStatus = (
  hermesPath: string,
  isProcessRunning: (pid: number) => boolean,
  getProcessUptime?: (pid: number) => number | null
): GatewayStatus => {
  const pidFile = path.join(hermesPath, 'gateway.pid')
  if (!fs.existsSync(pidFile)) {
    return {
      running: false,
      pid: null,
      uptime: null,
      pidFileExists: false,
      pidFileFormat: 'missing',
      message: 'Gateway pid 文件不存在'
    }
  }

  try {
    const { pid, format } = parseGatewayPid(fs.readFileSync(pidFile, 'utf-8'))
    if (!pid) {
      return {
        running: false,
        pid: null,
        uptime: null,
        pidFileExists: true,
        pidFileFormat: format,
        message: 'Gateway pid 文件格式无效'
      }
    }

    const running = isProcessRunning(pid)
    const uptimeSeconds = running ? getProcessUptime?.(pid) : null
    return {
      running,
      pid,
      uptime: uptimeSeconds ? formatUptime(uptimeSeconds) : null,
      pidFileExists: true,
      pidFileFormat: format,
      message: running ? `Gateway 运行中 (PID: ${pid})` : `Gateway 进程不存在 (PID: ${pid})`
    }
  } catch {
    return {
      running: false,
      pid: null,
      uptime: null,
      pidFileExists: true,
      pidFileFormat: 'invalid',
      message: 'Gateway pid 文件读取失败'
    }
  }
}

export const inspectHermesHealth = (hermesPath: string): HermesHealthInfo => {
  const exists = !!hermesPath && fs.existsSync(hermesPath) && fs.statSync(hermesPath).isDirectory()
  const info: HermesHealthInfo = {
    path: hermesPath || 'Not found',
    exists,
    totalSize: '0 B',
    sessionCount: 0,
    skillCount: 0,
    dbSize: '0 B',
    logSize: '0 B',
    cacheSize: '0 B',
    configExists: false,
    dbExists: false,
    logsExists: false,
    sessionsExists: false,
    gatewayPidExists: false,
    breakdown: [],
    checks: {
      hermesDirectory: {
        status: exists ? 'healthy' : 'critical',
        message: exists ? 'Hermes 目录存在' : '未找到 Hermes 目录'
      }
    }
  }

  if (!exists) return info

  const sessionsPath = path.join(hermesPath, 'sessions')
  const skillsPath = path.join(hermesPath, 'skills')
  const dbPath = path.join(hermesPath, 'state.db')
  const configPath = path.join(hermesPath, 'config.yaml')
  const logsPath = path.join(hermesPath, 'logs')
  const cachePath = path.join(hermesPath, 'cache')
  const gatewayPidPath = path.join(hermesPath, 'gateway.pid')

  info.configExists = fs.existsSync(configPath)
  info.dbExists = fs.existsSync(dbPath)
  info.logsExists = fs.existsSync(logsPath)
  info.sessionsExists = fs.existsSync(sessionsPath)
  info.gatewayPidExists = fs.existsSync(gatewayPidPath)

  info.checks.config = {
    status: info.configExists ? 'healthy' : 'warning',
    message: info.configExists ? 'config.yaml 存在' : '缺少 config.yaml'
  }
  info.checks.database = {
    status: info.dbExists ? 'healthy' : 'warning',
    message: info.dbExists ? 'state.db 存在' : '缺少 state.db'
  }
  info.checks.logs = {
    status: info.logsExists ? 'healthy' : 'warning',
    message: info.logsExists ? '日志目录存在' : '缺少 logs 目录'
  }
  info.checks.sessions = {
    status: info.sessionsExists ? 'healthy' : 'warning',
    message: info.sessionsExists ? 'sessions 目录存在' : '缺少 sessions 目录'
  }

  if (info.sessionsExists) {
    const sessionSize = getDirSize(sessionsPath)
    const files = fs.readdirSync(sessionsPath).filter(f => f.endsWith('.jsonl'))
    info.sessionCount = files.length
    info.breakdown.push({ name: '会话记录', size: formatBytes(sessionSize), path: 'sessions/' })
  }

  if (fs.existsSync(skillsPath)) {
    const skillSize = getDirSize(skillsPath)
    const skillDirs = fs.readdirSync(skillsPath, { withFileTypes: true }).filter(d => d.isDirectory())
    info.skillCount = skillDirs.length
    info.breakdown.push({ name: 'Skills', size: formatBytes(skillSize), path: 'skills/' })
  }

  if (info.dbExists) {
    const stats = fs.statSync(dbPath)
    info.dbSize = formatBytes(stats.size)
    info.breakdown.push({ name: '数据库', size: info.dbSize, path: 'state.db' })
  }

  if (info.logsExists) {
    const logSize = getDirSize(logsPath)
    info.logSize = formatBytes(logSize)
    info.breakdown.push({ name: '日志文件', size: info.logSize, path: 'logs/' })
  }

  if (fs.existsSync(cachePath)) {
    const cacheSize = getDirSize(cachePath)
    info.cacheSize = formatBytes(cacheSize)
    info.breakdown.push({ name: '缓存', size: info.cacheSize, path: 'cache/' })
  }

  for (const [dirName, label] of [['checkpoints', '检查点'], ['memories', '记忆存储']] as const) {
    const dirPath = path.join(hermesPath, dirName)
    if (fs.existsSync(dirPath)) {
      const dirSize = getDirSize(dirPath)
      if (dirSize > 0) {
        info.breakdown.push({ name: label, size: formatBytes(dirSize), path: `${dirName}/` })
      }
    }
  }

  info.totalSize = formatBytes(getDirSize(hermesPath))
  return info
}
