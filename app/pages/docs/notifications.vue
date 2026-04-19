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

    <!-- ==================== Telegram ==================== -->
    <h3 id="telegram">Telegram</h3>
    
    <p>通过 Telegram Bot 发送通知，需要创建 Bot 并获取配置信息。</p>
    
    <h4>步骤一：创建 Telegram Bot</h4>
    <ol>
      <li>在 Telegram 中搜索 <code>@BotFather</code></li>
      <li>发送 <code>/newbot</code> 命令</li>
      <li>按照提示输入 Bot 名称和用户名</li>
      <li>保存返回的 <strong>Bot Token</strong>（格式：<code>123456789:ABCdefGHIjklMNOpqrsTUVwxyz</code>）</li>
    </ol>

    <h4>步骤二：获取 Chat ID</h4>
    
    <p><strong>方法一：通过 API 获取</strong></p>
    <pre><code># 1. 先给你的 Bot 发送一条消息
# 2. 访问以下 URL（替换 YOUR_BOT_TOKEN）
https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates

# 3. 在返回的 JSON 中找到 chat.id</code></pre>

    <p><strong>方法二：使用 @userinfobot</strong></p>
    <ol>
      <li>在 Telegram 中搜索 <code>@userinfobot</code></li>
      <li>发送任意消息</li>
      <li>它会返回你的 Chat ID</li>
    </ol>

    <p><strong>群组 Chat ID</strong>：格式通常为 <code>-1001234567890</code>（负数开头）</p>

    <h4>步骤三：在 Hermes 中配置</h4>
    <table>
      <thead>
        <tr>
          <th>参数</th>
          <th>说明</th>
          <th>示例</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>Bot Token</code></td>
          <td>从 @BotFather 获取的 Bot 令牌</td>
          <td><code>123456789:ABCdef...</code></td>
        </tr>
        <tr>
          <td><code>Chat ID</code></td>
          <td>目标聊天 ID</td>
          <td><code>-1001234567890</code></td>
        </tr>
      </tbody>
    </table>

    <h4>测试配置</h4>
    <pre><code># 测试 Bot Token 是否有效
curl "https://api.telegram.org/botYOUR_TOKEN/getMe"

# 测试发送消息
curl -X POST "https://api.telegram.org/botYOUR_TOKEN/sendMessage" \
  -d "chat_id=YOUR_CHAT_ID" \
  -d "text=Hermes Agent 测试通知"</code></pre>

    <div class="tip">
      <strong>提示</strong>：Bot 需要是群组成员才能向群组发送消息。如果使用频道，需要将 Bot 添加为频道管理员。
    </div>

    <!-- ==================== Discord ==================== -->
    <h3 id="discord">Discord</h3>
    
    <p>通过 Discord Webhook 发送通知，配置简单，无需创建 Bot。</p>

    <h4>步骤一：创建 Webhook</h4>
    
    <p><strong>桌面端操作：</strong></p>
    <ol>
      <li>打开 Discord，进入目标服务器</li>
      <li>右键点击要发送通知的<strong>频道</strong></li>
      <li>选择「编辑频道」</li>
      <li>在左侧菜单选择「整合」</li>
      <li>点击「Webhooks」</li>
      <li>点击「新建 Webhook」</li>
      <li>设置名称和头像（可选）</li>
      <li>点击「复制 Webhook URL」</li>
    </ol>

    <p><strong>移动端操作：</strong></p>
    <ol>
      <li>点击频道名称进入频道设置</li>
      <li>向下滚动找到「Webhooks」</li>
      <li>点击「创建 Webhook」</li>
      <li>复制 Webhook URL</li>
    </ol>

    <h4>步骤二：在 Hermes 中配置</h4>
    <table>
      <thead>
        <tr>
          <th>参数</th>
          <th>说明</th>
          <th>示例</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>Webhook URL</code></td>
          <td>Discord 提供的 Webhook 地址</td>
          <td><code>https://discord.com/api/webhooks/123456789/abc123...</code></td>
        </tr>
      </tbody>
    </table>

    <h4>测试配置</h4>
    <pre><code># 测试 Webhook
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hermes Agent 测试通知"}'</code></pre>

    <h4>高级用法：嵌入消息</h4>
    <pre><code># 发送带格式的嵌入消息
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "embeds": [{
      "title": "API 错误告警",
      "description": "OpenAI API 返回 429 错误",
      "color": 15158332,
      "fields": [
        {"name": "严重程度", "value": "紧急", "inline": true},
        {"name": "时间", "value": "2026-04-19 15:30", "inline": true}
      ],
      "footer": {"text": "Hermes Agent"}
    }]
  }'</code></pre>

    <div class="warning">
      <strong>安全提示</strong>：Webhook URL 相当于密码，不要公开分享。如果泄露，请在 Discord 中重新生成。
    </div>

    <!-- ==================== 微信 ==================== -->
    <h3 id="wechat">微信</h3>
    
    <p>微信通知通过 Hermes Gateway 配置，支持企业微信和个人微信（通过 Gateway）。</p>

    <h4>前置条件</h4>
    <ul>
      <li>已部署 Hermes Gateway 服务</li>
      <li>Gateway 服务运行正常</li>
    </ul>

    <h4>配置 Gateway 通知</h4>
    <pre><code># 在 Gateway 的 systemd 服务中添加环境变量
# /etc/systemd/system/hermes-gateway.service

[Service]
Environment="WEIXIN_NOTIFY_ENABLED=true"
Environment="WEIXIN_NOTIFY_USERS=your_user_id"</code></pre>

    <h4>环境变量说明</h4>
    <table>
      <thead>
        <tr>
          <th>变量</th>
          <th>说明</th>
          <th>默认值</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>WEIXIN_NOTIFY_ENABLED</code></td>
          <td>是否启用微信通知</td>
          <td><code>false</code></td>
        </tr>
        <tr>
          <td><code>WEIXIN_NOTIFY_USERS</code></td>
          <td>接收通知的用户 ID 列表</td>
          <td>-</td>
        </tr>
      </tbody>
    </table>

    <div class="tip">
      <strong>提示</strong>：用户 ID 可通过 Gateway 日志查看，或在与 Gateway 的对话中发送消息后从日志中获取。
    </div>

    <!-- ==================== 邮件 ==================== -->
    <h3 id="email">邮件</h3>
    
    <p>通过 SMTP 发送邮件通知，适合周期性汇总报告。</p>

    <h4>配置参数</h4>
    <table>
      <thead>
        <tr>
          <th>参数</th>
          <th>说明</th>
          <th>示例</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>收件地址</code></td>
          <td>接收通知的邮箱</td>
          <td><code>admin@example.com</code></td>
        </tr>
        <tr>
          <td><code>SMTP 服务器</code></td>
          <td>SMTP 服务器地址</td>
          <td><code>smtp.gmail.com</code></td>
        </tr>
        <tr>
          <td><code>SMTP 端口</code></td>
          <td>服务器端口</td>
          <td><code>587</code>（TLS）或 <code>465</code>（SSL）</td>
        </tr>
        <tr>
          <td><code>发件人账号</code></td>
          <td>SMTP 登录账号</td>
          <td><code>your@gmail.com</code></td>
        </tr>
        <tr>
          <td><code>发件人密码</code></td>
          <td>SMTP 密码或应用专用密码</td>
          <td>-</td>
        </tr>
      </tbody>
    </table>

    <h4>常见邮件服务商配置</h4>
    <table>
      <thead>
        <tr>
          <th>服务商</th>
          <th>SMTP 服务器</th>
          <th>端口</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Gmail</td>
          <td><code>smtp.gmail.com</code></td>
          <td>587 / 465</td>
          <td>需使用应用专用密码</td>
        </tr>
        <tr>
          <td>QQ 邮箱</td>
          <td><code>smtp.qq.com</code></td>
          <td>587 / 465</td>
          <td>需开启 SMTP 服务</td>
        </tr>
        <tr>
          <td>163 邮箱</td>
          <td><code>smtp.163.com</code></td>
          <td>465</td>
          <td>需使用授权码</td>
        </tr>
        <tr>
          <td>阿里企业邮</td>
          <td><code>smtp.qiye.aliyun.com</code></td>
          <td>465</td>
          <td>-</td>
        </tr>
      </tbody>
    </table>

    <div class="warning">
      <strong>注意</strong>：Gmail 需要先生成应用专用密码：Google 账户 → 安全性 → 两步验证 → 应用专用密码。
    </div>

    <!-- ==================== Webhook ==================== -->
    <h3 id="webhook">自定义 Webhook</h3>
    
    <p>向自定义 HTTP 端点发送通知，用于对接其他系统。</p>

    <h4>配置参数</h4>
    <table>
      <thead>
        <tr>
          <th>参数</th>
          <th>说明</th>
          <th>示例</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>Webhook URL</code></td>
          <td>接收通知的 HTTP 端点</td>
          <td><code>https://your-server.com/webhook</code></td>
        </tr>
        <tr>
          <td><code>Secret</code></td>
          <td>可选，用于签名验证</td>
          <td><code>your-secret-key</code></td>
        </tr>
      </tbody>
    </table>

    <h4>请求格式</h4>
    <pre><code>POST /webhook
Content-Type: application/json
X-Hermes-Signature: sha256=HMAC_SHA256(secret, body)

{
  "event": "error",
  "severity": "critical",
  "title": "API 调用失败",
  "message": "OpenAI API 返回 429 错误",
  "timestamp": "2026-04-19T15:30:45Z",
  "metadata": {
    "model": "gpt-4",
    "error_code": 429
  }
}</code></pre>

    <h4>签名验证</h4>
    <pre><code># Python 示例：验证签名
import hmac
import hashlib

def verify_signature(secret: str, payload: bytes, signature: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)</code></pre>

    <!-- ==================== 通知规则 ==================== -->
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
    
    <table>
      <thead>
        <tr>
          <th>场景</th>
          <th>推荐渠道</th>
          <th>原因</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>紧急告警</td>
          <td>Telegram / 微信</td>
          <td>即时推送，手机必达</td>
        </tr>
        <tr>
          <td>团队协作</td>
          <td>Discord</td>
          <td>多人可见，支持讨论</td>
        </tr>
        <tr>
          <td>汇总报告</td>
          <td>邮件</td>
          <td>便于存档和检索</td>
        </tr>
        <tr>
          <td>系统集成</td>
          <td>Webhook</td>
          <td>灵活对接其他系统</td>
        </tr>
      </tbody>
    </table>

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

    <h2>故障排查</h2>

    <h3>通知未发送</h3>
    <ul>
      <li>检查渠道是否已启用（开关状态）</li>
      <li>检查规则是否匹配事件类型</li>
      <li>验证渠道配置（Token、URL 等）是否正确</li>
      <li>查看系统日志中的错误信息</li>
    </ul>

    <h3>Telegram 通知失败</h3>
    <pre><code># 验证 Bot Token
curl "https://api.telegram.org/botYOUR_TOKEN/getMe"

# 验证 Chat ID
curl "https://api.telegram.org/botYOUR_TOKEN/getChat?chat_id=YOUR_CHAT_ID"

# 常见错误
# 401 Unauthorized: Token 无效
# 400 Bad Request: Chat ID 格式错误
# 403 Forbidden: Bot 未加入群组或被禁言</code></pre>

    <h3>Discord 通知失败</h3>
    <pre><code># 测试 Webhook
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test"}'

# 常见错误
# 404 Not Found: Webhook URL 无效或已删除
# 403 Forbidden: 权限不足
# 400 Bad Request: JSON 格式错误</code></pre>

    <h3>邮件通知失败</h3>
    <pre><code># 测试 SMTP 连接
telnet smtp.gmail.com 587

# 常见错误
# 535 Authentication failed: 密码错误或未使用应用专用密码
# 530 Must issue STARTTLS: 需要启用 TLS
# Connection refused: 防火墙拦截或端口错误</code></pre>

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

ol, ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

li {
  margin: 0.25rem 0;
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
  margin-top: 1.5rem;
}

.tip strong {
  color: #3b82f6;
}

.warning {
  background: rgba(245, 158, 11, 0.1);
  border-left: 4px solid #f59e0b;
  padding: 1rem;
  border-radius: 0 8px 8px 0;
  margin-top: 1.5rem;
}

.warning strong {
  color: #f59e0b;
}
</style>
