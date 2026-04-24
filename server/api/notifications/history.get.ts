import { getNotificationHistory } from '../../utils/notification'

// GET /api/notifications/history - 获取通知历史
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = parseInt(query.limit as string) || 50
  
  const history = getNotificationHistory(limit)
  
  return {
    success: true,
    history,
    total: history.length
  }
})
