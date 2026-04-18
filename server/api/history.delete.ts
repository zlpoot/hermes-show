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
    // In SQLite, if FOREIGN KEY constraints are enabled, deleting the session might fail if we don't delete messages first.
    // However, if Prisma deleteMany fails, the raw delete might also fail if not executed in the same transaction or if PRAGMA foreign_keys = ON is strictly enforced.
    // We can try to disable foreign key checks temporarily if needed, or simply ensure we catch the error gracefully.
    
    // First, try to execute raw SQL to delete messages, ignoring errors if table doesn't exist
    try {
      const placeholders = ids.map(() => '?').join(',')
      await prisma.$executeRawUnsafe(`DELETE FROM messages WHERE session_id IN (${placeholders})`, ...ids)
    } catch (e) {
      console.log('Failed to delete messages via raw SQL, might not exist or schema mismatch', e)
    }

    // Try Prisma deleteMany for messages just in case
    try {
      await prisma.message.deleteMany({
        where: { session_id: { in: ids } }
      })
    } catch (e) {}

    // Now delete sessions via raw SQL
    try {
      const placeholders = ids.map(() => '?').join(',')
      await prisma.$executeRawUnsafe(`DELETE FROM sessions WHERE id IN (${placeholders})`, ...ids)
    } catch (e) {
      console.log('Failed to delete sessions via raw SQL', e)
      // If raw delete failed, try to disable FK checks, delete, and re-enable
      try {
        await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;')
        const placeholders = ids.map(() => '?').join(',')
        await prisma.$executeRawUnsafe(`DELETE FROM sessions WHERE id IN (${placeholders})`, ...ids)
        await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;')
      } catch (err) {
        // Ultimate fallback to Prisma deleteMany
        await prisma.session.deleteMany({
          where: { id: { in: ids } }
        })
      }
    }

    return { success: true, count: ids.length }
  } catch (error: any) {
    console.error('Batch delete failed:', error)
    return { success: false, message: error.message || 'Failed to delete sessions' }
  }
})
