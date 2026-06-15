import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  getJsonlSessionsPath,
  getJsonlTokenCounts,
  listJsonlSessions,
  normalizeJsonlContent,
  parseJsonlSessionMeta,
  parseJsonlTimestamp,
  readJsonlSession,
  searchJsonlSessions
} from '../../server/utils/jsonl'

let hermesPath = ''

vi.mock('../../server/utils/hermes', () => ({
  getHermesPath: () => hermesPath
}))

const writeSession = (id: string, lines: unknown[]) => {
  const sessionsPath = path.join(hermesPath, 'sessions')
  fs.mkdirSync(sessionsPath, { recursive: true })
  fs.writeFileSync(
    path.join(sessionsPath, `${id}.jsonl`),
    lines.map((line) => typeof line === 'string' ? line : JSON.stringify(line)).join('\n')
  )
}

describe('jsonl 工具函数', () => {
  beforeEach(() => {
    hermesPath = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-jsonl-test-'))
  })

  afterEach(() => {
    fs.rmSync(hermesPath, { recursive: true, force: true })
  })

  it('返回正确的 sessions 目录路径', () => {
    expect(getJsonlSessionsPath()).toBe(path.join(hermesPath, 'sessions'))
  })

  it('兼容 ISO、秒和毫秒时间戳', () => {
    expect(parseJsonlTimestamp('2026-04-24T00:04:40.000Z')).toBe(1776989080000)
    expect(parseJsonlTimestamp(1776989080)).toBe(1776989080000)
    expect(parseJsonlTimestamp(1776989080000)).toBe(1776989080000)
    expect(parseJsonlTimestamp('invalid')).toBeUndefined()
  })

  it('兼容常见 token 字段', () => {
    expect(getJsonlTokenCounts({ role: 'assistant', input_tokens: 3, output_tokens: 5 })).toEqual({ input: 3, output: 5 })
    expect(getJsonlTokenCounts({ role: 'assistant', usage: { prompt_tokens: 7, completion_tokens: 11 } })).toEqual({ input: 7, output: 11 })
    expect(getJsonlTokenCounts({ role: 'assistant', token_usage: { total_tokens: 13 } })).toEqual({ input: 13, output: 0 })
  })

  it('把非字符串消息内容归一化为可展示字符串', () => {
    expect(normalizeJsonlContent('hello')).toBe('hello')
    expect(normalizeJsonlContent({ text: 'hello' })).toBe('{"text":"hello"}')
    expect(normalizeJsonlContent(undefined)).toBe('')
  })

  it('解析元数据时跳过坏 JSONL 行并忽略 session_meta 消息计数', async () => {
    writeSession('20260424_000440_e5ee13d4', [
      { role: 'session_meta', platform: 'cli', model: 'gpt-test', timestamp: 1776989080 },
      'not-json',
      { role: 'user', content: '帮我检查 history', timestamp: '2026-04-24T00:04:41.000Z', usage: { prompt_tokens: 10 } },
      { role: 'assistant', content: '可以', timestamp: 1776989082000, usage: { completion_tokens: 6 } }
    ])

    const meta = await parseJsonlSessionMeta(
      path.join(hermesPath, 'sessions', '20260424_000440_e5ee13d4.jsonl'),
      '20260424_000440_e5ee13d4'
    )

    expect(meta).toMatchObject({
      id: '20260424_000440_e5ee13d4',
      title: '帮我检查 history',
      platform: 'cli',
      model: 'gpt-test',
      message_count: 2,
      input_tokens: 10,
      output_tokens: 6
    })
    expect(meta?.started_at).toBe(1776989080000)
    expect(meta?.ended_at).toBe(1776989082000)
  })

  it('读取会话详情时跳过 session_meta 和坏行', async () => {
    writeSession('session_a', [
      { role: 'session_meta', platform: 'cli' },
      { role: 'user', content: { text: 'hello' }, timestamp: 1776989080 },
      'bad-json',
      { role: 'assistant', content: 'world', timestamp: 1776989081 }
    ])

    const data = await readJsonlSession('session_a')

    expect(data?.session.message_count).toBe(2)
    expect(data?.messages).toEqual([
      expect.objectContaining({ role: 'user', content: '{"text":"hello"}' }),
      expect.objectContaining({ role: 'assistant', content: 'world' })
    ])
  })

  it('列出并搜索 JSONL 会话', async () => {
    writeSession('session_a', [
      { role: 'session_meta', platform: 'cli' },
      { role: 'user', content: 'alpha request', timestamp: 1776989080 }
    ])
    writeSession('session_b', [
      { role: 'session_meta', platform: 'slack' },
      { role: 'assistant', content: 'beta response', timestamp: 1776989081 }
    ])

    const sessions = await listJsonlSessions()
    expect(sessions).toHaveLength(2)

    const titleResults = await searchJsonlSessions('alpha')
    expect(titleResults.map((session) => session.id)).toEqual(['session_a'])

    const contentResults = await searchJsonlSessions('beta')
    expect(contentResults.map((session) => session.id)).toEqual(['session_b'])
  })
})
