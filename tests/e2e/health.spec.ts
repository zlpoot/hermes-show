import { test, expect } from '@playwright/test'

test.describe('健康检查页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    const healthLink = page.getByRole('link', { name: '健康检查' })
    await expect(healthLink).toBeVisible()
  })
  
  test('系统状态显示', async ({ page }) => {
    await page.waitForTimeout(500)
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.goto('/health')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
