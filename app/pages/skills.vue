<template>
  <div class="h-[calc(100vh-10rem)] flex gap-6">
    <!-- Skills List -->
    <div class="w-80 glass-panel flex flex-col overflow-hidden">
      <div class="p-4 border-b border-card-border">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold flex items-center gap-2">
            <BookOpen size="18" class="text-primary" />
            Skills 库
          </h3>
          <span class="text-xs text-muted-foreground">{{ skills.length }} 个</span>
        </div>
        
        <!-- Search -->
        <div class="relative">
          <Search size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" v-model="searchQuery" 
            placeholder="搜索技能..." 
            class="w-full bg-background border border-card-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary" />
        </div>
        
        <!-- Category Filter -->
        <div class="flex flex-wrap gap-1.5 mt-3">
          <button @click="selectedCategory = ''" 
            class="text-xs px-2 py-1 rounded-md transition-colors"
            :class="!selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'">
            全部
          </button>
          <button v-for="cat in categories" :key="cat" @click="selectedCategory = cat"
            class="text-xs px-2 py-1 rounded-md transition-colors"
            :class="selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'">
            {{ cat }}
          </button>
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <div v-for="skill in filteredSkills" :key="skill.id"
          class="p-3 rounded-lg cursor-pointer transition-colors border border-transparent"
          :class="selectedSkill?.id === skill.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50'"
          @click="selectSkill(skill.id)">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-medium truncate" :class="selectedSkill?.id === skill.id ? 'text-primary' : ''">
                {{ skill.name }}
              </h4>
              <p class="text-xs text-muted-foreground mt-1 line-clamp-2">{{ skill.description }}</p>
            </div>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-2 shrink-0">
              {{ skill.category }}
            </span>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <span v-if="skill.hasReferences" class="text-[10px] text-blue-400 flex items-center gap-0.5">
              <FileText size="10" /> refs
            </span>
            <span v-if="skill.hasScripts" class="text-[10px] text-amber-400 flex items-center gap-0.5">
              <TerminalSquare size="10" /> scripts
            </span>
            <span v-if="skill.hasTemplates" class="text-[10px] text-purple-400 flex items-center gap-0.5">
              <LayoutTemplate size="10" /> templates
            </span>
          </div>
        </div>
        
        <div v-if="filteredSkills.length === 0" class="text-center text-muted-foreground py-8">
          <BookOpen size="32" class="mx-auto mb-2 opacity-50" />
          <p class="text-sm">未找到匹配的技能</p>
        </div>
      </div>
    </div>

    <!-- Skill Detail -->
    <div class="flex-1 glass-panel flex flex-col overflow-hidden">
      <template v-if="skillDetail">
        <!-- Header -->
        <div class="p-4 border-b border-card-border">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-xl font-semibold">{{ skillDetail.skill.name }}</h2>
              <p class="text-sm text-muted-foreground mt-1">{{ skillDetail.skill.description }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-1 bg-primary/10 text-primary border border-primary/30 rounded">
                {{ skillDetail.skill.category }}
              </span>
              <span class="text-xs text-muted-foreground">v{{ skillDetail.skill.version }}</span>
            </div>
          </div>
          
          <!-- Tags -->
          <div v-if="skillDetail.skill.tags?.length" class="flex flex-wrap gap-1.5 mt-3">
            <span v-for="tag in skillDetail.skill.tags" :key="tag"
              class="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
              {{ tag }}
            </span>
          </div>
          
          <!-- Meta -->
          <div class="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span v-if="skillDetail.skill.author">作者: {{ skillDetail.skill.author }}</span>
            <span v-if="skillDetail.skill.license">许可证: {{ skillDetail.skill.license }}</span>
          </div>
        </div>
        
        <!-- Content Tabs -->
        <div class="flex border-b border-card-border">
          <button v-for="tab in availableTabs" :key="tab.id"
            @click="activeTab = tab.id"
            class="px-4 py-2 text-sm transition-colors"
            :class="activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'">
            <component :is="tab.icon" size="14" class="inline mr-1" />
            {{ tab.label }}
          </button>
        </div>
        
        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- README -->
          <div v-if="activeTab === 'readme'" class="prose prose-invert max-w-none">
            <pre class="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-xl border border-card-border overflow-x-auto">{{ skillDetail.content || '暂无详细说明' }}</pre>
          </div>
          
          <!-- References -->
          <div v-else-if="activeTab === 'references'" class="space-y-2">
            <div v-for="ref in skillDetail.references" :key="ref"
              class="p-3 bg-muted/30 rounded-lg border border-card-border hover:border-primary/50 cursor-pointer transition-colors"
              @click="viewReference(ref)">
              <div class="flex items-center gap-2">
                <FileText size="16" class="text-blue-400" />
                <span class="text-sm">{{ ref }}</span>
              </div>
            </div>
            <div v-if="!skillDetail.references?.length" class="text-center text-muted-foreground py-8">
              <FileText size="32" class="mx-auto mb-2 opacity-50" />
              <p class="text-sm">无参考文档</p>
            </div>
          </div>
          
          <!-- Scripts -->
          <div v-else-if="activeTab === 'scripts'" class="space-y-2">
            <div v-for="script in skillDetail.scripts" :key="script"
              class="p-3 bg-muted/30 rounded-lg border border-card-border hover:border-primary/50 cursor-pointer transition-colors"
              @click="viewScript(script)">
              <div class="flex items-center gap-2">
                <TerminalSquare size="16" class="text-amber-400" />
                <span class="text-sm font-mono">{{ script }}</span>
              </div>
            </div>
            <div v-if="!skillDetail.scripts?.length" class="text-center text-muted-foreground py-8">
              <TerminalSquare size="32" class="mx-auto mb-2 opacity-50" />
              <p class="text-sm">无脚本文件</p>
            </div>
          </div>
        </div>
      </template>
      
      <!-- Empty State -->
      <div v-else class="h-full flex flex-col items-center justify-center text-muted-foreground">
        <BookOpen size="48" class="mb-4 opacity-20" />
        <p>从左侧选择一个技能查看详情</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { BookOpen, Search, FileText, TerminalSquare, LayoutTemplate, Code, FileCode } from 'lucide-vue-next'

const { data } = await useFetch('/api/skills')

const skills = computed(() => data.value?.skills || [])
const categories = computed(() => data.value?.categories || [])

const searchQuery = ref('')
const selectedCategory = ref('')
const selectedSkill = ref<string | null>(null)
const skillDetail = ref<any>(null)
const activeTab = ref('readme')

const filteredSkills = computed(() => {
  let result = skills.value
  
  if (selectedCategory.value) {
    result = result.filter((s: any) => s.category === selectedCategory.value)
  }
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((s: any) => 
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags?.some((t: string) => t.toLowerCase().includes(q))
    )
  }
  
  return result
})

const availableTabs = computed(() => {
  const tabs = [{ id: 'readme', label: '说明', icon: FileText }]
  if (skillDetail.value?.references?.length) {
    tabs.push({ id: 'references', label: `参考文档 (${skillDetail.value.references.length})`, icon: BookOpen })
  }
  if (skillDetail.value?.scripts?.length) {
    tabs.push({ id: 'scripts', label: `脚本 (${skillDetail.value.scripts.length})`, icon: TerminalSquare })
  }
  return tabs
})

const selectSkill = async (skillId: string) => {
  selectedSkill.value = skillId
  activeTab.value = 'readme'
  
  try {
    const detail = await $fetch(`/api/skills?id=${skillId}`)
    skillDetail.value = detail
  } catch (e) {
    console.error('Failed to load skill detail:', e)
  }
}

const viewReference = async (filename: string) => {
  // TODO: Load and display reference content
  console.log('View reference:', filename)
}

const viewScript = async (filename: string) => {
  // TODO: Load and display script content
  console.log('View script:', filename)
}
</script>
