/**
 * Responsive Design Utilities
 * Hooks for responsive behavior and mobile support
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// ==================== Breakpoints ====================

export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

// ==================== Media Query Hook ====================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

// ==================== Breakpoint Hook ====================

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth

      if (width >= BREAKPOINTS['2xl']) {
        setBreakpoint('2xl')
      } else if (width >= BREAKPOINTS.xl) {
        setBreakpoint('xl')
      } else if (width >= BREAKPOINTS.lg) {
        setBreakpoint('lg')
      } else if (width >= BREAKPOINTS.md) {
        setBreakpoint('md')
      } else if (width >= BREAKPOINTS.sm) {
        setBreakpoint('sm')
      } else {
        setBreakpoint('xs')
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return breakpoint
}

// ==================== Is Mobile ====================

export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`)
}

export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`
  )
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`)
}

// ==================== Touch Device Detection ====================

export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - for older browsers
        navigator.msMaxTouchPoints > 0
    )
  }, [])

  return isTouch
}

// ==================== Window Size ====================

export interface WindowSize {
  width: number
  height: number
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

// ==================== Element Size ====================

export function useElementSize<T extends HTMLElement>(): [
  React.RefObject<T>,
  { width: number; height: number }
] {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!ref.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    resizeObserver.observe(ref.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return [ref, size]
}

// ==================== Orientation ====================

export type Orientation = 'portrait' | 'landscape'

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  )

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      )
    }

    window.addEventListener('resize', handleOrientationChange)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return orientation
}

// ==================== Sidebar State ====================

export function useSidebarState(defaultOpen: boolean = true) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // Auto-close on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      setIsOpen(false)
    }
  }, [isMobile])

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    toggle,
    open,
    close,
    isMobile,
  }
}

// ==================== Scroll Lock ====================

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return

    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight

    // Get scrollbar width
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth

    // Lock scroll
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
    }
  }, [isLocked])
}

// ==================== Responsive Value ====================

export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
  const breakpoint = useBreakpoint()

  // Find the largest breakpoint that matches
  const orderedBreakpoints: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs']

  for (const bp of orderedBreakpoints) {
    if (BREAKPOINTS[bp] <= BREAKPOINTS[breakpoint] && values[bp] !== undefined) {
      return values[bp]
    }
  }

  return undefined
}

// ==================== Container Query ====================

export function useContainerQuery<T extends HTMLElement>(
  breakpoints: Record<string, number>
): [React.RefObject<T>, string | null] {
  const ref = useRef<T>(null)
  const [activeBreakpoint, setActiveBreakpoint] = useState<string | null>(null)

  useEffect(() => {
    if (!ref.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const width = entry.contentRect.width

        // Find largest matching breakpoint
        let matchedBreakpoint: string | null = null
        let maxWidth = 0

        Object.entries(breakpoints).forEach(([name, minWidth]) => {
          if (width >= minWidth && minWidth > maxWidth) {
            matchedBreakpoint = name
            maxWidth = minWidth
          }
        })

        setActiveBreakpoint(matchedBreakpoint)
      }
    })

    resizeObserver.observe(ref.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [breakpoints])

  return [ref, activeBreakpoint]
}

// ==================== Touch Events ====================

export interface TouchHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}

export function useTouchGestures<T extends HTMLElement>(
  handlers: TouchHandlers
): React.RefObject<T> {
  const ref = useRef<T>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const { threshold = 50 } = handlers

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y

      // Horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            handlers.onSwipeRight?.()
          } else {
            handlers.onSwipeLeft?.()
          }
        }
      }
      // Vertical swipe
      else {
        if (Math.abs(deltaY) > threshold) {
          if (deltaY > 0) {
            handlers.onSwipeDown?.()
          } else {
            handlers.onSwipeUp?.()
          }
        }
      }

      touchStartRef.current = null
    }

    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handlers, threshold])

  return ref
}

// ==================== Viewport Height (mobile-safe) ====================

export function useViewportHeight(): number {
  const [height, setHeight] = useState(window.innerHeight)

  useEffect(() => {
    const updateHeight = () => {
      // Use visualViewport for mobile browsers
      const vh = window.visualViewport?.height || window.innerHeight
      setHeight(vh)
    }

    updateHeight()

    window.addEventListener('resize', updateHeight)
    window.visualViewport?.addEventListener('resize', updateHeight)

    return () => {
      window.removeEventListener('resize', updateHeight)
      window.visualViewport?.removeEventListener('resize', updateHeight)
    }
  }, [])

  return height
}

// ==================== Safe Area Insets (for mobile notches) ====================

export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })

  useEffect(() => {
    const updateInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement)

      setInsets({
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0'),
      })
    }

    updateInsets()
  }, [])

  return insets
}
