import { getTaskStats, getInProgressTask } from '../../utils/db'

export default defineEventHandler(() => {
  const stats = getTaskStats()
  
  const current = getInProgressTask()
  let currentTask = null
  
  if (current) {
    let duration = 0
    if (current.started_at) {
      duration = Math.round((Date.now() - new Date(current.started_at).getTime()) / 60000)
    }
    currentTask = {
      id: current.id,
      title: current.title,
      started_at: current.started_at,
      duration
    }
  }
  
  return {
    ...stats,
    currentTask
  }
})
