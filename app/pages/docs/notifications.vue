<template>
  <div>
    <h1>通知设置</h1>
    
    <p>通知模块允许配置 Hermes Agent 在特定事件发生时自动发送通知到多种渠道。</p>

    <h2>配置文件</h2>
    
    <p>通知相关配置位于 <code>~/.hermes/config.yaml</code>：</p>
    
    <pre><code>agent:
  # 网关超时警告时间（秒）
  # 当会话运行时间超过此阈值时发送警告通知
  gateway_timeout_warning: 900
  
  # 网关定期通知间隔（秒）
  # 启用后会定期发送运行状态通知
  gateway_notify_interval: 600

cli:
  # 后台进程通知模式
  # 控制通过 terminal(background=true, notify_on_complete=true) 
  # 启动的后台任务的通知行为
  #   off:    不发送任何通知
  #   result: 仅发送完成通知
  #   error:  仅在失败时通知
  #   all:    运行状态 + 完成通知（默认）
  background_process_notifications: all</code></pre>

    <h2>通知渠道</h2>

    <p>支持多种通知渠道，可在通知设置页面配置：</p>

    <h3>Telegram</h3>
    
    <p>通过 Telegram Bot 发送通知，需要创建 Bot 并获取配置信息。</p>
    
    <table>
      <thead>
        <tr>
          <th>参数</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>Bot Token</code></td>
          <td>从 @BotFather 获取的 Bot 令牌</td>
        </tr>
        <tr>
          <td><code>Chat ID</code></td>
          <td>目标聊天 ID（用户、群组或频道）</td>
        </tr>
      </tbody>
    </table>

    <p>获取 Chat ID 的方法：</p>
    <pre><code># 1. 给你的 Bot 发送一条消息
# 2. 访问以下 URL（替换 TOKEN）
https://api.telegram.org/bot<TOKEN>/getUpdates

# 3. 或使用 @userinfobot 获取</code></pre>

    <h3>微信</h3>
    
    <p>微信通知通过 Hermes Gateway 配置，需要在网关配置中启用。</p>
    
    <pre><code># 微信网关配置
WEIXIN_NOTIFY_ENABLED=true
WEIXIN_NOTIFY_USERS=用户ID列表</code></pre>

    <h3>Discord</h3>
    
    <p>通过 Discord Webhook 发送通知。</p>
    
    <table>
      <thead>
        <tr>
          <th>参数</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>Webhook URL</code></td>
          <td>Discord 频道的 Webhook 地址</td>
        </tr>
      </tbody>
    </table>

    <p>创建 Webhook：</p>
    <pre><code>1. 进入目标频道设置
2. 选择「整合」→「Webhooks」
3. 点击「新建 Webhook」
4. 复制 Webhook URL</code></pre>

    <h3>邮件</h3>
    
    <table>
      <thead>
        <tr>
          <th>参数</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>收件地址</code></td>
          <td>接收通知的邮箱地址</td>
        </tr>
        <tr>
          <td><code>SMTP 服务器</code></td>
          <td>SMTP 发送服务器地址</td>
        </tr>
      </tbody>
    </table>

    <h3>自定义 Webhook</h3>
    
    <p>支持向自定义 HTTP 端点发送通知。</p>
    
    <table>
      <thead>
        <tr>
          <th>参数</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>Webhook URL</code></td>
          <td>接收通知的 HTTP 端点</td>
        </tr>
        <tr>
          <td><code>Secret</code></td>
          <td>可选，用于签名验证</td>
        </tr>
      </tbody>
    </table>

    <p>Webhook 请求格式：</p>
    <pre><code>POST /webhook
Content-Type: application/json
X-Hermes-Signature: sha256=...

{
  "event": "error",
  "severity": "critical",
  "title": "API 调用失败",
  "message": "OpenAI API 返回 429 错误",
  "timestamp": "2026-04-19T15:30:45Z",
  "metadata": {}
}</code></pre>

    <h2>通知规则</h2>

    <p>规则定义了在什么条件下触发什么通知。</p>

    <h3>规则属性</h3>
    
    <table>
      <thead>
        <tr>
          <th>属性</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>名称</code></td>
          <td>规则的唯一标识名称</td>
        </tr>
        <tr>
          <td><code>事件类型</code></td>
          <td>触发通知的事件类型</td>
        </tr>
        <tr>
          <td><code>严重程度</code></td>
          <td>紧急/警告/信息</td>
        </tr>
        <tr>
          <td><code>通知渠道</code></td>
          <td>发送通知的渠道</td>
        </tr>
        <tr>
          <td><code>启用状态</code></td>
          <td>是否启用该规则</td>
        </tr>
      </tbody>
    </table>

    <h2>事件类型</h2>

    <table>
      <thead>
        <tr>
          <th>事件类型</th>
          <th>触发条件</th>
          <th>典型场景</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge error">错误告警</span></td>
          <td>API 错误、任务失败</td>
          <td>模型调用失败、工具执行错误</td>
        </tr>
        <tr>
          <td><span class="badge warning">性能警告</span></td>
          <td>高延迟、资源过限</td>
          <td>API 响应超时、Token 超额</td>
        </tr>
        <tr>
          <td><span class="badge success">任务完成</span></td>
          <td>后台任务完成</td>
          <td>Cron 任务、长时间任务</td>
        </tr>
        <tr>
          <td><span class="badge info">系统事件</span></td>
          <td>系统状态变更</td>
          <td>启动、关闭、配置变更</td>
        </tr>
        <tr>
          <td><span class="badge gateway">网关事件</span></td>
          <td>Gateway 连接变化</td>
          <td>连接断开、重连成功</td>
        </tr>
        <tr>
          <td><span class="badge cron">定时任务</span></td>
          <td>Cron 任务相关</td>
          <td>任务调度、执行结果</td>
        </tr>
      </tbody>
    </table>

    <h2>严重程度</h2>

    <table>
      <thead>
        <tr>
          <th>级别</th>
          <th>说明</th>
          <th>建议渠道</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge critical">紧急</span></td>
          <td>需要立即处理的严重问题</td>
          <td>Telegram、微信（实时通知）</td>
        </tr>
        <tr>
          <td><span class="badge warning">警告</span></td>
          <td>需要注意但非紧急的问题</td>
          <td>Discord、邮件</td>
        </tr>
        <tr>
          <td><span class="badge info">信息</span></td>
          <td>一般性状态通知</td>
          <td>邮件、Webhook</td>
        </tr>
      </tbody>
    </table>

    <h2>最佳实践</h2>

    <h3>渠道选择建议</h3>
    
    <ul>
      <li><strong>紧急告警</strong>：使用 Telegram 或微信，确保即时推送</li>
      <li><strong>日常通知</strong>：使用 Discord，便于团队协作</li>
      <li><strong>汇总报告</strong>：使用邮件，适合周期性总结</li>
      <li><strong>系统集成</strong>：使用 Webhook，对接其他系统</li>
    </ul>

    <h3>规则配置建议</h3>
    
    <ul>
      <li>根据事件严重程度选择合适的渠道</li>
      <li>避免过多低优先级通知造成干扰</li>
      <li>为不同类型的事件设置不同的规则</li>
      <li>定期检查通知历史，调整规则配置</li>
    </ul>

    <h3>告警抑制</h3>
    
    <p>为防止告警风暴，系统默认支持：</p>
    <ul>
      <li>相同事件在 5 分钟内只通知一次</li>
      <li>错误累积超过阈值时自动升级</li>
      <li>支持配置静默时间段</li>
    </ul>

    <h2>API 接口</h2>

    <h3>获取通知配置</h3>
    <pre><code>GET /api/notifications

Response:
{
  "stats": { ... },
  "channels": [ ... ],
  "rules": [ ... ],
  "eventTypes": [ ... ]
}</code></pre>

    <h3>发送测试通知</h3>
    <pre><code>POST /api/notifications/test
{
  "channelId": "ch-001",
  "message": "测试通知"
}</code></pre>

    <h2>故障排查</h2>

    <h3>通知未发送</h3>
    <ul>
      <li>检查渠道是否已启用</li>
      <li>检查规则是否匹配事件类型</li>
      <li>验证渠道配置（Token、URL 等）是否正确</li>
      <li>查看系统日志中的错误信息</li>
    </ul>

    <h3>Telegram 通知失败</h3>
    <pre><code># 验证 Bot Token
curl "https://api.telegram.org/bot<TOKEN>/getMe"

# 验证 Chat ID
curl "https://api.telegram.org/bot<TOKEN>/getChat?chat_id=<CHAT_ID>"

# 测试发送
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d "chat_id=<CHAT_ID>" \
  -d "text=Test"</code></pre>

    <h3>Discord 通知失败</h3>
    <pre><code># 测试 Webhook
curl -X POST "<WEBHOOK_URL>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test notification"}'</code></pre>

    <div class="tip">
      <strong>提示</strong>：配置通知渠道后，建议先使用「测试」功能验证配置是否正确，然后再启用相关规则。
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'docs'
})

useHead({
  title: '通知设置 - Hermes Show 文档'
})
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

th, td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #334155);
}

th {
  background: var(--table-header-bg, rgba(255, 255, 255, 0.05));
  font-weight: 600;
}

code {
  background: var(--code-bg, #1e293b);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.875em;
  color: var(--code-color, #f472b6);
}

pre {
  background: var(--code-bg, #1e293b);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1rem 0;
}

pre code {
  padding: 0;
  background: none;
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.error {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.badge.warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.badge.success {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.badge.info {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.badge.gateway {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.badge.cron {
  background: rgba(6, 182, 212, 0.2);
  color: #06b6d4;
}

.badge.critical {
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
