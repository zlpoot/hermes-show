import { execSync } from 'child_process'
import os from 'os'

interface ReconnectRequest {
  platform?: string // 如果不传则重连全部
}

interface ReconnectResponse {
  success: boolean
  message: string
  platform?: string
}

export default defineEventHandler(async (event): Promise<ReconnectResponse> => {
  const body = await readBody<ReconnectRequest>(event)
  const platform = body?.platform
  
  try {
    // 通过 systemctl 重启 hermes-gateway 服务
    // 这会触发所有平台重新连接
    const result = execSync('systemctl --user restart hermes-gateway', {
      encoding: 'utf-8',
      timeout: 10000
    })
    
    if (platform) {
      return {
        success: true,
        message: `正在重连 ${platform}...`,
        platform
      }
    } else {
      return {
        success: true,
        message: '正在重连所有平台...'
      }
    }
  } catch (error: any) {
    // 如果 systemctl 失败，尝试直接发送信号
    try {
      // 查找 hermes-gateway 进程并发送 SIGHUP 信号重载
      execSync('pkill -HUP -f "hermes.*gateway" || true', {
        encoding: 'utf-8',
        timeout: 5000
      })
      
      return {
        success: true,
        message: platform ? `已发送重连信号到 ${platform}` : '已发送重连信号到所有平台'
      }
    } catch (innerError: any) {
      return {
        success: false,
        message: `重连失败: ${innerError.message || '未知错误'}`
      }
    }
  }
})
