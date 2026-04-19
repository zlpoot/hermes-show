<template>
  <div>
    <h1>仪表盘</h1>
    
    <p>仪表盘是 Hermes Show 的首页，提供系统整体状态的可视化概览。</p>
    
    <h2>功能模块</h2>
    
    <h3>1. 系统状态卡片</h3>
    <p>显示关键系统指标：</p>
    <ul>
      <li><strong>运行状态</strong>: Hermes Agent 是否正常运行</li>
      <li><strong>活跃会话</strong>: 当前进行中的对话数量</li>
      <li><strong>今日消息</strong>: 今日处理的消息总数</li>
      <li><strong>Token 消耗</strong>: 今日消耗的 Token 数量</li>
    </ul>
    
    <h3>2. Token 消耗趋势图</h3>
    <p>折线图展示近 7 天的 Token 消耗趋势，帮助分析使用模式。</p>
    
    <h3>3. 活跃任务列表</h3>
    <p>显示当前正在执行的任务：</p>
    <ul>
      <li>任务名称和类型</li>
      <li>开始时间</li>
      <li>当前状态</li>
      <li>进度百分比（如适用）</li>
    </ul>
    
    <h3>4. 最近会话</h3>
    <p>快速访问最近的对话记录：</p>
    <ul>
      <li>会话标题</li>
      <li>消息数量</li>
      <li>最后活动时间</li>
      <li>点击可跳转到详情页</li>
    </ul>
    
    <h2>使用方式</h2>
    
    <pre><code>访问路径: / 或 /dashboard

操作:
1. 查看系统状态卡片了解整体情况
2. 通过趋势图分析使用模式
3. 点击活跃任务查看详情
4. 点击最近会话快速进入对话
</code></pre>
    
    <h2>数据刷新</h2>
    
    <p>仪表盘数据每 30 秒自动刷新一次，也可点击右上角刷新按钮手动刷新。</p>
    
    <div class="tip">
      <strong>提示</strong>: 如果状态显示异常，请检查 Hermes Agent 服务是否正常运行。
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'docs'
})

useHead({
  title: '仪表盘 - Hermes Show 文档'
})
</script>

<style scoped>
.tip {
  background: rgba(59, 130, 246, 0.1);
  border-left: 4px solid #3b82f6;
  padding: 1rem;
  border-radius: 0 8px 8px 0;
  margin-top: 2rem;
}

.tip strong {
  color: #3b82f6;
}
</style>
