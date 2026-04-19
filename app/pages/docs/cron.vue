<template>
  <DocsLayout>
    <h1>定时任务</h1>
    
    <p>定时任务模块允许你创建和管理自动化任务，支持定时执行和重复执行。</p>
    
    <h2>核心功能</h2>
    
    <h3>1. 任务列表</h3>
    <p>展示所有定时任务：</p>
    <ul>
      <li>任务名称和描述</li>
      <li>执行计划（cron 表达式）</li>
      <li>下次执行时间</li>
      <li>当前状态（运行中/暂停）</li>
      <li>执行次数统计</li>
    </ul>
    
    <h3>2. 创建任务</h3>
    <p>支持多种调度方式：</p>
    
    <table>
      <thead>
        <tr>
          <th>类型</th>
          <th>格式</th>
          <th>示例</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>指定时间</td>
          <td>ISO 时间戳</td>
          <td>2026-04-20T10:00:00</td>
        </tr>
        <tr>
          <td>相对时间</td>
          <td>时间偏移</td>
          <td>30m, 2h, 1d</td>
        </tr>
        <tr>
          <td>间隔重复</td>
          <td>every 间隔</td>
          <td>every 1h, every 30m</td>
        </tr>
        <tr>
          <td>Cron 表达式</td>
          <td>标准 cron</td>
          <td>0 9 * * * (每天9点)</td>
        </tr>
      </tbody>
    </table>
    
    <h3>3. 任务操作</h3>
    <ul>
      <li><strong>编辑</strong>: 修改任务内容或执行计划</li>
      <li><strong>暂停/恢复</strong>: 临时禁用或重新启用任务</li>
      <li><strong>立即执行</strong>: 不等待定时，立即运行一次</li>
      <li><strong>删除</strong>: 永久删除任务</li>
    </ul>
    
    <h3>4. 执行历史</h3>
    <p>查看任务的执行记录：</p>
    <ul>
      <li>执行时间和耗时</li>
      <li>执行结果（成功/失败）</li>
      <li>输出日志</li>
      <li>错误信息（如有）</li>
    </ul>
    
    <h2>使用方式</h2>
    
    <pre><code class="language-plaintext">访问路径: /cron

创建任务:
1. 点击"新建任务"按钮
2. 填写任务名称和描述
3. 输入任务指令（Prompt）
4. 选择执行计划类型
5. 设置执行时间
6. 可选：关联 Skills
7. 点击"保存"

管理任务:
- 点击暂停按钮暂停任务
- 点击播放按钮恢复任务
- 点击运行按钮立即执行
- 点击编辑按钮修改配置
- 点击删除按钮移除任务
</code></pre>
    
    <h2>Cron 表达式说明</h2>
    
    <pre><code class="language-plaintext">格式: 分 时 日 月 周

示例:
* * * * *     每分钟执行
0 * * * *     每小时执行
0 9 * * *     每天9点执行
0 9 * * 1     每周一9点执行
0 9 1 * *     每月1日9点执行
0 9,18 * * *  每天9点和18点执行
*/15 * * * *  每15分钟执行
</code></pre>
    
    <h2>任务内容</h2>
    
    <p>每个任务包含以下内容：</p>
    <ul>
      <li><strong>Prompt</strong>: 要执行的指令或任务描述</li>
      <li><strong>Skills</strong>: 关联的 Skills（可选）</li>
      <li><strong>脚本</strong>: 预执行的 Python 脚本（可选）</li>
      <li><strong>模型</strong>: 指定使用的模型（可选）</li>
    </ul>
    
    <div class="warning">
      <strong>注意</strong>: 定时任务在后台独立运行，无法进行交互式对话。任务指令需要是自包含的，能够独立完成。
    </div>
  </DocsLayout>
</template>

<script setup>
import DocsLayout from '~/layouts/docs.vue'

useHead({
  title: '定时任务 - Hermes Show 文档'
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
