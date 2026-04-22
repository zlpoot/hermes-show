import { defineEventHandler, readBody, createError } from 'h3'
import { getHermesConfig, getHermesPath } from '../utils/hermes'
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'yaml'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const configPath = path.join(getHermesPath(), 'config.yaml')
  
  if (!fs.existsSync(configPath)) {
    throw createError({
      statusCode: 404,
      message: 'Config file not found'
    })
  }
  
  try {
    // Read existing config
    const file = fs.readFileSync(configPath, 'utf8')
    const config = yaml.parse(file) || {}
    
    // Update providers
    if (body.providers) {
      config.providers = body.providers
    }
    
    // Update model settings
    if (body.model) {
      if (!config.model) config.model = {}
      if (body.model.provider !== undefined) config.model.provider = body.model.provider
      if (body.model.default !== undefined) config.model.default = body.model.default
      if (body.model.api_mode !== undefined) config.model.api_mode = body.model.api_mode
    }
    
    // Update fallback model
    if (body.fallback_model) {
      if (!config.fallback_model) config.fallback_model = {}
      if (body.fallback_model.provider !== undefined) config.fallback_model.provider = body.fallback_model.provider
      if (body.fallback_model.model !== undefined) config.fallback_model.model = body.fallback_model.model
    }
    
    // Update agent settings
    if (body.agent) {
      if (!config.agent) config.agent = {}
      if (body.agent.max_tokens !== undefined) config.agent.max_tokens = Number(body.agent.max_tokens)
      if (body.agent.max_turns !== undefined) config.agent.max_turns = Number(body.agent.max_turns)
      if (body.agent.reasoning_effort !== undefined) config.agent.reasoning_effort = body.agent.reasoning_effort
      if (body.agent.save_trajectories !== undefined) config.agent.save_trajectories = body.agent.save_trajectories
      if (body.agent.gateway_timeout !== undefined) config.agent.gateway_timeout = Number(body.agent.gateway_timeout)
      if (body.agent.verbose !== undefined) config.agent.verbose = body.agent.verbose
    }
    
    // Update streaming
    if (body.streaming) {
      if (!config.streaming) config.streaming = {}
      if (body.streaming.enabled !== undefined) config.streaming.enabled = body.streaming.enabled
    }
    
    // Update terminal settings
    if (body.terminal) {
      if (!config.terminal) config.terminal = {}
      if (body.terminal.backend !== undefined) config.terminal.backend = body.terminal.backend
      if (body.terminal.timeout !== undefined) config.terminal.timeout = Number(body.terminal.timeout)
      if (body.terminal.persistent_shell !== undefined) config.terminal.persistent_shell = body.terminal.persistent_shell
      if (body.terminal.lifetime_seconds !== undefined) config.terminal.lifetime_seconds = Number(body.terminal.lifetime_seconds)
      if (body.terminal.container_cpu !== undefined) config.terminal.container_cpu = Number(body.terminal.container_cpu)
      if (body.terminal.container_memory !== undefined) config.terminal.container_memory = Number(body.terminal.container_memory)
      if (body.terminal.container_disk !== undefined) config.terminal.container_disk = Number(body.terminal.container_disk)
      if (body.terminal.container_persistent !== undefined) config.terminal.container_persistent = body.terminal.container_persistent
      if (body.terminal.docker_image !== undefined) config.terminal.docker_image = body.terminal.docker_image
    }
    
    // Update logging
    if (body.logging) {
      if (!config.logging) config.logging = {}
      if (body.logging.level !== undefined) config.logging.level = body.logging.level
      if (body.logging.max_size_mb !== undefined) config.logging.max_size_mb = Number(body.logging.max_size_mb)
      if (body.logging.backup_count !== undefined) config.logging.backup_count = Number(body.logging.backup_count)
    }
    
    // Update display
    if (body.display) {
      if (!config.display) config.display = {}
      if (body.display.personality !== undefined) config.display.personality = body.display.personality
      if (body.display.compact !== undefined) config.display.compact = body.display.compact
      if (body.display.show_reasoning !== undefined) config.display.show_reasoning = body.display.show_reasoning
      if (body.display.show_cost !== undefined) config.display.show_cost = body.display.show_cost
      if (body.display.inline_diffs !== undefined) config.display.inline_diffs = body.display.inline_diffs
      if (body.display.bell_on_complete !== undefined) config.display.bell_on_complete = body.display.bell_on_complete
    }
    
    // Update dashboard
    if (body.dashboard) {
      if (!config.dashboard) config.dashboard = {}
      if (body.dashboard.theme !== undefined) config.dashboard.theme = body.dashboard.theme
    }
    
    // Update TTS
    if (body.tts) {
      if (!config.tts) config.tts = {}
      if (body.tts.provider !== undefined) config.tts.provider = body.tts.provider
      if (body.tts.voice !== undefined) {
        // Set voice based on provider
        const provider = body.tts.provider || config.tts.provider || 'edge'
        if (provider === 'edge') {
          if (!config.tts.edge) config.tts.edge = {}
          config.tts.edge.voice = body.tts.voice
        } else if (provider === 'openai') {
          if (!config.tts.openai) config.tts.openai = {}
          config.tts.openai.voice = body.tts.voice
        }
      }
    }
    
    // Update STT
    if (body.stt) {
      if (!config.stt) config.stt = {}
      if (body.stt.enabled !== undefined) config.stt.enabled = body.stt.enabled
      if (body.stt.provider !== undefined) config.stt.provider = body.stt.provider
      if (body.stt.local_model !== undefined) {
        if (!config.stt.local) config.stt.local = {}
        config.stt.local.model = body.stt.local_model
      }
    }
    
    // Update MCP
    if (body.mcp) {
      if (!config.mcp) config.mcp = {}
      if (body.mcp.osv_scanning !== undefined) config.mcp.osv_scanning = body.mcp.osv_scanning
    }
    
    // Update security
    if (body.security) {
      if (!config.security) config.security = {}
      if (body.security.redact_secrets !== undefined) config.security.redact_secrets = body.security.redact_secrets
      if (body.security.tirith_enabled !== undefined) config.security.tirith_enabled = body.security.tirith_enabled
    }
    
    // Update privacy
    if (body.privacy) {
      if (!config.privacy) config.privacy = {}
      if (body.privacy.redact_pii !== undefined) config.privacy.redact_pii = body.privacy.redact_pii
    }
    
    // Update approvals
    if (body.approvals) {
      if (!config.approvals) config.approvals = {}
      if (body.approvals.mode !== undefined) config.approvals.mode = body.approvals.mode
      if (body.approvals.timeout !== undefined) config.approvals.timeout = Number(body.approvals.timeout)
    }
    
    // Update compression
    if (body.compression) {
      if (!config.compression) config.compression = {}
      if (body.compression.enabled !== undefined) config.compression.enabled = body.compression.enabled
      if (body.compression.threshold !== undefined) config.compression.threshold = Number(body.compression.threshold)
      if (body.compression.target_ratio !== undefined) config.compression.target_ratio = Number(body.compression.target_ratio)
      if (body.compression.protect_last_n !== undefined) config.compression.protect_last_n = Number(body.compression.protect_last_n)
    }
    
    // Update memory
    if (body.memory) {
      if (!config.memory) config.memory = {}
      if (body.memory.memory_enabled !== undefined) config.memory.memory_enabled = body.memory.memory_enabled
      if (body.memory.user_profile_enabled !== undefined) config.memory.user_profile_enabled = body.memory.user_profile_enabled
      if (body.memory.memory_char_limit !== undefined) config.memory.memory_char_limit = Number(body.memory.memory_char_limit)
    }
    
    // Update checkpoints
    if (body.checkpoints) {
      if (!config.checkpoints) config.checkpoints = {}
      if (body.checkpoints.enabled !== undefined) config.checkpoints.enabled = body.checkpoints.enabled
      if (body.checkpoints.max_snapshots !== undefined) config.checkpoints.max_snapshots = Number(body.checkpoints.max_snapshots)
    }
    
    // Update session reset
    if (body.session_reset) {
      if (!config.session_reset) config.session_reset = {}
      if (body.session_reset.mode !== undefined) config.session_reset.mode = body.session_reset.mode
      if (body.session_reset.idle_minutes !== undefined) config.session_reset.idle_minutes = Number(body.session_reset.idle_minutes)
      if (body.session_reset.at_hour !== undefined) config.session_reset.at_hour = Number(body.session_reset.at_hour)
    }
    
    // Update auxiliary models
    if (body.auxiliary) {
      if (!config.auxiliary) config.auxiliary = {}
      for (const [key, value] of Object.entries(body.auxiliary)) {
        if (!config.auxiliary[key]) config.auxiliary[key] = {}
        const aux = value as { provider?: string; model?: string }
        if (aux.provider !== undefined) config.auxiliary[key].provider = aux.provider
        if (aux.model !== undefined) config.auxiliary[key].model = aux.model
      }
    }
    
    // Write back
    const newYaml = yaml.stringify(config)
    fs.writeFileSync(configPath, newYaml, 'utf8')
    
    return { success: true, message: 'Config saved successfully' }
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      message: e.message || 'Failed to save config'
    })
  }
})
