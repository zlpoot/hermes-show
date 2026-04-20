import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    exclude: ['tests/e2e/**', 'node_modules'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      include: ['composables/**', 'utils/**', 'server/api/**'],
      exclude: ['node_modules', 'tests', '**/*.d.ts', '**/*.config.*'],
      // 覆盖率阈值配置
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50
      },
      // 水印配置（HTML 报告颜色阈值）
      watermarks: {
        lines: [50, 80],
        functions: [50, 80],
        branches: [50, 80],
        statements: [50, 80]
      }
    }
  }
})
