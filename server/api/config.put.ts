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
    
    // Update model settings
    if (body.model) {
      if (!config.model) config.model = {}
      if (body.model.provider !== undefined) {
        config.model.default = body.model.default || config.model.default
        config.model.provider = body.model.provider
      }
      if (body.model.default !== undefined) {
        config.model.default = body.model.default
      }
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
    }
    
    // Update logging
    if (body.logging) {
      if (!config.logging) config.logging = {}
      if (body.logging.level !== undefined) config.logging.level = body.logging.level
    }
    
    // Update display
    if (body.display) {
      if (!config.display) config.display = {}
      if (body.display.personality !== undefined) config.display.personality = body.display.personality
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
    
    // Update approvals
    if (body.approvals) {
      if (!config.approvals) config.approvals = {}
      if (body.approvals.mode !== undefined) config.approvals.mode = body.approvals.mode
      if (body.approvals.timeout !== undefined) config.approvals.timeout = Number(body.approvals.timeout)
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
