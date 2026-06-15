import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const hermesPath = process.env.NUXT_HERMES_PATH || './tests/fixtures/hermes-history'
const webServerCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND || 'pnpm dev'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 60000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: `NUXT_HERMES_PATH=${hermesPath} ${webServerCommand}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
})
