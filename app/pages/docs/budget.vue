<template>
  <div>
    <h1>预算管理</h1>
    
    <p class="lead">
      预算管理页面用于设置和监控 API 使用预算，帮助你控制 AI 调用成本，避免超支。
    </p>
    
    <h2>功能概览</h2>
    
    <table>
      <thead>
        <tr>
          <th>功能</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>月度预算设置</td>
          <td>设定每月的消费上限</td>
        </tr>
        <tr>
          <td>消费进度</td>
          <td>实时显示已使用/剩余预算</td>
        </tr>
        <tr>
          <td>消费统计</td>
          <td>今日、本周、本月消费明细</td>
        </tr>
        <tr>
          <td>预估消费</td>
          <td>根据趋势预测月度消费</td>
        </tr>
        <tr>
          <td>超支警告</td>
          <td>预算不足或预计超支时提醒</td>
        </tr>
      </tbody>
    </table>
    
    <h2>预算概览</h2>
    
    <p>页面顶部显示本月预算使用情况：</p>
    
    <ul>
      <li><strong>已使用 / 月度预算</strong> — 当前已消费金额和总额度</li>
      <li><strong>进度条</strong> — 可视化显示使用比例
        <ul>
          <li>绿色：使用率 &lt; 70%</li>
          <li>黄色：使用率 70% - 90%</li>
          <li>红色：使用率 ≥ 90%</li>
        </ul>
      </li>
      <li><strong>剩余预算</strong> — 本月剩余可用额度</li>
    </ul>
    
    <h2>消费统计</h2>
    
    <h3>今日消费</h3>
    <p>显示当日的消费金额和 Token 消耗数量。</p>
    
    <h3>本周消费</h3>
    <p>显示本周累计消费和日均消费金额。</p>
    
    <h3>本月消费</h3>
    <p>显示本月累计消费和较上月的环比变化百分比。</p>
    
    <h3>预估月消费</h3>
    <p>根据当前消费速度预测本月总消费。如果预测值超过预算，会以红色高亮显示。</p>
    
    <h2>费用分析图表</h2>
    
    <h3>按提供商分布</h3>
    <p>饼图显示各 API 提供商的消费占比。</p>
    
    <h3>按模型分布</h3>
    <p>条形图显示各模型的消费金额对比。</p>
    
    <h3>消费趋势</h3>
    <p>折线图显示近期消费金额的变化趋势。</p>
    
    <h2>设置预算</h2>
    
    <ol>
      <li>点击右上角「设置预算」按钮</li>
      <li>输入月度预算金额（美元）</li>
      <li>点击保存</li>
    </ol>
    
    <div class="tip">
      <strong>提示</strong>: 预算金额以美元为单位，系统会自动按汇率换算显示人民币金额。
    </div>
    
    <h2>API 端点</h2>
    
    <pre><code class="language-http">GET /api/budget</code></pre>
    
    <p>返回预算数据和消费统计。</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'docs'
})

useHead({
  title: '预算管理 - Hermes Show 文档'
})
</script>

<style scoped>
.lead {
  font-size: 1.25rem;
  color: var(--muted-color, #94a3b8);
  margin-bottom: 2rem;
}

.tip {
  background: rgba(59, 130, 246, 0.1);
  border-left: 4px solid #3b82f6;
  padding: 1rem;
  border-radius: 0 8px 8px 0;
  margin: 1.5rem 0;
}

.tip strong {
  color: #3b82f6;
}

table {
  width: 100%;
  margin: 1rem 0;
}

pre {
  background: var(--card-bg, #1e293b);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}
</style>
