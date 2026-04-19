<template>
  <div>
    <h1>安装部署</h1>
    
    <p>本指南介绍如何安装和部署 Hermes Show。</p>
    
    <h2>环境要求</h2>
    
    <ul>
      <li>Node.js 18.x 或更高版本</li>
      <li>pnpm 8.x 或更高版本（推荐）</li>
      <li>Hermes Agent 服务运行中</li>
    </ul>
    
    <h2>安装步骤</h2>
    
    <h3>1. 克隆项目</h3>
    <pre><code class="language-bash">git clone https://github.com/zlpoot/hermes-show.git
cd hermes-show
</code></pre>
    
    <h3>2. 安装依赖</h3>
    <pre><code class="language-bash">pnpm install
</code></pre>
    
    <h3>3. 配置环境变量</h3>
    <pre><code class="language-bash"># 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
# HERMES_API_URL=http://localhost:8000  # Hermes Agent API 地址
</code></pre>
    
    <h3>4. 启动开发服务器</h3>
    <pre><code class="language-bash">pnpm dev
</code></pre>
    
    <p>访问 <a href="http://localhost:3000" target="_blank">http://localhost:3000</a> 查看应用。</p>
    
    <h2>生产部署</h2>
    
    <h3>构建生产版本</h3>
    <pre><code class="language-bash">pnpm build
</code></pre>
    
    <h3>启动生产服务</h3>
    <pre><code class="language-bash">pnpm start
</code></pre>
    
    <h3>使用 PM2 管理</h3>
    <pre><code class="language-bash"># 安装 PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 开机自启
pm2 startup
pm2 save
</code></pre>
    
    <h3>使用 Docker</h3>
    <pre><code class="language-dockerfile"># 构建镜像
docker build -t hermes-show .

# 运行容器
docker run -d -p 3000:3000 --name hermes-show hermes-show
</code></pre>
    
    <h2>Nginx 反向代理配置</h2>
    
    <pre><code class="language-nginx">server {
    listen 80;
    server_name hermes.example.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
</code></pre>
    
    <div class="tip">
      <strong>提示</strong>: 生产环境建议使用 HTTPS，可以使用 Let's Encrypt 免费证书。
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'docs'
})

useHead({
  title: '安装部署 - Hermes Show 文档'
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
