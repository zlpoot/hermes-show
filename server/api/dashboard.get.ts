import { defineEventHandler } from 'h3'
import { loadAllSessions } from '../utils/sessions'
import { buildDashboardData, createEmptyDashboardData } from '../utils/dashboard'
import os from 'node:os'

export default defineEventHandler(async (event) => {
  let cpuLoad = '0%'

  try {
    const cpus = os.cpus()
    let idle = 0
    let total = 0
    for (let cpu of cpus) {
      for (let type in cpu.times) {
        total += (cpu.times as any)[type]
      }
      idle += cpu.times.idle
    }
    const cpuUsage = 100 - ~~(100 * idle / total)
    cpuLoad = `${cpuUsage}%`

    // 统一加载 JSONL + SQLite 会话
    const { sessions, sources } = await loadAllSessions()

    const dashboardData = buildDashboardData(sessions, { cpuLoad, sources })

    return {
      ...dashboardData,
      isRealHermesConnected: sources.jsonl > 0 || sources.sqlite > 0,
    }
  } catch (e) {
    console.error('[dashboard] Error loading data', e)
  }

  return {
    ...createEmptyDashboardData(cpuLoad),
    isRealHermesConnected: false,
  }
})
