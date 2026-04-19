<template>
  <div>
    <h1>Skills 管理</h1>
    
    <p>Skills 是 Hermes Agent 的能力扩展模块，本页面提供 Skills 的浏览、搜索和管理功能。</p>
    
    <h2>什么是 Skills？</h2>
    
    <p>Skills 是预定义的任务模板和工作流程，帮助 Agent 更好地完成特定类型的任务。每个 Skill 包含：</p>
    <ul>
      <li>触发条件和适用场景</li>
      <li>执行步骤和命令</li>
      <li>注意事项和常见陷阱</li>
      <li>相关参考和模板文件</li>
    </ul>
    
    <h2>功能模块</h2>
    
    <h3>1. 分类浏览</h3>
    <p>Skills 按功能领域分类：</p>
    
    <table>
      <thead>
        <tr>
          <th>分类</th>
          <th>说明</th>
          <th>示例</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>development</td>
          <td>开发相关</td>
          <td>调试、测试、代码审查</td>
        </tr>
        <tr>
          <td>devops</td>
          <td>运维相关</td>
          <td>部署、监控、日志分析</td>
        </tr>
        <tr>
          <td>mlops</td>
          <td>机器学习</td>
          <td>训练、推理、模型管理</td>
        </tr>
        <tr>
          <td>github</td>
          <td>GitHub 操作</td>
          <td>PR、Issue、代码审查</td>
        </tr>
        <tr>
          <td>messaging</td>
          <td>消息平台</td>
          <td>微信、Discord、Telegram</td>
        </tr>
      </tbody>
    </table>
    
    <h3>2. 关键词搜索</h3>
    <p>支持在 Skill 名称、描述、内容中搜索。</p>
    
    <h3>3. Skill 详情</h3>
    <p>点击 Skill 查看详细信息：</p>
    <ul>
      <li>完整说明文档</li>
      <li>使用示例</li>
      <li>相关参考文件</li>
      <li>模板和脚本</li>
    </ul>
    
    <h2>使用方式</h2>
    
    <pre><code>访问路径: /skills

浏览操作:
1. 从分类列表选择感兴趣的领域
2. 查看该分类下的所有 Skills
3. 点击 Skill 卡片查看详情

搜索操作:
1. 在搜索框输入关键词
2. 结果实时更新
3. 点击结果查看详情
</code></pre>
    
    <h2>Skill 文件结构</h2>
    
    <pre><code>~/.hermes/skills/
├── development/
│   └── debug/
│       ├── SKILL.md        # 主文档
│       ├── references/     # 参考资料
│       ├── templates/      # 模板文件
│       └── scripts/        # 脚本文件
├── devops/
│   └── deploy/
│       └── ...
└── ...
</code></pre>
    
    <h2>创建自定义 Skill</h2>
    
    <p>可以通过在 <code>~/.hermes/skills/</code> 目录下创建新的 Skill 文件夹来添加自定义 Skills。</p>
    
    <div class="tip">
      <strong>提示</strong>: Skills 在 Agent 启动时自动加载，修改后需要重启 Agent 或使用热重载命令。
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'docs'
})

useHead({
  title: 'Skills 管理 - Hermes Show 文档'
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
