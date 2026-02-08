/**
 * Test Utilities
 * Custom render functions and helpers for testing
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { VersionProvider } from '../../contexts/VersionContext'

// Custom render with VersionProvider
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  providerProps?: {
    apiBaseUrl?: string
  }
}

export function renderWithVersionProvider(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { providerProps, ...renderOptions } = options || {}

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <VersionProvider apiBaseUrl={providerProps?.apiBaseUrl || '/api'}>
        {children}
      </VersionProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Wait for async updates
export const waitForAsync = () =>
  new Promise((resolve) => setTimeout(resolve, 0))

// Mock localStorage
export function mockLocalStorage() {
  const store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key])
    },
  }
}

// Create mock mouse event
export function createMouseEvent(
  type: string,
  options: { clientX?: number; clientY?: number } = {}
): MouseEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: options.clientX || 0,
    clientY: options.clientY || 0,
  })
  return event
}

// Simulate drag operation
export function simulateDrag(
  element: HTMLElement,
  startX: number,
  endX: number
) {
  const mouseDown = createMouseEvent('mousedown', { clientX: startX })
  const mouseMove = createMouseEvent('mousemove', { clientX: endX })
  const mouseUp = createMouseEvent('mouseup', { clientX: endX })

  element.dispatchEvent(mouseDown)
  document.dispatchEvent(mouseMove)
  document.dispatchEvent(mouseUp)
}

// Assert element has class
export function expectToHaveClass(element: HTMLElement, className: string) {
  expect(element.classList.contains(className)).toBe(true)
}

// Assert element does not have class
export function expectNotToHaveClass(element: HTMLElement, className: string) {
  expect(element.classList.contains(className)).toBe(false)
}

// Get by data-testid
export function getByTestId(container: HTMLElement, testId: string): HTMLElement {
  const element = container.querySelector(`[data-testid="${testId}"]`)
  if (!element) {
    throw new Error(`Element with data-testid="${testId}" not found`)
  }
  return element as HTMLElement
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react'
