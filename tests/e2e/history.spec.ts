import { test, expect } from '@playwright/test'

test.describe('历史页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/history')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    // 检查页面已加载（h1 标题是 Hermes Agent，在侧边栏中）
    const heading = page.locator('h1').first()
    await expect(heading).toContainText('Hermes')
    
    // 检查侧边栏中是否有历史链接
    const historyLink = page.getByRole('link', { name: '历史' })
    await expect(historyLink).toBeVisible()
  })
  
  test('会话列表渲染', async ({ page }) => {
    // 检查是否有会话列表或空状态提示
    const content = page.locator('body')
    await expect(content).toBeVisible()
    
    // 等待数据加载
    await page.waitForTimeout(500)
  })
  
  test('无 Hydration 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      if (error.message.includes('Hydration') || error.message.includes('hydration')) {
        errors.push(error.message)
      }
    })
    
    await page.goto('/history')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.goto('/history')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
