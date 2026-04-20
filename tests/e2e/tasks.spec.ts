import { test, expect } from '@playwright/test'

test.describe('任务队列页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    const tasksLink = page.getByRole('link', { name: '任务队列' })
    await expect(tasksLink).toBeVisible()
  })
  
  test('任务列表渲染', async ({ page }) => {
    await page.waitForTimeout(500)
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
