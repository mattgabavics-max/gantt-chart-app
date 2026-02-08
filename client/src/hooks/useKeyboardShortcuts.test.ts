/**
 * Keyboard Shortcuts Hook Tests
 */

import { renderHook } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import {
  useKeyboardShortcuts,
  createCommonShortcuts,
  createNavigationShortcuts,
  formatShortcut,
  getModifierKey,
} from './useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    // Clear all event listeners
    document.removeAllListeners?.('keydown')
  })

  describe('basic functionality', () => {
    it('should trigger shortcut on correct key combination', () => {
      const handler = jest.fn()

      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            {
              key: 's',
              modifiers: ['meta'],
              handler,
              description: 'Save',
            },
          ],
        })
      )

      // Trigger Cmd+S
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 's',
          metaKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not trigger without modifiers', () => {
      const handler = jest.fn()

      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            {
              key: 's',
              modifiers: ['meta'],
              handler,
              description: 'Save',
            },
          ],
        })
      )

      // Trigger just 's' without Cmd
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 's',
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      expect(handler).not.toHaveBeenCalled()
    })

    it('should prevent default when configured', () => {
      const handler = jest.fn()

      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            {
              key: 's',
              modifiers: ['meta'],
              handler,
              description: 'Save',
              preventDefault: true,
            },
          ],
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 's',
          metaKey: true,
          bubbles: true,
          cancelable: true,
        })
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
        document.dispatchEvent(event)

        expect(preventDefaultSpy).toHaveBeenCalled()
      })
    })

    it('should handle multiple modifiers', () => {
      const handler = jest.fn()

      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            {
              key: 'z',
              modifiers: ['meta', 'shift'],
              handler,
              description: 'Redo',
            },
          ],
        })
      )

      // Trigger Cmd+Shift+Z
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'z',
          metaKey: true,
          shiftKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should be case insensitive', () => {
      const handler = jest.fn()

      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            {
              key: 's',
              modifiers: ['meta'],
              handler,
              description: 'Save',
            },
          ],
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'S', // Capital S
          metaKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('enabled/disabled', () => {
    it('should not trigger when globally disabled', () => {
      const handler = jest.fn()

      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            {
              key: 's',
              modifiers: ['meta'],
              handler,
              description: 'Save',
            },
          ],
          enabled: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 's',
          metaKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      expect(handler).not.toHaveBeenCalled()
    })

    it('should not trigger when shortcut is disabled', () => {
      const handler = jest.fn()

      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            {
              key: 's',
              modifiers: ['meta'],
              handler,
              description: 'Save',
              enabled: false,
            },
          ],
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 's',
          metaKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('input exclusion', () => {
    it('should not trigger in input fields by default', () => {
      const handler = jest.fn()

      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            {
              key: 's',
              modifiers: ['meta'],
              handler,
              description: 'Save',
            },
          ],
        })
      )

      // Create input and dispatch event from it
      const input = document.createElement('input')
      document.body.appendChild(input)

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 's',
          metaKey: true,
          bubbles: true,
        })
        Object.defineProperty(event, 'target', {
          value: input,
          writable: false,
        })
        document.dispatchEvent(event)
      })

      document.body.removeChild(input)
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const handler = jest.fn()
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            {
              key: 's',
              modifiers: ['meta'],
              handler,
              description: 'Save',
            },
          ],
        })
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )
    })
  })
})

describe('createCommonShortcuts', () => {
  it('should create save shortcut', () => {
    const onSave = jest.fn()
    const shortcuts = createCommonShortcuts({ onSave })

    const saveShortcut = shortcuts.find((s) => s.description === 'Save')
    expect(saveShortcut).toBeDefined()
    expect(saveShortcut?.key).toBe('s')
    expect(saveShortcut?.modifiers).toContain('meta')

    saveShortcut?.handler({} as KeyboardEvent)
    expect(onSave).toHaveBeenCalled()
  })

  it('should create undo shortcut', () => {
    const onUndo = jest.fn()
    const shortcuts = createCommonShortcuts({ onUndo })

    const undoShortcut = shortcuts.find((s) => s.description === 'Undo')
    expect(undoShortcut).toBeDefined()
    expect(undoShortcut?.key).toBe('z')
  })

  it('should create redo shortcut', () => {
    const onRedo = jest.fn()
    const shortcuts = createCommonShortcuts({ onRedo })

    const redoShortcut = shortcuts.find((s) => s.description === 'Redo')
    expect(redoShortcut).toBeDefined()
    expect(redoShortcut?.key).toBe('z')
    expect(redoShortcut?.modifiers).toContain('shift')
  })

  it('should only create shortcuts for provided handlers', () => {
    const shortcuts = createCommonShortcuts({
      onSave: jest.fn(),
    })

    expect(shortcuts.length).toBe(1)
    expect(shortcuts[0].description).toBe('Save')
  })
})

describe('createNavigationShortcuts', () => {
  it('should create arrow key shortcuts', () => {
    const onArrowUp = jest.fn()
    const onArrowDown = jest.fn()

    const shortcuts = createNavigationShortcuts({
      onArrowUp,
      onArrowDown,
    })

    const upShortcut = shortcuts.find((s) => s.key === 'ArrowUp')
    const downShortcut = shortcuts.find((s) => s.key === 'ArrowDown')

    expect(upShortcut).toBeDefined()
    expect(downShortcut).toBeDefined()

    upShortcut?.handler({} as KeyboardEvent)
    downShortcut?.handler({} as KeyboardEvent)

    expect(onArrowUp).toHaveBeenCalled()
    expect(onArrowDown).toHaveBeenCalled()
  })

  it('should create tab shortcuts', () => {
    const onTab = jest.fn()
    const onShiftTab = jest.fn()

    const shortcuts = createNavigationShortcuts({
      onTab,
      onShiftTab,
    })

    const tabShortcut = shortcuts.find(
      (s) => s.key === 'Tab' && !s.modifiers?.includes('shift')
    )
    const shiftTabShortcut = shortcuts.find(
      (s) => s.key === 'Tab' && s.modifiers?.includes('shift')
    )

    expect(tabShortcut).toBeDefined()
    expect(shiftTabShortcut).toBeDefined()
  })
})

describe('formatShortcut', () => {
  it('should format with Cmd on Mac', () => {
    // Mock Mac platform
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
    })

    const formatted = formatShortcut('s', ['meta'])
    expect(formatted).toBe('Cmd+S')
  })

  it('should format with Ctrl on Windows', () => {
    // Mock Windows platform
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      writable: true,
    })

    const formatted = formatShortcut('s', ['ctrl'])
    expect(formatted).toBe('Ctrl+S')
  })

  it('should format multiple modifiers', () => {
    const formatted = formatShortcut('z', ['meta', 'shift'])
    expect(formatted).toMatch(/\+Shift\+Z$/)
  })

  it('should format without modifiers', () => {
    const formatted = formatShortcut('Delete', [])
    expect(formatted).toBe('DELETE')
  })
})

describe('getModifierKey', () => {
  it('should return Cmd on Mac', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
    })

    expect(getModifierKey()).toBe('Cmd')
  })

  it('should return Ctrl on Windows', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      writable: true,
    })

    expect(getModifierKey()).toBe('Ctrl')
  })
})
