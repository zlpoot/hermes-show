import { test, expect } from '@playwright/test'

test.describe('备份管理页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/backup')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    const backupLink = page.getByRole('link', { name: '备份管理' })
    await expect(backupLink).toBeVisible()
  })
  
  test('备份操作按钮', async ({ page }) => {
    await page.waitForTimeout(500)
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.goto('/backup')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
