import { test, expect } from '@playwright/test'

test.describe('历史页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/history', async (route) => {
      const request = route.request()
      if (request.method() !== 'DELETE') {
        await route.fallback()
        return
      }

      const body = request.postDataJSON() as { ids?: string[] }
      if (body.ids?.includes('jsonl_slack_1')) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Failed to delete some sessions' })
        })
        return
      }

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          deleted: body.ids?.length || 0,
          requested: body.ids?.length || 0,
          results: (body.ids || []).map((id) => ({ id, jsonlDeleted: true, sqliteDeleted: false }))
        })
      })
    })
  })

  test('页面加载真实 JSONL 列表且无 hydration 或 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' || message.text().toLowerCase().includes('hydration')) {
        errors.push(message.text())
      }
    })

    await page.goto('/history')
    await expect(page.locator('h4', { hasText: 'Alpha JSONL request' })).toBeVisible()
    await expect(page.locator('h4', { hasText: 'Beta Slack thread' })).toBeVisible()
    await expect(page.getByText('CLI', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Slack', { exact: true }).first()).toBeVisible()
    expect(errors).toEqual([])
  })

  test('可以选择详情、搜索并按分类筛选', async ({ page }) => {
    await page.goto('/history')

    await page.locator('h4', { hasText: 'Alpha JSONL request' }).click()
    await expect(page.getByText('History works with JSONL data')).toBeVisible()
    await expect(page.getByText('Tokens: 16')).toBeVisible()

    await page.getByPlaceholder('搜索对话内容...').fill('Beta')
    await expect(page.locator('h4', { hasText: 'Beta Slack thread' })).toBeVisible()
    await expect(page.locator('h4', { hasText: 'Alpha JSONL request' })).toBeHidden()

    await page.getByRole('button', { name: /已选|全部分类/ }).click()
    await page.getByText('Slack', { exact: true }).first().click()
    await expect(page.locator('h4', { hasText: 'Beta Slack thread' })).toBeHidden()
  })

  test('可以导出 JSON 和 Markdown', async ({ page }) => {
    await page.goto('/history')
    await page.locator('h4', { hasText: 'Alpha JSONL request' }).click()

    const jsonDownload = page.waitForEvent('download')
    await page.getByLabel('导出会话').click()
    await page.getByText('导出 JSON').click()
    expect((await jsonDownload).suggestedFilename()).toBe('jsonl_cli_1.json')

    const mdDownload = page.waitForEvent('download')
    await page.getByLabel('导出会话').click()
    await page.getByText('导出 Markdown').click()
    expect((await mdDownload).suggestedFilename()).toBe('jsonl_cli_1.md')
  })

  test('批量删除成功和失败都有明确反馈', async ({ page }) => {
    await page.goto('/history')
    await page.getByRole('checkbox').nth(1).check()
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm')
      await dialog.accept()
    })
    await page.getByRole('button', { name: /删除/ }).click()
    await expect(page.locator('h4', { hasText: 'Alpha JSONL request' })).toBeVisible()

    await page.getByRole('checkbox').nth(2).check()
    let confirmed = false
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm')
      confirmed = true
      await dialog.accept()
    })
    const alertPromise = page.waitForEvent('dialog', (dialog) => dialog.type() === 'alert')
    await page.getByRole('button', { name: /删除/ }).click()

    const alert = await alertPromise
    expect(confirmed).toBe(true)
    expect(alert.message()).toContain('删除过程中出现异常')
    await alert.accept()
  })
})
