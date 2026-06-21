import { test, expect } from '@playwright/test'

test.describe('仪表盘 (Dashboard)', () => {
  test('有测试数据时显示完整的三段式布局', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 三大 section 标题
    await expect(page.getByText('运行状态')).toBeVisible()
    await expect(page.getByText('最近活动')).toBeVisible()
    await expect(page.getByText('数据覆盖')).toBeVisible()

    // 覆盖概况统计
    await expect(page.getByText('总会话数')).toBeVisible()
    await expect(page.getByText('今日会话')).toBeVisible()

    // 活跃会话 & 最近会话
    await expect(page.getByText('近期活跃会话').or(page.getByText('暂无运行中任务'))).toBeVisible()
  })

  test('Dashboard API 返回正确数据结构', async ({ request }) => {
    const response = await request.get('/api/dashboard')
    expect(response.ok()).toBe(true)

    const data = await response.json()
    // 顶级字段
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('coverage')
    expect(data).toHaveProperty('chartData')
    expect(data).toHaveProperty('recentActiveSessions')
    expect(data).toHaveProperty('recentSessions')

    // status
    expect(data.status).toMatchObject({
      cpuLoad: expect.any(String),
      lastRefreshTime: expect.any(String),
      isHermesConnected: expect.any(Boolean),
    })

    // coverage
    expect(data.coverage).toMatchObject({
      totalSessions: expect.any(Number),
      hasTokenSessions: expect.any(Number),
      todaySessions: expect.any(Number),
    })
    expect(data.coverage.totalSessions).toBeGreaterThanOrEqual(0)

    // chartData
    expect(data.chartData).toMatchObject({
      labels: expect.any(Array),
      datasets: expect.any(Array),
      mode: expect.stringMatching(/^(tokens|sessions|empty)$/),
    })

    // 不应包含调试字段
    expect(data).not.toHaveProperty('_dataSources')
    expect(data).not.toHaveProperty('stats')

    // lastRefreshTime 在 status 内
    expect(data.status).toHaveProperty('lastRefreshTime')
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
