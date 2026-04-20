<template>
  <div>
    <h1>提供商性能</h1>
    
    <p class="lead">
      提供商性能页面监控各 API 提供商的调用情况和性能指标，帮助你选择最优的模型配置。
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
          <td>性能监控</td>
          <td>实时监控 API 调用性能</td>
        </tr>
        <tr>
          <td>成功率统计</td>
          <td>各提供商的成功/失败调用比例</td>
        </tr>
        <tr>
          <td>延迟分析</td>
          <td>平均响应时间、P95/P99 延迟</td>
        </tr>
        <tr>
          <td>调用统计</td>
          <td>调用次数、活跃模型数</td>
        </tr>
      </tbody>
    </table>
    
    <h2>统计卡片</h2>
    
    <p>页面顶部显示关键指标：</p>
    
    <table>
      <thead>
        <tr>
          <th>指标</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>平均响应时间</td>
          <td>所有 API 调用的平均延迟（毫秒）</td>
        </tr>
        <tr>
          <td>成功率</td>
          <td>成功调用占总调用的百分比</td>
        </tr>
        <tr>
          <td>总调用次数</td>
          <td>累计 API 调用次数</td>
        </tr>
        <tr>
          <td>活跃提供商</td>
          <td>当前使用的提供商数量</td>
        </tr>
      </tbody>
    </table>
    
    <h2>提供商性能表格</h2>
    
    <p>表格显示各提供商的详细性能数据：</p>
    
    <table>
      <thead>
        <tr>
          <th>列名</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>提供商</td>
          <td>API 提供商名称</td>
        </tr>
        <tr>
          <td>模型</td>
          <td>使用的模型名称</td>
        </tr>
        <tr>
          <td>调用</td>
          <td>该提供商的调用次数</td>
        </tr>
        <tr>
          <td>成功率</td>
          <td>调用成功的百分比</td>
        </tr>
        <tr>
          <td>平均响应</td>
          <td>平均响应时间（毫秒）</td>
        </tr>
        <tr>
          <td>P95</td>
          <td>95% 的请求响应时间低于此值</td>
        </tr>
        <tr>
          <td>状态</td>
          <td>当前连接状态</td>
        </tr>
      </tbody>
    </table>
    
    <h2>状态颜色</h2>
    
    <h3>成功率颜色</h3>
    <ul>
      <li><strong>绿色</strong> — 成功率 ≥ 95%</li>
      <li><strong>黄色</strong> — 成功率 80% - 95%</li>
      <li><strong>红色</strong> — 成功率 &lt; 80%</li>
    </ul>
    
    <h3>状态指示灯</h3>
    <ul>
      <li><strong>绿色圆点</strong> — 提供商正常运行</li>
      <li><strong>黄色圆点</strong> — 提供商响应较慢</li>
      <li><strong>红色圆点</strong> — 提供商异常</li>
    </ul>
    
    <h2>查看详情</h2>
    
    <p>点击表格行可展开查看详细信息：</p>
    
    <ul>
      <li>近期调用历史</li>
      <li>错误日志</li>
      <li>性能趋势图表</li>
    </ul>
    
    <h2>性能优化建议</h2>
    
    <div class="tip">
      <strong>提示</strong>: 如果某个提供商成功率较低或延迟较高，建议：
      <ul>
        <li>检查 API Key 是否有效</li>
        <li>检查网络连接状态</li>
        <li>考虑切换到其他提供商</li>
        <li>检查是否有速率限制</li>
      </ul>
    </div>
    
    <h2>API 端点</h2>
    
    <pre><code class="language-http">GET /api/providers</code></pre>
    
    <p>返回提供商性能数据。</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'docs'
})

useHead({
  title: '提供商性能 - Hermes Show 文档'
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

.tip ul {
  margin-top: 0.5rem;
  padding-left: 1.5rem;
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
