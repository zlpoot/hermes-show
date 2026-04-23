export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { base_url, api_mode } = body

  if (!base_url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'base_url is required'
    })
  }

  try {
    // Construct models endpoint URL
    let modelsUrl = base_url
    if (!modelsUrl.endsWith('/models')) {
      // Remove trailing /v1 if present and add /models
      modelsUrl = modelsUrl.replace(/\/v1$/, '').replace(/\/$/, '')
      modelsUrl += '/v1/models'
    }

    // For Ollama, use /api/tags instead
    if (api_mode === 'ollama') {
      modelsUrl = base_url.replace(/\/v1$/, '').replace(/\/$/, '') + '/api/tags'
    }

    // Get API key from environment if available
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Try common API key env vars
    const apiKeyEnv = [
      'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'DEEPSEEK_API_KEY',
      'JD_CLOUD_API_KEY', 'CTYUN_API_KEY', 'ZHIPU_API_KEY',
      'DASHSCOPE_API_KEY', 'MOONSHOT_API_KEY', 'YI_API_KEY',
      'BAICHUAN_API_KEY', 'MINIMAX_API_KEY', 'SILICONFLOW_API_KEY',
      'GROQ_API_KEY', 'TOGETHER_API_KEY'
    ].find(key => process.env[key])

    if (apiKeyEnv && process.env[apiKeyEnv]) {
      headers['Authorization'] = `Bearer ${process.env[apiKeyEnv]}`
    }

    const response = await $fetch(modelsUrl, { headers })

    // Parse response based on API type
    if (api_mode === 'ollama') {
      // Ollama format: { models: [{ name: string }] }
      const data = response as { models?: Array<{ name: string }> }
      return {
        data: (data.models || []).map(m => ({ id: m.name }))
      }
    }

    // OpenAI format: { data: [{ id: string }] }
    const data = response as { data?: Array<{ id: string }> }
    return {
      data: data.data || []
    }
  } catch (error: any) {
    console.error('Failed to fetch models:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch models'
    })
  }
})
