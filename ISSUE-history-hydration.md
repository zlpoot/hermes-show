# GitHub Issue: History 页面 Hydration Mismatch 错误

**标题**: Bug: History 页面存在 Vue Hydration Mismatch 错误

**标签**: bug, vue, ssr

---

## 问题描述

访问 `/history` 页面时，浏览器控制台出现多处 Vue Hydration Mismatch 警告和错误：

```
[Vue warn]: Hydration node mismatch:
- rendered on server: node (element)
- expected on client: label (element)

[Vue warn]: Hydration text content mismatch:
- rendered on server: "选择一个会话"
- expected on client: "Untitled"

Hydration completed but contains mismatches.
```

## 复现步骤

1. 启动开发服务器 `pnpm dev`
2. 访问 http://localhost:3000/history
3. 打开浏览器开发者工具 Console
4. 观察到多处 Hydration 警告

## 问题原因

在 `app/pages/history.vue` 第 198 行：

```javascript
const activeSession = ref((route.query.id as string) || sessions.value[0]?.id || '')
```

这是 SSR hydration mismatch 的典型原因：
- **服务端渲染**时，`sessions.value` 为空数组（`useFetch` 的数据还未返回）
- **客户端渲染**时，`sessions.value` 已包含数据（第一个会话的 id）
- 导致 `currentSession?.title || '选择一个会话'` 在服务端和客户端渲染出不同的内容

## 解决方案

使用 `<ClientOnly>` 组件包裹会话详情区域，或者使用 `useState` + `onMounted` 模式确保客户端和服务器渲染一致：

```vue
<ClientOnly>
  <h2 class="font-semibold">{{ currentSession?.title || '选择一个会话' }}</h2>
</ClientOnly>
```

或者在 `<script setup>` 中：

```typescript
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})

const displayTitle = computed(() => {
  if (!isMounted.value) return '选择一个会话'
  return currentSession.value?.title || '选择一个会话'
})
```

## 环境

- 浏览器: Chrome/Firefox
- 页面: /history
- Nuxt.js: 3.21.2
- Vue: 3.5.32

## 影响程度

- **中等** - 功能正常，但控制台有错误警告，影响用户体验和 SEO

---

## 测试报告

**测试时间**: 2026-04-20
**测试版本**: v0.8.0 (v2026.4.8)
**测试页面**: 17 个页面全部通过功能测试

### 测试结果汇总

| 页面 | 状态 | 备注 |
|------|------|------|
| `/` (首页) | ✅ 正常 | 无控制台错误 |
| `/config` | ✅ 正常 | 配置中心 |
| `/history` | ⚠️ 有警告 | **Hydration mismatch 错误** |
| `/skills` | ✅ 正常 | Skills 管理 |
| `/cron` | ✅ 正常 | 定时任务 |
| `/logs` | ✅ 正常 | 系统日志 |
| `/gateway` | ✅ 正常 | 网关状态（显示离线） |
| `/notifications` | ✅ 正常 | 通知设置 |
| `/mcp` | ✅ 正常 | MCP 服务器管理 |
| `/users` | ✅ 正常 | 用户授权（2个已授权用户） |
| `/backup` | ✅ 正常 | 备份管理（数据库 6.19 MB） |
| `/health` | ✅ 正常 | 系统状态 |
| `/budget` | ✅ 正常 | 预算管理（$14.94/$100.00） |
| `/cost` | ✅ 正常 | 成本统计 |
| `/providers` | ✅ 正常 | 提供商管理 |
| `/tasks` | ✅ 正常 | 任务队列 |
| `/docs` | ✅ 正常 | 文档页面 |

### 系统状态

- 平台: Linux x64 (WSL)
- 内存: 21.34 GB / 23.39 GB (9%)
- 磁盘: 23G / 1007G (3%)
- Gateway: 离线

### 发现的问题

1. **History 页面 Hydration Mismatch** (中等优先级)
   - 位置: `/history` 页面
   - 原因: SSR 和客户端渲染数据不一致
   - 影响: 控制台警告，不影响功能
