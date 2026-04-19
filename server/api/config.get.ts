import { defineEventHandler } from 'h3'
import { getHermesConfig, getHermesPath } from '../utils/hermes'
import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const config = getHermesConfig()
  
  if (config) {
    // Extract providers with their full config
    const providers: Record<string, { name: string; base_url: string; key_env: string; api_mode: string; default_model?: string }> = {}
    for (const [id, cfg] of Object.entries(config.providers || {})) {
      const p = cfg as any
      providers[id] = {
        name: p.name || id,
        base_url: p.base_url || '',
        key_env: p.key_env || '',
        api_mode: p.api_mode || 'openai',
        default_model: p.default_model
      }
    }
    
    // Get current model settings
    const currentProvider = config.model?.provider || config.default_provider || ''
    const currentModel = config.model?.default || ''
    const apiMode = config.model?.api_mode || config.providers?.[currentProvider]?.api_mode || 'openai'
    
    return {
      // Model settings
      model: {
        provider: currentProvider,
        default: currentModel,
        api_mode: apiMode
      },
      providers: providers,
      
      // Agent settings
      agent: {
        max_tokens: config.agent?.max_tokens || 8000,
        max_turns: config.agent?.max_turns || 90,
        reasoning_effort: config.agent?.reasoning_effort || 'medium',
        save_trajectories: config.agent?.save_trajectories ?? false,
        gateway_timeout: config.agent?.gateway_timeout || 1800,
        verbose: config.agent?.verbose ?? false,
      },
      
      // Streaming
      streaming: {
        enabled: config.streaming?.enabled ?? false
      },
      
      // Terminal settings
      terminal: {
        backend: config.terminal?.backend || 'local',
        timeout: config.terminal?.timeout || 180,
        persistent_shell: config.terminal?.persistent_shell ?? true,
      },
      
      // Logging
      logging: {
        level: config.logging?.level || 'INFO',
        max_size_mb: config.logging?.max_size_mb || 5,
      },
      
      // Display settings
      display: {
        personality: config.display?.personality || 'helpful',
      },
      
      // MCP settings
      mcp: {
        osv_scanning: config.mcp?.osv_scanning ?? true
      },
      
      // Security
      security: {
        redact_secrets: config.security?.redact_secrets ?? true,
        tirith_enabled: config.security?.tirith_enabled ?? true,
      },
      
      // Approvals
      approvals: {
        mode: config.approvals?.mode || 'manual',
        timeout: config.approvals?.timeout || 60,
      },
      
      isRealHermesConnected: true,
      configPath: path.join(getHermesPath(), 'config.yaml')
    }
  }
  
  // Mock data when not connected
  return {
    model: {
      provider: 'openrouter',
      default: 'anthropic/claude-3.5-sonnet',
      api_mode: 'openai'
    },
    providers: {
      openrouter: { name: 'OpenRouter', base_url: 'https://openrouter.ai/api/v1', key_env: 'OPENROUTER_API_KEY', api_mode: 'openai' },
      openai: { name: 'OpenAI', base_url: 'https://api.openai.com/v1', key_env: 'OPENAI_API_KEY', api_mode: 'openai' },
      anthropic: { name: 'Anthropic', base_url: 'https://api.anthropic.com', key_env: 'ANTHROPIC_API_KEY', api_mode: 'anthropic' },
      ollama: { name: 'Ollama', base_url: 'http://localhost:11434', key_env: '', api_mode: 'ollama' },
    },
    
    agent: {
      max_tokens: 8000,
      max_turns: 90,
      reasoning_effort: 'medium',
      save_trajectories: false,
      gateway_timeout: 1800,
      verbose: false,
    },
    
    streaming: { enabled: false },
    
    terminal: {
      backend: 'local',
      timeout: 180,
      persistent_shell: true,
    },
    
    logging: {
      level: 'INFO',
      max_size_mb: 5,
    },
    
    display: {
      personality: 'helpful',
    },
    
    mcp: {
      osv_scanning: true
    },
    
    security: {
      redact_secrets: true,
      tirith_enabled: true,
    },
    
    approvals: {
      mode: 'manual',
      timeout: 60,
    },
    
    isRealHermesConnected: false,
    configPath: null
  }
})
