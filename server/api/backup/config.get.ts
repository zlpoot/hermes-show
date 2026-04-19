export default defineEventHandler(async (event) => {
  // Mock config export
  const configContent = `# Hermes Agent Configuration
# Generated: ${new Date().toISOString()}

agent:
  name: "Hermes Agent"
  provider: jdcloud
  model: GLM-5
  max_tokens: 16000

providers:
  jdcloud:
    base_url: "https://modelservice.jdcloud.com/coding/openai/v1"
    api_key_env: "JD_CLOUD_API_KEY"
    api_mode: "openai"

memory:
  enabled: true
  
skills:
  enabled: true
`
  return { content: configContent }
})
