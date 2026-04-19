<template>
  <DocsLayout>
    <h1>快速上手</h1>
    
    <p>本指南帮助你快速上手 Hermes Show 的基本使用。</p>
    
    <h2>首次使用</h2>
    
    <h3>1. 检查服务状态</h3>
    <p>打开 Hermes Show 后，首先查看仪表盘页面：</p>
    <ul>
      <li>确认 Hermes Agent 状态显示"运行中"</li>
      <li>查看各平台网关连接状态</li>
      <li>了解当前活跃任务</li>
    </ul>
    
    <h3>2. 查看配置</h3>
    <p>进入配置中心：</p>
    <ul>
      <li>查看当前使用的模型配置</li>
      <li>了解 Agent 基础设置</li>
      <li>确认 API 密钥已正确配置</li>
    </ul>
    
    <h3>3. 测试对话</h3>
    <p>通过已连接的消息平台发送测试消息，然后在对话历史中查看记录。</p>
    
    <h2>常用操作</h2>
    
    <h3>查看对话历史</h3>
    <ol>
      <li>点击左侧"对话历史"菜单</li>
      <li>在搜索框输入关键词搜索</li>
      <li>点击会话查看详细内容</li>
    </ol>
    
    <h3>管理定时任务</h3>
    <ol>
      <li>点击左侧"定时任务"菜单</li>
      <li>点击"新建任务"按钮</li>
      <li>填写任务名称和指令</li>
      <li>设置执行计划</li>
      <li>保存并启用任务</li>
    </ol>
    
    <h3>查看日志</h3>
    <ol>
      <li>点击左侧"系统日志"菜单</li>
      <li>选择要查看的日志文件</li>
      <li>使用级别过滤器筛选</li>
      <li>搜索特定关键词</li>
    </ol>
    
    <h2>快捷键</h2>
    
    <table>
      <thead>
        <tr>
          <th>快捷键</th>
          <th>功能</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><kbd>Ctrl</kbd> + <kbd>K</kbd></td>
          <td>全局搜索</td>
        </tr>
        <tr>
          <td><kbd>Ctrl</kbd> + <kbd>/</kbd></td>
          <td>显示快捷键帮助</td>
        </tr>
        <tr>
          <td><kbd>Esc</kbd></td>
          <td>关闭弹窗/取消操作</td>
        </tr>
      </tbody>
    </table>
    
    <h2>下一步</h2>
    
    <ul>
      <li>阅读各功能模块的详细文档</li>
      <li>配置你的第一个定时任务</li>
      <li>探索 Skills 库</li>
      <li>自定义 Agent 配置</li>
    </ul>
    
    <div class="tip">
      <strong>提示</strong>: 遇到问题？查看系统日志获取详细信息，或访问 GitHub Issues 提交反馈。
    </div>
  </DocsLayout>
</template>

<script setup>
import DocsLayout from '~/layouts/docs.vue'

useHead({
  title: '快速上手 - Hermes Show 文档'
})
</script>

<style scoped>
kbd {
  background: var(--code-bg, #1e293b);
  border: 1px solid var(--border-color, #334155);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85em;
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
