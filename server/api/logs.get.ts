import { defineEventHandler, getQuery } from 'h3'
import { getHermesLogs, getHermesLogFiles, getHermesStatus, parseLogLine } from '../utils/hermes'

export interface LogEntry {
  time: string
  level: string
  source: string
  message: string
}

export interface LogsApiResponse {
  logs: LogEntry[]
  logFiles: string[]
  currentFile: string
  status: 'ok' | 'empty' | 'no-hermes' | 'no-logs-dir' | 'read-error'
  isRealHermesConnected: boolean
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const linesCount = Math.min(Math.max(parseInt((query.lines as string) || '100'), 1), 1000)
  const requestedFile = (query.file as string) || ''
  const levelFilter = (query.level as string) || ''
  const searchFilter = (query.search as string) || ''

  // Determine actual log file
  const availableFiles = getHermesLogFiles()
  let logFile = requestedFile
  if (!logFile && availableFiles.length > 0) {
    logFile = availableFiles[0]!
  } else if (logFile && availableFiles.length > 0 && !availableFiles.includes(logFile)) {
    logFile = availableFiles[0]!
  }

  // Check hermes connection status
  const status = getHermesStatus()
  if (status === 'no-hermes') {
    return {
      logs: [], logFiles: availableFiles, currentFile: logFile,
      status, isRealHermesConnected: false,
    }
  }

  if (status === 'no-logs-dir' || !logFile) {
    return {
      logs: [], logFiles: availableFiles, currentFile: logFile,
      status: logFile ? 'no-logs-dir' : 'empty', isRealHermesConnected: true,
    }
  }

  // Read log file
  const rawLogs = getHermesLogs(logFile, linesCount)
  if (!rawLogs) {
    return {
      logs: [], logFiles: availableFiles, currentFile: logFile,
      status: 'read-error', isRealHermesConnected: true,
    }
  }
  if (rawLogs.length === 0) {
    return {
      logs: [], logFiles: availableFiles, currentFile: logFile,
      status: 'empty', isRealHermesConnected: true,
    }
  }

  // Parse and filter
  let parsedLogs = rawLogs.map(line => parseLogLine(line))

  if (levelFilter) {
    const allowed = levelFilter.split(',').map(l => l.trim().toUpperCase())
    parsedLogs = parsedLogs.filter(l => allowed.includes(l.level.toUpperCase()))
  }
  if (searchFilter) {
    const kw = searchFilter.toLowerCase()
    parsedLogs = parsedLogs.filter(l =>
      l.message.toLowerCase().includes(kw) || l.source.toLowerCase().includes(kw)
    )
  }

  return {
    logs: parsedLogs,
    logFiles: availableFiles.length > 0 ? availableFiles : [logFile],
    currentFile: logFile,
    status: 'ok',
    isRealHermesConnected: true,
  }
})
