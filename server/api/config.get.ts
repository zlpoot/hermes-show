import { defineEventHandler } from 'h3'
import { getHermesConfig, getHermesPath } from '../utils/hermes'

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
    
    // Extract fallback model
    const fallbackModel = config.fallback_model || {}
    
    // Extract auxiliary configs
    const auxiliary: Record<string, { provider?: string; model?: string }> = {}
    const auxiliaryKeys = ['vision', 'web_extract', 'compression', 'session_search', 'skills_hub', 'title_generation', 'approval', 'mcp', 'flush_memories']
    for (const key of auxiliaryKeys) {
      if (config.auxiliary?.[key]) {
        auxiliary[key] = {
          provider: config.auxiliary[key].provider || 'auto',
          model: config.auxiliary[key].model || ''
        }
      }
    }
    
    return {
      // Model settings
      model: {
        provider: currentProvider,
        default: currentModel,
        api_mode: apiMode
      },
      providers: providers,
      fallback_model: {
        provider: fallbackModel.provider || '',
        model: fallbackModel.model || ''
      },
      
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
        lifetime_seconds: config.terminal?.lifetime_seconds || 300,
        container_cpu: config.terminal?.container_cpu || 1,
        container_memory: config.terminal?.container_memory || 5120,
        container_disk: config.terminal?.container_disk || 51200,
        container_persistent: config.terminal?.container_persistent ?? true,
        docker_image: config.terminal?.docker_image || 'nikolaik/python-nodejs:python3.11-nodejs20',
      },
      
      // Logging
      logging: {
        level: config.logging?.level || 'INFO',
        max_size_mb: config.logging?.max_size_mb || 5,
        backup_count: config.logging?.backup_count || 3,
      },
      
      // Display settings
      display: {
        personality: config.display?.personality || 'helpful',
        compact: config.display?.compact ?? false,
        show_reasoning: config.display?.show_reasoning ?? false,
        show_cost: config.display?.show_cost ?? false,
        inline_diffs: config.display?.inline_diffs ?? true,
        bell_on_complete: config.display?.bell_on_complete ?? false,
      },
      
      // Dashboard settings
      dashboard: {
        theme: config.dashboard?.theme || 'default',
      },
      
      // TTS settings
      tts: {
        provider: config.tts?.provider || 'edge',
        voice: config.tts?.edge?.voice || config.tts?.openai?.voice || 'en-US-AriaNeural',
      },
      
      // STT settings
      stt: {
        enabled: config.stt?.enabled ?? true,
        provider: config.stt?.provider || 'local',
        local_model: config.stt?.local?.model || 'base',
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
      
      // Privacy
      privacy: {
        redact_pii: config.privacy?.redact_pii ?? false,
      },
      
      // Approvals
      approvals: {
        mode: config.approvals?.mode || 'manual',
        timeout: config.approvals?.timeout || 60,
      },
      
      // Compression
      compression: {
        enabled: config.compression?.enabled ?? true,
        threshold: config.compression?.threshold || 0.5,
        target_ratio: config.compression?.target_ratio || 0.2,
        protect_last_n: config.compression?.protect_last_n || 20,
      },
      
      // Memory
      memory: {
        memory_enabled: config.memory?.memory_enabled ?? true,
        user_profile_enabled: config.memory?.user_profile_enabled ?? true,
        memory_char_limit: config.memory?.memory_char_limit || 2200,
      },
      
      // Checkpoints
      checkpoints: {
        enabled: config.checkpoints?.enabled ?? true,
        max_snapshots: config.checkpoints?.max_snapshots || 50,
      },
      
      // Session reset
      session_reset: {
        mode: config.session_reset?.mode || 'both',
        idle_minutes: config.session_reset?.idle_minutes || 1440,
        at_hour: config.session_reset?.at_hour || 4,
      },
      
      // Auxiliary models
      auxiliary: auxiliary,
      
      isRealHermesConnected: true,
      configPath: getHermesPath() + '/config.yaml'
    }
  }
  
  // 无配置文件，返回默认配置
  console.log('[config] No config.yaml found, returning defaults')
  return {
    model: {
      provider: '',
      default: '',
      api_mode: 'openai'
    },
    providers: {},
    fallback_model: { provider: '', model: '' },
    agent: { max_tokens: 8000, max_turns: 90, reasoning_effort: 'medium', save_trajectories: false, gateway_timeout: 1800, verbose: false },
    streaming: { enabled: false },
    terminal: { backend: 'local', timeout: 180, persistent_shell: true, lifetime_seconds: 300, container_cpu: 1, container_memory: 5120, container_disk: 51200, container_persistent: true, docker_image: 'nikolaik/python-nodejs:python3.11-nodejs20' },
    logging: { level: 'INFO', max_size_mb: 5, backup_count: 3 },
    display: { personality: 'helpful', compact: false, show_reasoning: false, show_cost: false, inline_diffs: true, bell_on_complete: false },
    dashboard: { theme: 'default' },
    tts: { provider: 'edge', voice: 'en-US-AriaNeural' },
    stt: { enabled: true, provider: 'local', local_model: 'base' },
    mcp: { osv_scanning: true },
    security: { redact_secrets: true, tirith_enabled: true },
    privacy: { redact_pii: false },
    approvals: { mode: 'manual', timeout: 60 },
    compression: { enabled: true, threshold: 0.5, target_ratio: 0.2, protect_last_n: 20 },
    memory: { memory_enabled: true, user_profile_enabled: true, memory_char_limit: 2200 },
    checkpoints: { enabled: true, max_snapshots: 50 },
    session_reset: { mode: 'both', idle_minutes: 1440, at_hour: 4 },
    auxiliary: {},
    isRealHermesConnected: false,
    configPath: null
  }
})
