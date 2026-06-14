import { describe, expect, it } from 'vitest'
import { applyConfigUpdate, createDefaultConfigResponse, mapHermesConfigToResponse } from '../../server/utils/config-transform'

describe('config transform utilities', () => {
  it('maps synthetic Hermes config to API response fields', () => {
    const response = mapHermesConfigToResponse({
      model: { provider: 'openai', default: 'gpt-4.1', api_mode: 'openai' },
      providers: {
        openai: {
          name: 'OpenAI',
          base_url: 'https://api.example.test/v1',
          key_env: 'OPENAI_API_KEY',
          api_mode: 'openai',
          default_model: 'gpt-4.1',
          custom_header: 'preserved-only-in-source'
        }
      },
      fallback_model: { provider: 'anthropic', model: 'claude-sonnet' },
      agent: { max_tokens: 12000, max_turns: 42, reasoning_effort: 'high' },
      terminal: { backend: 'docker', timeout: 240 },
      security: { redact_secrets: false, tirith_enabled: false }
    }, '/synthetic/config.yaml')

    expect(response.model).toEqual({ provider: 'openai', default: 'gpt-4.1', api_mode: 'openai' })
    expect(response.providers.openai).toEqual({
      name: 'OpenAI',
      base_url: 'https://api.example.test/v1',
      key_env: 'OPENAI_API_KEY',
      api_mode: 'openai',
      default_model: 'gpt-4.1'
    })
    expect(response.fallback_model).toEqual({ provider: 'anthropic', model: 'claude-sonnet' })
    expect(response.agent.max_tokens).toBe(12000)
    expect(response.terminal.backend).toBe('docker')
    expect(response.security.redact_secrets).toBe(false)
    expect(response.isRealHermesConnected).toBe(true)
    expect(response.configPath).toBe('/synthetic/config.yaml')
  })

  it('returns stable defaults for missing config', () => {
    const response = createDefaultConfigResponse(false, null)

    expect(response.model.api_mode).toBe('openai')
    expect(response.providers).toEqual({})
    expect(response.agent.max_tokens).toBe(8000)
    expect(response.terminal.backend).toBe('local')
    expect(response.security.redact_secrets).toBe(true)
    expect(response.isRealHermesConnected).toBe(false)
    expect(response.configPath).toBeNull()
  })

  it('updates known config fields while preserving unknown top-level fields', () => {
    const config = {
      unknown_top_level: { keep: true },
      model: { provider: 'old', default: 'old-model', untouched: 'keep' },
      agent: { max_tokens: 1000, custom_agent_flag: true },
      terminal: { backend: 'local', timeout: 120, custom_terminal_flag: 'keep' },
      security: { redact_secrets: true, custom_security_flag: 'keep' }
    }

    const result = applyConfigUpdate(config, {
      model: { provider: 'new', default: 'new-model' },
      agent: { max_tokens: '9000' },
      terminal: { timeout: '300' },
      security: { redact_secrets: false }
    })

    expect(result.unknown_top_level).toEqual({ keep: true })
    expect(result.model).toMatchObject({ provider: 'new', default: 'new-model', untouched: 'keep' })
    expect(result.agent).toMatchObject({ max_tokens: 9000, custom_agent_flag: true })
    expect(result.terminal).toMatchObject({ backend: 'local', timeout: 300, custom_terminal_flag: 'keep' })
    expect(result.security).toMatchObject({ redact_secrets: false, custom_security_flag: 'keep' })
  })

  it('merges provider updates without dropping unknown provider subfields or omitted providers', () => {
    const config = {
      providers: {
        openai: {
          name: 'OpenAI',
          base_url: 'https://old.example.test',
          key_env: 'OPENAI_API_KEY',
          api_mode: 'openai',
          organization: 'keep-me'
        },
        anthropic: {
          name: 'Anthropic',
          base_url: 'https://anthropic.example.test',
          api_mode: 'anthropic',
          unknown_provider_field: true
        }
      }
    }

    const result = applyConfigUpdate(config, {
      providers: {
        openai: {
          base_url: 'https://new.example.test',
          default_model: 'gpt-4.1'
        }
      }
    })

    expect(result.providers.openai).toMatchObject({
      name: 'OpenAI',
      base_url: 'https://new.example.test',
      key_env: 'OPENAI_API_KEY',
      api_mode: 'openai',
      default_model: 'gpt-4.1',
      organization: 'keep-me'
    })
    expect(result.providers.anthropic).toMatchObject({
      name: 'Anthropic',
      unknown_provider_field: true
    })
  })

  it('updates nested tts, stt, and auxiliary structures without dropping existing fields', () => {
    const config = {
      tts: { provider: 'edge', edge: { voice: 'old', rate: '+0%' } },
      stt: { provider: 'local', local: { model: 'base', device: 'cpu' } },
      auxiliary: { vision: { provider: 'old', model: 'old-model', custom: true } }
    }

    const result = applyConfigUpdate(config, {
      tts: { provider: 'edge', voice: 'new-voice' },
      stt: { local_model: 'small' },
      auxiliary: { vision: { model: 'new-model' } }
    })

    expect(result.tts.edge).toEqual({ voice: 'new-voice', rate: '+0%' })
    expect(result.stt.local).toEqual({ model: 'small', device: 'cpu' })
    expect(result.auxiliary.vision).toEqual({ provider: 'old', model: 'new-model', custom: true })
  })
})
