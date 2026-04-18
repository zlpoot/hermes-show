import { defineEventHandler, readBody } from 'h3'
import { getHermesDB } from '../utils/hermes'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const ids = body?.ids

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return { success: false, message: 'No IDs provided for deletion' }
  }

  const prisma = getHermesDB()
  if (!prisma) {
    return { success: false, message: 'Real database not connected. Cannot delete mock data.' }
  }

  try {
    // 1. Delete messages associated with the selected sessions first
    try {
      await prisma.message.deleteMany({
        where: { session_id: { in: ids } }
      })
    } catch (e) {
      // Fallback for schema mismatch: use raw query
      const placeholders = ids.map(() => '?').join(',')
      await prisma.$executeRawUnsafe(`DELETE FROM messages WHERE session_id IN (${placeholders})`, ...ids)
    }

    // 2. Delete the sessions themselves
    try {
      await prisma.session.deleteMany({
        where: { id: { in: ids } }
      })
    } catch (e) {
      // Fallback for schema mismatch: use raw query
      const placeholders = ids.map(() => '?').join(',')
      await prisma.$executeRawUnsafe(`DELETE FROM sessions WHERE id IN (${placeholders})`, ...ids)
    }

    return { success: true, count: ids.length }
  } catch (error: any) {
    console.error('Batch delete failed:', error)
    return { success: false, message: error.message || 'Failed to delete sessions' }
  }
})
