import { defineEventHandler, getQuery } from 'h3'
import { getHermesPath } from '../utils/hermes'
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'yaml'

interface SkillMeta {
  name: string
  description: string
  version?: string
  author?: string
  license?: string
  created?: string
  metadata?: {
    hermes?: {
      tags?: string[]
      related_skills?: string[]
      category?: string
    }
  }
}

interface Skill {
  id: string
  name: string
  description: string
  category: string
  version: string
  author: string
  license: string
  tags: string[]
  related_skills: string[]
  path: string
  hasReferences: boolean
  hasScripts: boolean
  hasTemplates: boolean
  source: 'learned' | 'bundled'  // learned = 自己学会的, bundled = 内置的
  createdAt: number  // 文件创建时间戳
}

/**
 * 加载内置技能清单
 * .bundled_manifest 文件格式: "skill-id:hash" 每行一个
 */
function loadBundledManifest(skillsDir: string): Set<string> {
  const manifestPath = path.join(skillsDir, '.bundled_manifest')
  const bundledIds = new Set<string>()
  
  if (fs.existsSync(manifestPath)) {
    try {
      const content = fs.readFileSync(manifestPath, 'utf-8')
      const lines = content.split('\n').filter(Boolean)
      for (const line of lines) {
        const skillId = line.split(':')[0]
        if (skillId) bundledIds.add(skillId)
      }
    } catch (e) {
      console.error('Failed to load bundled manifest:', e)
    }
  }
  
  return bundledIds
}

function parseSkillMd(skillPath: string): SkillMeta | null {
  try {
    const content = fs.readFileSync(skillPath, 'utf8')
    // Extract YAML frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (match && match[1]) {
      return yaml.parse(match[1]) as SkillMeta
    }
  } catch (e) {}
  return null
}

function scanSkillsDir(skillsDir: string): Skill[] {
  const skills: Skill[] = []
  
  if (!fs.existsSync(skillsDir)) return skills
  
  // 加载内置技能清单
  const bundledIds = loadBundledManifest(skillsDir)
  
  // Scan categories
  const categories = fs.readdirSync(skillsDir).filter(f => {
    const p = path.join(skillsDir, f)
    return fs.statSync(p).isDirectory() && !f.startsWith('.')
  })
  
  for (const category of categories) {
    const categoryPath = path.join(skillsDir, category)
    const skillDirs = fs.readdirSync(categoryPath).filter(f => {
      const p = path.join(categoryPath, f)
      return fs.statSync(p).isDirectory()
    })
    
    for (const skillDir of skillDirs) {
      const skillPath = path.join(categoryPath, skillDir)
      const skillMdPath = path.join(skillPath, 'SKILL.md')
      
      if (fs.existsSync(skillMdPath)) {
        const meta = parseSkillMd(skillMdPath)
        const stat = fs.statSync(skillMdPath)
        const createdAt = stat.birthtimeMs || stat.ctimeMs
        
        // Check for subdirectories
        const hasReferences = fs.existsSync(path.join(skillPath, 'references'))
        const hasScripts = fs.existsSync(path.join(skillPath, 'scripts'))
        const hasTemplates = fs.existsSync(path.join(skillPath, 'templates'))
        
        // 判断技能来源：在 bundled manifest 中的为内置技能，否则为自学习技能
        const isBundled = bundledIds.has(skillDir)
        
        skills.push({
          id: `${category}/${skillDir}`,
          name: meta?.name || skillDir,
          description: meta?.description || 'No description',
          category: category,
          version: meta?.version || '1.0.0',
          author: meta?.author || 'Unknown',
          license: meta?.license || 'MIT',
          tags: meta?.metadata?.hermes?.tags || [],
          related_skills: meta?.metadata?.hermes?.related_skills || [],
          path: skillPath,
          hasReferences,
          hasScripts,
          hasTemplates,
          source: isBundled ? 'bundled' : 'learned',
          createdAt
        })
      }
    }
  }
  
  return skills
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const hermesPath = getHermesPath()
  
  // 尝试两个可能的 skills 目录位置
  let skillsDir = path.join(hermesPath, 'skills')
  if (!fs.existsSync(skillsDir)) {
    skillsDir = path.join(hermesPath, 'hermes-agent', 'skills')
  }
  
  let skills = scanSkillsDir(skillsDir)
  
  // Filter by source (learned/bundled)
  if (query.source) {
    skills = skills.filter(s => s.source === query.source)
  }
  
  // Filter by category
  if (query.category) {
    skills = skills.filter(s => s.category === query.category)
  }
  
  // Filter by search query
  if (query.q) {
    const q = (query.q as string).toLowerCase()
    skills = skills.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    )
  }
  
  // Get unique categories
  const categories = [...new Set(skills.map(s => s.category))]
  
  // 按来源分组统计
  const learnedCount = skills.filter(s => s.source === 'learned').length
  const bundledCount = skills.filter(s => s.source === 'bundled').length
  
  // Get skill detail if id is provided
  if (query.id) {
    const skill = skills.find(s => s.id === query.id)
    if (skill) {
      const skillMdPath = path.join(skill.path, 'SKILL.md')
      let content = ''
      try {
        content = fs.readFileSync(skillMdPath, 'utf8')
        // Remove frontmatter for display
        content = content.replace(/^---\n[\s\S]*?\n---\n?/, '')
      } catch (e) {}
      
      // List reference files
      let references: string[] = []
      const refPath = path.join(skill.path, 'references')
      if (fs.existsSync(refPath)) {
        references = fs.readdirSync(refPath).filter(f => f.endsWith('.md'))
      }
      
      // List script files
      let scripts: string[] = []
      const scriptPath = path.join(skill.path, 'scripts')
      if (fs.existsSync(scriptPath)) {
        scripts = fs.readdirSync(scriptPath).filter(f => f.endsWith('.py') || f.endsWith('.sh'))
      }
      
      // 提取中文说明（查找 ## 中文说明 或 ## 简介 部分）
      let chineseDescription = ''
      const chineseMatch = content.match(/##\s*(?:中文说明|简介|中文简介)\s*\n([\s\S]*?)(?=\n##\s|$)/)
      if (chineseMatch) {
        chineseDescription = chineseMatch[1].trim()
      }
      
      return {
        skill,
        content,
        chineseDescription,
        references,
        scripts,
        stats: {
          calls: 0,
          successRate: '100.0',
          avgTime: 0,
          lastUsed: '未知'
        },
        isRealHermesConnected: true
      }
    }
    
    return {
      skill: null,
      error: 'Skill not found',
      isRealHermesConnected: true
    }
  }
  
  // 按来源和分类组织数据
  const groupedBySource = {
    learned: {
      label: '自学习技能',
      description: '通过对话学习并总结的技能',
      icon: 'Brain',
      count: learnedCount,
      categories: {} as Record<string, Skill[]>
    },
    bundled: {
      label: '内置技能',
      description: '系统预置的专业技能',
      icon: 'Package',
      count: bundledCount,
      categories: {} as Record<string, Skill[]>
    }
  }
  
  // 填充分类数据
  for (const skill of skills) {
    const group = groupedBySource[skill.source]
    if (!group.categories[skill.category]) {
      group.categories[skill.category] = []
    }
    group.categories[skill.category].push(skill)
  }
  
  return {
    skills,
    categories: categories.sort(),
    total: skills.length,
    learnedCount,
    bundledCount,
    groupedBySource,
    isRealHermesConnected: true,
    skillsPath: skillsDir
  }
})
