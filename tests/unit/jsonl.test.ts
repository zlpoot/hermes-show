import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getJsonlSessionsPath,
  parseLogLine,
  JsonlMessage,
  JsonlSessionMeta
} from '../../server/utils/jsonl'

// Mock getHermesPath
vi.mock('../../server/utils/hermes', () => ({
  getHermesPath: () => '/tmp/.hermes-test'
}))

describe('jsonl 工具函数', () => {
  describe('getJsonlSessionsPath', () => {
    it('返回正确的 sessions 目录路径', () => {
      const path = getJsonlSessionsPath()
      expect(path).toBe('/tmp/.hermes-test/sessions')
    })
  })
})

// 注意：listJsonlSessions, readJsonlSession, searchJsonlSessions 等函数
// 需要实际的文件系统操作，应该在 e2e 测试中覆盖
