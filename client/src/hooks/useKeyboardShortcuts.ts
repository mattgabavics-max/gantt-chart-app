/**
 * Keyboard Shortcuts Hook
 * Global and context-specific keyboard shortcuts
 */

import { useEffect, useCallback, useRef } from 'react'

// ==================== Types ====================

export type KeyModifier = 'ctrl' | 'shift' | 'alt' | 'meta'

export interface KeyboardShortcut {
  key: string
  modifiers?: KeyModifier[]
  handler: (event: KeyboardEvent) => void
  description: string
  preventDefault?: boolean
  enabled?: boolean
}

export interface KeyboardShortcutConfig {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

// ==================== Utilities ====================

function matchesModifiers(event: KeyboardEvent, modifiers: KeyModifier[] = []): boolean {
  const hasCtrl = modifiers.includes('ctrl') || modifiers.includes('meta')
  const hasShift = modifiers.includes('shift')
  const hasAlt = modifiers.includes('alt')

  const ctrlPressed = event.ctrlKey || event.metaKey
  const shiftPressed = event.shiftKey
  const altPressed = event.altKey

  return (
    (!hasCtrl || ctrlPressed) &&
    (!hasShift || shiftPressed) &&
    (!hasAlt || altPressed) &&
    (hasCtrl ? ctrlPressed : !ctrlPressed) &&
    (hasShift ? shiftPressed : !shiftPressed) &&
    (hasAlt ? altPressed : !altPressed)
  )
}

function matchesKey(event: KeyboardEvent, key: string): boolean {
  return event.key.toLowerCase() === key.toLowerCase()
}

function isMac(): boolean {
  return typeof window !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform)
}

export function getModifierKey(): 'Cmd' | 'Ctrl' {
  return isMac() ? 'Cmd' : 'Ctrl'
}

export function formatShortcut(key: string, modifiers: KeyModifier[] = []): string {
  const mod = getModifierKey()
  const parts: string[] = []

  if (modifiers.includes('ctrl') || modifiers.includes('meta')) {
    parts.push(mod)
  }
  if (modifiers.includes('shift')) {
    parts.push('Shift')
  }
  if (modifiers.includes('alt')) {
    parts.push('Alt')
  }

  parts.push(key.toUpperCase())

  return parts.join('+')
}

// ==================== Main Hook ====================

export function useKeyboardShortcuts(config: KeyboardShortcutConfig): void {
  const { shortcuts, enabled = true } = config
  const shortcutsRef = useRef(shortcuts)

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when typing in inputs (unless explicitly allowed)
      const target = event.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue

        if (
          matchesKey(event, shortcut.key) &&
          matchesModifiers(event, shortcut.modifiers)
        ) {
          // Skip if in input and shortcut doesn't allow it
          if (isInput && shortcut.preventDefault !== false) {
            continue
          }

          if (shortcut.preventDefault !== false) {
            event.preventDefault()
          }

          shortcut.handler(event)
          break
        }
      }
    },
    [enabled]
  )

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])
}

// ==================== Preset Shortcuts ====================

export interface CommonShortcutHandlers {
  onSave?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onDelete?: () => void
  onCopy?: () => void
  onPaste?: () => void
  onCut?: () => void
  onSelectAll?: () => void
  onEscape?: () => void
  onSearch?: () => void
  onNew?: () => void
}

export function createCommonShortcuts(
  handlers: CommonShortcutHandlers
): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = []

  if (handlers.onSave) {
    shortcuts.push({
      key: 's',
      modifiers: ['meta'],
      handler: handlers.onSave,
      description: 'Save',
      preventDefault: true,
    })
  }

  if (handlers.onUndo) {
    shortcuts.push({
      key: 'z',
      modifiers: ['meta'],
      handler: handlers.onUndo,
      description: 'Undo',
      preventDefault: true,
    })
  }

  if (handlers.onRedo) {
    shortcuts.push({
      key: 'z',
      modifiers: ['meta', 'shift'],
      handler: handlers.onRedo,
      description: 'Redo',
      preventDefault: true,
    })
  }

  if (handlers.onDelete) {
    shortcuts.push({
      key: 'Delete',
      modifiers: [],
      handler: handlers.onDelete,
      description: 'Delete selected',
      preventDefault: true,
    })
    shortcuts.push({
      key: 'Backspace',
      modifiers: [],
      handler: handlers.onDelete,
      description: 'Delete selected',
      preventDefault: true,
    })
  }

  if (handlers.onCopy) {
    shortcuts.push({
      key: 'c',
      modifiers: ['meta'],
      handler: handlers.onCopy,
      description: 'Copy',
      preventDefault: true,
    })
  }

  if (handlers.onPaste) {
    shortcuts.push({
      key: 'v',
      modifiers: ['meta'],
      handler: handlers.onPaste,
      description: 'Paste',
      preventDefault: true,
    })
  }

  if (handlers.onCut) {
    shortcuts.push({
      key: 'x',
      modifiers: ['meta'],
      handler: handlers.onCut,
      description: 'Cut',
      preventDefault: true,
    })
  }

  if (handlers.onSelectAll) {
    shortcuts.push({
      key: 'a',
      modifiers: ['meta'],
      handler: handlers.onSelectAll,
      description: 'Select all',
      preventDefault: true,
    })
  }

  if (handlers.onEscape) {
    shortcuts.push({
      key: 'Escape',
      modifiers: [],
      handler: handlers.onEscape,
      description: 'Cancel / Close',
      preventDefault: true,
    })
  }

  if (handlers.onSearch) {
    shortcuts.push({
      key: 'f',
      modifiers: ['meta'],
      handler: handlers.onSearch,
      description: 'Search',
      preventDefault: true,
    })
  }

  if (handlers.onNew) {
    shortcuts.push({
      key: 'n',
      modifiers: ['meta'],
      handler: handlers.onNew,
      description: 'New',
      preventDefault: true,
    })
  }

  return shortcuts
}

// ==================== Navigation Shortcuts ====================

export interface NavigationHandlers {
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onEnter?: () => void
  onTab?: () => void
  onShiftTab?: () => void
}

export function createNavigationShortcuts(
  handlers: NavigationHandlers
): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = []

  if (handlers.onArrowUp) {
    shortcuts.push({
      key: 'ArrowUp',
      modifiers: [],
      handler: handlers.onArrowUp,
      description: 'Move up',
      preventDefault: true,
    })
  }

  if (handlers.onArrowDown) {
    shortcuts.push({
      key: 'ArrowDown',
      modifiers: [],
      handler: handlers.onArrowDown,
      description: 'Move down',
      preventDefault: true,
    })
  }

  if (handlers.onArrowLeft) {
    shortcuts.push({
      key: 'ArrowLeft',
      modifiers: [],
      handler: handlers.onArrowLeft,
      description: 'Move left',
      preventDefault: true,
    })
  }

  if (handlers.onArrowRight) {
    shortcuts.push({
      key: 'ArrowRight',
      modifiers: [],
      handler: handlers.onArrowRight,
      description: 'Move right',
      preventDefault: true,
    })
  }

  if (handlers.onEnter) {
    shortcuts.push({
      key: 'Enter',
      modifiers: [],
      handler: handlers.onEnter,
      description: 'Confirm / Open',
      preventDefault: true,
    })
  }

  if (handlers.onTab) {
    shortcuts.push({
      key: 'Tab',
      modifiers: [],
      handler: handlers.onTab,
      description: 'Next',
      preventDefault: true,
    })
  }

  if (handlers.onShiftTab) {
    shortcuts.push({
      key: 'Tab',
      modifiers: ['shift'],
      handler: handlers.onShiftTab,
      description: 'Previous',
      preventDefault: true,
    })
  }

  return shortcuts
}

// ==================== Shortcut Help Modal ====================

export interface ShortcutHelpProps {
  shortcuts: KeyboardShortcut[]
  isOpen: boolean
  onClose: () => void
}

export function useShortcutHelp() {
  const [isOpen, setIsOpen] = React.useState(false)

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: '?',
        modifiers: ['shift'],
        handler: () => setIsOpen(true),
        description: 'Show keyboard shortcuts',
        preventDefault: true,
      },
    ],
  })

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }
}
