<template>
  <div>
    <h1>任务队列</h1>
    
    <p class="lead">
      任务队列页面用于管理和监控异步任务的执行，支持优先级队列和任务状态追踪。
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
          <td>任务创建</td>
          <td>创建新的异步任务</td>
        </tr>
        <tr>
          <td>状态筛选</td>
          <td>按状态过滤任务列表</td>
        </tr>
        <tr>
          <td>优先级设置</td>
          <td>P1-P4 四级优先级</td>
        </tr>
        <tr>
          <td>任务详情</td>
          <td>查看执行日志和结果</td>
        </tr>
        <tr>
          <td>重试/取消</td>
          <td>对失败任务进行操作</td>
        </tr>
      </tbody>
    </table>
    
    <h2>任务状态</h2>
    
    <table>
      <thead>
        <tr>
          <th>状态</th>
          <th>颜色</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>待处理</td>
          <td>黄色</td>
          <td>任务已创建，等待执行</td>
        </tr>
        <tr>
          <td>执行中</td>
          <td>蓝色</td>
          <td>任务正在执行</td>
        </tr>
        <tr>
          <td>已完成</td>
          <td>绿色</td>
          <td>任务成功完成</td>
        </tr>
        <tr>
          <td>失败</td>
          <td>红色</td>
          <td>任务执行失败</td>
        </tr>
        <tr>
          <td>已取消</td>
          <td>灰色</td>
          <td>任务被取消</td>
        </tr>
      </tbody>
    </table>
    
    <h2>统计卡片</h2>
    
    <p>页面顶部显示任务统计：</p>
    
    <ul>
      <li><strong>待处理</strong> — 等待执行的任务数</li>
      <li><strong>执行中</strong> — 正在执行的任务数</li>
      <li><strong>已完成</strong> — 成功完成的任务数</li>
      <li><strong>失败</strong> — 执行失败的任务数</li>
      <li><strong>总计</strong> — 所有任务总数</li>
    </ul>
    
    <h2>当前执行任务</h2>
    
    <p>如果有任务正在执行，会显示当前任务的详细信息：</p>
    
    <ul>
      <li>任务 ID 和标题</li>
      <li>开始时间</li>
      <li>已执行时长</li>
    </ul>
    
    <h2>优先级</h2>
    
    <table>
      <thead>
        <tr>
          <th>优先级</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>P1 - 最高</td>
          <td>紧急任务，优先执行</td>
        </tr>
        <tr>
          <td>P2 - 高</td>
          <td>重要任务</td>
        </tr>
        <tr>
          <td>P3 - 中</td>
          <td>普通任务</td>
        </tr>
        <tr>
          <td>P4 - 低</td>
          <td>低优先级任务</td>
        </tr>
      </tbody>
    </table>
    
    <h2>筛选功能</h2>
    
    <p>支持按以下条件筛选任务：</p>
    
    <ul>
      <li><strong>状态</strong> — 全部/待处理/执行中/已完成/失败/已取消</li>
      <li><strong>优先级</strong> — 全部/P1/P2/P3/P4</li>
      <li><strong>关键词</strong> — 搜索任务标题</li>
    </ul>
    
    <h2>任务操作</h2>
    
    <h3>新建任务</h3>
    <ol>
      <li>点击右上角「新建任务」按钮</li>
      <li>填写任务标题和提示词</li>
      <li>选择优先级</li>
      <li>点击创建</li>
    </ol>
    
    <h3>查看详情</h3>
    <p>点击任务行可展开详情面板，查看：</p>
    <ul>
      <li>任务执行日志</li>
      <li>执行结果</li>
      <li>错误信息（如果失败）</li>
    </ul>
    
    <h3>重试任务</h3>
    <p>对于失败的任务，可以点击「重试」按钮重新执行。</p>
    
    <h3>取消任务</h3>
    <p>对于待处理的任务，可以点击「取消」按钮取消执行。</p>
    
    <h2>API 端点</h2>
    
    <pre><code class="language-http">GET /api/tasks</code></pre>
    
    <p>返回任务队列数据。</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'docs'
})

useHead({
  title: '任务队列 - Hermes Show 文档'
})
</script>

<style scoped>
.lead {
  font-size: 1.25rem;
  color: var(--muted-color, #94a3b8);
  margin-bottom: 2rem;
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
