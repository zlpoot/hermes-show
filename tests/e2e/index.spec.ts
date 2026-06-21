import { test, expect } from '@playwright/test'

test.describe('仪表盘 (Dashboard)', () => {
  test('有测试数据时显示已连接和统计信息', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('已成功接入本地 Hermes Agent')).toBeVisible()
    await expect(page.getByText('今日 Tokens')).toBeVisible()
    await expect(page.getByText('总会话数')).toBeVisible()
    await expect(page.getByText('今日会话')).toBeVisible()
    await expect(page.getByText('近期活跃会话')).toBeVisible()
    await expect(page.getByText('最近会话')).toBeVisible()
  })

  test('Dashboard API 返回正确数据结构', async ({ request }) => {
    const response = await request.get('/api/dashboard')
    expect(response.ok()).toBe(true)

    const data = await response.json()
    expect(data).toHaveProperty('stats')
    expect(data.stats).toMatchObject({
      todayTokens: expect.any(String),
      totalSessions: expect.any(Number),
      todaySessions: expect.any(Number),
      activeAgents: expect.any(Number),
      avgTokensPerSession: expect.any(String)
    })
    expect(data.stats.totalSessions).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(data.activeTasks)).toBe(true)
    expect(Array.isArray(data.recentSessions)).toBe(true)
    expect(data.chartData).toMatchObject({ labels: expect.any(Array), datasets: expect.any(Array) })
    expect(data.isRealHermesConnected).toBe(true)
    // 不应包含调试字段
    expect(data).not.toHaveProperty('_dataSources')
    expect(data).toHaveProperty('lastRefreshTime')
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
