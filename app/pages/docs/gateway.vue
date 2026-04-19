<template>
  <div>
    <h1>网关状态</h1>
    
    <p>网关状态模块展示 Hermes Agent 消息网关的运行状态和连接信息。</p>
    
    <h2>功能概览</h2>
    
    <h3>1. 运行状态</h3>
    <p>显示网关服务的整体状态：</p>
    <ul>
      <li><strong>状态指示器</strong>: 运行中/已停止/异常</li>
      <li><strong>运行时长</strong>: 服务启动后的运行时间</li>
      <li><strong>服务版本</strong>: 当前运行的版本号</li>
      <li><strong>资源占用</strong>: CPU、内存使用情况</li>
    </ul>
    
    <h3>2. 平台连接</h3>
    <p>展示各消息平台的连接状态：</p>
    
    <table>
      <thead>
        <tr>
          <th>平台</th>
          <th>状态</th>
          <th>账户</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>微信</td>
          <td><span class="status connected">已连接</span></td>
          <td>账户 ID</td>
        </tr>
        <tr>
          <td>Discord</td>
          <td><span class="status connected">已连接</span></td>
          <td>Bot#0000</td>
        </tr>
        <tr>
          <td>Telegram</td>
          <td><span class="status disconnected">未连接</span></td>
          <td>-</td>
        </tr>
        <tr>
          <td>Slack</td>
          <td><span class="status disconnected">未连接</span></td>
          <td>-</td>
        </tr>
      </tbody>
    </table>
    
    <h3>3. 授权用户</h3>
    <p>显示已授权可以使用 Agent 的用户列表：</p>
    <ul>
      <li>用户 ID / 用户名</li>
      <li>授权时间</li>
      <li>最后活动时间</li>
      <li>消息统计</li>
    </ul>
    
    <h3>4. 消息统计</h3>
    <ul>
      <li>今日收发消息数量</li>
      <li>消息成功率</li>
      <li>平均响应时间</li>
      <li>错误统计</li>
    </ul>
    
    <h2>使用方式</h2>
    
    <pre><code>访问路径: /gateway

查看状态:
1. 查看网关整体运行状态
2. 检查各平台连接情况
3. 查看授权用户列表
4. 查看消息统计信息

管理操作:
- 启动/停止网关服务
- 重连特定平台
- 添加/移除授权用户
- 查看平台详细配置
</code></pre>
    
    <h2>配置说明</h2>
    
    <h3>环境变量</h3>
    <pre><code class="language-bash"># 网关基础配置
GATEWAY_ENABLED=true
GATEWAY_ALLOW_ALL_USERS=false

# 授权用户列表
WEIXIN_ALLOWED_USERS=user1,user2

# 配对策略
WEIXIN_DM_POLICY=open  # open/pairing
</code></pre>
    
    <h3>配对模式</h3>
    <ul>
      <li><strong>open</strong>: 所有人都可以与 Agent 对话</li>
      <li><strong>pairing</strong>: 需要管理员在终端批准用户</li>
    </ul>
    
    <h2>故障排查</h2>
    
    <table>
      <thead>
        <tr>
          <th>问题</th>
          <th>可能原因</th>
          <th>解决方案</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>状态显示已停止</td>
          <td>服务未启动</td>
          <td>检查 systemd 服务状态</td>
        </tr>
        <tr>
          <td>平台连接失败</td>
          <td>网络/凭证问题</td>
          <td>检查网络和 API 密钥</td>
        </tr>
        <tr>
          <td>消息无响应</td>
          <td>用户未授权</td>
          <td>检查授权用户列表</td>
        </tr>
        <tr>
          <td>频繁断线</td>
          <td>网络不稳定</td>
          <td>检查网络连接质量</td>
        </tr>
      </tbody>
    </table>
    
    <div class="tip">
      <strong>提示</strong>: 当网关状态异常时，可以先尝试重启服务，如果问题持续请查看系统日志获取详细错误信息。
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'docs'
})

useHead({
  title: '网关状态 - Hermes Show 文档'
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

.status {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status.connected {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status.disconnected {
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
