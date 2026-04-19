export default defineEventHandler(async (event) => {
  // Mock create backup endpoint
  return {
    success: true,
    backupId: 'backup-' + Date.now(),
    message: 'Backup created successfully'
  }
})
