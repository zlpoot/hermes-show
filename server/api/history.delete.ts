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
    // 1. Dynamically find all tables that have a foreign key referencing 'sessions'
    // and delete the child records first.
    try {
      const intIds = ids.map((id: string) => parseInt(id, 10)).filter((id: number) => !isNaN(id))
      const combinedIds = [...ids, ...intIds]
      const placeholders = combinedIds.map(() => '?').join(',')

      const tables: any[] = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table';`
      for (const table of tables) {
        const tableName = table.name
        const fks: any[] = await prisma.$queryRawUnsafe(`PRAGMA foreign_key_list("${tableName}");`)
        
        for (const fk of fks) {
          if (fk.table === 'sessions' || fk.table === 'session') {
            const childColumn = fk.from
            await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}" WHERE "${childColumn}" IN (${placeholders})`, ...combinedIds)
          }
        }
      }
    } catch (e) {
      console.log('Failed to dynamically delete child records', e)
    }

    // Try Prisma deleteMany for messages just in case (if the dynamic approach missed it)
    try {
      await prisma.message.deleteMany({
        where: { session_id: { in: ids } }
      })
    } catch (e) {}

    // Now delete sessions via raw SQL
    try {
      const intIds = ids.map((id: string) => parseInt(id, 10)).filter((id: number) => !isNaN(id))
      const combinedIds = [...ids, ...intIds]
      const placeholders = combinedIds.map(() => '?').join(',')
      await prisma.$executeRawUnsafe(`DELETE FROM sessions WHERE id IN (${placeholders})`, ...combinedIds)
    } catch (e) {
      console.log('Failed to delete sessions via raw SQL', e)
      throw new Error('Failed to delete sessions due to database constraints.')
    }

    return { success: true, count: ids.length }
  } catch (error: any) {
    console.error('Batch delete failed:', error)
    return { success: false, message: error.message || 'Failed to delete sessions' }
  }
})
