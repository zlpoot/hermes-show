import { defineEventHandler, readBody, createError } from 'h3'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getHermesDB, getHermesPath } from '../utils/hermes'

interface DeleteResult {
  id: string
  jsonlDeleted: boolean
  sqliteDeleted: boolean
  error?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const ids = body?.ids

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request: ids array required'
    })
  }

  const normalizedIds = ids
    .map((id) => String(id).trim())
    .filter(Boolean)

  if (normalizedIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request: ids array required'
    })
  }

  const prisma = getHermesDB()
  const sessionsPath = path.join(getHermesPath(), 'sessions')
  const results: DeleteResult[] = []
  let deleted = 0

  for (const id of normalizedIds) {
    const result: DeleteResult = {
      id,
      jsonlDeleted: false,
      sqliteDeleted: false
    }

    try {
      const safeSessionId = path.basename(id)
      if (safeSessionId !== id) {
        throw new Error('Invalid session id')
      }

      const jsonlPath = path.join(sessionsPath, `${safeSessionId}.jsonl`)
      try {
        await fs.unlink(jsonlPath)
        result.jsonlDeleted = true
      } catch (e: any) {
        if (e?.code !== 'ENOENT') {
          throw e
        }
      }

      if (prisma) {
        const deletedMessages = await prisma.$executeRaw`DELETE FROM messages WHERE session_id = ${id}`
        const deletedSessions = await prisma.$executeRaw`DELETE FROM sessions WHERE id = ${id}`
        result.sqliteDeleted = Number(deletedMessages) > 0 || Number(deletedSessions) > 0
      }

      if (result.jsonlDeleted || result.sqliteDeleted) {
        deleted++
      }
    } catch (e: any) {
      console.error('Failed to delete session:', id, e)
      result.error = e?.message || 'Failed to delete session'
    }

    results.push(result)
  }

  const failed = results.filter((result) => result.error)
  if (failed.length > 0) {
    throw createError({
      statusCode: 500,
      message: 'Failed to delete some sessions',
      data: { deleted, failed, results }
    })
  }

  return {
    success: true,
    deleted,
    requested: normalizedIds.length,
    results
  }
})
