import { test, expect } from '@playwright/test'

const terminalBody = () => '[data-testid="terminal-body"]'
const logEntry = () => '[data-testid="log-entry"]'

test.describe('系统日志页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/logs')
    await page.waitForLoadState('networkidle')
  })

  test('页面能正常加载', async ({ page }) => {
    const logsLink = page.getByRole('link', { name: '系统日志' })
    await expect(logsLink).toBeVisible()
  })

  test('日志内容从伺服器加载 (fixture logs)', async ({ page }) => {
    // Playwright webServer uses NUXT_HERMES_PATH=./tests/fixtures/hermes-history
    // which contains agent.log with 20 synthetic lines
    await page.waitForTimeout(1000)

    // Check that log entries are visible (real logs from fixture)
    const logRows = page.locator(logEntry())
    const count = await logRows.count()
    expect(count).toBeGreaterThan(0)

    // First log should contain "Application started" (first line in fixture)
    const firstLog = logRows.first()
    await expect(firstLog).toContainText('Application')
  })

  test('日志文件下拉列表从 API 填充', async ({ page }) => {
    await page.waitForTimeout(1000)

    // The fixture dir has agent.log and gateway.log
    const fileSelect = page.locator('select').first()
    await expect(fileSelect).toBeVisible()
    const options = fileSelect.locator('option')
    const optionCount = await options.count()
    expect(optionCount).toBeGreaterThanOrEqual(2)

    // Check option text values instead of asserting visibility
    const optionTexts = await options.allTextContents()
    expect(optionTexts.some(t => t.includes('agent.log'))).toBeTruthy()
    expect(optionTexts.some(t => t.includes('gateway.log'))).toBeTruthy()
  })

  test('日志级别筛选按钮可点击', async ({ page }) => {
    await page.waitForTimeout(1000)

    // Click 'ERROR' level button to toggle it off
    const errorBtn = page.locator('button', { hasText: 'ERROR' }).first()
    await expect(errorBtn).toBeVisible()

    // Toggling off: background should change
    const initialClass = await errorBtn.getAttribute('class')
    await errorBtn.click()

    // Wait a tick for reactivity
    await page.waitForTimeout(100)
    const afterToggleClass = await errorBtn.getAttribute('class')
    expect(afterToggleClass).not.toBe(initialClass)

    // Click again to re-enable
    await errorBtn.click()
    await page.waitForTimeout(100)
    const afterReToggleClass = await errorBtn.getAttribute('class')
    expect(afterReToggleClass).toBe(initialClass)
  })

  test('暂停/恢复按钮不改变日志内容', async ({ page }) => {
    await page.waitForTimeout(1000)

    // Count current log entries via data-testid
    const logRows = page.locator(logEntry())
    const countBefore = await logRows.count()

    // Click pause
    const pauseBtn = page.locator('button', { hasText: '暂停' })
    await expect(pauseBtn).toBeVisible()
    await pauseBtn.click()

    // Button text should change to "恢复"
    const resumeBtn = page.locator('button', { hasText: '恢复' })
    await expect(resumeBtn).toBeVisible()

    // Click resume
    await resumeBtn.click()

    // Button text should be "暂停" again
    await expect(page.locator('button', { hasText: '暂停' })).toBeVisible()

    // Log entries should still be present (pause does not clear view)
    const countAfter = await logRows.count()
    expect(countAfter).toBe(countBefore)
  })

  test('清空按钮清空日志显示', async ({ page }) => {
    await page.waitForTimeout(1000)

    // Clear button should exist
    const clearBtn = page.locator('button', { hasText: '清空' })
    await expect(clearBtn).toBeVisible()

    // Click clear
    await clearBtn.click()
    await page.waitForTimeout(200)

    // After clear, should see "没有匹配的日志记录" or 0 log entries
    const logRows = page.locator(logEntry())
    const count = await logRows.count()
    expect(count).toBe(0)
  })

  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []

    page.on('pageerror', error => {
      errors.push(error.message)
    })

    await page.waitForTimeout(2000)

    expect(errors).toHaveLength(0)
  })
})

test.describe('日志页面 - API 模拟状态', () => {
  test('空日志状态显示正确信息', async ({ page }) => {
    // Mock API to return empty logs
    await page.route('**/api/logs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          logs: [],
          logFiles: ['agent.log'],
          currentFile: 'agent.log',
          status: 'empty',
          isRealHermesConnected: true
        })
      })
    })

    await page.goto('/logs')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Should show "日志为空" message — scope to terminal body
    await expect(page.locator(terminalBody()).getByText('日志为空')).toBeVisible()
  })

  test('Hermes 未连接时显示对应信息', async ({ page }) => {
    // Mock API to return no-hermes status
    await page.route('**/api/logs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          logs: [],
          logFiles: [],
          currentFile: '',
          status: 'no-hermes',
          isRealHermesConnected: false
        })
      })
    })

    await page.goto('/logs')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Scope to terminal body (header also says "Hermes 未连接" without demo suffix)
    const body = page.locator(terminalBody())
    await expect(body.getByText('Hermes 未连接')).toBeVisible()
  })

  test('日志目录不存在时显示对应信息', async ({ page }) => {
    await page.route('**/api/logs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          logs: [],
          logFiles: [],
          currentFile: '',
          status: 'no-logs-dir',
          isRealHermesConnected: true
        })
      })
    })

    await page.goto('/logs')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Scope to terminal body (header also contains "日志目录不存在")
    const body = page.locator(terminalBody())
    await expect(body.getByText('日志目录不存在')).toBeVisible()
  })

  test('读取失败状态显示对应信息', async ({ page }) => {
    await page.route('**/api/logs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          logs: [],
          logFiles: ['agent.log'],
          currentFile: 'agent.log',
          status: 'read-error',
          isRealHermesConnected: true
        })
      })
    })

    await page.goto('/logs')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Scope to terminal body (header also says "日志读取失败")
    const body = page.locator(terminalBody())
    await expect(body.getByText('日志读取失败')).toBeVisible()
  })

  test('不同日志文件可通过下拉列表切换', async ({ page }) => {
    // Return multiple files
    await page.route('**/api/logs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          logs: [
            { time: '06:00:01', level: 'INFO', source: 'Core', message: 'Test log' }
          ],
          logFiles: ['agent.log', 'gateway.log', 'cron.log'],
          currentFile: 'agent.log',
          status: 'ok',
          isRealHermesConnected: true
        })
      })
    })

    await page.goto('/logs')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Check the select has 3 options — inspect text content, not visibility
    const select = page.locator('select').first()
    const options = select.locator('option')
    await expect(options).toHaveCount(3)
    await expect(options.nth(0)).toHaveText('agent.log')
    await expect(options.nth(1)).toHaveText('gateway.log')
    await expect(options.nth(2)).toHaveText('cron.log')
  })
})
