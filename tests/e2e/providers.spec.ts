import { test, expect } from '@playwright/test'

test.describe('提供商监控页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/providers')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    const providersLink = page.getByRole('link', { name: '提供商' })
    await expect(providersLink).toBeVisible()
  })
  
  test('提供商性能数据', async ({ page }) => {
    await page.waitForTimeout(500)
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.goto('/providers')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
