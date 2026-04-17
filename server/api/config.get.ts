import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const config = getHermesConfig()
  
  if (config) {
    return {
      activeProvider: config.llm?.provider || 'openrouter',
      activeModel: config.llm?.model || 'anthropic/claude-3.5-sonnet',
      toggles: {
        streaming: config.display?.streaming ?? true,
        saveTrajectories: config.agent?.save_trajectories ?? false,
        quietMode: config.display?.quiet_mode ?? false,
        mcpScanning: config.mcp?.osv_scanning ?? true,
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
