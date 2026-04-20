# 测试指南

本文档说明如何运行测试、编写新测试以及查看测试覆盖率报告。

## 测试框架

项目使用以下测试框架：

- **Vitest** - 单元测试和组件测试
- **Playwright** - E2E 端到端测试

## 快速开始

### 运行所有测试

```bash
pnpm test
```

### 运行单元测试

```bash
# 运行一次
pnpm test:unit

# 监视模式
pnpm test
```

### 运行 E2E 测试

```bash
# 运行 E2E 测试
pnpm test:e2e

# 使用 UI 模式调试
pnpm test:e2e:ui
```

### 生成覆盖率报告

```bash
pnpm test:coverage
```

覆盖率报告将生成在 `./coverage` 目录下，包含：
- `index.html` - HTML 可视化报告
- `lcov.info` - LCOV 格式（用于 CI 集成）
- `coverage-final.json` - JSON 格式

## 目录结构

```
tests/
├── setup.ts          # 测试测试初始化配置
├── unit/             # 单元测试
│   └── *.test.ts
├── components/       # 组件测试
│   └── *.test.ts
├── e2e/              # E2E 测试
│   └── *.spec.ts
└── api/              # API 路由测试
    └── *.test.ts
```

## 编写单元测试

### 基本示例

```typescript
import { describe, it, expect } from 'vitest'

describe('MyComponent', () => {
  it('should work correctly', () => {
    expect(1 + 1).toBe(2)
  })
})
```

### 测试 Vue 组件

```typescript
import { mount } from '@vue/test-utils'
import MyComponent from '~/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent)
    expect(wrapper.text()).toContain('Hello')
  })
})
```

### 测试 Composables

```typescript
import { describe, it, expect } from 'vitest'
import { useMyComposable } from '~/composables/useMyComposable'

describe('useMyComposable', () => {
  it('returns expected values', () => {
    const { data, loading } = useMyComposable()
    expect(data.value).toBeDefined()
  })
})
```

## 编写 E2E 测试

### 基本示例

```typescript
import { test, expect } from '@playwright/test'

test.describe('My Page', () => {
  test('should load correctly', async ({ page }) => {
    await page.goto('/my-page')
    await expect(page).toHaveTitle(/My Page/)
  })
})
```

### 测试导航

```typescript
test('navigation works', async ({ page }) => {
  await page.goto('/')
  await page.click('text=配置中心')
  await expect(page).toHaveURL(/.*config/)
})
```

### 测试表单

```typescript
test('form submission', async ({ page }) => {
  await page.goto('/form')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.click('button[type="submit"]')
  await expect(page.locator('.success-message')).toBeVisible()
})
```

## 覆盖率阈值

项目设置了以下覆盖率阈值（可在 `vitest.config.ts` 中调整）：

| 指标 | 最低阈值 |
|------|---------|
| Lines | 50% |
| Functions | 50% |
| Branches | 50% |
| Statements | 50% |

如果覆盖率低于阈值，测试将失败。

## CI/CD 集成

测试在 CI 环境中自动运行：

- **Pull Request** - 运行单元测试和 E2E 测试
- **Main Branch** - 运行测试并上传覆盖率报告

## 调试技巧

### Vitest

```bash
# 只运行特定测试文件
pnpm vitest run tests/unit/demo.test.ts

# 更新快照
pnpm vitest -u
```

### Playwright

```bash
# 使用 UI 模式调试
pnpm test:e2e:ui

# 只运行特定测试
pnpm playwright test tests/e2e/demo.spec.ts

# 显示浏览器窗口
HEADLESS=false pnpm playwright test
```

## 最佳实践

1. **单元测试** - 测试独立的函数和组件逻辑
2. **组件测试** - 测试组件的渲染和交互
3. **E2E 测试** - 测试完整的用户流程
4. **测试命名** - 使用描述性的测试名称
5. **测试隔离** - 每个测试应该独立，不依赖其他测试的状态
