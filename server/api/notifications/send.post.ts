import { sendNotification } from '../../utils/notification'
import type { NotificationEvent } from '../../types/notification'

// POST /api/notifications/send - 发送通知
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.type || !body.title || !body.message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: type, title, message'
    })
  }
  
  const notificationEvent: NotificationEvent = {
    type: body.type,
    title: body.title,
    message: body.message,
    level: body.level,
    source: body.source,
    details: body.details,
    suggestion: body.suggestion,
    mention: body.mention
  }
  
  const result = await sendNotification(notificationEvent)
  
  if (!result.success) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send notification to some channels'
    })
  }
  
  return {
    success: true,
    ...result
  }
})
