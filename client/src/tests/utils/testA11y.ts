/**
 * Accessibility Testing Utility
 *
 * This utility provides a simple interface for running accessibility tests
 * using jest-axe against rendered React components.
 */

import { render, RenderResult } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ReactElement } from 'react'

expect.extend(toHaveNoViolations)

/**
 * Test a React component for accessibility violations
 *
 * @param ui - The React element to test
 * @param options - Optional axe configuration options
 * @returns Promise that resolves when test completes
 *
 * @example
 * ```typescript
 * it('should have no accessibility violations', async () => {
 *   await testA11y(<MyComponent />)
 * })
 * ```
 */
export async function testA11y(
  ui: ReactElement,
  options?: {
    rules?: Record<string, { enabled: boolean }>
    exclude?: string[]
  }
): Promise<void> {
  const { container } = render(ui)
  const results = await axe(container, {
    rules: options?.rules,
  })
  expect(results).toHaveNoViolations()
}

/**
 * Test an already-rendered component for accessibility violations
 *
 * @param renderResult - The result from @testing-library/react render()
 * @param options - Optional axe configuration options
 * @returns Promise that resolves when test completes
 *
 * @example
 * ```typescript
 * it('should have no accessibility violations', async () => {
 *   const { container } = render(<MyComponent />)
 *   await testA11yOnContainer(container)
 * })
 * ```
 */
export async function testA11yOnContainer(
  container: Element,
  options?: {
    rules?: Record<string, { enabled: boolean }>
    exclude?: string[]
  }
): Promise<void> {
  const results = await axe(container, {
    rules: options?.rules,
  })
  expect(results).toHaveNoViolations()
}

/**
 * Common accessibility test patterns
 */
export const a11yPatterns = {
  /**
   * Disable color-contrast rule (useful for components with dynamic styling)
   */
  ignoreColorContrast: {
    rules: {
      'color-contrast': { enabled: false },
    },
  },

  /**
   * Disable landmark rules (useful for isolated component tests)
   */
  ignoreLandmarks: {
    rules: {
      region: { enabled: false },
      'landmark-one-main': { enabled: false },
    },
  },
}
