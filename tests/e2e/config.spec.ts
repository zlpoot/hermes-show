import { test, expect } from '@playwright/test'

test.describe('配置中心页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/config')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    // 检查侧边栏中是否有配置中心链接
    const configLink = page.getByRole('link', { name: '配置中心' })
    await expect(configLink).toBeVisible()
  })
  
  test('表单元素存在', async ({ page }) => {
    // 检查页面有表单或配置项
    const form = page.locator('form, .form-control, input').first()
    // 页面至少有交互元素
    await expect(form).toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    // beforeEach 已经导航到 /config，无需重复导航
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
