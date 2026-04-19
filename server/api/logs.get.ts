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
  
  // Mock data fallback
  return {
    logs: [
      { time: '14:30:01', level: 'INFO', source: 'Core', message: 'Starting Hermes Agent v0.8.0...' },
      { time: '14:30:02', level: 'INFO', source: 'Config', message: 'Loaded configuration from ~/.hermes/config.yaml' },
      { time: '14:30:02', level: 'SUCCESS', source: 'Provider', message: 'Connected to OpenRouter API successfully.' },
      { time: '14:30:03', level: 'INFO', source: 'Gateway', message: 'Initializing messaging adapters...' },
      { time: '14:30:05', level: 'SUCCESS', source: 'Telegram', message: 'Telegram bot connected. Listening for messages.' },
      { time: '14:30:06', level: 'SUCCESS', source: 'Discord', message: 'Discord gateway connected.' },
      { time: '14:30:08', level: 'INFO', source: 'Cron', message: 'Found 3 scheduled jobs. Starting scheduler.' },
      { time: '14:35:12', level: 'DEBUG', source: 'Memory', message: 'Compacting context history for session sess-a1b2...' },
      { time: '14:40:00', level: 'WARN', source: 'Tool', message: 'Timeout executing mcp_server_sync. Retrying (1/3)...' },
      { time: '14:40:02', level: 'SUCCESS', source: 'Tool', message: 'mcp_server_sync executed successfully on retry.' },
    ],
    logFiles: ['agent.log', 'gateway.log', 'cron.log', 'mcp.log'],
    currentFile: logFile,
    isRealHermesConnected: false
  }
})
