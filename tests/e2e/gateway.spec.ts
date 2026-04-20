import { test, expect } from '@playwright/test'

test.describe('网关状态页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gateway')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    const gatewayLink = page.getByRole('link', { name: '网关状态' })
    await expect(gatewayLink).toBeVisible()
  })
  
  test('网关状态显示', async ({ page }) => {
    await page.waitForTimeout(500)
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.goto('/gateway')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
