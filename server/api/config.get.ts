import { defineEventHandler } from 'h3'
import { getHermesConfig } from '../utils/hermes'

export default defineEventHandler(async (event) => {
  const config = getHermesConfig()
  
  if (config) {
    return {
      activeProvider: config.llm?.provider || config.provider || 'openrouter',
      activeModel: config.llm?.model || config.model || 'anthropic/claude-3.5-sonnet',
      toggles: {
        streaming: config.display?.streaming ?? config.streaming ?? true,
        saveTrajectories: config.agent?.save_trajectories ?? config.save_trajectories ?? false,
        quietMode: config.display?.quiet_mode ?? config.quiet_mode ?? false,
        mcpScanning: config.mcp?.osv_scanning ?? config.osv_scanning ?? true,
      },
      isRealHermesConnected: true
    }
  }
  
  return {
    activeProvider: 'openrouter',
    activeModel: 'anthropic/claude-3.5-sonnet',
    toggles: {
      streaming: true,
      saveTrajectories: false,
      quietMode: false,
      mcpScanning: true,
    },
    isRealHermesConnected: false
  }
})
