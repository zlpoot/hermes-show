import { test, expect } from '@playwright/test'

test.describe('首页/仪表盘', () => {
  test('页面能正常加载', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // 检查页面标题
    await expect(page).toHaveTitle(/Hermes/)
    
    // 检查侧边栏导航存在
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })
  
  test('显示系统关键指标', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // 检查统计卡片区域
    const statsSection = page.locator('.grid').first()
    await expect(statsSection).toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // 等待一段时间确保没有延迟错误
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
  
  test('侧边栏导航链接可点击', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // 点击配置中心
    await page.click('text=配置中心')
    await page.waitForURL('**/config')
    expect(page.url()).toContain('/config')
  })
})
