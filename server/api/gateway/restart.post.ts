import { spawn } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import os from 'os'

interface RestartResponse {
  success: boolean
  message: string
}

export default defineEventHandler(async (event): Promise<RestartResponse> => {
  const hermesDir = os.homedir() + '/.hermes'
  
  try {
    const statePath = hermesDir + '/gateway_state.json'
    
    if (!existsSync(statePath)) {
      return {
        success: false,
        message: '网关状态文件不存在'
      }
    }
    
    const state = JSON.parse(readFileSync(statePath, 'utf-8'))
    
    if (!state.pid || state.gateway_state !== 'running') {
      return {
        success: false,
        message: '网关未运行'
      }
    }
    
    // 异步执行重启，避免阻塞
    const child = spawn('hermes', ['gateway', 'restart'], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    })
    child.unref()
    
    return {
      success: true,
      message: '网关正在重启...'
    }
  } catch (error: any) {
    return {
      success: false,
      message: `重启失败: ${error.message || '未知错误'}`
    }
  }
})
