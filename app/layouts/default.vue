<template>
  <div class="flex h-screen bg-background text-foreground overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 glass-panel border-r-0 border-l-0 rounded-none rounded-r-2xl flex flex-col z-10 relative">
      <div class="p-6 border-b border-card-border flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <Bot size="20" />
        </div>
        <h1 class="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Hermes Agent</h1>
      </div>
      
      <nav class="flex-1 overflow-y-auto p-4 space-y-2">
        <NuxtLink v-for="item in menuItems" :key="item.path" :to="item.path" 
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group"
          :class="route.path === item.path ? 'bg-primary/10 text-primary shadow-[inset_2px_0_0_rgba(16,185,129,1)]' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'">
          <component :is="item.icon" size="18" :class="route.path === item.path ? 'text-primary' : 'group-hover:text-primary/70 transition-colors'" />
          <span class="font-medium">{{ item.name }}</span>
        </NuxtLink>
        
        <!-- 文档链接 -->
        <div class="mt-4 pt-4 border-t border-card-border">
          <NuxtLink to="/docs" target="_blank"
            class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-muted-foreground hover:bg-muted/50 hover:text-foreground group">
            <BookOpen size="18" class="group-hover:text-primary/70 transition-colors" />
            <span class="font-medium">文档</span>
            <ExternalLink size="14" class="ml-auto opacity-50" />
          </NuxtLink>
        </div>
      </nav>
      
      <div class="p-4 border-t border-card-border">
        <div class="glass-panel p-4 rounded-xl flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_5px_rgba(16,185,129,1)]"></div>
            <span class="text-sm font-medium text-muted-foreground">Gateway 运行中</span>
          </div>
          <button class="text-muted-foreground hover:text-primary transition-colors">
            <Settings size="16" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-full relative overflow-hidden">
      <!-- Top header -->
      <header class="h-16 glass-nav flex items-center justify-between px-8 z-10 relative">
        <h2 class="text-lg font-semibold">{{ currentTitle }}</h2>
        <div class="flex items-center gap-4">
          <div class="px-3 py-1.5 rounded-full bg-muted/50 border border-card-border text-xs font-mono flex items-center gap-2">
            <Cpu size="14" class="text-secondary" />
            <span>0.8.0 (v2026.4.8)</span>
          </div>
          <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-card-border">
            <User size="16" class="text-muted-foreground" />
          </div>
        </div>
      </header>
      
      <!-- Page Content -->
      <div class="flex-1 overflow-y-auto p-8 z-0 relative">
        <!-- Abstract Background Decoration -->
        <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div class="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
          <div class="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-[150px]"></div>
        </div>
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutDashboard, SlidersHorizontal, History, TerminalSquare, Bot, Settings, Cpu, User, BookOpen, Clock, Radio, ExternalLink, DollarSign, Activity, Gauge, Server, HardDrive } from 'lucide-vue-next'

const route = useRoute()

const menuItems = [
  { name: '仪表盘', path: '/', icon: LayoutDashboard },
  { name: '配置中心', path: '/config', icon: SlidersHorizontal },
  { name: '成本统计', path: '/cost', icon: DollarSign },
  { name: '提供商监控', path: '/providers', icon: Server },
  { name: '健康检查', path: '/health', icon: Activity },
  { name: '对话历史', path: '/history', icon: History },
  { name: 'Skills 管理', path: '/skills', icon: BookOpen },
  { name: '定时任务', path: '/cron', icon: Clock },
  { name: '备份管理', path: '/backup', icon: HardDrive },
  { name: '网关状态', path: '/gateway', icon: Radio },
  { name: '系统日志', path: '/logs', icon: TerminalSquare },
]

const currentTitle = computed(() => {
  const current = menuItems.find(item => item.path === route.path)
  return current ? current.name : 'Hermes Agent'
})
</script>
