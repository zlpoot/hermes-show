import { test, expect } from '@playwright/test'

test.describe('Playwright Demo 测试', () => {
  test('首页能正常加载', async ({ page }) => {
    await page.goto('/')
    
    // 等待页面加载
    await page.waitForLoadState('networkidle')
    
    // 检查标题包含 Hermes
    await expect(page).toHaveTitle(/Hermes/)
    
    // 检查侧边栏导航存在
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })

  test('仪表盘显示关键指标', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // 检查侧边栏有仪表盘链接
    const dashboardLink = page.getByRole('link', { name: '仪表盘' })
    await expect(dashboardLink).toBeVisible()
    
    // 检查页面包含 Hermes 标题
    const heading = page.locator('h1').first()
    await expect(heading).toContainText('Hermes')
  })

  test('导航菜单可点击', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // 点击配置中心链接
    await page.click('text=配置中心')
    await page.waitForURL('**/config')
    
    // 验证URL
    expect(page.url()).toContain('/config')
  })
})
