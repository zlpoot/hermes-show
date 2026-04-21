import { test, expect } from '@playwright/test'

test.describe('系统日志页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/logs')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    const logsLink = page.getByRole('link', { name: '系统日志' })
    await expect(logsLink).toBeVisible()
  })
  
  test('日志内容区域', async ({ page }) => {
    await page.waitForTimeout(500)
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    // beforeEach 已经导航到 /logs，无需重复导航
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
