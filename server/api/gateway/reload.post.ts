import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import os from 'os'

interface ConfigResponse {
  success: boolean
  message: string
}

export default defineEventHandler(async (event): Promise<ConfigResponse> => {
  const hermesDir = os.homedir() + '/.hermes'
  
  try {
    // 发送 SIGHUP 信号让 hermes-gateway 重新加载配置
    execSync('pkill -HUP -f "hermes.*gateway" || true', {
      encoding: 'utf-8',
      timeout: 5000
    })
    
    return {
      success: true,
      message: '配置已重新加载'
    }
  } catch (error: any) {
    return {
      success: false,
      message: `重载配置失败: ${error.message || '未知错误'}`
    }
  }
})
