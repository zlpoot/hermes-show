import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { getHermesPath, getHermesDB } from '../utils/hermes'

export default defineEventHandler(async (event) => {
  const hermesPath = getHermesPath()
  const backupsDir = path.join(hermesPath, 'backups')
  const configPath = path.join(hermesPath, 'config.yaml')
  const stateDbPath = path.join(hermesPath, 'state.db')
  
  // 获取数据库大小
  let dbSize = 0
  if (fs.existsSync(stateDbPath)) {
    const stats = fs.statSync(stateDbPath)
    dbSize = stats.size
  }
  
  // 获取配置文件信息
  let configLastModified = ''
  let configCount = 1 // config.yaml 本身
  if (fs.existsSync(configPath)) {
    const stats = fs.statSync(configPath)
    configLastModified = stats.mtime.toISOString().slice(0, 16).replace('T', ' ')
  }
  
  // 从数据库获取会话和消息统计
  const prisma = getHermesDB()
  let sessionCount = 0
  let messageCount = 0
  
  if (prisma) {
    try {
      const sessionResult: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sessions`
      sessionCount = Number(sessionResult[0]?.count || 0)
      
      const messageResult: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM messages`
      messageCount = Number(messageResult[0]?.count || 0)
    } catch (e) {
      console.error('Failed to query database stats', e)
    }
  }
  
  // 获取备份列表
  const backups: any[] = []
  if (fs.existsSync(backupsDir)) {
    const files = fs.readdirSync(backupsDir)
    for (const file of files) {
      const filePath = path.join(backupsDir, file)
      const stats = fs.statSync(filePath)
      if (stats.isFile()) {
        backups.push({
          id: file,
          name: file,
          date: stats.mtime.toISOString().slice(0, 16).replace('T', ' '),
          size: stats.size,
          type: file.includes('config') ? 'config' : 'database',
          auto: file.includes('auto')
        })
      }
    }
    // 按日期排序，最新的在前
    backups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
  
  // 检查自动备份配置
  const autoBackupConfigPath = path.join(hermesPath, 'auto_backup.json')
  let autoBackup = {
    enabled: false,
    interval: 'daily',
    retention: 10,
    lastBackup: '',
    nextBackup: ''
  }
  
  if (fs.existsSync(autoBackupConfigPath)) {
    try {
      autoBackup = JSON.parse(fs.readFileSync(autoBackupConfigPath, 'utf-8'))
    } catch (e) {
      // 使用默认值
    }
  }
  
  // 如果有备份，更新最后备份时间
  if (backups.length > 0) {
    autoBackup.lastBackup = backups[0].date
  }
  
  return {
    summary: {
      dbSize,
      sessionCount,
      messageCount,
      configCount,
      configLastModified
    },
    backups,
    autoBackup,
    isRealHermesConnected: true
  }
})
