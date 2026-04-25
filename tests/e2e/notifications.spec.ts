import { test, expect } from '@playwright/test'

test.describe('通知设置页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')
  })
  
  test('页面能正常加载', async ({ page }) => {
    // 检查页面标题 - 使用 .first() 避免多个匹配
    const heading = page.getByRole('heading', { name: '通知设置' }).first()
    await expect(heading).toBeVisible()
    
    // 检查侧边栏中有通知设置链接
    const notificationsLink = page.getByRole('link', { name: '通知设置' })
    await expect(notificationsLink.first()).toBeVisible()
  })
  
  test('统计卡片显示正常', async ({ page }) => {
    // 等待数据加载
    await page.waitForTimeout(500)
    
    // 检查统计卡片存在
    const todayLabel = page.getByText('今日通知')
    await expect(todayLabel).toBeVisible()
    
    const failedLabel = page.getByText('失败通知')
    await expect(failedLabel).toBeVisible()
    
    // 使用精确匹配避免多个元素
    const rulesLabel = page.getByText('路由规则', { exact: true })
    await expect(rulesLabel.first()).toBeVisible()
    
    const channelsLabel = page.getByText('通知渠道', { exact: true })
    await expect(channelsLabel.first()).toBeVisible()
  })
  
  test('通知渠道区域存在', async ({ page }) => {
    // 检查渠道标题 - 使用精确匹配
    const channelsTitle = page.getByText('通知渠道', { exact: true })
    await expect(channelsTitle.first()).toBeVisible()
    
    // 检查添加按钮
    const addButton = page.getByRole('button', { name: /添加/ })
    await expect(addButton).toBeVisible()
  })
  
  test('路由规则区域存在', async ({ page }) => {
    // 检查规则标题 - 使用精确匹配
    const rulesTitle = page.getByText('路由规则', { exact: true })
    await expect(rulesTitle.first()).toBeVisible()
  })
  
  test('事件类型区域存在', async ({ page }) => {
    // 检查事件类型标题
    const eventTypesTitle = page.getByText('事件类型')
    await expect(eventTypesTitle).toBeVisible()
  })
  
  test('通知历史区域存在', async ({ page }) => {
    // 检查历史标题
    const historyTitle = page.getByText('通知历史')
    await expect(historyTitle).toBeVisible()
  })
  
  test('刷新按钮功能', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /刷新/ })
    await expect(refreshButton).toBeVisible()
    
    // 点击刷新
    await refreshButton.click()
    
    // 等待刷新完成（按钮会短暂显示加载状态）
    await page.waitForTimeout(500)
  })
  
  test('文档链接可用', async ({ page }) => {
    // 使用更精确的选择器，指定 main 区域内的链接
    const docsLink = page.getByRole('main').getByRole('link', { name: /文档/ })
    await expect(docsLink).toBeVisible()
    
    // 检查链接指向正确的文档页面
    await expect(docsLink).toHaveAttribute('href', '/docs/notifications')
  })
  
  test('添加渠道弹窗', async ({ page }) => {
    // 点击添加按钮
    const addButton = page.getByRole('button', { name: /添加/ })
    await addButton.click()
    
    // 等待弹窗出现
    await page.waitForTimeout(300)
    
    // 检查弹窗标题
    const modalTitle = page.getByText('添加渠道')
    await expect(modalTitle).toBeVisible()
    
    // 检查表单字段
    const channelIdLabel = page.getByText('渠道ID')
    await expect(channelIdLabel).toBeVisible()
    
    const channelTypeLabel = page.getByText('渠道类型')
    await expect(channelTypeLabel).toBeVisible()
    
    // 检查取消按钮
    const cancelButton = page.getByRole('button', { name: '取消' })
    await expect(cancelButton).toBeVisible()
    
    // 关闭弹窗
    await cancelButton.click()
    await page.waitForTimeout(300)
    
    // 弹窗应该关闭
    await expect(modalTitle).not.toBeVisible()
  })
  
  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
  
  test('无 Hydration 错误', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', error => {
      if (error.message.includes('Hydration') || error.message.includes('hydration')) {
        errors.push(error.message)
      }
    })
    
    await page.waitForTimeout(1000)
    
    expect(errors).toHaveLength(0)
  })
})
