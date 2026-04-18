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
          <div v-for="(msg, idx) in messages" :key="idx" class="flex gap-4 max-w-3xl">
            <!-- User Message -->
            <template v-if="msg.role === 'user'">
              <div class="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center shrink-0">
                <User size="16" class="text-secondary" />
              </div>
              <div class="pt-1">
                <p class="text-sm text-muted-foreground mb-1 font-medium">User</p>
                <div class="bg-muted/50 p-4 rounded-2xl rounded-tl-none border border-card-border text-sm leading-relaxed">
                  {{ msg.content }}
                </div>
              </div>
            </template>
            
            <!-- Tool Call -->
            <template v-else-if="msg.role === 'tool' || msg.tool_name">
              <div class="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Wrench size="16" class="text-amber-500" />
              </div>
              <div class="pt-1 w-full">
                <p class="text-sm text-amber-500 mb-1 font-medium">Tool Call: {{ msg.tool_name || 'unknown_tool' }}</p>
                <div class="bg-background p-3 rounded-xl border border-card-border text-xs font-mono text-muted-foreground">
                  <div class="pl-4 border-l-2 border-card-border opacity-70 whitespace-pre-wrap">
                    {{ msg.content }}
                  </div>
                </div>
              </div>
            </template>
            
            <!-- Agent Message -->
            <template v-else-if="msg.role === 'assistant'">
              <div class="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <Bot size="16" class="text-primary" />
              </div>
              <div class="pt-1">
                <p class="text-sm text-primary mb-1 font-medium">Hermes Agent</p>
                <div class="bg-primary/5 p-4 rounded-2xl rounded-tl-none border border-primary/20 text-sm leading-relaxed prose prose-invert max-w-none whitespace-pre-wrap">
                  {{ msg.content }}
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { History, Search, MessageSquare, Download, User, Bot, Wrench, TerminalSquare } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const { data } = await useFetch('/api/history')

const sessions = computed(() => data.value?.sessions || [])
const activeSession = ref((route.query.id as string) || sessions.value[0]?.id || '')
const activeSessionDetail = ref(null)

watch(activeSession, async (newId) => {
  if (newId) {
    // Update URL to reflect selected session (without page reload)
    if (route.query.id !== newId) {
      router.replace({ query: { ...route.query, id: newId } })
    }
    
    const { data: detailData } = await useFetch(`/api/history?id=${newId}`)
    activeSessionDetail.value = detailData.value
  }
}, { immediate: true })

// Also react to external URL changes (e.g. browser back button)
watch(() => route.query.id, (newId) => {
  if (newId && newId !== activeSession.value) {
    activeSession.value = newId as string
  }
})

const currentSession = computed(() => {
  return sessions.value.find(s => s.id === activeSession.value)
})

const messages = computed(() => activeSessionDetail.value?.messages || [])
</script>
