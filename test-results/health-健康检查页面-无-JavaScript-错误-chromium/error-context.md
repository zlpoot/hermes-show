# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: health.spec.ts >> 健康检查页面 >> 无 JavaScript 错误
- Location: tests/e2e/health.spec.ts:20:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/health", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - complementary [ref=e5]:
      - generic [ref=e6]:
        - img [ref=e8]
        - heading "Hermes Agent" [level=1] [ref=e11]
      - navigation [ref=e12]:
        - link "仪表盘" [ref=e13] [cursor=pointer]:
          - /url: /
          - img [ref=e14]
          - generic [ref=e19]: 仪表盘
        - link "配置中心" [ref=e20] [cursor=pointer]:
          - /url: /config
          - img [ref=e21]
          - generic [ref=e22]: 配置中心
        - link "成本统计" [ref=e23] [cursor=pointer]:
          - /url: /cost
          - img [ref=e24]
          - generic [ref=e26]: 成本统计
        - link "提供商监控" [ref=e27] [cursor=pointer]:
          - /url: /providers
          - img [ref=e28]
          - generic [ref=e31]: 提供商监控
        - link "健康检查" [ref=e32] [cursor=pointer]:
          - /url: /health
          - img [ref=e33]
          - generic [ref=e35]: 健康检查
        - link "对话历史" [ref=e36] [cursor=pointer]:
          - /url: /history
          - img [ref=e37]
          - generic [ref=e41]: 对话历史
        - link "任务队列" [ref=e42] [cursor=pointer]:
          - /url: /tasks
          - img [ref=e43]
          - generic [ref=e46]: 任务队列
        - link "Skills 管理" [ref=e47] [cursor=pointer]:
          - /url: /skills
          - img [ref=e48]
          - generic [ref=e50]: Skills 管理
        - link "定时任务" [ref=e51] [cursor=pointer]:
          - /url: /cron
          - img [ref=e52]
          - generic [ref=e55]: 定时任务
        - link "MCP 服务器" [ref=e56] [cursor=pointer]:
          - /url: /mcp
          - img [ref=e57]
          - generic [ref=e60]: MCP 服务器
        - link "用户授权" [ref=e61] [cursor=pointer]:
          - /url: /users
          - img [ref=e62]
          - generic [ref=e67]: 用户授权
        - link "备份管理" [ref=e68] [cursor=pointer]:
          - /url: /backup
          - img [ref=e69]
          - generic [ref=e71]: 备份管理
        - link "网关状态" [ref=e72] [cursor=pointer]:
          - /url: /gateway
          - img [ref=e73]
          - generic [ref=e79]: 网关状态
        - link "通知设置" [ref=e80] [cursor=pointer]:
          - /url: /notifications
          - img [ref=e81]
          - generic [ref=e84]: 通知设置
        - link "系统日志" [ref=e85] [cursor=pointer]:
          - /url: /logs
          - img [ref=e86]
          - generic [ref=e89]: 系统日志
        - link "文档" [ref=e91] [cursor=pointer]:
          - /url: /docs
          - img [ref=e92]
          - generic [ref=e94]: 文档
          - img [ref=e95]
      - generic [ref=e100]:
        - generic [ref=e103]: Gateway 运行中
        - button [ref=e104] [cursor=pointer]:
          - img [ref=e105]
    - main [ref=e108]:
      - generic [ref=e109]:
        - heading "健康检查" [level=2] [ref=e110]
        - generic [ref=e111]:
          - generic [ref=e112]:
            - img [ref=e113]
            - generic [ref=e116]: 0.8.0 (v2026.4.8)
          - img [ref=e118]
      - generic [ref=e122]:
        - generic [ref=e124]:
          - generic [ref=e125]:
            - img [ref=e127]
            - generic [ref=e129]:
              - 'heading "系统状态: 警告" [level=2] [ref=e130]'
              - paragraph [ref=e131]: 2026/4/22 09:20:10
          - button "刷新" [ref=e132] [cursor=pointer]:
            - img [ref=e133]
            - text: 刷新
        - generic [ref=e138]:
          - generic [ref=e139]:
            - generic [ref=e140]:
              - generic [ref=e141]: memory
              - img [ref=e142]
            - paragraph [ref=e145]: 内存使用正常
          - generic [ref=e146]:
            - generic [ref=e147]:
              - generic [ref=e148]: disk
              - img [ref=e149]
            - paragraph [ref=e152]: 磁盘空间充足
          - generic [ref=e153]:
            - generic [ref=e154]:
              - generic [ref=e155]: hermes
              - img [ref=e156]
            - paragraph [ref=e159]: Hermes 目录正常
          - generic [ref=e160]:
            - generic [ref=e161]:
              - generic [ref=e162]: gateway
              - img [ref=e163]
            - paragraph [ref=e165]: Gateway 未运行
        - generic [ref=e166]:
          - generic [ref=e167]:
            - heading "系统信息" [level=3] [ref=e168]:
              - img [ref=e169]
              - text: 系统信息
            - generic [ref=e172]:
              - generic [ref=e173]:
                - generic [ref=e174]: 平台
                - generic [ref=e175]: linux (x64)
              - generic [ref=e176]:
                - generic [ref=e177]: 主机名
                - generic [ref=e178]: DESKTOP-5IP6BCN
              - generic [ref=e179]:
                - generic [ref=e180]: 运行时间
                - generic [ref=e181]: 1d 13h 4m
              - generic [ref=e182]:
                - generic [ref=e183]: CPU
                - generic [ref=e184]: 20 核 - 13th
              - generic [ref=e185]:
                - generic [ref=e186]: 负载
                - generic [ref=e187]: 1.44 / 0.86 / 0.67
          - generic [ref=e188]:
            - heading "存储与内存" [level=3] [ref=e189]:
              - img [ref=e190]
              - text: 存储与内存
            - generic [ref=e192]:
              - generic [ref=e193]:
                - generic [ref=e194]: 内存
                - generic [ref=e195]: 19% 已使用
              - generic [ref=e198]:
                - generic [ref=e199]: "已用: 18.96 GB"
                - generic [ref=e200]: "总计: 23.39 GB"
            - generic [ref=e201]:
              - generic [ref=e202]:
                - generic [ref=e203]: 磁盘
                - generic [ref=e204]: 3% 已使用
              - generic [ref=e207]:
                - generic [ref=e208]: "已用: 23G"
                - generic [ref=e209]: "可用: 933G / 1007G"
        - generic [ref=e210]:
          - generic [ref=e211]:
            - heading "Hermes 目录" [level=3] [ref=e212]:
              - img [ref=e213]
              - text: Hermes 目录
            - generic [ref=e215]:
              - generic [ref=e216]: /home/zlpoot/.hermes
              - generic [ref=e217]: 存在
          - generic [ref=e218]:
            - generic [ref=e219]:
              - paragraph [ref=e220]: 2.22 GB
              - paragraph [ref=e221]: 总大小
            - generic [ref=e222]:
              - paragraph [ref=e223]: "59"
              - paragraph [ref=e224]: 会话记录
            - generic [ref=e225]:
              - paragraph [ref=e226]: "32"
              - paragraph [ref=e227]: Skills
            - generic [ref=e228]:
              - paragraph [ref=e229]: 23.88 MB
              - paragraph [ref=e230]: 数据库
            - generic [ref=e231]:
              - paragraph [ref=e232]: 2.32 MB
              - paragraph [ref=e233]: 日志
          - generic [ref=e234]:
            - heading "存储分布" [level=4] [ref=e235]
            - generic [ref=e236]:
              - generic [ref=e237]:
                - img [ref=e238]
                - generic [ref=e240]: 会话记录
                - generic [ref=e241]: sessions/
              - generic [ref=e242]: 83.13 MB
            - generic [ref=e243]:
              - generic [ref=e244]:
                - img [ref=e245]
                - generic [ref=e247]: Skills
                - generic [ref=e248]: skills/
              - generic [ref=e249]: 7.94 MB
            - generic [ref=e250]:
              - generic [ref=e251]:
                - img [ref=e252]
                - generic [ref=e254]: 数据库
                - generic [ref=e255]: state.db
              - generic [ref=e256]: 23.88 MB
            - generic [ref=e257]:
              - generic [ref=e258]:
                - img [ref=e259]
                - generic [ref=e261]: 日志文件
                - generic [ref=e262]: logs/
              - generic [ref=e263]: 2.32 MB
            - generic [ref=e264]:
              - generic [ref=e265]:
                - img [ref=e266]
                - generic [ref=e268]: 缓存
                - generic [ref=e269]: cache/
              - generic [ref=e270]: 1.38 MB
            - generic [ref=e271]:
              - generic [ref=e272]:
                - img [ref=e273]
                - generic [ref=e275]: 检查点
                - generic [ref=e276]: checkpoints/
              - generic [ref=e277]: 692.14 MB
            - generic [ref=e278]:
              - generic [ref=e279]:
                - img [ref=e280]
                - generic [ref=e282]: 记忆存储
                - generic [ref=e283]: memories/
              - generic [ref=e284]: 4.27 KB
        - generic [ref=e285]:
          - heading "Gateway 状态" [level=3] [ref=e286]:
            - img [ref=e287]
            - text: Gateway 状态
          - generic [ref=e293]:
            - paragraph [ref=e298]: 未运行
            - generic [ref=e299]:
              - img [ref=e300]
              - generic [ref=e304]: 离线
  - generic:
    - img
  - generic [ref=e305]:
    - button "Toggle Nuxt DevTools" [ref=e306] [cursor=pointer]:
      - img [ref=e307]
    - generic "Page load time" [ref=e310]:
      - generic [ref=e311]: "125"
      - generic [ref=e312]: ms
    - button "Toggle Component Inspector" [ref=e314] [cursor=pointer]:
      - img [ref=e315]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('健康检查页面', () => {
  4  |   test.beforeEach(async ({ page }) => {
> 5  |     await page.goto('/health')
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  6  |     await page.waitForLoadState('networkidle')
  7  |   })
  8  |   
  9  |   test('页面能正常加载', async ({ page }) => {
  10 |     const healthLink = page.getByRole('link', { name: '健康检查' })
  11 |     await expect(healthLink).toBeVisible()
  12 |   })
  13 |   
  14 |   test('系统状态显示', async ({ page }) => {
  15 |     await page.waitForTimeout(500)
  16 |     const content = page.locator('body')
  17 |     await expect(content).toBeVisible()
  18 |   })
  19 |   
  20 |   test('无 JavaScript 错误', async ({ page }) => {
  21 |     const errors: string[] = []
  22 |     
  23 |     page.on('pageerror', error => {
  24 |       errors.push(error.message)
  25 |     })
  26 |     
  27 |     // beforeEach 已经导航到 /health，无需重复导航
  28 |     await page.waitForTimeout(1000)
  29 |     
  30 |     expect(errors).toHaveLength(0)
  31 |   })
  32 | })
  33 | 
```