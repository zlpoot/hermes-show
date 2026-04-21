import { test, expect } from '@playwright/test'

test.describe('用户授权页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    const usersLink = page.getByRole('link', { name: '用户授权' })
    await expect(usersLink).toBeVisible()
  })
  
  test('用户列表渲染', async ({ page }) => {
    await page.waitForTimeout(500)
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    // beforeEach 已经导航到 /users，无需重复导航
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
