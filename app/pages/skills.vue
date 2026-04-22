<template>
  <div class="h-[calc(100vh-10rem)] flex gap-6">
    <!-- Left Panel: Source & Category Navigation -->
    <div class="w-72 glass-panel flex flex-col overflow-hidden">
      <div class="p-4 border-b border-card-border">
        <h3 class="font-semibold flex items-center gap-2">
          <BookOpen :size="18" class="text-primary" />
          Skills 库
        </h3>
        <p class="text-xs text-muted-foreground mt-1">共 {{ totalSkills }} 个技能</p>
      </div>
      
      <!-- Source Groups -->
      <div class="flex-1 overflow-y-auto">
        <div v-for="(group, sourceKey) in sourceGroups" :key="sourceKey" class="border-b border-card-border last:border-b-0">
          <!-- Source Header -->
          <button 
            @click="toggleSource(sourceKey)"
            class="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div class="flex items-center gap-2">
              <component :is="sourceKey === 'learned' ? Brain : Package" :size="18" 
                :class="sourceKey === 'learned' ? 'text-green-400' : 'text-blue-400'" />
              <span class="font-medium text-sm">{{ group.label }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-0.5 rounded-full bg-muted">{{ group.count }}</span>
              <ChevronDown :size="16" class="text-muted-foreground transition-transform"
                :class="expandedSources.includes(sourceKey) ? '' : '-rotate-90'" />
            </div>
          </button>
          
          <!-- Categories under this source -->
          <div v-show="expandedSources.includes(sourceKey)" class="bg-muted/10">
            <button 
              v-for="(skills, category) in group.categories" 
              :key="category"
              @click="selectCategory(sourceKey, category)"
              class="w-full px-4 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors"
              :class="selectedSource === sourceKey && selectedCategory === category ? 'bg-primary/10 border-l-2 border-primary' : 'border-l-2 border-transparent'">
              <span class="text-sm text-muted-foreground">{{ category }}</span>
              <span class="text-xs text-muted-foreground">{{ skills.length }}</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Search -->
      <div class="p-3 border-t border-card-border">
        <div class="relative">
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" v-model="searchQuery" 
            placeholder="搜索技能..." 
            class="w-full bg-background border border-card-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary" />
        </div>
      </div>
    </div>

    <!-- Middle Panel: Skills List -->
    <div class="w-80 glass-panel flex flex-col overflow-hidden">
      <div class="p-4 border-b border-card-border">
        <div class="flex items-center justify-between">
          <h4 class="font-medium text-sm">
            <template v-if="searchQuery">搜索结果</template>
            <template v-else-if="selectedSource && selectedCategory">
              {{ sourceGroups[selectedSource]?.label }} / {{ selectedCategory }}
            </template>
            <template v-else>全部技能</template>
          </h4>
          <span class="text-xs text-muted-foreground">{{ filteredSkills.length }} 个</span>
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <div v-for="skill in filteredSkills" :key="skill.id"
          class="p-3 rounded-lg cursor-pointer transition-colors border border-transparent"
          :class="selectedSkill === skill.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50'"
          @click="selectSkill(skill.id)">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-medium truncate" :class="selectedSkill === skill.id ? 'text-primary' : ''">
                  {{ skill.name }}
                </h4>
                <span v-if="skill.source === 'learned'" 
                  class="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                  自学习
                </span>
              </div>
              <p class="text-xs text-muted-foreground mt-1 line-clamp-2">{{ skill.description }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {{ skill.category }}
            </span>
            <span v-if="skill.hasReferences" class="text-[10px] text-blue-400 flex items-center gap-0.5">
              <FileText :size="10" /> refs
            </span>
            <span v-if="skill.hasScripts" class="text-[10px] text-amber-400 flex items-center gap-0.5">
              <TerminalSquare :size="10" /> scripts
            </span>
            <span v-if="skill.hasTemplates" class="text-[10px] text-purple-400 flex items-center gap-0.5">
              <LayoutTemplate :size="10" /> templates
            </span>
          </div>
        </div>
        
        <div v-if="filteredSkills.length === 0" class="text-center text-muted-foreground py-8">
          <BookOpen :size="32" class="mx-auto mb-2 opacity-50" />
          <p class="text-sm">未找到匹配的技能</p>
        </div>
      </div>
    </div>

    <!-- Right Panel: Skill Detail -->
    <div class="flex-1 glass-panel flex flex-col overflow-hidden">
      <template v-if="skillDetail">
        <!-- Header -->
        <div class="p-4 border-b border-card-border">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-semibold">{{ skillDetail.skill.name }}</h2>
                <span v-if="skillDetail.skill.source === 'learned'" 
                  class="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  自学习技能
                </span>
                <span v-else 
                  class="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  内置技能
                </span>
              </div>
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
        <div class="flex border-b border-card-border items-center justify-between">
          <div class="flex">
            <button v-for="tab in availableTabs" :key="tab.id"
              @click="activeTab = tab.id"
              class="px-4 py-2 text-sm transition-colors"
              :class="activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'">
              <component :is="tab.icon" :size="14" class="inline mr-1" />
              {{ tab.label }}
            </button>
          </div>
          <!-- Preview Toggle -->
          <button @click="previewMode = !previewMode"
            class="px-3 py-1.5 mr-3 text-xs rounded-full border transition-colors flex items-center gap-1.5"
            :class="previewMode ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-muted/30 border-card-border text-muted-foreground hover:text-foreground'">
            <Eye v-if="previewMode" :size="12" />
            <Code v-else :size="12" />
            {{ previewMode ? '预览' : '源码' }}
          </button>
        </div>
        
        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- 内容 Tab -->
          <div v-if="activeTab === 'content'">
            <div class="prose prose-invert max-w-none" v-if="previewMode" v-html="renderMarkdown(skillDetail.content || '暂无内容')"></div>
            <pre v-else class="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-xl border border-card-border overflow-x-auto">{{ skillDetail.content || '暂无内容' }}</pre>
          </div>
          
          <!-- 说明 Tab -->
          <div v-else-if="activeTab === 'description'">
            <div v-if="skillDetail.description" class="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div class="prose prose-invert max-w-none" v-if="previewMode" v-html="renderMarkdown(skillDetail.description)"></div>
              <pre v-else class="whitespace-pre-wrap text-sm text-foreground">{{ skillDetail.description }}</pre>
            </div>
            <div v-else class="text-center text-muted-foreground py-8">
              <BookOpen :size="32" class="mx-auto mb-2 opacity-50" />
              <p class="text-sm">暂无中文说明</p>
              <p class="text-xs mt-1">可创建 DESCRIPTION.zh-CN.md 文件添加说明</p>
            </div>
          </div>
          
          <!-- References Tab -->
          <div v-else-if="activeTab === 'references'" class="space-y-4">
            <div v-for="ref in skillDetail.references" :key="ref.filename"
              class="bg-muted/30 rounded-lg border border-card-border overflow-hidden">
              <div class="px-4 py-2 bg-muted/50 border-b border-card-border flex items-center gap-2">
                <FileText :size="16" class="text-blue-400" />
                <span class="text-sm font-medium">{{ ref.filename }}</span>
              </div>
              <div class="prose prose-invert max-w-none p-4" v-if="previewMode" v-html="renderMarkdown(ref.content)"></div>
              <pre v-else class="p-4 text-sm overflow-x-auto whitespace-pre-wrap">{{ ref.content }}</pre>
            </div>
            <div v-if="!skillDetail.references?.length" class="text-center text-muted-foreground py-8">
              <FileText :size="32" class="mx-auto mb-2 opacity-50" />
              <p class="text-sm">无参考文档</p>
            </div>
          </div>
          
          <!-- Scripts Tab -->
          <div v-else-if="activeTab === 'scripts'" class="space-y-2">
            <div v-for="script in skillDetail.scripts" :key="script"
              class="p-3 bg-muted/30 rounded-lg border border-card-border hover:border-primary/50 cursor-pointer transition-colors"
              @click="viewScript(script)">
              <div class="flex items-center gap-2">
                <TerminalSquare :size="16" class="text-amber-400" />
                <span class="text-sm font-mono">{{ script }}</span>
              </div>
            </div>
            <div v-if="!skillDetail.scripts?.length" class="text-center text-muted-foreground py-8">
              <TerminalSquare :size="32" class="mx-auto mb-2 opacity-50" />
              <p class="text-sm">无脚本文件</p>
            </div>
          </div>
        </div>
      </template>
      
      <!-- Empty State -->
      <div v-else class="h-full flex flex-col items-center justify-center text-muted-foreground">
        <BookOpen :size="48" class="mb-4 opacity-20" />
        <p>从左侧选择一个技能查看详情</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'
import { BookOpen, Search, FileText, TerminalSquare, LayoutTemplate, Brain, Package, ChevronDown, Eye, Code } from 'lucide-vue-next'

interface Skill {
  id: string
  name: string
  description: string
  category: string
  version: string
  author: string
  license: string
  tags: string[]
  source: 'learned' | 'bundled'
  hasReferences: boolean
  hasScripts: boolean
  hasTemplates: boolean
}

interface SkillDetail {
  skill: Skill
  content?: string
  description?: string
  references?: { filename: string; content: string }[]
  scripts?: string[]
}

interface SourceGroup {
  label: string
  description: string
  icon: string
  count: number
  categories: Record<string, Skill[]>
}

interface SkillsListResponse {
  skills: Skill[]
  total: number
  learnedCount: number
  bundledCount: number
  groupedBySource: {
    learned: SourceGroup
    bundled: SourceGroup
  }
}

interface SkillDetailResponse {
  skill: Skill
  content?: string
  references?: string[]
  scripts?: string[]
}

const { data } = await useFetch<SkillsListResponse>('/api/skills')

const skills = computed(() => data.value?.skills || [])
const totalSkills = computed(() => data.value?.total || 0)
const sourceGroups = computed(() => data.value?.groupedBySource || { learned: { label: '自学习技能', description: '', icon: 'Brain', count: 0, categories: {} }, bundled: { label: '内置技能', description: '', icon: 'Package', count: 0, categories: {} } })

const searchQuery = ref('')
const expandedSources = ref<string[]>(['learned', 'bundled'])
const selectedSource = ref<string | null>(null)
const selectedCategory = ref<string | null>(null)
const selectedSkill = ref<string | null>(null)
const skillDetail = ref<SkillDetail | null>(null)
const activeTab = ref('readme')
const previewMode = ref(true) // 默认开启预览模式

// Markdown 渲染函数
const renderMarkdown = (text: string): string => {
  if (!text) return ''
  return marked.parse(text, { breaks: true, gfm: true }) as string
}

const filteredSkills = computed(() => {
  let result = skills.value
  
  // Filter by source and category
  if (selectedSource.value && selectedCategory.value) {
    result = result.filter(s => s.source === selectedSource.value && s.category === selectedCategory.value)
  }
  
  // Filter by search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags?.some(t => t.toLowerCase().includes(q))
    )
  }
  
  return result
})

const availableTabs = computed(() => {
  const tabs = [
    { id: 'content', label: '内容', icon: FileText },
    { id: 'description', label: '说明', icon: BookOpen }
  ]
  if (skillDetail.value?.references?.length) {
    tabs.push({ id: 'references', label: `参考文档 (${skillDetail.value.references.length})`, icon: FileText })
  }
  if (skillDetail.value?.scripts?.length) {
    tabs.push({ id: 'scripts', label: `脚本 (${skillDetail.value.scripts.length})`, icon: TerminalSquare })
  }
  return tabs
})

const toggleSource = (sourceKey: string) => {
  const index = expandedSources.value.indexOf(sourceKey)
  if (index > -1) {
    expandedSources.value.splice(index, 1)
  } else {
    expandedSources.value.push(sourceKey)
  }
}

const selectCategory = (sourceKey: string, category: string) => {
  selectedSource.value = sourceKey
  selectedCategory.value = category
  selectedSkill.value = null
  skillDetail.value = null
}

const selectSkill = async (skillId: string) => {
  selectedSkill.value = skillId
  activeTab.value = 'content'
  
  try {
    const detail = await $fetch<SkillDetailResponse>(`/api/skills?id=${skillId}`)
    skillDetail.value = detail
  } catch (e) {
    console.error('Failed to load skill detail:', e)
  }
}

const viewScript = async (filename: string) => {
  console.log('View script:', filename)
}

// Clear category selection when searching
watch(searchQuery, (q) => {
  if (q) {
    selectedSource.value = null
    selectedCategory.value = null
  }
})
</script>
