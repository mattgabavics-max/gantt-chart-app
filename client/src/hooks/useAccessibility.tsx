/**
 * Accessibility Utilities and Hooks
 * ARIA labels, focus management, screen reader announcements
 */

import React, { useEffect, useRef, useCallback, useState } from 'react'

// ==================== Focus Management ====================

export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)

    // Focus first element on mount
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [isActive])

  return containerRef
}

// ==================== Auto Focus ====================

export function useAutoFocus<T extends HTMLElement>(shouldFocus: boolean = true) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (shouldFocus && ref.current) {
      ref.current.focus()
    }
  }, [shouldFocus])

  return ref
}

// ==================== Focus Restoration ====================

export function useFocusRestore() {
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const saveFocus = useCallback(() => {
    previousActiveElement.current = document.activeElement as HTMLElement
  }, [])

  const restoreFocus = useCallback(() => {
    if (previousActiveElement.current) {
      previousActiveElement.current.focus()
      previousActiveElement.current = null
    }
  }, [])

  return { saveFocus, restoreFocus }
}

// ==================== Screen Reader Announcements ====================

export type AnnouncementPriority = 'polite' | 'assertive'

export function useAnnouncer() {
  const announcerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Create announcer element
    const announcer = document.createElement('div')
    announcer.setAttribute('role', 'status')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    document.body.appendChild(announcer)
    announcerRef.current = announcer

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current)
      }
    }
  }, [])

  const announce = useCallback(
    (message: string, priority: AnnouncementPriority = 'polite') => {
      if (!announcerRef.current) return

      announcerRef.current.setAttribute('aria-live', priority)
      announcerRef.current.textContent = ''

      // Use setTimeout to ensure screen readers pick up the change
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message
        }
      }, 100)
    },
    []
  )

  return { announce }
}

// ==================== Roving Tab Index ====================

export function useRovingTabIndex<T extends HTMLElement>(
  items: T[],
  orientation: 'horizontal' | 'vertical' = 'vertical'
) {
  const [activeIndex, setActiveIndex] = useState(0)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'
      const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'

      if (event.key === nextKey) {
        event.preventDefault()
        setActiveIndex((prev) => (prev + 1) % items.length)
      } else if (event.key === prevKey) {
        event.preventDefault()
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
      } else if (event.key === 'Home') {
        event.preventDefault()
        setActiveIndex(0)
      } else if (event.key === 'End') {
        event.preventDefault()
        setActiveIndex(items.length - 1)
      }
    },
    [items.length, orientation]
  )

  useEffect(() => {
    const activeItem = items[activeIndex]
    if (activeItem) {
      activeItem.focus()
    }
  }, [activeIndex, items])

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
  }
}

// ==================== Skip Link ====================

export function useSkipLink(targetId: string) {
  const handleSkip = useCallback(() => {
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView()
    }
  }, [targetId])

  return handleSkip
}

// ==================== ARIA Utilities ====================

export function getAriaLabel(
  label: string,
  context?: Record<string, string | number>
): string {
  if (!context) return label

  let result = label
  Object.entries(context).forEach(([key, value]) => {
    result = result.replace(`{${key}}`, String(value))
  })
  return result
}

export function generateAriaDescribedBy(...ids: (string | undefined)[]): string | undefined {
  const validIds = ids.filter(Boolean)
  return validIds.length > 0 ? validIds.join(' ') : undefined
}

// ==================== Reduced Motion ====================

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}

// ==================== Visually Hidden ====================

export const srOnlyStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span style={srOnlyStyles}>{children}</span>
}

// ==================== Focus Visible ====================

export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false)
  const [wasFocusedByMouse, setWasFocusedByMouse] = useState(false)

  const onFocus = useCallback(() => {
    if (!wasFocusedByMouse) {
      setIsFocusVisible(true)
    }
  }, [wasFocusedByMouse])

  const onBlur = useCallback(() => {
    setIsFocusVisible(false)
    setWasFocusedByMouse(false)
  }, [])

  const onMouseDown = useCallback(() => {
    setWasFocusedByMouse(true)
  }, [])

  return {
    isFocusVisible,
    focusProps: {
      onFocus,
      onBlur,
      onMouseDown,
    },
  }
}

// ==================== Accessible Navigation ====================

export interface AccessibleNavigationProps {
  items: Array<{ id: string; label: string }>
  activeId: string
  onActivate: (id: string) => void
  orientation?: 'horizontal' | 'vertical'
}

export function useAccessibleNavigation({
  items,
  activeId,
  onActivate,
  orientation = 'horizontal',
}: AccessibleNavigationProps) {
  const activeIndex = items.findIndex((item) => item.id === activeId)

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
      const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'

      let newIndex = activeIndex

      if (event.key === nextKey) {
        event.preventDefault()
        newIndex = (activeIndex + 1) % items.length
      } else if (event.key === prevKey) {
        event.preventDefault()
        newIndex = (activeIndex - 1 + items.length) % items.length
      } else if (event.key === 'Home') {
        event.preventDefault()
        newIndex = 0
      } else if (event.key === 'End') {
        event.preventDefault()
        newIndex = items.length - 1
      }

      if (newIndex !== activeIndex) {
        onActivate(items[newIndex].id)
      }
    },
    [activeIndex, items, onActivate, orientation]
  )

  return { handleKeyDown }
}

// ==================== Accessible Form Field ====================

export interface AccessibleFieldProps {
  id: string
  label: string
  error?: string
  description?: string
  required?: boolean
}

export function useAccessibleField({
  id,
  label,
  error,
  description,
  required,
}: AccessibleFieldProps) {
  const errorId = error ? `${id}-error` : undefined
  const descriptionId = description ? `${id}-description` : undefined

  const ariaDescribedBy = generateAriaDescribedBy(errorId, descriptionId)

  return {
    fieldProps: {
      id,
      'aria-label': label,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': error ? true : undefined,
      'aria-required': required,
    },
    labelProps: {
      htmlFor: id,
    },
    errorProps: error
      ? {
          id: errorId,
          role: 'alert',
          'aria-live': 'polite' as const,
        }
      : undefined,
    descriptionProps: description
      ? {
          id: descriptionId,
        }
      : undefined,
  }
}

// ==================== Loading Announcements ====================

export function useLoadingAnnouncement(
  isLoading: boolean,
  loadingMessage: string = 'Loading',
  completeMessage: string = 'Content loaded'
) {
  const { announce } = useAnnouncer()
  const previousLoadingRef = useRef(isLoading)

  useEffect(() => {
    if (isLoading && !previousLoadingRef.current) {
      announce(loadingMessage, 'polite')
    } else if (!isLoading && previousLoadingRef.current) {
      announce(completeMessage, 'polite')
    }
    previousLoadingRef.current = isLoading
  }, [isLoading, loadingMessage, completeMessage, announce])
}

// ==================== Accessible Dropdown ====================

export function useAccessibleDropdown(isOpen: boolean, onClose: () => void) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        triggerRef.current?.focus()
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  return { triggerRef, menuRef }
}
