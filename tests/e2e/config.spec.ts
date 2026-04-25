import { test, expect } from '@playwright/test'

test.describe('配置中心页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/config')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    // 检查侧边栏中是否有配置中心链接
    const configLink = page.getByRole('link', { name: '配置中心' })
    await expect(configLink).toBeVisible()
  })
  
  test('页面内容存在', async ({ page }) => {
    // 检查页面主要内容区域
    const mainContent = page.getByRole('main')
    await expect(mainContent).toBeVisible()
    
    // 页面应该有一些交互元素（按钮或链接）
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    expect(buttonCount).toBeGreaterThan(0)
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    // beforeEach 已经导航到 /config，无需重复导航
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
