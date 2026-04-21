import { writeFileSync, existsSync } from 'fs'
import os from 'os'

interface ClearQueueResponse {
  success: boolean
  message: string
}

export default defineEventHandler(async (event): Promise<ClearQueueResponse> => {
  const hermesDir = os.homedir() + '/.hermes'
  const queuePath = hermesDir + '/gateway_queue.json'
  
  try {
    // 清空消息队列文件
    if (existsSync(queuePath)) {
      writeFileSync(queuePath, JSON.stringify([], null, 2))
    }
    
    return {
      success: true,
      message: '消息队列已清空'
    }
  } catch (error: any) {
    return {
      success: false,
      message: `清空队列失败: ${error.message || '未知错误'}`
    }
  }
})
