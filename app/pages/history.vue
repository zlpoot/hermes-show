<template>
  <div class="h-[calc(100vh-10rem)] flex gap-6">
    <!-- Session List -->
    <div class="w-80 glass-panel flex flex-col overflow-hidden">
      <div class="p-4 border-b border-card-border">
        <h3 class="font-semibold flex items-center gap-2">
          <History size="18" class="text-primary" />
          会话检索 (FTS5)
        </h3>
        <div class="relative mt-4">
          <Search size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="搜索历史对话..." class="w-full bg-background border border-card-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors">
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <button v-for="session in sessions" :key="session.id"
          @click="activeSession = session.id"
          class="w-full text-left p-3 rounded-lg transition-colors border border-transparent hover:bg-muted/50"
          :class="activeSession === session.id ? 'bg-primary/10 border-primary/30' : ''">
          <h4 class="text-sm font-medium line-clamp-1" :class="activeSession === session.id ? 'text-primary' : 'text-foreground'">{{ session.title }}</h4>
          <div class="flex items-center justify-between mt-2">
            <span class="text-xs text-muted-foreground">{{ session.date }}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-card-border/50 text-muted-foreground">{{ session.platform }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Conversation Detail -->
    <div class="flex-1 glass-panel flex flex-col overflow-hidden">
      <div class="p-4 border-b border-card-border flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-card-border">
            <MessageSquare size="20" class="text-muted-foreground" />
          </div>
          <div>
            <h2 class="font-semibold">{{ currentSession?.title || '选择一个会话' }}</h2>
            <p class="text-xs text-muted-foreground">{{ currentSession?.id || '---' }}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2" v-if="currentSession">
          <span class="text-xs px-2 py-1 bg-background border border-card-border rounded-md text-muted-foreground">Tokens: {{ currentSession.tokens }}</span>
          <button class="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <Download size="16" />
          </button>
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <div v-if="!currentSession" class="h-full flex flex-col items-center justify-center text-muted-foreground">
          <MessageSquare size="48" class="mb-4 opacity-20" />
          <p>从左侧选择会话以查看详细信息</p>
        </div>
        
        <template v-else>
          <!-- User Message -->
          <div class="flex gap-4 max-w-3xl">
            <div class="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center shrink-0">
              <User size="16" class="text-secondary" />
            </div>
            <div class="pt-1">
              <p class="text-sm text-muted-foreground mb-1 font-medium">User</p>
              <div class="bg-muted/50 p-4 rounded-2xl rounded-tl-none border border-card-border text-sm leading-relaxed">
                帮助我分析一下当前项目的目录结构，并给出一份重构建议。
              </div>
            </div>
          </div>
          
          <!-- Tool Call -->
          <div class="flex gap-4 max-w-3xl">
            <div class="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Wrench size="16" class="text-amber-500" />
            </div>
            <div class="pt-1 w-full">
              <p class="text-sm text-amber-500 mb-1 font-medium">Tool Call: run_command</p>
              <div class="bg-background p-3 rounded-xl border border-card-border text-xs font-mono text-muted-foreground">
                <div class="flex items-center gap-2 mb-2">
                  <TerminalSquare size="14" />
                  <span class="text-foreground">ls -la src/</span>
                </div>
                <div class="pl-4 border-l-2 border-card-border opacity-70">
                  <p>drwxr-xr-x 1 root root 4096 Apr 17 08:00 components</p>
                  <p>drwxr-xr-x 1 root root 4096 Apr 17 08:00 pages</p>
                  <p>drwxr-xr-x 1 root root 4096 Apr 17 08:00 utils</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Agent Message -->
          <div class="flex gap-4 max-w-3xl">
            <div class="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <Bot size="16" class="text-primary" />
            </div>
            <div class="pt-1">
              <p class="text-sm text-primary mb-1 font-medium">Hermes Agent</p>
              <div class="bg-primary/5 p-4 rounded-2xl rounded-tl-none border border-primary/20 text-sm leading-relaxed prose prose-invert max-w-none">
                <p>根据 `src/` 目录的输出，我建议进行如下重构以提升可维护性：</p>
                <ol class="list-decimal pl-4 mt-2 space-y-1">
                  <li><strong>拆分 Components</strong>：将 `components` 按照业务领域（如 `common/`, `layout/`, `features/`）进行分类。</li>
                  <li><strong>引入 Composables/Hooks</strong>：将页面逻辑抽离到独立的 `composables` 目录中。</li>
                  <li><strong>API 隔离</strong>：在 `src/` 外层或内部建立 `api` 目录统一管理请求逻辑。</li>
                </ol>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { History, Search, MessageSquare, Download, User, Bot, Wrench, TerminalSquare } from 'lucide-vue-next'

const sessions = [
  { id: 'sess-a1b2', title: '项目结构重构建议', date: '2026-04-17 14:32', platform: 'CLI', tokens: '4,210' },
  { id: 'sess-c3d4', title: '配置 S3 每日自动备份', date: '2026-04-16 09:15', platform: 'Telegram', tokens: '1,504' },
  { id: 'sess-e5f6', title: '生成并审核代码 PR', date: '2026-04-15 16:45', platform: 'GitHub Copilot', tokens: '8,920' },
  { id: 'sess-g7h8', title: '查询上周的服务器日志错误', date: '2026-04-15 10:20', platform: 'Discord', tokens: '2,341' },
]

const activeSession = ref('sess-a1b2')

const currentSession = computed(() => {
  return sessions.find(s => s.id === activeSession.value)
})
</script>
