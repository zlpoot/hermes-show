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
  metadata?: {
    hermes?: {
      tags?: string[]
      related_skills?: string[]
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
}

function parseSkillMd(skillPath: string): SkillMeta | null {
  try {
    const content = fs.readFileSync(skillPath, 'utf8')
    // Extract YAML frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (match) {
      return yaml.parse(match[1]) as SkillMeta
    }
  } catch (e) {}
  return null
}

function scanSkillsDir(skillsDir: string): Skill[] {
  const skills: Skill[] = []
  
  if (!fs.existsSync(skillsDir)) return skills
  
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
        
        // Check for subdirectories
        const hasReferences = fs.existsSync(path.join(skillPath, 'references'))
        const hasScripts = fs.existsSync(path.join(skillPath, 'scripts'))
        const hasTemplates = fs.existsSync(path.join(skillPath, 'templates'))
        
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
          hasTemplates
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
      
      // TODO: 从日志或数据库统计 skill 使用情况
      // 目前返回占位数据
      return {
        skill,
        content,
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
  
  return {
    skills,
    categories: categories.sort(),
    total: skills.length,
    isRealHermesConnected: true,
    skillsPath: skillsDir
  }
})
