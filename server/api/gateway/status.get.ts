import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import os from 'os'

export default defineEventHandler(async (event) => {
  try {
    const hermesDir = os.homedir() + '/.hermes'
    const result: any = {
      status: 'offline',
      pid: null,
      uptime: null,
      platforms: {},
      pairedUsers: [],
      config: {},
      system: {}
    }

    // 读取网关状态
    const gatewayStatePath = hermesDir + '/gateway_state.json'
    if (existsSync(gatewayStatePath)) {
      try {
        const gatewayState = JSON.parse(readFileSync(gatewayStatePath, 'utf-8'))
        result.status = gatewayState.gateway_state || 'unknown'
        result.pid = gatewayState.pid || null
        result.uptime = gatewayState.start_time ? formatUptime(gatewayState.start_time) : null
        result.platforms = gatewayState.platforms || {}
      } catch(e) {}
    }

    // 读取配对用户
    const pairingDir = hermesDir + '/pairing'
    if (existsSync(pairingDir)) {
      try {
        const files = execSync(`ls ${pairingDir}/*-approved.json 2>/dev/null`, { encoding: 'utf-8' })
        const approvedFiles = files.trim().split('\n').filter(Boolean)
        
        for (const file of approvedFiles) {
          if (existsSync(file)) {
            const content = readFileSync(file, 'utf-8')
            const approved = JSON.parse(content)
            const platform = file.split('/').pop()?.replace('-approved.json', '') || 'unknown'
            
            for (const [id, data] of Object.entries(approved)) {
              result.pairedUsers.push({
                id: id,
                platform: platform,
                approved_at: (data as any).approved_at 
                  ? new Date((data as any).approved_at * 1000).toLocaleString('zh-CN') 
                  : 'N/A'
              })
            }
          }
        }
      } catch(e) {}
    }

    // 读取配置中的网关相关设置
    const configPath = hermesDir + '/config.yaml'
    if (existsSync(configPath)) {
      try {
        const configContent = readFileSync(configPath, 'utf-8')
        // 提取关键配置
        const gatewayTimeout = configContent.match(/gateway_timeout:\s*(\d+)/)
        const allowAllUsers = configContent.match(/GATEWAY_ALLOW_ALL_USERS:\s*(\w+)/)
        const dmPolicy = configContent.match(/WEIXIN_DM_POLICY:\s*(\w+)/)
        
        result.config = {
          gateway_timeout: gatewayTimeout && gatewayTimeout[1] ? parseInt(gatewayTimeout[1]) : null,
          allow_all_users: allowAllUsers && allowAllUsers[1] ? allowAllUsers[1] === 'true' : false,
          weixin_dm_policy: dmPolicy && dmPolicy[1] ? dmPolicy[1] : 'unknown'
        }
      } catch(e) {}
    }

    // 系统信息
    try {
      // 检查进程是否真正运行
      if (result.pid) {
        try {
          execSync(`ps -p ${result.pid} -o pid=`, { stdio: 'pipe' })
          result.system.process_running = true
        } catch {
          result.system.process_running = false
          result.status = 'dead'
        }
      }

      // 端口监听状态
      try {
        const ports = execSync('ss -tlnp 2>/dev/null | grep hermes || netstat -tlnp 2>/dev/null | grep hermes', { 
          encoding: 'utf-8', 
          stdio: ['pipe', 'pipe', 'pipe'] 
        })
        result.system.listening_ports = ports.trim().split('\n').filter(Boolean).length > 0
      } catch {
        result.system.listening_ports = false
      }

      // 网关目录大小
      try {
        const size = execSync(`du -sh ${hermesDir} 2>/dev/null | cut -f1`, { encoding: 'utf-8' })
        result.system.data_dir_size = size.trim()
      } catch {}

      // 日志文件大小
      try {
        const logSize = execSync(`du -sh ${hermesDir}/logs 2>/dev/null | cut -f1`, { encoding: 'utf-8' })
        result.system.logs_size = logSize.trim()
      } catch {}

    } catch(e) {}

    return result
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message
    }
  }
})

function formatUptime(startTime: number): string {
  // startTime is relative boot time in seconds
  const uptime = process.uptime()
  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}
