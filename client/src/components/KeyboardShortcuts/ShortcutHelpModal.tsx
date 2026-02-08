/**
 * Keyboard Shortcuts Help Modal
 * Display available keyboard shortcuts
 */

import React from 'react'
import { formatShortcut, type KeyboardShortcut } from '../../hooks/useKeyboardShortcuts'
import { useFocusTrap } from '../../hooks/useAccessibility'

export interface ShortcutHelpModalProps {
  shortcuts: KeyboardShortcut[]
  isOpen: boolean
  onClose: () => void
}

export const ShortcutHelpModal: React.FC<ShortcutHelpModalProps> = ({
  shortcuts,
  isOpen,
  onClose,
}) => {
  const modalRef = useFocusTrap(isOpen)

  if (!isOpen) return null

  // Group shortcuts by category
  const categories = {
    General: shortcuts.filter(
      (s) =>
        s.description.includes('Save') ||
        s.description.includes('Search') ||
        s.description.includes('New')
    ),
    Editing: shortcuts.filter(
      (s) =>
        s.description.includes('Undo') ||
        s.description.includes('Redo') ||
        s.description.includes('Copy') ||
        s.description.includes('Paste') ||
        s.description.includes('Cut') ||
        s.description.includes('Delete')
    ),
    Navigation: shortcuts.filter(
      (s) =>
        s.description.includes('Move') ||
        s.description.includes('Next') ||
        s.description.includes('Previous') ||
        s.description.includes('arrow')
    ),
    Other: shortcuts.filter(
      (s) =>
        !['General', 'Editing', 'Navigation'].some((cat) => {
          const checks = [
            'Save',
            'Search',
            'New',
            'Undo',
            'Redo',
            'Copy',
            'Paste',
            'Cut',
            'Delete',
            'Move',
            'Next',
            'Previous',
            'arrow',
          ]
          return checks.some((check) => s.description.includes(check))
        })
    ),
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      onClick={onClose}
    >
      <div
        ref={modalRef as React.RefObject<HTMLDivElement>}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="shortcuts-title" className="text-xl font-semibold text-gray-900">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Close shortcuts help"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {Object.entries(categories).map(([category, categoryShortcuts]) => {
            if (categoryShortcuts.length === 0) return null

            return (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">
                        {shortcut.description}
                      </span>
                      <kbd className="inline-flex items-center gap-1 px-3 py-1 text-xs font-mono font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded shadow-sm">
                        {formatShortcut(shortcut.key, shortcut.modifiers)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600">
            Press <kbd className="px-2 py-1 text-xs font-mono bg-white border border-gray-300 rounded">?</kbd> to show/hide this help
          </p>
        </div>
      </div>
    </div>
  )
}

// ==================== Keyboard Shortcut Badge ====================

export const ShortcutBadge: React.FC<{
  shortcutKey: string
  modifiers?: string[]
  className?: string
}> = ({ shortcutKey, modifiers = [], className = '' }) => (
  <kbd
    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-mono font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded ${className}`}
    aria-label={`Keyboard shortcut: ${[...modifiers, shortcutKey].join('+')}`}
  >
    {formatShortcut(shortcutKey, modifiers as any)}
  </kbd>
)

// ==================== Shortcut Hint ====================

export const ShortcutHint: React.FC<{
  label: string
  shortcutKey: string
  modifiers?: string[]
}> = ({ label, shortcutKey, modifiers }) => (
  <div className="flex items-center justify-between text-sm">
    <span>{label}</span>
    <ShortcutBadge shortcutKey={shortcutKey} modifiers={modifiers} />
  </div>
)
