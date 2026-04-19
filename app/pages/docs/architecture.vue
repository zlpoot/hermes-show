<template>
  <DocsLayout>
    <h1>项目架构</h1>
    
    <p>本文档介绍 Hermes Show 的技术架构和代码组织。</p>
    
    <h2>技术栈</h2>
    
    <table>
      <thead>
        <tr>
          <th>层次</th>
          <th>技术</th>
          <th>用途</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>框架</td>
          <td>Nuxt.js 3</td>
          <td>Vue.js 全栈框架</td>
        </tr>
        <tr>
          <td>UI 库</td>
          <td>TailwindCSS</td>
          <td>原子化 CSS</td>
        </tr>
        <tr>
          <td>图标</td>
          <td>Lucide Vue</td>
          <td>图标组件库</td>
        </tr>
        <tr>
          <td>状态管理</td>
          <td>Pinia</td>
          <td>Vue 状态管理</td>
        </tr>
        <tr>
          <td>HTTP 客户端</td>
          <td>ofetch</td>
          <td>数据请求</td>
        </tr>
        <tr>
          <td>图表</td>
          <td>Chart.js</td>
          <td>数据可视化</td>
        </tr>
      </tbody>
    </table>
    
    <h2>目录结构</h2>
    
    <pre><code class="language-plaintext">hermes-show/
├── app/                    # 应用主目录
│   ├── app.vue            # 根组件
│   ├── components/        # 可复用组件
│   ├── composables/       # 组合式函数
│   ├── layouts/           # 页面布局
│   │   ├── default.vue   # 默认布局（侧边栏）
│   │   └── docs.vue      # 文档布局
│   └── pages/            # 页面路由
│       ├── index.vue     # 仪表盘
│       ├── config.vue    # 配置中心
│       ├── history.vue   # 对话历史
│       ├── skills.vue    # Skills 管理
│       ├── cron.vue      # 定时任务
│       ├── logs.vue      # 系统日志
│       ├── gateway.vue   # 网关状态
│       └── docs/         # 文档页面
│           ├── index.vue
│           ├── dashboard.vue
│           └── ...
├── server/               # 服务端代码
│   └── api/             # API 路由
│       ├── config.ts    # 配置 API
│       ├── history.ts   # 历史 API
│       ├── skills.ts    # Skills API
│       └── ...
├── public/              # 静态资源
├── nuxt.config.ts       # Nuxt 配置
├── tailwind.config.js   # Tailwind 配置
├── tsconfig.json        # TypeScript 配置
└── package.json         # 项目依赖
</code></pre>
    
    <h2>核心概念</h2>
    
    <h3>1. 页面路由</h3>
    <p>Nuxt.js 基于文件系统的路由：</p>
    <ul>
      <li><code>pages/index.vue</code> → <code>/</code></li>
      <li><code>pages/config.vue</code> → <code>/config</code></li>
      <li><code>pages/docs/index.vue</code> → <code>/docs</code></li>
      <li><code>pages/docs/dashboard.vue</code> → <code>/docs/dashboard</code></li>
    </ul>
    
    <h3>2. 布局系统</h3>
    <p>页面可以使用不同的布局：</p>
    <ul>
      <li><code>layouts/default.vue</code> - 主应用布局（含侧边栏）</li>
      <li><code>layouts/docs.vue</code> - 文档布局（含文档导航）</li>
    </ul>
    
    <h3>3. API 路由</h3>
    <p>服务端 API 位于 <code>server/api/</code>：</p>
    <ul>
      <li><code>server/api/config.get.ts</code> → <code>GET /api/config</code></li>
      <li><code>server/api/history.get.ts</code> → <code>GET /api/history</code></li>
    </ul>
    
    <h3>4. 组合式函数</h3>
    <p>可复用逻辑封装在 <code>composables/</code>：</p>
    <pre><code class="language-typescript">// composables/useConfig.ts
export const useConfig = () => {
  const config = useState('config', () => null)
  
  const fetchConfig = async () => {
    config.value = await $fetch('/api/config')
  }
  
  return { config, fetchConfig }
}
</code></pre>
    
    <h2>数据流</h2>
    
    <pre><code class="language-plaintext">用户操作 → Vue 组件 → Composable/API 调用
                              ↓
                         Nuxt Server API
                              ↓
                         Hermes Agent API
                              ↓
                         数据库/文件系统
</code></pre>
    
    <h2>扩展开发</h2>
    
    <h3>添加新页面</h3>
    <p>在 <code>pages/</code> 目录下创建新的 Vue 文件即可自动注册路由。</p>
    
    <h3>添加新 API</h3>
    <p>在 <code>server/api/</code> 目录下创建处理函数：</p>
    <pre><code class="language-typescript">// server/api/custom.get.ts
export default defineEventHandler(async (event) => {
  return { message: 'Hello' }
})
</code></pre>
    
    <h3>添加新组件</h3>
    <p>在 <code>components/</code> 目录下创建组件，Nuxt 会自动导入：</p>
    <pre><code class="language-vue">&lt;!-- components/MyComponent.vue --&gt;
&lt;template&gt;
  &lt;div&gt;My Component&lt;/div&gt;
&lt;/template&gt;

&lt;!-- 使用时自动导入 --&gt;
&lt;MyComponent /&gt;
</code></pre>
    
    <div class="tip">
      <strong>提示</strong>: 开发时使用 <code>pnpm dev</code> 启动热重载服务器，修改代码后自动刷新。
    </div>
  </DocsLayout>
</template>

<script setup>
import DocsLayout from '~/layouts/docs.vue'

useHead({
  title: '项目架构 - Hermes Show 文档'
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
