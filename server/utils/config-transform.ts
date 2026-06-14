export function mapHermesConfigToResponse(config: any, configPath: string | null) {
  if (!config) {
    return createDefaultConfigResponse(false, configPath)
  }

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

  const currentProvider = config.model?.provider || config.default_provider || ''
  const fallbackModel = config.fallback_model || {}

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
    model: {
      provider: currentProvider,
      default: config.model?.default || '',
      api_mode: config.model?.api_mode || config.providers?.[currentProvider]?.api_mode || 'openai'
    },
    providers,
    fallback_model: {
      provider: fallbackModel.provider || '',
      model: fallbackModel.model || ''
    },
    agent: {
      max_tokens: config.agent?.max_tokens || 8000,
      max_turns: config.agent?.max_turns || 90,
      reasoning_effort: config.agent?.reasoning_effort || 'medium',
      save_trajectories: config.agent?.save_trajectories ?? false,
      gateway_timeout: config.agent?.gateway_timeout || 1800,
      verbose: config.agent?.verbose ?? false,
    },
    streaming: {
      enabled: config.streaming?.enabled ?? false
    },
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
    logging: {
      level: config.logging?.level || 'INFO',
      max_size_mb: config.logging?.max_size_mb || 5,
      backup_count: config.logging?.backup_count || 3,
    },
    display: {
      personality: config.display?.personality || 'helpful',
      compact: config.display?.compact ?? false,
      show_reasoning: config.display?.show_reasoning ?? false,
      show_cost: config.display?.show_cost ?? false,
      inline_diffs: config.display?.inline_diffs ?? true,
      bell_on_complete: config.display?.bell_on_complete ?? false,
    },
    dashboard: {
      theme: config.dashboard?.theme || 'default',
    },
    tts: {
      provider: config.tts?.provider || 'edge',
      voice: config.tts?.edge?.voice || config.tts?.openai?.voice || 'en-US-AriaNeural',
    },
    stt: {
      enabled: config.stt?.enabled ?? true,
      provider: config.stt?.provider || 'local',
      local_model: config.stt?.local?.model || 'base',
    },
    mcp: {
      osv_scanning: config.mcp?.osv_scanning ?? true
    },
    security: {
      redact_secrets: config.security?.redact_secrets ?? true,
      tirith_enabled: config.security?.tirith_enabled ?? true,
    },
    privacy: {
      redact_pii: config.privacy?.redact_pii ?? false,
    },
    approvals: {
      mode: config.approvals?.mode || 'manual',
      timeout: config.approvals?.timeout || 60,
    },
    compression: {
      enabled: config.compression?.enabled ?? true,
      threshold: config.compression?.threshold || 0.5,
      target_ratio: config.compression?.target_ratio || 0.2,
      protect_last_n: config.compression?.protect_last_n || 20,
    },
    memory: {
      memory_enabled: config.memory?.memory_enabled ?? true,
      user_profile_enabled: config.memory?.user_profile_enabled ?? true,
      memory_char_limit: config.memory?.memory_char_limit || 2200,
    },
    checkpoints: {
      enabled: config.checkpoints?.enabled ?? true,
      max_snapshots: config.checkpoints?.max_snapshots || 50,
    },
    session_reset: {
      mode: config.session_reset?.mode || 'both',
      idle_minutes: config.session_reset?.idle_minutes || 1440,
      at_hour: config.session_reset?.at_hour || 4,
    },
    auxiliary,
    isRealHermesConnected: true,
    configPath
  }
}

export function createDefaultConfigResponse(isRealHermesConnected = false, configPath: string | null = null) {
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
    isRealHermesConnected,
    configPath
  }
}

export function applyConfigUpdate(config: any, body: any) {
  const next = config || {}

  if (body.providers) {
    const existingProviders = next.providers || {}
    next.providers = { ...existingProviders }
    for (const [id, incoming] of Object.entries(body.providers)) {
      const inc = incoming as Record<string, unknown>
      const existing = existingProviders[id] || {}
      next.providers[id] = mergeKnownFields(existing, inc, ['name', 'base_url', 'key_env', 'api_mode', 'default_model'])
    }
  }

  mergeSection(next, body, 'model', ['provider', 'default', 'api_mode'])
  mergeSection(next, body, 'fallback_model', ['provider', 'model'])
  mergeSection(next, body, 'agent', ['max_tokens', 'max_turns', 'reasoning_effort', 'save_trajectories', 'gateway_timeout', 'verbose'], ['max_tokens', 'max_turns', 'gateway_timeout'])
  mergeSection(next, body, 'streaming', ['enabled'])
  mergeSection(next, body, 'terminal', ['backend', 'timeout', 'persistent_shell', 'lifetime_seconds', 'container_cpu', 'container_memory', 'container_disk', 'container_persistent', 'docker_image'], ['timeout', 'lifetime_seconds', 'container_cpu', 'container_memory', 'container_disk'])
  mergeSection(next, body, 'logging', ['level', 'max_size_mb', 'backup_count'], ['max_size_mb', 'backup_count'])
  mergeSection(next, body, 'display', ['personality', 'compact', 'show_reasoning', 'show_cost', 'inline_diffs', 'bell_on_complete'])
  mergeSection(next, body, 'dashboard', ['theme'])
  mergeSection(next, body, 'mcp', ['osv_scanning'])
  mergeSection(next, body, 'security', ['redact_secrets', 'tirith_enabled'])
  mergeSection(next, body, 'privacy', ['redact_pii'])
  mergeSection(next, body, 'approvals', ['mode', 'timeout'], ['timeout'])
  mergeSection(next, body, 'compression', ['enabled', 'threshold', 'target_ratio', 'protect_last_n'], ['threshold', 'target_ratio', 'protect_last_n'])
  mergeSection(next, body, 'memory', ['memory_enabled', 'user_profile_enabled', 'memory_char_limit'], ['memory_char_limit'])
  mergeSection(next, body, 'checkpoints', ['enabled', 'max_snapshots'], ['max_snapshots'])
  mergeSection(next, body, 'session_reset', ['mode', 'idle_minutes', 'at_hour'], ['idle_minutes', 'at_hour'])

  if (body.tts) {
    if (!next.tts) next.tts = {}
    if (body.tts.provider !== undefined) next.tts.provider = body.tts.provider
    if (body.tts.voice !== undefined) {
      const provider = body.tts.provider || next.tts.provider || 'edge'
      if (!next.tts[provider]) next.tts[provider] = {}
      next.tts[provider].voice = body.tts.voice
    }
  }

  if (body.stt) {
    if (!next.stt) next.stt = {}
    if (body.stt.enabled !== undefined) next.stt.enabled = body.stt.enabled
    if (body.stt.provider !== undefined) next.stt.provider = body.stt.provider
    if (body.stt.local_model !== undefined) {
      if (!next.stt.local) next.stt.local = {}
      next.stt.local.model = body.stt.local_model
    }
  }

  if (body.auxiliary) {
    if (!next.auxiliary) next.auxiliary = {}
    for (const [key, value] of Object.entries(body.auxiliary)) {
      if (!next.auxiliary[key]) next.auxiliary[key] = {}
      const aux = value as { provider?: string; model?: string }
      if (aux.provider !== undefined) next.auxiliary[key].provider = aux.provider
      if (aux.model !== undefined) next.auxiliary[key].model = aux.model
    }
  }

  return next
}

function mergeSection(target: any, body: any, section: string, fields: string[], numericFields: string[] = []) {
  if (!body[section]) return
  if (!target[section]) target[section] = {}
  target[section] = mergeKnownFields(target[section], body[section], fields, numericFields)
}

function mergeKnownFields(existing: any, incoming: Record<string, unknown>, fields: string[], numericFields: string[] = []) {
  const merged = { ...existing }
  for (const field of fields) {
    if (incoming[field] !== undefined) {
      merged[field] = numericFields.includes(field) ? Number(incoming[field]) : incoming[field]
    }
  }
  return merged
}
