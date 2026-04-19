<template>
  <div>
    <h1>系统日志</h1>
    
    <p>系统日志模块提供对 Hermes Agent 运行日志的实时查看和历史查询功能。</p>
    
    <h2>功能模块</h2>
    
    <h3>1. 日志文件选择</h3>
    <p>支持查看多个日志文件：</p>
    
    <table>
      <thead>
        <tr>
          <th>日志文件</th>
          <th>内容</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>hermes.log</code></td>
          <td>主程序运行日志</td>
        </tr>
        <tr>
          <td><code>gateway.log</code></td>
          <td>网关服务日志</td>
        </tr>
        <tr>
          <td><code>error.log</code></td>
          <td>错误日志</td>
        </tr>
        <tr>
          <td><code>access.log</code></td>
          <td>访问日志</td>
        </tr>
      </tbody>
    </table>
    
    <h3>2. 日志级别过滤</h3>
    <p>按日志级别筛选：</p>
    <ul>
      <li><span class="level debug">DEBUG</span> - 调试信息</li>
      <li><span class="level info">INFO</span> - 一般信息</li>
      <li><span class="level warn">WARNING</span> - 警告信息</li>
      <li><span class="level error">ERROR</span> - 错误信息</li>
    </ul>
    
    <h3>3. 关键词搜索</h3>
    <p>支持在日志内容中搜索关键词：</p>
    <ul>
      <li>实时搜索，输入即显示结果</li>
      <li>支持正则表达式</li>
      <li>高亮匹配结果</li>
    </ul>
    
    <h3>4. 实时监控</h3>
    <p>类似 <code>tail -f</code> 的实时日志流：</p>
    <ul>
      <li>自动滚动到最新日志</li>
      <li>可暂停/恢复滚动</li>
      <li>支持自动刷新间隔设置</li>
    </ul>
    
    <h2>使用方式</h2>
    
    <pre><code>访问路径: /logs

基本操作:
1. 从下拉菜单选择日志文件
2. 使用级别过滤器筛选
3. 在搜索框输入关键词
4. 查看日志内容

实时监控:
1. 点击"实时监控"开关
2. 日志自动滚动显示
3. 点击"暂停"停止滚动
4. 手动滚动查看历史日志
</code></pre>
    
    <h2>日志格式</h2>
    
    <pre><code>格式: [时间戳] [级别] [模块] 消息内容

示例:
[2026-04-19 15:30:45] [INFO] [gateway] WeChat gateway connected
[2026-04-19 15:30:46] [DEBUG] [agent] Processing message from user
[2026-04-19 15:30:47] [WARN] [model] Rate limit approaching
[2026-04-19 15:30:48] [ERROR] [api] Connection timeout
</code></pre>
    
    <h2>日志存储</h2>
    
    <pre><code>日志目录: ~/.hermes/logs/

配置选项:
- 日志级别: DEBUG, INFO, WARNING, ERROR
- 日志轮转: 按大小或时间自动分割
- 保留策略: 保留天数或文件数量
</code></pre>
    
    <h2>故障排查</h2>
    
    <p>常见问题定位：</p>
    <ul>
      <li><strong>服务无法启动</strong>: 查看 error.log 中的错误信息</li>
      <li><strong>消息无响应</strong>: 查看 gateway.log 中的连接状态</li>
      <li><strong>模型调用失败</strong>: 查看包含 "model" 或 "api" 的日志</li>
      <li><strong>权限问题</strong>: 搜索 "permission" 或 "denied"</li>
    </ul>
    
    <div class="tip">
      <strong>提示</strong>: 在排查问题时，建议先切换到 WARNING 或 ERROR 级别查看关键信息，再根据需要开启 DEBUG 级别获取详细日志。
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'docs'
})

useHead({
  title: '系统日志 - Hermes Show 文档'
})
</script>

<style scoped>
table code {
  background: var(--code-bg, #1e293b);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.875em;
  color: var(--code-color, #f472b6);
}

.level {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: monospace;
}

.level.debug {
  background: rgba(148, 163, 184, 0.2);
  color: #94a3b8;
}

.level.info {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.level.warn {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
}

.level.error {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

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
