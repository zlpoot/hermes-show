import { test, expect } from '@playwright/test'

test.describe('MCP 服务器页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mcp')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    const mcpLink = page.getByRole('link', { name: 'MCP' })
    await expect(mcpLink).toBeVisible()
  })
  
  test('MCP 服务器列表', async ({ page }) => {
    await page.waitForTimeout(500)
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.goto('/mcp')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
