import { defineEventHandler, readBody, createError } from 'h3'
import { getHermesDB } from '../utils/hermes'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { ids } = body
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request: ids array required'
    })
  }
  
  const prisma = getHermesDB()
  
  if (prisma) {
    try {
      // Delete messages first (foreign key constraint)
      for (const id of ids) {
        await prisma.$executeRaw`DELETE FROM messages WHERE session_id = ${id}`
      }
      
      // Then delete sessions
      for (const id of ids) {
        await prisma.$executeRaw`DELETE FROM sessions WHERE id = ${id}`
      }
      
      return { success: true, deleted: ids.length }
    } catch (e) {
      console.error('Failed to delete sessions:', e)
      throw createError({
        statusCode: 500,
        message: 'Failed to delete sessions'
      })
    }
  }
  
  // 无数据库连接，返回错误
  throw createError({
    statusCode: 503,
    message: 'Database not available'
  })
})
