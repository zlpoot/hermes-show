import { config } from '@vue/test-utils'

// 全局测试配置
config.global.stubs = {}

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
})
