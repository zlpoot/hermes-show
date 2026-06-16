import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  inspectGatewayStatus,
  inspectHermesHealth,
  parseDfOutput,
  parseGatewayPid,
  resourceStatus
} from '../../server/utils/health'

const tempDirs: string[] = []

const makeHermesDir = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-health-test-'))
  tempDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

describe('health 工具函数', () => {
  it('Hermes 目录不存在时不会误报连接', () => {
    const info = inspectHermesHealth(path.join(os.tmpdir(), '__missing_hermes_health__'))

    expect(info.exists).toBe(false)
    expect(info.checks.hermesDirectory.status).toBe('critical')
    expect(info.checks.hermesDirectory.message).toBe('未找到 Hermes 目录')
  })

  it('Hermes 目录存在但缺少关键文件时返回 warning', () => {
    const dir = makeHermesDir()
    const info = inspectHermesHealth(dir)

    expect(info.exists).toBe(true)
    expect(info.configExists).toBe(false)
    expect(info.dbExists).toBe(false)
    expect(info.logsExists).toBe(false)
    expect(info.sessionsExists).toBe(false)
    expect(info.checks.config.status).toBe('warning')
    expect(info.checks.database.status).toBe('warning')
    expect(info.checks.logs.status).toBe('warning')
    expect(info.checks.sessions.status).toBe('warning')
  })

  it('Hermes 目录关键文件存在时返回对应统计', () => {
    const dir = makeHermesDir()
    fs.writeFileSync(path.join(dir, 'config.yaml'), 'model:\n  provider: test\n')
    fs.writeFileSync(path.join(dir, 'state.db'), 'fixture-db')
    fs.mkdirSync(path.join(dir, 'logs'))
    fs.writeFileSync(path.join(dir, 'logs', 'agent.log'), '2026-06-16 00:00:00,000 INFO Core: ok\n')
    fs.mkdirSync(path.join(dir, 'sessions'))
    fs.writeFileSync(path.join(dir, 'sessions', 'session_a.jsonl'), '{"role":"user","content":"hi"}\n')

    const info = inspectHermesHealth(dir)

    expect(info.exists).toBe(true)
    expect(info.configExists).toBe(true)
    expect(info.dbExists).toBe(true)
    expect(info.logsExists).toBe(true)
    expect(info.sessionsExists).toBe(true)
    expect(info.sessionCount).toBe(1)
    expect(info.dbSize).not.toBe('0 B')
    expect(info.logSize).not.toBe('0 B')
    expect(info.checks.config.status).toBe('healthy')
    expect(info.checks.database.status).toBe('healthy')
  })

  it('解析 gateway pid JSON 和纯文本格式', () => {
    expect(parseGatewayPid('{"pid":12345,"started_at":"now"}')).toEqual({ pid: 12345, format: 'json' })
    expect(parseGatewayPid('23456\n')).toEqual({ pid: 23456, format: 'text' })
    expect(parseGatewayPid('{"pid":"bad"}')).toEqual({ pid: null, format: 'invalid' })
    expect(parseGatewayPid('not-a-pid')).toEqual({ pid: null, format: 'invalid' })
  })

  it('检查 gateway pid 文件状态', () => {
    const dir = makeHermesDir()
    fs.writeFileSync(path.join(dir, 'gateway.pid'), '{"pid":12345}')

    const running = inspectGatewayStatus(dir, pid => pid === 12345, () => 125)
    expect(running).toMatchObject({
      running: true,
      pid: 12345,
      pidFileExists: true,
      pidFileFormat: 'json',
      uptime: '2m'
    })

    const stopped = inspectGatewayStatus(dir, () => false)
    expect(stopped.running).toBe(false)
    expect(stopped.message).toContain('Gateway 进程不存在')
  })

  it('坏 gateway pid 文件不会崩溃', () => {
    const dir = makeHermesDir()
    fs.writeFileSync(path.join(dir, 'gateway.pid'), 'bad-pid')

    const status = inspectGatewayStatus(dir, () => true)
    expect(status.running).toBe(false)
    expect(status.pidFileFormat).toBe('invalid')
    expect(status.message).toBe('Gateway pid 文件格式无效')
  })

  it('解析 df 输出并计算资源阈值', () => {
    const disk = parseDfOutput(`Filesystem      Size  Used Avail Use% Mounted on\n/dev/disk1s1   100G   85G   15G  85% /\n`)

    expect(disk).toEqual({
      total: '100G',
      used: '85G',
      free: '15G',
      usedPercent: 85
    })
    expect(resourceStatus(79, 80, 90)).toBe('healthy')
    expect(resourceStatus(80, 80, 90)).toBe('warning')
    expect(resourceStatus(90, 80, 90)).toBe('critical')
  })
})
