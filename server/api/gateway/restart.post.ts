import { execSync } from 'child_process'

interface RestartResponse {
  success: boolean
  message: string
}

export default defineEventHandler(async (event): Promise<RestartResponse> => {
  try {
    // 通过 systemctl 重启 hermes-gateway 服务
    execSync('systemctl --user restart hermes-gateway', {
      encoding: 'utf-8',
      timeout: 15000
    })
    
    return {
      success: true,
      message: '网关已重启'
    }
  } catch (error: any) {
    return {
      success: false,
      message: `重启失败: ${error.message || '未知错误'}`
    }
  }
})
