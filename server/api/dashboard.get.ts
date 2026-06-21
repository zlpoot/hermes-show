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
    for (const cpu of cpus) {
      for (const type of Object.keys(cpu.times)) {
        total += (cpu.times as any)[type]
      }
      idle += cpu.times.idle
    }
    const cpuUsage = 100 - ~~(100 * idle / total)
    cpuLoad = `${cpuUsage}%`

    const { sessions } = await loadAllSessions()
    const dashboardData = buildDashboardData(sessions, { cpuLoad })

    return dashboardData
  } catch (e) {
    console.error('[dashboard] Error loading data', e)
  }

  return createEmptyDashboardData(cpuLoad)
})
