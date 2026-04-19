<template>
  <DocsLayout>
    <h1>配置中心</h1>
    
    <p>配置中心提供对 Hermes Agent 所有配置文件的在线管理能力，支持实时编辑和保存。</p>
    
    <h2>配置分类</h2>
    
    <table>
      <thead>
        <tr>
          <th>配置文件</th>
          <th>说明</th>
          <th>常用配置项</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>config.yaml</code></td>
          <td>主配置文件</td>
          <td>模型、Agent、终端设置</td>
        </tr>
        <tr>
          <td><code>.env</code></td>
          <td>环境变量</td>
          <td>API密钥、敏感信息</td>
        </tr>
        <tr>
          <td><code>skills/</code></td>
          <td>Skills 配置</td>
          <td>自定义技能和工作流</td>
        </tr>
        <tr>
          <td><code>gateway.yaml</code></td>
          <td>网关配置</td>
          <td>消息平台连接配置</td>
        </tr>
      </tbody>
    </table>
    
    <h2>主要功能</h2>
    
    <h3>1. 配置文件选择</h3>
    <p>左侧文件树展示所有可编辑的配置文件，点击切换当前编辑的文件。</p>
    
    <h3>2. 代码编辑器</h3>
    <p>中央区域为代码编辑器，支持：</p>
    <ul>
      <li>语法高亮（YAML、JSON、Markdown）</li>
      <li>行号显示</li>
      <li>代码折叠</li>
      <li>自动缩进</li>
      <li>错误提示</li>
    </ul>
    
    <h3>3. 配置验证</h3>
    <p>保存前自动验证配置格式：</p>
    <ul>
      <li>YAML 语法检查</li>
      <li>必填字段验证</li>
      <li>类型一致性检查</li>
      <li>配置冲突检测</li>
    </ul>
    
    <h3>4. 版本历史</h3>
    <p>查看配置的历史修改记录，支持回滚到任意版本。</p>
    
    <h2>使用方式</h2>
    
    <pre><code class="language-plaintext">访问路径: /config

操作步骤:
1. 从左侧文件树选择目标配置文件
2. 在编辑器中修改配置内容
3. 点击"验证"按钮检查格式
4. 点击"保存"按钮应用更改
5. 部分配置需要重启服务生效
</code></pre>
    
    <h2>配置示例</h2>
    
    <h3>模型配置</h3>
    <pre><code class="language-yaml">model:
  provider: openai
  model: gpt-4
  temperature: 0.7
  max_tokens: 4096
</code></pre>
    
    <h3>Agent 配置</h3>
    <pre><code class="language-yaml">agent:
  name: Hermes
  max_turns: 50
  enable_memory: true
  enable_skills: true
</code></pre>
    
    <div class="warning">
      <strong>注意</strong>: 修改配置后，某些设置需要重启 Hermes Agent 服务才能生效。建议在生产环境修改前先备份配置文件。
    </div>
  </DocsLayout>
</template>

<script setup>
import DocsLayout from '~/layouts/docs.vue'

useHead({
  title: '配置中心 - Hermes Show 文档'
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

.warning {
  background: rgba(234, 179, 8, 0.1);
  border-left: 4px solid #eab308;
  padding: 1rem;
  border-radius: 0 8px 8px 0;
  margin-top: 2rem;
}

.warning strong {
  color: #eab308;
}
</style>
