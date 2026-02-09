/**
 * Test Setup and Global Mocks
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'

// Extend Jest matchers with jest-axe
expect.extend(toHaveNoViolations)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Polyfills for jsdom
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return []
    }
    unobserve() {}
  } as any

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any

  // Mock scrollIntoView
  Element.prototype.scrollIntoView = jest.fn()

  // Mock navigator
  Object.defineProperty(window.navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: jest.fn().mockResolvedValue(undefined),
      readText: jest.fn().mockResolvedValue(''),
    },
  })

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  global.localStorage = localStorageMock as any

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  global.sessionStorage = sessionStorageMock as any

  // Mock console methods
  global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
  }
})

// Mock environment variables
process.env.VITE_API_URL = 'http://localhost:5000'
process.env.VITE_ENVIRONMENT = 'test'
