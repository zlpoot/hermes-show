import { test, expect } from '@playwright/test'

test.describe('通知设置页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    const notificationsLink = page.getByRole('link', { name: '通知设置' })
    await expect(notificationsLink).toBeVisible()
  })
  
  test('通知渠道列表', async ({ page }) => {
    await page.waitForTimeout(500)
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
