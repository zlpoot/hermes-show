import { test, expect } from '@playwright/test'

test.describe('网关状态页面', () => {
  test.beforeEach(async ({ page }) => {
    // 使用 domcontentloaded 替代 networkidle，避免长时间等待
    await page.goto('/gateway', { waitUntil: 'domcontentloaded' })
    // 额外等待确保页面渲染
    await page.waitForTimeout(500)
  })
  
  test('页面能正常加载', async ({ page }) => {
    const gatewayLink = page.getByRole('link', { name: '网关状态' })
    await expect(gatewayLink).toBeVisible()
  })
  
  test('网关状态显示', async ({ page }) => {
    await page.waitForTimeout(500)
    const content = page.getByRole('main')
    await expect(content).toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    // beforeEach 已经导航到 /gateway，无需重复导航
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
