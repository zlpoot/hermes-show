import { describe, it, expect } from 'vitest'

// Demo 测试：验证 Vitest 配置正确
describe('Vitest Demo 测试', () => {
  it('基础数学运算', () => {
    expect(1 + 1).toBe(2)
    expect(2 * 3).toBe(6)
    expect(10 / 2).toBe(5)
  })

  it('字符串操作', () => {
    const str = 'Hermes Agent'
    expect(str).toContain('Hermes')
    expect(str.length).toBe(12)
    expect(str.toUpperCase()).toBe('HERMES AGENT')
  })

  it('数组操作', () => {
    const arr = [1, 2, 3, 4, 5]
    expect(arr).toHaveLength(5)
    expect(arr.includes(3)).toBe(true)
    expect(arr.filter(n => n > 3)).toEqual([4, 5])
  })

  it('对象比较', () => {
    const obj = { name: 'hermes', version: '0.8.0' }
    expect(obj).toHaveProperty('name')
    expect(obj.name).toBe('hermes')
    expect(obj).toMatchObject({ version: '0.8.0' })
  })
})
