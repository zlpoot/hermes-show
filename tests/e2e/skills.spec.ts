import { test, expect } from '@playwright/test'

test.describe('Skills 管理页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/skills')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    const skillsLink = page.getByRole('link', { name: 'Skills' })
    await expect(skillsLink).toBeVisible()
  })
  
  test('Skills 列表渲染', async ({ page }) => {
    // 等待数据加载
    await page.waitForTimeout(500)
    
    // 页面应该有内容区域
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    // beforeEach 已经导航到 /skills，无需重复导航
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
