import { defineEventHandler } from 'h3'
import { getHermesDB } from '../utils/hermes'
import { buildDashboardData, createEmptyDashboardData, type DashboardSessionRow } from '../utils/dashboard'
import os from 'node:os'

export default defineEventHandler(async (event) => {
  const prisma = getHermesDB()
  let cpuLoad = '0%'
  let latency = '0ms'
  
  if (prisma) {
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
      
      const start = performance.now()
      await prisma.$queryRaw`SELECT 1`
      const end = performance.now()
      latency = `${Math.round(end - start + 5)}ms`

      const sessions = await prisma.$queryRaw<DashboardSessionRow[]>`
        SELECT id, title, source, started_at, ended_at, input_tokens, output_tokens
        FROM sessions
      `
      const dashboardData = buildDashboardData(sessions, { cpuLoad, latency })
      
      return {
        ...dashboardData,
        isRealHermesConnected: true
      }
    } catch (e) {
      console.log('Error reading from real DB', e)
    }
  } else {
    // 无数据库连接，返回空数据
    console.log('[dashboard] No database connection')
  }
  
  return {
    ...createEmptyDashboardData(cpuLoad, latency),
    isRealHermesConnected: !!prisma
  }
})
