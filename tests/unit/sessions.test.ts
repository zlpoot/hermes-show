import { describe, it, expect } from 'vitest'
import { isActiveSession, sqliteRowToUnified, type UnifiedSession } from '../../server/utils/sessions'

describe('sqliteRowToUnified', () => {
  it('converts a basic SQLite row', () => {
    const result = sqliteRowToUnified({
      id: '20260424_123456_abc123',
      title: 'Test Session',
      source: 'discord',
      started_at: '1770897600', // unix seconds
      ended_at: null,
      input_tokens: 100,
      output_tokens: 200,
    })

    expect(result.id).toBe('20260424_123456_abc123')
    expect(result.title).toBe('Test Session')
    expect(result.source).toBe('discord')
    expect(result.started_at).toBe(1770897600 * 1000) // converted to ms
    expect(result.ended_at).toBeNull()
    expect(result.input_tokens).toBe(100)
    expect(result.output_tokens).toBe(200)
    expect(result._origin).toBe('sqlite')
  })

  it('handles millisecond timestamps', () => {
    const result = sqliteRowToUnified({
      id: 'ms-test',
      started_at: '1770897600000',
    })
    expect(result.started_at).toBe(1770897600000)
  })

  it('handles null timestamps', () => {
    const result = sqliteRowToUnified({
      id: 'null-ts',
      started_at: null,
      ended_at: null,
    })
    expect(result.started_at).toBeNull()
    expect(result.ended_at).toBeNull()
  })

  it('handles missing tokens', () => {
    const result = sqliteRowToUnified({
      id: 'no-tokens',
      started_at: null,
    })
    expect(result.input_tokens).toBe(0)
    expect(result.output_tokens).toBe(0)
  })

  it('uses platform alias for source', () => {
    const result = sqliteRowToUnified({
      id: 'platform-test',
      platform: 'telegram',
      started_at: null,
    })
    expect(result.source).toBe('telegram')
  })
})

describe('isActiveSession', () => {
  const now = Date.now()

  it('returns false when started_at is null', () => {
    expect(isActiveSession({ id: 'x', started_at: null, ended_at: null } as UnifiedSession, now)).toBe(false)
  })

  it('returns false when ended_at is set', () => {
    expect(isActiveSession({
      id: 'x',
      started_at: now - 60_000,
      ended_at: now,
    } as UnifiedSession, now)).toBe(false)
  })

  it('returns true when un-ended and within 5 hours', () => {
    expect(isActiveSession({
      id: 'recent',
      started_at: now - 60 * 60 * 1000, // 1 hour ago
      ended_at: null,
    } as UnifiedSession, now)).toBe(true)

    expect(isActiveSession({
      id: 'almost-stale',
      started_at: now - 4.5 * 60 * 60 * 1000, // 4.5 hours ago
      ended_at: null,
    } as UnifiedSession, now)).toBe(true)
  })

  it('returns false when un-ended but older than 5 hours', () => {
    expect(isActiveSession({
      id: 'stale',
      started_at: now - 6 * 60 * 60 * 1000, // 6 hours ago
      ended_at: null,
    } as UnifiedSession, now)).toBe(false)

    expect(isActiveSession({
      id: 'old',
      started_at: now - 24 * 60 * 60 * 1000, // 1 day ago
      ended_at: null,
    } as UnifiedSession, now)).toBe(false)
  })
})
