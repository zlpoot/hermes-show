import { spawn } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import os from 'os'

interface ReconnectRequest {
  platform?: string
}

interface ReconnectResponse {
  success: boolean
  message: string
  platform?: string
}

export default defineEventHandler(async (event): Promise<ReconnectResponse> => {
  const body = await readBody<ReconnectRequest>(event)
  const platform = body?.platform
  const hermesDir = os.homedir() + '/.hermes'
  
  try {
    const statePath = hermesDir + '/gateway_state.json'
    
    if (!existsSync(statePath)) {
      return {
        success: false,
        message: '网关状态文件不存在，请确认 Hermes 网关是否正常运行'
      }
    }
    
    const state = JSON.parse(readFileSync(statePath, 'utf-8'))
    
    // 检查网关进程是否运行
    if (!state.pid || state.gateway_state !== 'running') {
      return {
        success: false,
        message: '网关未运行，请先启动网关'
      }
    }
    
    if (platform) {
      // 单个平台操作
      if (!state.platforms || !state.platforms[platform]) {
        return {
          success: false,
          message: `未找到平台 ${platform}`,
          platform
        }
      }
      
      const platformState = state.platforms[platform]
      
      if (platformState.state === 'connected') {
        return {
          success: true,
          message: `${platform} 已连接，无需重连`,
          platform
        }
      }
      
      // 当前版本不支持单独重连，提示用户
      return {
        success: false,
        message: `当前版本不支持单独重连，请点击"重连全部"`,
        platform
      }
    } else {
      // 重连全部：异步执行 hermes gateway restart
      // 使用 detached spawn 避免阻塞请求
      const child = spawn('hermes', ['gateway', 'restart'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      })
      child.unref()
      
      return {
        success: true,
        message: '已发送重启命令，网关将在几秒内重启'
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: `操作失败: ${error.message || '未知错误'}`
    }
  }
})
