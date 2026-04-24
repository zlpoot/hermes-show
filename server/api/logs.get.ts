import { defineEventHandler, getQuery } from 'h3'
import { getHermesLogs, getHermesPath, parseLogLine } from '../utils/hermes'
import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const linesCount = parseInt((query.lines as string) || '100')
  const logFile = (query.file as string) || 'agent.log'
  
  // List available log files
  const logsDir = path.join(getHermesPath(), 'logs')
  let availableFiles: string[] = []
  try {
    if (fs.existsSync(logsDir)) {
      availableFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'))
    }
  } catch (e) {
    console.error('Failed to list log files:', e)
  }
  
  const rawLogs = getHermesLogs(logFile, linesCount)
  
  if (rawLogs) {
    // Parse raw text into structured JSON
    const parsedLogs = rawLogs.map(line => parseLogLine(line))
    
    return {
      logs: parsedLogs,
      logFiles: availableFiles.length > 0 ? availableFiles : [logFile],
      currentFile: logFile,
      isRealHermesConnected: true
    }
  }
  
  // 无日志数据，返回空状态
  console.log('[logs] No log data available')
  return {
    logs: [],
    logFiles: [],
    currentFile: logFile,
    isRealHermesConnected: false
  }
})
