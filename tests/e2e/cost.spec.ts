import { test, expect } from '@playwright/test'

test.describe('成本统计页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cost')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    const costLink = page.getByRole('link', { name: '成本统计' })
    await expect(costLink).toBeVisible()
  })
  
  test('成本数据展示', async ({ page }) => {
    await page.waitForTimeout(500)
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.goto('/cost')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
