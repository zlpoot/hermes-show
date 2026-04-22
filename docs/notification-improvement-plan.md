# 通知设置页面完善计划

## 问题分析

### 1. 统计功能不完善
- `todayCount`: 从数据库messages表统计，而非通知发送记录
- `errorAlerts`: 始终为0
- `yesterdayChange`: 始终为0
- `todaySent`: 渠道发送数始终为0

### 2. 通知历史混乱
- 当前从日志文件读取，而非`notification_history.json`
- 历史记录格式不完整

### 3. 规则显示不清晰
- 未直观展示"事件类型→目标频道"的路由关系
- 规则列表显示混乱

### 4. 事件类型统计缺失
- `triggerCount`始终为0

---

## 完善方案

### Phase 1: 后端API优化

#### 1.1 完善统计API (`notifications.get.ts`)
- 从`notification_history.json`统计今日通知数
- 统计未处理的错误告警数
- 计算较昨日变化百分比
- 统计每个渠道的今日发送数

#### 1.2 修复通知历史读取
- 使用`notification_history.json`而非日志文件
- 支持分页查询
- 支持按渠道、事件类型、时间范围筛选

#### 1.3 完善事件类型统计
- 从历史记录统计每种事件类型的触发次数
- 统计每种事件类型的成功/失败率

### Phase 2: 前端UI优化

#### 2.1 统计卡片
- 今日通知：显示实际发送数，较昨日变化
- 错误告警：显示未处理的失败通知数
- 活跃规则：显示启用的路由规则数
- 通知渠道：显示健康的渠道数

#### 2.2 规则显示优化
- 改为表格形式，清晰展示路由关系
- 显示：事件类型 → 目标频道 → 状态
- 支持快速启用/禁用规则

#### 2.3 通知历史优化
- 增大显示区域
- 支持分页
- 显示更多详情（时间、状态、错误信息）

#### 2.4 事件类型面板
- 显示每种事件类型的触发次数
- 显示关联的频道

---

## 实现步骤

1. [x] 分析问题
2. [ ] 修改 `notifications.get.ts` - 完善统计和历史读取
3. [ ] 修改 `notifications.vue` - 优化UI显示
4. [ ] 测试验证

---

## 数据结构

### notification_history.json 格式
```json
{
  "id": "notif-xxx",
  "timestamp": 1776738701680,
  "event": "task_complete",
  "severity": "info",
  "title": "任务完成",
  "message": "...",
  "channelId": "discord-tasks",
  "channelName": "任务频道",
  "channelType": "discord",
  "status": "sent|failed",
  "error": "可选的错误信息"
}
```

### 统计计算逻辑
```typescript
// 今日通知数
const todayStart = new Date().setHours(0,0,0,0)
const todayCount = history.filter(h => h.timestamp >= todayStart).length

// 昨日通知数
const yesterdayStart = todayStart - 86400000
const yesterdayCount = history.filter(h => 
  h.timestamp >= yesterdayStart && h.timestamp < todayStart
).length

// 较昨日变化
const yesterdayChange = yesterdayCount > 0 
  ? Math.round((todayCount - yesterdayCount) / yesterdayCount * 100) 
  : 0

// 错误告警（未处理的失败通知）
const errorAlerts = history.filter(h => 
  h.status === 'failed' && h.timestamp >= todayStart
).length

// 渠道发送数
const channelSent = history.filter(h => 
  h.channelId === channelId && h.timestamp >= todayStart
).length

// 事件类型触发次数
const eventTriggerCount = history.filter(h => h.event === eventType).length
```
