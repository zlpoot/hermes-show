export default defineEventHandler(async (event) => {
  // Mock data for backup management
  const mockData = {
    summary: {
      dbSize: 45 * 1024 * 1024, // 45 MB
      sessionCount: 1247,
      messageCount: 45823,
      configCount: 12,
      configLastModified: '2026-04-19 14:32'
    },
    backups: [
      {
        id: 'backup-001',
        name: 'auto-backup-2026-04-19-12-00',
        date: '2026-04-19 12:00',
        size: 42 * 1024 * 1024, // 42 MB
        type: 'database',
        auto: true
      },
      {
        id: 'backup-002',
        name: 'manual-backup-2026-04-18',
        date: '2026-04-18 20:15',
        size: 38 * 1024 * 1024, // 38 MB
        type: 'database',
        auto: false
      },
      {
        id: 'backup-003',
        name: 'config-backup-2026-04-18',
        date: '2026-04-18 10:00',
        size: 15 * 1024, // 15 KB
        type: 'config',
        auto: true
      },
      {
        id: 'backup-004',
        name: 'auto-backup-2026-04-17-12-00',
        date: '2026-04-17 12:00',
        size: 35 * 1024 * 1024, // 35 MB
        type: 'database',
        auto: true
      },
      {
        id: 'backup-005',
        name: 'full-backup-2026-04-16',
        date: '2026-04-16 09:30',
        size: 50 * 1024 * 1024, // 50 MB
        type: 'database',
        auto: false
      }
    ],
    autoBackup: {
      enabled: true,
      interval: 'daily',
      retention: 10,
      lastBackup: '2026-04-19 12:00',
      nextBackup: '2026-04-20 12:00'
    },
    isRealHermesConnected: false
  }

  return mockData
})
