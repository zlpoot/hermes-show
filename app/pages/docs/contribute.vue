<template>
  <DocsLayout>
    <h1>贡献指南</h1>
    
    <p>感谢你对 Hermes Show 项目的兴趣！本文档介绍如何为项目做出贡献。</p>
    
    <h2>行为准则</h2>
    
    <p>我们希望所有贡献者遵守以下准则：</p>
    <ul>
      <li>尊重他人，包容不同的观点</li>
      <li>专注于对项目最有利的事情</li>
      <li>提供建设性的反馈</li>
    </ul>
    
    <h2>如何贡献</h2>
    
    <h3>报告 Bug</h3>
    <p>如果你发现了 Bug，请：</p>
    <ol>
      <li>搜索 <a href="https://github.com/zlpoot/hermes-show/issues" target="_blank">Issues</a> 确认是否已被报告</li>
      <li>如果未报告，创建新的 Issue</li>
      <li>提供详细的复现步骤、预期行为和实际行为</li>
      <li>附上相关的日志或截图</li>
    </ol>
    
    <h3>建议新功能</h3>
    <p>如果你想建议新功能：</p>
    <ol>
      <li>在 Issues 中搜索是否已有类似建议</li>
      <li>创建新的 Feature Request Issue</li>
      <li>描述功能的使用场景和预期效果</li>
    </ol>
    
    <h3>提交代码</h3>
    
    <h4>1. Fork 项目</h4>
    <pre><code class="language-bash"># Fork 后克隆你的仓库
git clone https://github.com/YOUR_USERNAME/hermes-show.git
cd hermes-show
</code></pre>
    
    <h4>2. 创建分支</h4>
    <pre><code class="language-bash">git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
</code></pre>
    
    <h4>3. 安装依赖</h4>
    <pre><code class="language-bash">pnpm install
</code></pre>
    
    <h4>4. 进行修改</h4>
    <ul>
      <li>确保代码风格一致</li>
      <li>添加必要的测试</li>
      <li>更新相关文档</li>
    </ul>
    
    <h4>5. 提交更改</h4>
    <pre><code class="language-bash">git add .
git commit -m "feat: 添加新功能描述"
# 或
git commit -m "fix: 修复问题描述"
</code></pre>
    
    <p>提交信息格式：</p>
    <ul>
      <li><code>feat:</code> 新功能</li>
      <li><code>fix:</code> Bug 修复</li>
      <li><code>docs:</code> 文档更新</li>
      <li><code>style:</code> 代码格式调整</li>
      <li><code>refactor:</code> 代码重构</li>
      <li><code>test:</code> 测试相关</li>
      <li><code>chore:</code> 构建/工具相关</li>
    </ul>
    
    <h4>6. 推送并创建 PR</h4>
    <pre><code class="language-bash">git push origin feature/your-feature-name
</code></pre>
    
    <p>然后在 GitHub 上创建 Pull Request。</p>
    
    <h2>开发指南</h2>
    
    <h3>代码风格</h3>
    <ul>
      <li>使用 TypeScript 编写代码</li>
      <li>Vue 组件使用 Composition API</li>
      <li>遵循项目现有的代码风格</li>
      <li>使用 ESLint 和 Prettier 格式化代码</li>
    </ul>
    
    <h3>提交前检查</h3>
    <pre><code class="language-bash"># 运行 lint 检查
pnpm lint

# 运行类型检查
pnpm typecheck

# 构建测试
pnpm build
</code></pre>
    
    <h2>项目结构</h2>
    
    <p>详细的目录结构请参考 <NuxtLink to="/docs/architecture">项目架构</NuxtLink> 文档。</p>
    
    <h2>联系方式</h2>
    
    <ul>
      <li><strong>GitHub Issues</strong>: 用于 Bug 报告和功能建议</li>
      <li><strong>GitHub Discussions</strong>: 用于一般讨论和问题</li>
    </ul>
    
    <div class="tip">
      <strong>感谢</strong>: 感谢所有为项目做出贡献的开发者！
    </div>
  </DocsLayout>
</template>

<script setup>
import DocsLayout from '~/layouts/docs.vue'

useHead({
  title: '贡献指南 - Hermes Show 文档'
})
</script>

<style scoped>
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
