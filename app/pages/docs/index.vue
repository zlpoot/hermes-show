<template>
  <div>
    <h1>Hermes Show 文档</h1>
    
    <p class="lead">
      Hermes Show 是 Hermes Agent 的可视化管理平台，提供直观的 Web 界面来管理配置、查看对话历史、管理 Skills、定时任务等功能。
    </p>
    
    <h2>功能概览</h2>
    
    <h3>监控面板</h3>
    <table>
      <thead>
        <tr>
          <th>模块</th>
          <th>功能描述</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><NuxtLink to="/docs/dashboard">仪表盘</NuxtLink></td>
          <td>系统概览、Token 消耗趋势、活跃任务监控</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
        <tr>
          <td><NuxtLink to="/docs/health">健康检查</NuxtLink></td>
          <td>组件状态监控、资源使用情况</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
      </tbody>
    </table>
    
    <h3>配置管理</h3>
    <table>
      <thead>
        <tr>
          <th>模块</th>
          <th>功能描述</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><NuxtLink to="/docs/config">配置中心</NuxtLink></td>
          <td>模型配置、Agent 设置、安全配置等</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
        <tr>
          <td><NuxtLink to="/docs/providers">提供商性能</NuxtLink></td>
          <td>API 调用监控、性能指标分析</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
      </tbody>
    </table>
    
    <h3>数据管理</h3>
    <table>
      <thead>
        <tr>
          <th>模块</th>
          <th>功能描述</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><NuxtLink to="/docs/history">对话历史</NuxtLink></td>
          <td>FTS5 全文搜索、会话详情、批量管理</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
        <tr>
          <td><NuxtLink to="/docs/skills">Skills 管理</NuxtLink></td>
          <td>分类浏览、关键词搜索、详情查看</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
        <tr>
          <td><NuxtLink to="/docs/mcp">MCP 服务器</NuxtLink></td>
          <td>工具集成管理、连接状态监控</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
      </tbody>
    </table>
    
    <h3>费用管理</h3>
    <table>
      <thead>
        <tr>
          <th>模块</th>
          <th>功能描述</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><NuxtLink to="/docs/budget">预算管理</NuxtLink></td>
          <td>月度预算设置、消费监控、超支警告</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
        <tr>
          <td><NuxtLink to="/docs/cost">费用统计</NuxtLink></td>
          <td>成本分析、Token 消耗趋势</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
      </tbody>
    </table>
    
    <h3>自动化</h3>
    <table>
      <thead>
        <tr>
          <th>模块</th>
          <th>功能描述</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><NuxtLink to="/docs/cron">定时任务</NuxtLink></td>
          <td>创建、编辑、暂停、立即执行任务</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
        <tr>
          <td><NuxtLink to="/docs/tasks">任务队列</NuxtLink></td>
          <td>异步任务管理、优先级队列</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
      </tbody>
    </table>
    
    <h3>系统运维</h3>
    <table>
      <thead>
        <tr>
          <th>模块</th>
          <th>功能描述</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><NuxtLink to="/docs/logs">系统日志</NuxtLink></td>
          <td>多文件切换、级别过滤、关键词搜索</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
        <tr>
          <td><NuxtLink to="/docs/gateway">网关状态</NuxtLink></td>
          <td>运行状态、平台连接、授权用户</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
        <tr>
          <td><NuxtLink to="/docs/backup">备份管理</NuxtLink></td>
          <td>数据备份恢复、自动备份设置</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
        <tr>
          <td><NuxtLink to="/docs/notifications">通知设置</NuxtLink></td>
          <td>多渠道通知、事件配置</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
        <tr>
          <td><NuxtLink to="/docs/users">用户授权</NuxtLink></td>
          <td>访问权限管理、白名单配置</td>
          <td><span class="badge success">已完成</span></td>
        </tr>
      </tbody>
    </table>
    
    <h2>技术栈</h2>
    
    <ul>
      <li><strong>框架</strong>: Nuxt.js 3 + Vue 3</li>
      <li><strong>样式</strong>: TailwindCSS</li>
      <li><strong>图表</strong>: Chart.js + vue-chartjs</li>
      <li><strong>图标</strong>: Lucide Vue Next</li>
      <li><strong>构建工具</strong>: pnpm</li>
    </ul>
    
    <h2>快速开始</h2>
    
    <pre><code class="language-bash"># 克隆项目
git clone https://github.com/zlpoot/hermes-show.git
cd hermes-show

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
</code></pre>
    
    <h2>项目结构</h2>
    
    <pre><code class="language-plaintext">hermes-show/
├── app/
│   ├── components/     # Vue 组件
│   ├── composables/    # 组合式函数
│   ├── layouts/        # 布局组件
│   ├── pages/          # 页面路由
│   │   └── docs/       # 文档页面
│   └── assets/         # 静态资源
├── server/
│   └── api/            # API 路由
├── public/             # 公共文件
└── nuxt.config.ts      # Nuxt 配置
</code></pre>
    
    <h2>相关链接</h2>
    
    <ul>
      <li><a href="https://github.com/zlpoot/hermes-show" target="_blank">GitHub 仓库</a></li>
      <li><a href="https://hermes-agent.nousresearch.com" target="_blank">Hermes Agent 官方文档</a></li>
      <li><a href="https://nuxt.com" target="_blank">Nuxt.js 官方网站</a></li>
    </ul>
    
    <div class="tip">
      <strong>提示</strong>: 点击左侧导航菜单查看各模块的详细使用说明。
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'docs'
})

useHead({
  title: '介绍 - Hermes Show 文档'
})
</script>

<style scoped>
.lead {
  font-size: 1.25rem;
  color: var(--muted-color, #94a3b8);
  margin-bottom: 2rem;
}

h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
  color: var(--text-color, #e2e8f0);
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.success {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
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

table a {
  color: #3b82f6;
  text-decoration: none;
}

table a:hover {
  text-decoration: underline;
}
</style>
