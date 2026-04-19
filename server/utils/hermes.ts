import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import yaml from 'yaml'
import { PrismaClient } from '@prisma/client'

export const getHermesPath = () => {
  // If running on Windows and trying to access WSL path
  if (process.platform === 'win32') {
    // Try to check if WSL Hermes path exists for the user
    const wslPath = '\\\\wsl$\\Ubuntu-20.04\\home\\zlpoot\\.hermes'
    if (fs.existsSync(wslPath)) {
      return wslPath
    }
  }
  
  // Default to standard OS homedir
  return path.join(os.homedir(), '.hermes')
}

export const getHermesConfig = () => {
  const configPath = path.join(getHermesPath(), 'config.yaml')
  try {
    if (fs.existsSync(configPath)) {
      const file = fs.readFileSync(configPath, 'utf8')
      return yaml.parse(file)
    }
  } catch (e) {
    console.error('Failed to read config.yaml', e)
  }
  return null
}

let prisma: PrismaClient | null = null

export const getHermesDB = () => {
  if (prisma) return prisma

  const dbPath = path.join(getHermesPath(), 'state.db')
  console.log('[hermes] Looking for DB at:', dbPath)
  console.log('[hermes] DB exists:', fs.existsSync(dbPath))
  
  try {
    if (fs.existsSync(dbPath)) {
      // Set DATABASE_URL environment variable for Prisma
      const dbUrl = `file:${dbPath}`
      process.env.DATABASE_URL = dbUrl
      console.log('[hermes] DATABASE_URL set to:', dbUrl)
      
      prisma = new PrismaClient()
      console.log('[hermes] Prisma client created successfully')
      return prisma
    }
  } catch (e) {
    console.error('[hermes] Failed to connect to state.db with Prisma', e)
  }
  console.log('[hermes] Returning null prisma')
  return null
}

export const getHermesLogs = (filename: string, linesCount: number = 100) => {
  const logPath = path.join(getHermesPath(), 'logs', filename)
  try {
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf8')
      const lines = content.split('\n').filter(Boolean)
      return lines.slice(-linesCount)
    }
  } catch (e) {
    console.error(`Failed to read ${filename}`, e)
  }
  return null
}

export const parseLogLine = (line: string) => {
  // Try standard format: 2026-04-15 06:39:53,020 INFO module: message
  const standardMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3})\s+([A-Z]+)\s+([^:]+):\s+(.*)$/)
  if (standardMatch) {
    return {
      time: standardMatch[1].split(' ')[1].split(',')[0], // Just the time part
      level: standardMatch[2],
      source: standardMatch[3].trim(),
      message: standardMatch[4]
    }
  }
  
  // Try bracketed format: [14:30:01] [INFO] [Core] message
  const bracketMatch = line.match(/\[(.*?)\]\s*\[([A-Z]+)\]\s*\[(.*?)\]\s*(.*)/)
  if (bracketMatch) {
    return {
      time: bracketMatch[1],
      level: bracketMatch[2],
      source: bracketMatch[3],
      message: bracketMatch[4]
    }
  }
  
  // Fallback: just return the whole line as message
  return { time: '', level: 'INFO', source: 'System', message: line }
}
