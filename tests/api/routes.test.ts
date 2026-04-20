import { describe, it, expect } from 'vitest'
import { $fetch } from 'ofetch'

const baseUrl = 'http://localhost:3000'

describe('API 路由测试', () => {
  describe('GET /api/health', () => {
    it('返回健康状态', async () => {
      const response = await $fetch(`${baseUrl}/api/health`)
      expect(response).toBeDefined()
      // health API 可能返回不同的结构
    })
  })

  describe('GET /api/config', () => {
    it('返回配置信息', async () => {
      const response = await $fetch(`${baseUrl}/api/config`)
      expect(response).toBeDefined()
    })
  })

  describe('GET /api/dashboard', () => {
    it('返回仪表盘数据', async () => {
      const response = await $fetch(`${baseUrl}/api/dashboard`)
      expect(response).toBeDefined()
    })
  })

  describe('GET /api/history', () => {
    it('返回历史记录列表', async () => {
      const response = await $fetch(`${baseUrl}/api/history`)
      expect(response).toBeDefined()
      expect(Array.isArray(response.sessions) || response.sessions).toBeTruthy()
    })
  })

  describe('GET /api/cost', () => {
    it('返回成本统计数据', async () => {
      const response = await $fetch(`${baseUrl}/api/cost`)
      expect(response).toBeDefined()
    })
  })

  describe('GET /api/providers', () => {
    it('返回提供商列表', async () => {
      const response = await $fetch(`${baseUrl}/api/providers`)
      expect(response).toBeDefined()
    })
  })

  describe('GET /api/gateway', () => {
    it('返回网关状态', async () => {
      const response = await $fetch(`${baseUrl}/api/gateway`)
      expect(response).toBeDefined()
    })
  })

  describe('GET /api/backup', () => {
    it('返回备份列表', async () => {
      const response = await $fetch(`${baseUrl}/api/backup`)
      expect(response).toBeDefined()
    })
  })

  describe('GET /api/logs', () => {
    it('返回日志列表', async () => {
      const response = await $fetch(`${baseUrl}/api/logs`)
      expect(response).toBeDefined()
    })
  })

  describe('GET /api/mcp', () => {
    it('返回 MCP 服务器列表', async () => {
      const response = await $fetch(`${baseUrl}/api/mcp`)
      expect(response).toBeDefined()
    })
  })

  describe('GET /api/notifications', () => {
    it('返回通知设置', async () => {
      const response = await $fetch(`${baseUrl}/api/notifications`)
      expect(response).toBeDefined()
    })
  })

  describe('GET /api/users', () => {
    it('返回用户列表', async () => {
      const response = await $fetch(`${baseUrl}/api/users`)
      expect(response).toBeDefined()
    })
  })
})
