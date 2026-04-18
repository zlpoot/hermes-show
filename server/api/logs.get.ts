import { defineEventHandler, getQuery } from 'h3'
import { getHermesLogs } from '../utils/hermes'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const linesCount = parseInt((query.lines as string) || '100')
  
  const logs = getHermesLogs('agent.log', linesCount)
  
  if (logs) {
    // Parse raw text into structured JSON if possible
    const parsedLogs = logs.map(line => {
      const match = line.match(/\[(.*?)\] \[([A-Z]+)\] \[(.*?)\] (.*)/)
      if (match) {
        return {
          time: match[1],
          level: match[2],
          source: match[3],
          message: match[4]
        }
      }
      return { time: '', level: 'INFO', source: 'System', message: line }
    })
    
    return {
      logs: parsedLogs,
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
    isRealHermesConnected: false
  }
})
