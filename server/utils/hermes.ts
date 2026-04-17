import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import yaml from 'yaml'
import Database from 'better-sqlite3'

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

export const getHermesDB = () => {
  const dbPath = path.join(getHermesPath(), 'state.db')
  try {
    if (fs.existsSync(dbPath)) {
      return new Database(dbPath, { readonly: true })
    }
  } catch (e) {
    console.error('Failed to connect to state.db', e)
  }
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
