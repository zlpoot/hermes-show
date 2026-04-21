import { defineEventHandler, getQuery, readBody, createError } from 'h3'
import { getHermesPath, getRuntimeConfig } from '../../utils/hermes'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import os from 'node:os'

interface CronJob {
  id: string
  name?: string
  schedule: {
    kind: 'once' | 'interval' | 'cron'
    minutes?: number
    expr?: string
    display: string
    value?: string
  }
  prompt?: string
  skills?: string[]
  script?: string
  deliver?: string | string[]
  repeat?: {
    times?: number
    completed?: number
  }
  enabled?: boolean
  state?: string
  next_run_at?: string
  last_run_at?: string
  last_status?: string
  created_at?: string
}

function getJobsFilePath(): string {
  const hermesPath = getHermesPath()
  return path.join(hermesPath, 'cron', 'jobs.json')
}

function loadJobs(): CronJob[] {
  const jobsFile = getJobsFilePath()
  try {
    if (fs.existsSync(jobsFile)) {
      const content = fs.readFileSync(jobsFile, 'utf8')
      const data = JSON.parse(content)
      // Support both {jobs: [...]} and [...] formats
      return Array.isArray(data) ? data : (data.jobs || [])
    }
  } catch (e) {
    console.error('Failed to load cron jobs:', e)
  }
  return []
}

function saveJobs(jobs: CronJob[]): boolean {
  const jobsFile = getJobsFilePath()
  try {
    // Ensure directory exists
    const dir = path.dirname(jobsFile)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(jobsFile, JSON.stringify(jobs, null, 2))
    return true
  } catch (e) {
    console.error('Failed to save cron jobs:', e)
    return false
  }
}

function getOutputDir(jobId: string): string {
  const hermesPath = getHermesPath()
  return path.join(hermesPath, 'cron', 'output', jobId)
}

function getJobOutputs(jobId: string): { timestamp: string; file: string; preview?: string }[] {
  const outputDir = getOutputDir(jobId)
  const outputs: { timestamp: string; file: string; preview?: string }[] = []
  
  try {
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir)
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse()
        .slice(0, 20) // Last 20 outputs
      
      for (const file of files) {
        const filePath = path.join(outputDir, file)
        let preview = ''
        try {
          const content = fs.readFileSync(filePath, 'utf8')
          preview = content.slice(0, 500)
        } catch (e) {}
        
        outputs.push({
          timestamp: file.replace('.md', ''),
          file: filePath,
          preview
        })
      }
    }
  } catch (e) {}
  
  return outputs
}

export default defineEventHandler(async (event) => {
  const method = event.method
  const query = getQuery(event)
  
  // GET - List jobs or get single job
  if (method === 'GET') {
    const jobs = loadJobs()
    
    // Get single job detail
    if (query.id) {
      const job = jobs.find(j => j.id === query.id)
      if (!job) {
        throw createError({
          statusCode: 404,
          message: 'Job not found'
        })
      }
      
      const outputs = getJobOutputs(job.id)
      
      return {
        job,
        outputs,
        isRealHermesConnected: true
      }
    }
    
    // List all jobs - 默认显示所有任务包括暂停的
    const includeDisabled = query.all !== 'false' // 默认包含所有
    let filteredJobs = includeDisabled ? jobs : jobs.filter(j => j.enabled !== false)
    
    // Filter by state
    if (query.state) {
      filteredJobs = filteredJobs.filter(j => j.state === query.state)
    }
    
    return {
      jobs: filteredJobs,
      total: filteredJobs.length,
      allTotal: jobs.length,
      isRealHermesConnected: true
    }
  }
  
  // POST - Create new job
  if (method === 'POST') {
    const body = await readBody(event)
    const jobs = loadJobs()
    
    // Generate ID
    const id = body.id || `cron_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
    
    // Parse schedule
    let schedule: any = {}
    if (typeof body.schedule === 'string') {
      // Simple parsing for display
      const scheduleStr = body.schedule
      if (scheduleStr.startsWith('every ')) {
        schedule = {
          kind: 'interval',
          display: scheduleStr
        }
      } else if (scheduleStr.includes(' ') && scheduleStr.split(' ').length >= 5) {
        schedule = {
          kind: 'cron',
          display: scheduleStr,
          expr: scheduleStr
        }
      } else {
        schedule = {
          kind: 'once',
          display: scheduleStr
        }
      }
    } else if (body.schedule) {
      schedule = body.schedule
    }
    
    const newJob: CronJob = {
      id,
      name: body.name || `Job ${id.slice(0, 8)}`,
      schedule,
      prompt: body.prompt,
      skills: body.skills || [],
      script: body.script,
      deliver: body.deliver || 'local',
      repeat: body.repeat,
      enabled: true,
      state: 'scheduled',
      created_at: new Date().toISOString()
    }
    
    jobs.push(newJob)
    
    if (saveJobs(jobs)) {
      return {
        success: true,
        job: newJob,
        message: 'Job created successfully'
      }
    } else {
      throw createError({
        statusCode: 500,
        message: 'Failed to save job'
      })
    }
  }
  
  // PUT - Update job
  if (method === 'PUT') {
    const body = await readBody(event)
    
    if (!body.id) {
      throw createError({
        statusCode: 400,
        message: 'Job ID is required'
      })
    }
    
    const jobs = loadJobs()
    const index = jobs.findIndex(j => j.id === body.id)
    
    if (index === -1) {
      throw createError({
        statusCode: 404,
        message: 'Job not found'
      })
    }
    
    // Handle run_now - 立即执行任务
    if (body.run_now) {
      try {
        const job = jobs[index]
        const runtimeConfig = getRuntimeConfig()
        
        // 获取工作目录：优先 runtimeConfig，然后 HOME 环境变量，最后 os.homedir()
        const workDir = runtimeConfig.workDir || process.env.HOME || os.homedir()
        
        // 调用 hermes cron run 命令
        const result = execSync(`hermes cron run ${job.id}`, {
          encoding: 'utf8',
          timeout: 30000,
          cwd: workDir
        })
        
        return {
          success: true,
          job,
          message: 'Job execution triggered',
          output: result
        }
      } catch (e: any) {
        console.error('Failed to run job:', e)
        return {
          success: false,
          message: 'Failed to trigger job execution',
          error: e.message
        }
      }
    }
    
    // Update job
    jobs[index] = {
      ...jobs[index],
      ...body,
      updated_at: new Date().toISOString()
    }
    
    if (saveJobs(jobs)) {
      return {
        success: true,
        job: jobs[index],
        message: 'Job updated successfully'
      }
    } else {
      throw createError({
        statusCode: 500,
        message: 'Failed to save job'
      })
    }
  }
  
  // DELETE - Remove job
  if (method === 'DELETE') {
    const body = await readBody(event)
    
    if (!body.id) {
      throw createError({
        statusCode: 400,
        message: 'Job ID is required'
      })
    }
    
    const jobs = loadJobs()
    const index = jobs.findIndex(j => j.id === body.id)
    
    if (index === -1) {
      throw createError({
        statusCode: 404,
        message: 'Job not found'
      })
    }
    
    jobs.splice(index, 1)
    
    if (saveJobs(jobs)) {
      return {
        success: true,
        message: 'Job deleted successfully'
      }
    } else {
      throw createError({
        statusCode: 500,
        message: 'Failed to save jobs'
      })
    }
  }
  
  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  })
})
