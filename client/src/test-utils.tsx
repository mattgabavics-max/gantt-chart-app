/**
 * Test Utilities
 * Custom render functions and helpers for testing React components
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

// ==================== Custom Providers ====================

interface ProvidersProps {
  children: React.ReactNode
}

export function AllProviders({ children }: ProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

// ==================== Custom Render ====================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { route = '/', queryClient, ...renderOptions } = options

  // Set initial route
  window.history.pushState({}, 'Test page', route)

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const client = queryClient || new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
        mutations: { retry: false },
      },
    })

    return (
      <QueryClientProvider client={client}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// ==================== Mock Data Factories ====================

export const createMockProject = (overrides = {}) => ({
  id: '1',
  name: 'Test Project',
  description: 'Test Description',
  isPublic: false,
  ownerId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  taskCount: 5,
  ...overrides,
})

export const createMockTask = (overrides = {}) => ({
  id: '1',
  name: 'Test Task',
  description: 'Test Description',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-05'),
  progress: 50,
  status: 'in-progress' as const,
  priority: 'medium' as const,
  projectId: 'project-1',
  assignees: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2024-01-01'),
  ...overrides,
})

export const createMockVersion = (overrides = {}) => ({
  id: '1',
  projectId: 'project-1',
  name: 'v1.0.0',
  description: 'Initial version',
  createdAt: new Date('2024-01-01'),
  createdBy: 'user-1',
  snapshot: { tasks: [], metadata: {} },
  ...overrides,
})

// ==================== Wait Utilities ====================

export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ==================== Event Helpers ====================

export const createKeyboardEvent = (
  key: string,
  modifiers: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
  } = {}
): KeyboardEvent => {
  return new KeyboardEvent('keydown', {
    key,
    ctrlKey: modifiers.ctrl,
    shiftKey: modifiers.shift,
    altKey: modifiers.alt,
    metaKey: modifiers.meta,
    bubbles: true,
    cancelable: true,
  })
}

export const createTouchEvent = (
  type: string,
  touches: { clientX: number; clientY: number }[]
): TouchEvent => {
  const touchList = touches.map((touch, index) => ({
    identifier: index,
    target: document.body,
    ...touch,
  }))

  return new TouchEvent(type, {
    touches: touchList as any,
    changedTouches: touchList as any,
    bubbles: true,
    cancelable: true,
  })
}

// ==================== Query Client Helpers ====================

export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress errors in tests
    },
  })
}

// ==================== Mock API Responses ====================

export const createMockApiResponse = <T,>(data: T) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
})

export const createMockApiError = (message: string, status = 500) => ({
  response: {
    data: { message },
    status,
    statusText: status === 404 ? 'Not Found' : 'Internal Server Error',
    headers: {},
    config: {} as any,
  },
  message,
  name: 'AxiosError',
  config: {} as any,
  isAxiosError: true,
  toJSON: () => ({}),
})

// ==================== Local Storage Helpers ====================

export const mockLocalStorage = () => {
  const store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key])
    }),
  }
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { renderWithProviders as render }
