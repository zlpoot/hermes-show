<template>
  <div class="docs-layout">
    <!-- 文档侧边栏 -->
    <aside class="docs-sidebar">
      <div class="sidebar-header">
        <NuxtLink to="/" class="logo">
          <span class="logo-icon">📚</span>
          <span class="logo-text">Hermes Show</span>
        </NuxtLink>
        <span class="version-badge">v1.0</span>
      </div>
      
      <nav class="sidebar-nav">
        <!-- 快速开始 -->
        <div class="nav-section">
          <h3 class="nav-title">快速开始</h3>
          <ul class="nav-list">
            <li>
              <NuxtLink to="/docs" exact-active-class="active">
                介绍
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/docs/installation" active-class="active">
                安装部署
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/docs/quick-start" active-class="active">
                快速上手
              </NuxtLink>
            </li>
          </ul>
        </div>
        
        <!-- 功能模块 -->
        <div class="nav-section">
          <h3 class="nav-title">功能模块</h3>
          <ul class="nav-list">
            <li>
              <NuxtLink to="/docs/dashboard" active-class="active">
                仪表盘
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/docs/config" active-class="active">
                配置中心
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/docs/history" active-class="active">
                对话历史
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/docs/skills" active-class="active">
                Skills管理
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/docs/cron" active-class="active">
                定时任务
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/docs/logs" active-class="active">
                系统日志
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/docs/gateway" active-class="active">
                网关状态
              </NuxtLink>
            </li>
          </ul>
        </div>
        
        <!-- 开发指南 -->
        <div class="nav-section">
          <h3 class="nav-title">开发指南</h3>
          <ul class="nav-list">
            <li>
              <NuxtLink to="/docs/architecture" active-class="active">
                项目架构
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/docs/api" active-class="active">
                API参考
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/docs/contribute" active-class="active">
                贡献指南
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>
      
      <!-- 外部链接 -->
      <div class="sidebar-footer">
        <a href="https://github.com/zlpoot/hermes-show" target="_blank" class="external-link">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span>GitHub</span>
        </a>
        <a href="https://hermes-agent.nousresearch.com" target="_blank" class="external-link">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          <span>Hermes Agent</span>
        </a>
      </div>
    </aside>
    
    <!-- 文档内容区域 -->
    <main class="docs-content">
      <div class="content-header">
        <NuxtLink to="/" class="back-link">
          ← 返回主页
        </NuxtLink>
        <div class="header-actions">
          <a :href="editLink" target="_blank" class="edit-link">
            在 GitHub 上编辑此页
          </a>
        </div>
      </div>
      
      <article class="content-body">
        <slot />
      </article>
      
      <footer class="content-footer">
        <div class="footer-nav">
          <NuxtLink v-if="prevPage" :to="prevPage.path" class="prev-link">
            <span class="label">← 上一篇</span>
            <span class="title">{{ prevPage.title }}</span>
          </NuxtLink>
          <span v-else class="placeholder"></span>
          
          <NuxtLink v-if="nextPage" :to="nextPage.path" class="next-link">
            <span class="label">下一篇 →</span>
            <span class="title">{{ nextPage.title }}</span>
          </NuxtLink>
          <span v-else class="placeholder"></span>
        </div>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 文档页面顺序
const docPages = [
  { path: '/docs', title: '介绍' },
  { path: '/docs/installation', title: '安装部署' },
  { path: '/docs/quick-start', title: '快速上手' },
  { path: '/docs/dashboard', title: '仪表盘' },
  { path: '/docs/config', title: '配置中心' },
  { path: '/docs/history', title: '对话历史' },
  { path: '/docs/skills', title: 'Skills管理' },
  { path: '/docs/cron', title: '定时任务' },
  { path: '/docs/logs', title: '系统日志' },
  { path: '/docs/gateway', title: '网关状态' },
  { path: '/docs/architecture', title: '项目架构' },
  { path: '/docs/api', title: 'API参考' },
  { path: '/docs/contribute', title: '贡献指南' }
]

// 计算上一篇/下一篇
const currentIndex = computed(() => {
  return docPages.findIndex(p => p.path === route.path)
})

const prevPage = computed(() => {
  const idx = currentIndex.value
  return idx > 0 ? docPages[idx - 1] : null
})

const nextPage = computed(() => {
  const idx = currentIndex.value
  return idx < docPages.length - 1 ? docPages[idx + 1] : null
})

// GitHub 编辑链接
const editLink = computed(() => {
  const path = route.path === '/docs' ? 'index' : route.path.replace('/docs/', '')
  return `https://github.com/zlpoot/hermes-show/edit/main/docs/${path}.md`
})
</script>

<style scoped>
.docs-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-color, #0f172a);
  color: var(--text-color, #e2e8f0);
}

/* 侧边栏样式 */
.docs-sidebar {
  width: 280px;
  background: var(--sidebar-bg, #1e293b);
  border-right: 1px solid var(--border-color, #334155);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color, #334155);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: inherit;
  font-weight: 600;
  font-size: 1.1rem;
}

.logo-icon {
  font-size: 1.5rem;
}

.version-badge {
  background: var(--accent-color, #3b82f6);
  color: white;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

/* 导航样式 */
.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}

.nav-section {
  margin-bottom: 1.5rem;
}

.nav-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-color, #64748b);
  padding: 0 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-list li a {
  display: block;
  padding: 0.5rem 1.5rem;
  color: var(--text-color, #e2e8f0);
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-list li a:hover {
  background: var(--hover-bg, #334155);
  color: var(--accent-color, #3b82f6);
}

.nav-list li a.active {
  background: var(--active-bg, rgba(59, 130, 246, 0.1));
  color: var(--accent-color, #3b82f6);
  border-left-color: var(--accent-color, #3b82f6);
}

/* 侧边栏底部 */
.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color, #334155);
}

.external-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--muted-color, #94a3b8);
  text-decoration: none;
  padding: 0.5rem 0;
  transition: color 0.2s;
}

.external-link:hover {
  color: var(--accent-color, #3b82f6);
}

.external-link .icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* 内容区域样式 */
.docs-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 3rem;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #334155);
}

.back-link {
  color: var(--muted-color, #94a3b8);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--accent-color, #3b82f6);
}

.edit-link {
  color: var(--muted-color, #94a3b8);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.edit-link:hover {
  color: var(--accent-color, #3b82f6);
}

/* 文档主体样式 */
.content-body {
  flex: 1;
  line-height: 1.8;
}

.content-body :deep(h1) {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.content-body :deep(h2) {
  font-size: 1.75rem;
  font-weight: 600;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color, #334155);
}

.content-body :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.content-body :deep(p) {
  margin-bottom: 1rem;
  color: var(--text-color, #cbd5e1);
}

.content-body :deep(ul),
.content-body :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.content-body :deep(li) {
  margin-bottom: 0.5rem;
}

.content-body :deep(code) {
  background: var(--code-bg, #1e293b);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.875em;
  color: var(--code-color, #f472b6);
}

.content-body :deep(pre) {
  background: var(--code-bg, #1e293b);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.content-body :deep(pre code) {
  background: none;
  padding: 0;
}

.content-body :deep(blockquote) {
  border-left: 4px solid var(--accent-color, #3b82f6);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--muted-color, #94a3b8);
}

.content-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.content-body :deep(th),
.content-body :deep(td) {
  border: 1px solid var(--border-color, #334155);
  padding: 0.75rem;
  text-align: left;
}

.content-body :deep(th) {
  background: var(--table-header-bg, #1e293b);
  font-weight: 600;
}

/* 底部导航 */
.content-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color, #334155);
}

.footer-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.prev-link,
.next-link {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  padding: 1rem;
  border-radius: 8px;
  background: var(--card-bg, #1e293b);
  transition: all 0.2s;
}

.prev-link:hover,
.next-link:hover {
  background: var(--hover-bg, #334155);
  transform: translateY(-2px);
}

.next-link {
  text-align: right;
}

.label {
  font-size: 0.75rem;
  color: var(--muted-color, #64748b);
  margin-bottom: 0.25rem;
}

.title {
  font-weight: 600;
  color: var(--text-color, #e2e8f0);
}

.placeholder {
  visibility: hidden;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .docs-sidebar {
    width: 240px;
  }
  
  .docs-content {
    padding: 1.5rem 2rem;
  }
}

@media (max-width: 768px) {
  .docs-layout {
    flex-direction: column;
  }
  
  .docs-sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
  
  .sidebar-nav {
    display: none; /* 移动端可折叠 */
  }
  
  .docs-content {
    padding: 1rem;
  }
  
  .content-body :deep(h1) {
    font-size: 2rem;
  }
  
  .footer-nav {
    grid-template-columns: 1fr;
  }
}
</style>
