import { defineEventHandler } from 'h3'
import { getHermesPath } from '../utils/hermes'
import {
  formatBytes,
  formatUptime,
  inspectGatewayStatus,
  inspectHermesHealth,
  parseDfOutput,
  resourceStatus
} from '../utils/health'
import os from 'node:os'
import { execSync } from 'node:child_process'

export default defineEventHandler(async () => {
  const hermesPath = getHermesPath()

  const usedMemoryPercent = Math.round((1 - os.freemem() / os.totalmem()) * 100)
  const systemInfo = {
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    uptime: formatUptime(os.uptime()),
    totalMemory: formatBytes(os.totalmem()),
    freeMemory: formatBytes(os.freemem()),
    usedMemoryPercent,
    cpuCores: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'Unknown',
    loadAverage: os.loadavg().map(l => l.toFixed(2))
  }

  let diskInfo = {
    total: 'Unknown',
    used: 'Unknown',
    free: 'Unknown',
    usedPercent: 0
  }

  try {
    const dfOutput = execSync('df -h / 2>/dev/null', { encoding: 'utf-8' })
    diskInfo = parseDfOutput(dfOutput) || diskInfo
  } catch {}

  const hermesInfo = inspectHermesHealth(hermesPath)
  const gatewayStatus = hermesInfo.exists
    ? inspectGatewayStatus(
        hermesPath,
        (pid) => {
          try {
            process.kill(pid, 0)
            return true
          } catch {
            return false
          }
        },
        (pid) => {
          try {
            const uptimeOutput = execSync(`ps -o etimes= -p ${pid} 2>/dev/null`, { encoding: 'utf-8' })
            const seconds = parseInt(uptimeOutput.trim(), 10)
            return Number.isNaN(seconds) ? null : seconds
          } catch {
            return null
          }
        }
      )
    : {
        running: false,
        pid: null,
        uptime: null,
        pidFileExists: false,
        pidFileFormat: 'missing' as const,
        message: 'Hermes 未连接，无法检查 Gateway'
      }

  const memoryStatus = resourceStatus(systemInfo.usedMemoryPercent, 90, 95)
  const diskStatus = resourceStatus(diskInfo.usedPercent, 80, 90)
  const healthChecks = {
    memory: {
      status: memoryStatus,
      message: memoryStatus === 'healthy' ? '内存使用正常' : memoryStatus === 'warning' ? '内存使用较高' : '内存严重不足'
    },
    disk: {
      status: diskStatus,
      message: diskStatus === 'healthy' ? '磁盘空间充足' : diskStatus === 'warning' ? '磁盘空间紧张' : '磁盘空间严重不足'
    },
    hermes: hermesInfo.checks.hermesDirectory,
    config: hermesInfo.checks.config,
    database: hermesInfo.checks.database,
    logs: hermesInfo.checks.logs,
    sessions: hermesInfo.checks.sessions,
    gateway: {
      status: gatewayStatus.running ? 'healthy' : 'warning',
      message: gatewayStatus.message
    }
  }

  const statuses = Object.values(healthChecks)
    .filter(Boolean)
    .map(h => h.status)
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
    isRealHermesConnected: hermesInfo.exists
  }
})
