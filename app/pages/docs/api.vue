<template>
  <DocsLayout>
    <h1>API 参考</h1>
    
    <p>本文档列出 Hermes Show 提供的所有 API 端点。</p>
    
    <h2>基础信息</h2>
    
    <table>
      <thead>
        <tr>
          <th>属性</th>
          <th>值</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>基础 URL</td>
          <td><code>/api</code></td>
        </tr>
        <tr>
          <td>数据格式</td>
          <td>JSON</td>
        </tr>
        <tr>
          <td>认证方式</td>
          <td>可选（依赖 Hermes Agent 配置）</td>
        </tr>
      </tbody>
    </table>
    
    <h2>配置管理</h2>
    
    <h3>GET /api/config</h3>
    <p>获取当前配置</p>
    
    <pre><code class="language-typescript">Response:
{
  "model": {
    "provider": "openai",
    "model": "gpt-4"
  },
  "agent": {
    "name": "Hermes",
    "max_turns": 50
  }
}
</code></pre>
    
    <h3>PUT /api/config</h3>
    <p>更新配置</p>
    
    <pre><code class="language-typescript">Request:
{
  "model": {
    "temperature": 0.8
  }
}

Response:
{
  "success": true,
  "message": "配置已更新"
}
</code></pre>
    
    <h2>对话历史</h2>
    
    <h3>GET /api/history</h3>
    <p>获取会话列表</p>
    
    <table>
      <thead>
        <tr>
          <th>参数</th>
          <th>类型</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>q</td>
          <td>string</td>
          <td>搜索关键词（可选）</td>
        </tr>
        <tr>
          <td>limit</td>
          <td>number</td>
          <td>返回数量（默认50）</td>
        </tr>
        <tr>
          <td>offset</td>
          <td>number</td>
          <td>偏移量（分页）</td>
        </tr>
      </tbody>
    </table>
    
    <pre><code class="language-typescript">Response:
{
  "sessions": [
    {
      "id": "abc123",
      "title": "配置微信网关",
      "message_count": 15,
      "created_at": "2026-04-19T10:00:00Z",
      "updated_at": "2026-04-19T11:30:00Z"
    }
  ],
  "total": 100
}
</code></pre>
    
    <h3>GET /api/history/:id</h3>
    <p>获取会话详情</p>
    
    <pre><code class="language-typescript">Response:
{
  "id": "abc123",
  "title": "配置微信网关",
  "messages": [
    {
      "role": "user",
      "content": "如何配置微信网关？",
      "timestamp": "2026-04-19T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "配置微信网关需要...",
      "timestamp": "2026-04-19T10:00:05Z"
    }
  ]
}
</code></pre>
    
    <h3>DELETE /api/history/:id</h3>
    <p>删除会话</p>
    
    <h2>Skills</h2>
    
    <h3>GET /api/skills</h3>
    <p>获取 Skills 列表</p>
    
    <table>
      <thead>
        <tr>
          <th>参数</th>
          <th>类型</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>category</td>
          <td>string</td>
          <td>分类过滤（可选）</td>
        </tr>
        <tr>
          <td>q</td>
          <td>string</td>
          <td>搜索关键词（可选）</td>
        </tr>
      </tbody>
    </table>
    
    <pre><code class="language-typescript">Response:
{
  "skills": [
    {
      "name": "systematic-debugging",
      "category": "development",
      "description": "系统性调试方法"
    }
  ]
}
</code></pre>
    
    <h3>GET /api/skills/:name</h3>
    <p>获取 Skill 详情</p>
    
    <h2>定时任务</h2>
    
    <h3>GET /api/cron</h3>
    <p>获取任务列表</p>
    
    <h3>POST /api/cron</h3>
    <p>创建新任务</p>
    
    <pre><code class="language-typescript">Request:
{
  "name": "每日报告",
  "prompt": "生成每日使用报告",
  "schedule": "0 9 * * *",
  "skills": ["reporting"]
}
</code></pre>
    
    <h3>PUT /api/cron/:id</h3>
    <p>更新任务</p>
    
    <h3>DELETE /api/cron/:id</h3>
    <p>删除任务</p>
    
    <h3>POST /api/cron/:id/run</h3>
    <p>立即执行任务</p>
    
    <h3>POST /api/cron/:id/pause</h3>
    <p>暂停任务</p>
    
    <h3>POST /api/cron/:id/resume</h3>
    <p>恢复任务</p>
    
    <h2>日志</h2>
    
    <h3>GET /api/logs</h3>
    <p>获取日志内容</p>
    
    <table>
      <thead>
        <tr>
          <th>参数</th>
          <th>类型</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>file</td>
          <td>string</td>
          <td>日志文件名</td>
        </tr>
        <tr>
          <td>level</td>
          <td>string</td>
          <td>日志级别过滤</td>
        </tr>
        <tr>
          <td>q</td>
          <td>string</td>
          <td>搜索关键词</td>
        </tr>
        <tr>
          <td>lines</td>
          <td>number</td>
          <td>返回行数（默认200）</td>
        </tr>
      </tbody>
    </table>
    
    <h2>网关</h2>
    
    <h3>GET /api/gateway</h3>
    <p>获取网关状态</p>
    
    <pre><code class="language-typescript">Response:
{
  "status": "running",
  "uptime": 86400,
  "platforms": [
    {
      "name": "wechat",
      "status": "connected",
      "account": "account@im.bot"
    }
  ],
  "users": [
    {
      "id": "user123",
      "name": "User",
      "authorized_at": "2026-04-19T10:00:00Z"
    }
  ]
}
</code></pre>
    
    <h2>错误响应</h2>
    
    <pre><code class="language-typescript">{
  "error": {
    "code": "NOT_FOUND",
    "message": "资源不存在"
  }
}
</code></pre>
    
    <div class="tip">
      <strong>提示</strong>: 所有 API 支持 CORS，可从前端直接调用。
    </div>
  </DocsLayout>
</template>

<script setup>
import DocsLayout from '~/layouts/docs.vue'

useHead({
  title: 'API 参考 - Hermes Show 文档'
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
