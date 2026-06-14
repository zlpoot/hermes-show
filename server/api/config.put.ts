import { defineEventHandler, readBody, createError } from 'h3'
import { getHermesPath } from '../utils/hermes'
import { applyConfigUpdate } from '../utils/config-transform'
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'yaml'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const configPath = path.join(getHermesPath(), 'config.yaml')

  if (!fs.existsSync(configPath)) {
    throw createError({
      statusCode: 404,
      message: 'Config file not found'
    })
  }

  try {
    const file = fs.readFileSync(configPath, 'utf8')
    const config = yaml.parse(file) || {}
    const nextConfig = applyConfigUpdate(config, body)

    fs.writeFileSync(configPath, yaml.stringify(nextConfig), 'utf8')

    return { success: true, message: 'Config saved successfully' }
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      message: e.message || 'Failed to save config'
    })
  }
})
