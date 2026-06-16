import { test, expect } from '@playwright/test'

const healthResponse = (overrides: Record<string, any> = {}) => ({
  systemInfo: {
    platform: 'linux',
    arch: 'x64',
    hostname: 'fixture-host',
    uptime: '1h 2m',
    totalMemory: '16 GB',
    freeMemory: '8 GB',
    usedMemoryPercent: 50,
    cpuCores: 8,
    cpuModel: 'Fixture CPU',
    loadAverage: ['0.10', '0.20', '0.30']
  },
  diskInfo: {
    total: '100G',
    used: '42G',
    free: '58G',
    usedPercent: 42
  },
  hermesInfo: {
    path: '/tmp/hermes-fixture',
    exists: true,
    totalSize: '2 KB',
    sessionCount: 1,
    skillCount: 0,
    dbSize: '10 B',
    logSize: '80 B',
    cacheSize: '0 B',
    configExists: true,
    dbExists: true,
    logsExists: true,
    sessionsExists: true,
    gatewayPidExists: false,
    breakdown: [
      { name: '数据库', size: '10 B', path: 'state.db' },
      { name: '日志文件', size: '80 B', path: 'logs/' }
    ]
  },
  gatewayStatus: {
    running: false,
    pid: 12345,
    uptime: null,
    pidFileExists: true,
    pidFileFormat: 'text',
    message: 'Gateway 进程不存在 (PID: 12345)'
  },
  healthChecks: {
    memory: { status: 'healthy', message: '内存使用正常' },
    disk: { status: 'healthy', message: '磁盘空间充足' },
    hermes: { status: 'healthy', message: 'Hermes 目录存在' },
    config: { status: 'healthy', message: 'config.yaml 存在' },
    database: { status: 'healthy', message: 'state.db 存在' },
    logs: { status: 'healthy', message: '日志目录存在' },
    sessions: { status: 'healthy', message: 'sessions 目录存在' },
    gateway: { status: 'warning', message: 'Gateway 进程不存在 (PID: 12345)' }
  },
  overallStatus: 'warning',
  timestamp: '2026-06-16T00:00:00.000Z',
  isRealHermesConnected: true,
  ...overrides
})

const refreshWithHealth = async (page: any, body: Record<string, any>) => {
  await page.route('**/api/health', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body)
    })
  })
  await page.goto('/health', { timeout: 60000 })
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /刷新/ }).click()
}

test.describe('健康检查页面', () => {
  test('页面能正常加载', async ({ page }) => {
    await page.goto('/health', { timeout: 60000, waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('link', { name: '健康检查' })).toBeVisible()
    await expect(page.getByText(/系统状态:/)).toBeVisible()
  })

  test('Hermes 目录不存在时显示未连接且不误报 healthy', async ({ page }) => {
    await refreshWithHealth(page, healthResponse({
      hermesInfo: {
        path: '/tmp/missing-hermes',
        exists: false,
        totalSize: '0 B',
        sessionCount: 0,
        skillCount: 0,
        dbSize: '0 B',
        logSize: '0 B',
        cacheSize: '0 B',
        configExists: false,
        dbExists: false,
        logsExists: false,
        sessionsExists: false,
        gatewayPidExists: false,
        breakdown: []
      },
      gatewayStatus: {
        running: false,
        pid: null,
        uptime: null,
        pidFileExists: false,
        pidFileFormat: 'missing',
        message: 'Hermes 未连接，无法检查 Gateway'
      },
      healthChecks: {
        memory: { status: 'healthy', message: '内存使用正常' },
        disk: { status: 'healthy', message: '磁盘空间充足' },
        hermes: { status: 'critical', message: '未找到 Hermes 目录' },
        gateway: { status: 'warning', message: 'Hermes 未连接，无法检查 Gateway' }
      },
      overallStatus: 'critical',
      isRealHermesConnected: false
    }))

    await expect(page.getByText('系统状态: 异常')).toBeVisible()
    await expect(page.getByText('未找到 Hermes 目录')).toBeVisible()
    await expect(page.getByText('未找到', { exact: true })).toBeVisible()
  })

  test('缺少 DB/config/logs 时逐项显示 warning', async ({ page }) => {
    await refreshWithHealth(page, healthResponse({
      hermesInfo: {
        path: '/tmp/partial-hermes',
        exists: true,
        totalSize: '0 B',
        sessionCount: 0,
        skillCount: 0,
        dbSize: '0 B',
        logSize: '0 B',
        cacheSize: '0 B',
        configExists: false,
        dbExists: false,
        logsExists: false,
        sessionsExists: true,
        gatewayPidExists: false,
        breakdown: []
      },
      healthChecks: {
        memory: { status: 'healthy', message: '内存使用正常' },
        disk: { status: 'healthy', message: '磁盘空间充足' },
        hermes: { status: 'healthy', message: 'Hermes 目录存在' },
        config: { status: 'warning', message: '缺少 config.yaml' },
        database: { status: 'warning', message: '缺少 state.db' },
        logs: { status: 'warning', message: '缺少 logs 目录' },
        sessions: { status: 'healthy', message: 'sessions 目录存在' },
        gateway: { status: 'warning', message: 'Gateway pid 文件不存在' }
      },
      overallStatus: 'warning'
    }))

    await expect(page.getByText('系统状态: 警告')).toBeVisible()
    await expect(page.getByText('缺少 config.yaml')).toBeVisible()
    await expect(page.getByText('缺少 state.db')).toBeVisible()
    await expect(page.getByText('缺少 logs 目录')).toBeVisible()
  })

  test('gateway pid 存在但进程未运行时显示 warning', async ({ page }) => {
    await refreshWithHealth(page, healthResponse())

    await expect(page.getByText('系统状态: 警告')).toBeVisible()
    await expect(page.getByText('Gateway 进程不存在 (PID: 12345)')).toBeVisible()
    await expect(page.getByText('离线')).toBeVisible()
  })

  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []

    page.on('pageerror', error => {
      errors.push(error.message)
    })

    await page.goto('/health', { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)

    expect(errors).toHaveLength(0)
  })
})
