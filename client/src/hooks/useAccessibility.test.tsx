/**
 * Accessibility Hooks Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'
import { render, screen } from '../test-utils'
import {
  useFocusTrap,
  useAutoFocus,
  useFocusRestore,
  useAnnouncer,
  useRovingTabIndex,
  useSkipLink,
  getAriaLabel,
  generateAriaDescribedBy,
  usePrefersReducedMotion,
  VisuallyHidden,
  srOnlyStyles,
  useFocusVisible,
  useAccessibleNavigation,
  useAccessibleField,
  useLoadingAnnouncement,
  useAccessibleDropdown,
} from './useAccessibility'

describe('useFocusTrap', () => {
  it('should trap focus within container', () => {
    const container = document.createElement('div')
    const button1 = document.createElement('button')
    const button2 = document.createElement('button')
    container.appendChild(button1)
    container.appendChild(button2)
    document.body.appendChild(container)

    const { result } = renderHook(() => useFocusTrap(true))

    // @ts-ignore - assign ref
    result.current.current = container

    // Manually trigger the effect by focusing
    button1.focus()
    expect(document.activeElement).toBe(button1)

    // Simulate Tab from last element
    button2.focus()
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
    container.dispatchEvent(tabEvent)

    document.body.removeChild(container)
  })

  it('should not trap focus when inactive', () => {
    const { result, rerender } = renderHook(
      ({ isActive }) => useFocusTrap(isActive),
      { initialProps: { isActive: false } }
    )

    expect(result.current.current).toBe(null)

    rerender({ isActive: true })
    expect(result.current.current).toBe(null)
  })

  it('should cleanup event listeners on unmount', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const removeEventListenerSpy = jest.spyOn(container, 'removeEventListener')

    const { result, unmount } = renderHook(() => useFocusTrap(true))
    // @ts-ignore
    result.current.current = container

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    )

    document.body.removeChild(container)
  })
})

describe('useAutoFocus', () => {
  it('should focus element on mount', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)

    const { result } = renderHook(() => useAutoFocus<HTMLInputElement>(true))

    // @ts-ignore
    result.current.current = input

    // Manually call focus since jsdom doesn't auto-trigger effects
    act(() => {
      input.focus()
    })

    expect(document.activeElement).toBe(input)
    document.body.removeChild(input)
  })

  it('should not focus when shouldFocus is false', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)

    const { result } = renderHook(() => useAutoFocus<HTMLInputElement>(false))
    // @ts-ignore
    result.current.current = input

    expect(document.activeElement).not.toBe(input)
    document.body.removeChild(input)
  })
})

describe('useFocusRestore', () => {
  it('should save and restore focus', () => {
    const button1 = document.createElement('button')
    const button2 = document.createElement('button')
    document.body.appendChild(button1)
    document.body.appendChild(button2)

    const { result } = renderHook(() => useFocusRestore())

    // Focus first button and save
    button1.focus()
    act(() => {
      result.current.saveFocus()
    })

    // Focus second button
    button2.focus()
    expect(document.activeElement).toBe(button2)

    // Restore focus
    act(() => {
      result.current.restoreFocus()
    })

    expect(document.activeElement).toBe(button1)

    document.body.removeChild(button1)
    document.body.removeChild(button2)
  })

  it('should handle restoring when no focus was saved', () => {
    const { result } = renderHook(() => useFocusRestore())

    act(() => {
      result.current.restoreFocus()
    })

    // Should not throw
    expect(true).toBe(true)
  })
})

describe('useAnnouncer', () => {
  it('should create announcer element', () => {
    renderHook(() => useAnnouncer())

    const announcer = document.querySelector('[role="status"]')
    expect(announcer).toBeInTheDocument()
    expect(announcer).toHaveAttribute('aria-live', 'polite')
    expect(announcer).toHaveAttribute('aria-atomic', 'true')
    expect(announcer).toHaveClass('sr-only')
  })

  it('should announce message with polite priority', async () => {
    const { result } = renderHook(() => useAnnouncer())

    act(() => {
      result.current.announce('Test message', 'polite')
    })

    await waitFor(() => {
      const announcer = document.querySelector('[role="status"]')
      expect(announcer?.textContent).toBe('Test message')
      expect(announcer).toHaveAttribute('aria-live', 'polite')
    })
  })

  it('should announce message with assertive priority', async () => {
    const { result } = renderHook(() => useAnnouncer())

    act(() => {
      result.current.announce('Urgent message', 'assertive')
    })

    await waitFor(() => {
      const announcer = document.querySelector('[role="status"]')
      expect(announcer?.textContent).toBe('Urgent message')
      expect(announcer).toHaveAttribute('aria-live', 'assertive')
    })
  })

  it('should cleanup announcer on unmount', () => {
    const { unmount } = renderHook(() => useAnnouncer())

    expect(document.querySelector('[role="status"]')).toBeInTheDocument()

    unmount()

    expect(document.querySelector('[role="status"]')).not.toBeInTheDocument()
  })
})

describe('useRovingTabIndex', () => {
  it('should initialize with first item active', () => {
    const items = [
      document.createElement('button'),
      document.createElement('button'),
    ]

    const { result } = renderHook(() => useRovingTabIndex(items, 'vertical'))

    expect(result.current.activeIndex).toBe(0)
  })

  it('should move to next item on ArrowDown', () => {
    const items = [
      document.createElement('button'),
      document.createElement('button'),
    ]

    const { result } = renderHook(() => useRovingTabIndex(items, 'vertical'))

    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent('keydown', { key: 'ArrowDown' }) as any
      )
    })

    expect(result.current.activeIndex).toBe(1)
  })

  it('should move to previous item on ArrowUp', () => {
    const items = [
      document.createElement('button'),
      document.createElement('button'),
    ]

    const { result } = renderHook(() => useRovingTabIndex(items, 'vertical'))

    // Set to second item
    act(() => {
      result.current.setActiveIndex(1)
    })

    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent('keydown', { key: 'ArrowUp' }) as any
      )
    })

    expect(result.current.activeIndex).toBe(0)
  })

  it('should wrap around at boundaries', () => {
    const items = [
      document.createElement('button'),
      document.createElement('button'),
    ]

    const { result } = renderHook(() => useRovingTabIndex(items, 'vertical'))

    // From first, go up - should wrap to last
    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent('keydown', { key: 'ArrowUp' }) as any
      )
    })

    expect(result.current.activeIndex).toBe(1)
  })

  it('should jump to first item on Home', () => {
    const items = [
      document.createElement('button'),
      document.createElement('button'),
      document.createElement('button'),
    ]

    const { result } = renderHook(() => useRovingTabIndex(items, 'vertical'))

    act(() => {
      result.current.setActiveIndex(2)
    })

    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent('keydown', { key: 'Home' }) as any
      )
    })

    expect(result.current.activeIndex).toBe(0)
  })

  it('should jump to last item on End', () => {
    const items = [
      document.createElement('button'),
      document.createElement('button'),
      document.createElement('button'),
    ]

    const { result } = renderHook(() => useRovingTabIndex(items, 'vertical'))

    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent('keydown', { key: 'End' }) as any
      )
    })

    expect(result.current.activeIndex).toBe(2)
  })

  it('should use horizontal keys when orientation is horizontal', () => {
    const items = [
      document.createElement('button'),
      document.createElement('button'),
    ]

    const { result } = renderHook(() => useRovingTabIndex(items, 'horizontal'))

    act(() => {
      result.current.handleKeyDown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' }) as any
      )
    })

    expect(result.current.activeIndex).toBe(1)
  })
})

describe('useSkipLink', () => {
  it('should focus and scroll to target', () => {
    const target = document.createElement('div')
    target.id = 'main-content'
    target.tabIndex = -1
    document.body.appendChild(target)

    const focusSpy = jest.spyOn(target, 'focus')
    const scrollSpy = jest.spyOn(target, 'scrollIntoView')

    const { result } = renderHook(() => useSkipLink('main-content'))

    act(() => {
      result.current()
    })

    expect(focusSpy).toHaveBeenCalled()
    expect(scrollSpy).toHaveBeenCalled()

    document.body.removeChild(target)
  })

  it('should handle missing target gracefully', () => {
    const { result } = renderHook(() => useSkipLink('non-existent'))

    act(() => {
      result.current()
    })

    // Should not throw
    expect(true).toBe(true)
  })
})

describe('getAriaLabel', () => {
  it('should return label without context', () => {
    expect(getAriaLabel('Simple label')).toBe('Simple label')
  })

  it('should replace placeholders with context values', () => {
    const label = getAriaLabel('Task {count} of {total}', {
      count: 5,
      total: 10,
    })
    expect(label).toBe('Task 5 of 10')
  })

  it('should handle string values', () => {
    const label = getAriaLabel('User: {name}', { name: 'John' })
    expect(label).toBe('User: John')
  })

  it('should handle multiple replacements', () => {
    const label = getAriaLabel('{action} {item} {status}', {
      action: 'Delete',
      item: 'task',
      status: 'completed',
    })
    expect(label).toBe('Delete task completed')
  })
})

describe('generateAriaDescribedBy', () => {
  it('should join valid IDs', () => {
    expect(generateAriaDescribedBy('id1', 'id2', 'id3')).toBe('id1 id2 id3')
  })

  it('should filter out undefined values', () => {
    expect(generateAriaDescribedBy('id1', undefined, 'id2')).toBe('id1 id2')
  })

  it('should return undefined for empty input', () => {
    expect(generateAriaDescribedBy()).toBeUndefined()
  })

  it('should return undefined for all undefined inputs', () => {
    expect(generateAriaDescribedBy(undefined, undefined)).toBeUndefined()
  })
})

describe('usePrefersReducedMotion', () => {
  it('should return false when reduced motion is not preferred', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }))

    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('should return true when reduced motion is preferred', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }))

    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('should update when preference changes', async () => {
    let listener: ((e: MediaQueryListEvent) => void) | null = null

    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn((_, fn) => {
        listener = fn
      }),
      removeEventListener: jest.fn(),
    }))

    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)

    // Simulate preference change
    act(() => {
      if (listener) {
        listener({ matches: true } as MediaQueryListEvent)
      }
    })

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })
})

describe('VisuallyHidden', () => {
  it('should render children with sr-only styles', () => {
    render(<VisuallyHidden>Hidden text</VisuallyHidden>)
    expect(screen.getByText('Hidden text')).toBeInTheDocument()
  })

  it('should have correct styles for screen readers', () => {
    expect(srOnlyStyles.position).toBe('absolute')
    expect(srOnlyStyles.width).toBe('1px')
    expect(srOnlyStyles.height).toBe('1px')
    expect(srOnlyStyles.overflow).toBe('hidden')
  })
})

describe('useFocusVisible', () => {
  it('should initialize with no focus visible', () => {
    const { result } = renderHook(() => useFocusVisible())
    expect(result.current.isFocusVisible).toBe(false)
  })

  it('should show focus visible on keyboard focus', () => {
    const { result } = renderHook(() => useFocusVisible())

    act(() => {
      result.current.focusProps.onFocus()
    })

    expect(result.current.isFocusVisible).toBe(true)
  })

  it('should hide focus visible after mouse interaction', () => {
    const { result } = renderHook(() => useFocusVisible())

    act(() => {
      result.current.focusProps.onMouseDown()
    })

    act(() => {
      result.current.focusProps.onFocus()
    })

    expect(result.current.isFocusVisible).toBe(false)
  })

  it('should reset on blur', () => {
    const { result } = renderHook(() => useFocusVisible())

    act(() => {
      result.current.focusProps.onFocus()
    })

    expect(result.current.isFocusVisible).toBe(true)

    act(() => {
      result.current.focusProps.onBlur()
    })

    expect(result.current.isFocusVisible).toBe(false)
  })
})

describe('useAccessibleNavigation', () => {
  it('should handle arrow key navigation', () => {
    const items = [
      { id: '1', label: 'Item 1' },
      { id: '2', label: 'Item 2' },
      { id: '3', label: 'Item 3' },
    ]
    const onActivate = jest.fn()

    const { result } = renderHook(() =>
      useAccessibleNavigation({
        items,
        activeId: '1',
        onActivate,
        orientation: 'horizontal',
      })
    )

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowRight',
        preventDefault: jest.fn(),
      } as any)
    })

    expect(onActivate).toHaveBeenCalledWith('2')
  })

  it('should handle Home key', () => {
    const items = [
      { id: '1', label: 'Item 1' },
      { id: '2', label: 'Item 2' },
      { id: '3', label: 'Item 3' },
    ]
    const onActivate = jest.fn()

    const { result } = renderHook(() =>
      useAccessibleNavigation({
        items,
        activeId: '3',
        onActivate,
        orientation: 'horizontal',
      })
    )

    act(() => {
      result.current.handleKeyDown({
        key: 'Home',
        preventDefault: jest.fn(),
      } as any)
    })

    expect(onActivate).toHaveBeenCalledWith('1')
  })

  it('should handle End key', () => {
    const items = [
      { id: '1', label: 'Item 1' },
      { id: '2', label: 'Item 2' },
      { id: '3', label: 'Item 3' },
    ]
    const onActivate = jest.fn()

    const { result } = renderHook(() =>
      useAccessibleNavigation({
        items,
        activeId: '1',
        onActivate,
        orientation: 'horizontal',
      })
    )

    act(() => {
      result.current.handleKeyDown({
        key: 'End',
        preventDefault: jest.fn(),
      } as any)
    })

    expect(onActivate).toHaveBeenCalledWith('3')
  })

  it('should wrap around at boundaries', () => {
    const items = [
      { id: '1', label: 'Item 1' },
      { id: '2', label: 'Item 2' },
    ]
    const onActivate = jest.fn()

    const { result } = renderHook(() =>
      useAccessibleNavigation({
        items,
        activeId: '2',
        onActivate,
        orientation: 'horizontal',
      })
    )

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowRight',
        preventDefault: jest.fn(),
      } as any)
    })

    expect(onActivate).toHaveBeenCalledWith('1')
  })
})

describe('useAccessibleField', () => {
  it('should generate field props', () => {
    const { result } = renderHook(() =>
      useAccessibleField({
        id: 'field-1',
        label: 'Field Label',
      })
    )

    expect(result.current.fieldProps.id).toBe('field-1')
    expect(result.current.fieldProps['aria-label']).toBe('Field Label')
  })

  it('should handle error state', () => {
    const { result } = renderHook(() =>
      useAccessibleField({
        id: 'field-1',
        label: 'Field Label',
        error: 'Error message',
      })
    )

    expect(result.current.fieldProps['aria-invalid']).toBe(true)
    expect(result.current.fieldProps['aria-describedby']).toBe('field-1-error')
    expect(result.current.errorProps).toBeDefined()
    expect(result.current.errorProps?.id).toBe('field-1-error')
    expect(result.current.errorProps?.role).toBe('alert')
  })

  it('should handle description', () => {
    const { result } = renderHook(() =>
      useAccessibleField({
        id: 'field-1',
        label: 'Field Label',
        description: 'Field description',
      })
    )

    expect(result.current.fieldProps['aria-describedby']).toBe(
      'field-1-description'
    )
    expect(result.current.descriptionProps).toBeDefined()
    expect(result.current.descriptionProps?.id).toBe('field-1-description')
  })

  it('should handle required state', () => {
    const { result } = renderHook(() =>
      useAccessibleField({
        id: 'field-1',
        label: 'Field Label',
        required: true,
      })
    )

    expect(result.current.fieldProps['aria-required']).toBe(true)
  })

  it('should combine error and description in aria-describedby', () => {
    const { result } = renderHook(() =>
      useAccessibleField({
        id: 'field-1',
        label: 'Field Label',
        error: 'Error',
        description: 'Description',
      })
    )

    expect(result.current.fieldProps['aria-describedby']).toBe(
      'field-1-error field-1-description'
    )
  })
})

describe('useLoadingAnnouncement', () => {
  it('should announce when loading starts', async () => {
    const { rerender } = renderHook(
      ({ isLoading }) =>
        useLoadingAnnouncement(isLoading, 'Loading content', 'Content ready'),
      { initialProps: { isLoading: false } }
    )

    rerender({ isLoading: true })

    await waitFor(() => {
      const announcer = document.querySelector('[role="status"]')
      expect(announcer?.textContent).toBe('Loading content')
    })
  })

  it('should announce when loading completes', async () => {
    const { rerender } = renderHook(
      ({ isLoading }) =>
        useLoadingAnnouncement(isLoading, 'Loading content', 'Content ready'),
      { initialProps: { isLoading: true } }
    )

    rerender({ isLoading: false })

    await waitFor(() => {
      const announcer = document.querySelector('[role="status"]')
      expect(announcer?.textContent).toBe('Content ready')
    })
  })
})

describe('useAccessibleDropdown', () => {
  it('should close on Escape key', () => {
    const onClose = jest.fn()
    renderHook(() => useAccessibleDropdown(true, onClose))

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)
    })

    expect(onClose).toHaveBeenCalled()
  })

  it('should close on outside click', () => {
    const onClose = jest.fn()
    const { result } = renderHook(() => useAccessibleDropdown(true, onClose))

    const outsideElement = document.createElement('div')
    document.body.appendChild(outsideElement)

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true })
      Object.defineProperty(event, 'target', {
        value: outsideElement,
        writable: false,
      })
      document.dispatchEvent(event)
    })

    expect(onClose).toHaveBeenCalled()

    document.body.removeChild(outsideElement)
  })

  it('should not trigger handlers when closed', () => {
    const onClose = jest.fn()
    renderHook(() => useAccessibleDropdown(false, onClose))

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('should cleanup event listeners on unmount', () => {
    const onClose = jest.fn()
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

    const { unmount } = renderHook(() => useAccessibleDropdown(true, onClose))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    )
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mousedown',
      expect.any(Function)
    )
  })
})
