import { test, expect } from '@playwright/test'

test.describe('仪表盘 (Dashboard)', () => {
  test('无 state.db 时显示断开连接和空状态', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('未连接 Hermes Agent')).toBeVisible()
    await expect(page.getByText('今日 Tokens')).toBeVisible()
    await expect(page.getByText('总会话数')).toBeVisible()
    await expect(page.getByText('今日会话')).toBeVisible()
    await expect(page.getByText('暂无图表数据')).toBeVisible()
    await expect(page.getByText('没有活跃任务')).toBeVisible()
    await expect(page.getByText('暂无会话记录')).toBeVisible()
  })

  test('Dashboard API 返回稳定空状态结构', async ({ request }) => {
    const response = await request.get('/api/dashboard')
    expect(response.ok()).toBe(true)

    const data = await response.json()
    expect(data).toHaveProperty('stats')
    expect(data.stats).toMatchObject({
      todayTokens: '0',
      totalSessions: 0,
      todaySessions: 0,
      activeAgents: 0,
      avgTokensPerSession: '0'
    })
    expect(Array.isArray(data.activeTasks)).toBe(true)
    expect(Array.isArray(data.recentSessions)).toBe(true)
    expect(data.chartData).toMatchObject({ labels: [], datasets: [] })
    expect(data.isRealHermesConnected).toBe(false)
  })

  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []

    page.on('pageerror', error => {
      errors.push(error.message)
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    expect(errors).toHaveLength(0)
  })

  test('侧边栏导航链接可点击', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click('text=配置中心')
    await page.waitForURL('**/config')
    expect(page.url()).toContain('/config')
  })
})
