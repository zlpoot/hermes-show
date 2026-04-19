<template>
  <div>
    <h1>对话历史</h1>
    
    <p>对话历史模块提供对 Hermes Agent 所有对话记录的浏览、搜索和管理功能。</p>
    
    <h2>核心功能</h2>
    
    <h3>1. 全文搜索</h3>
    <p>基于 SQLite FTS5 的全文搜索引擎：</p>
    <ul>
      <li>支持中英文混合搜索</li>
      <li>模糊匹配和精确匹配</li>
      <li>按时间范围筛选</li>
      <li>按会话类型筛选</li>
    </ul>
    
    <pre><code>搜索语法:
关键词        - 包含该关键词的会话
"精确短语"    - 完全匹配短语
关键词1 OR 关键词2 - 包含任一关键词
关键词1 关键词2    - 同时包含两个关键词
</code></pre>
    
    <h3>2. 会话列表</h3>
    <p>展示所有对话会话：</p>
    <ul>
      <li>会话标题（自动生成或自定义）</li>
      <li>消息数量</li>
      <li>创建时间和最后更新时间</li>
      <li>会话来源（CLI、微信、Discord等）</li>
    </ul>
    
    <h3>3. 会话详情</h3>
    <p>点击会话查看完整对话内容：</p>
    <ul>
      <li>消息时间线展示</li>
      <li>用户消息和AI回复区分显示</li>
      <li>代码块语法高亮</li>
      <li>支持导出为 Markdown/TXT</li>
    </ul>
    
    <h3>4. 批量管理</h3>
    <p>支持批量操作：</p>
    <ul>
      <li>多选会话</li>
      <li>批量删除</li>
      <li>批量导出</li>
      <li>批量标记</li>
    </ul>
    
    <h2>使用方式</h2>
    
    <pre><code>访问路径: /history

基本操作:
1. 在搜索框输入关键词搜索
2. 使用筛选器缩小范围
3. 点击会话查看详情
4. 勾选会话进行批量操作

高级操作:
- 点击"导出"按钮导出单个会话
- 使用时间范围选择器查看特定时间段
- 按来源平台过滤会话
</code></pre>
    
    <h2>数据存储</h2>
    
    <p>对话数据存储在 SQLite 数据库中：</p>
    <pre><code>数据库位置: ~/.hermes/hermes.db

表结构:
- sessions: 会话元数据
- messages: 消息内容
- sessions_fts: 全文搜索索引
</code></pre>
    
    <h2>隐私与安全</h2>
    
    <ul>
      <li>所有数据存储在本地，不会上传到云端</li>
      <li>支持设置数据保留策略</li>
      <li>支持手动清除历史记录</li>
      <li>敏感信息可配置自动脱敏</li>
    </ul>
    
    <div class="tip">
      <strong>提示</strong>: 使用引号进行精确匹配可以更快定位目标会话，例如 "配置微信网关"。
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'docs'
})

useHead({
  title: '对话历史 - Hermes Show 文档'
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
