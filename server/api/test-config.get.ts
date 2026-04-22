import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  
  // 尝试从 .env 读取
  let envToken = ''
  let envProxy = ''
  try {
    const envPath = path.join(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8')
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim()
        if (trimmed.startsWith('NUXT_DISCORD_BOT_TOKEN=')) {
          envToken = trimmed.slice(23).replace(/^["']|["']$/g, '')
        }
        if (trimmed.startsWith('NUXT_DISCORD_PROXY=')) {
          envProxy = trimmed.slice(19).replace(/^["']|["']$/g, '')
        }
      }
    }
  } catch (e) {
    // ignore
  }
  
  return {
    runtimeConfig: {
      hasDiscordToken: !!(config.discordBotToken),
      tokenLength: config.discordBotToken?.length || 0,
      hasDiscordProxy: !!(config.discordProxy),
      proxy: config.discordProxy || 'not set'
    },
    envFile: {
      hasToken: !!envToken,
      tokenLength: envToken.length,
      hasProxy: !!envProxy,
      proxy: envProxy || 'not set'
    },
    cwd: process.cwd()
  }
})
