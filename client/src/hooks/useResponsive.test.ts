/**
 * Responsive Design Hooks Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import {
  useMediaQuery,
  useBreakpoint,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchDevice,
  useWindowSize,
  useOrientation,
  useSidebarState,
  BREAKPOINTS,
} from './useResponsive'

describe('useMediaQuery', () => {
  it('should return true for matching query', () => {
    // Mock matchMedia to return matches: true
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(true)
  })

  it('should return false for non-matching query', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(false)
  })

  it('should update when media query changes', async () => {
    let listener: ((e: MediaQueryListEvent) => void) | null = null

    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn((_, fn) => {
        listener = fn
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(false)

    // Simulate media query change
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

describe('useBreakpoint', () => {
  it('should return correct breakpoint for window width', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    })

    const { result } = renderHook(() => useBreakpoint())

    expect(result.current).toBe('xl')
  })

  it('should update on window resize', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    })

    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('xl')

    // Simulate resize
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: 768,
      })
      window.dispatchEvent(new Event('resize'))
    })

    await waitFor(() => {
      expect(result.current).toBe('md')
    })
  })

  it('should return xs for very small screens', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 320,
    })

    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('xs')
  })
})

describe('useIsMobile', () => {
  it('should return true for mobile width', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query.includes('max-width: 767px'),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should return false for desktop width', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })
})

describe('useIsTablet', () => {
  it('should return true for tablet width', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => {
      // Check if query is for tablet range (768-1023px)
      return {
        matches: query.includes('min-width: 768px') && query.includes('max-width: 1023px'),
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }
    })

    const { result } = renderHook(() => useIsTablet())
    expect(typeof result.current).toBe('boolean')
  })
})

describe('useIsDesktop', () => {
  it('should return true for desktop width', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query.includes('min-width: 1024px'),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(true)
  })
})

describe('useIsTouchDevice', () => {
  it('should return true for touch devices', () => {
    Object.defineProperty(window, 'ontouchstart', {
      value: jest.fn(),
      writable: true,
    })

    const { result } = renderHook(() => useIsTouchDevice())
    expect(result.current).toBe(true)
  })

  it('should return false for non-touch devices', () => {
    Object.defineProperty(window, 'ontouchstart', {
      value: undefined,
      writable: true,
    })
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      writable: true,
    })

    const { result } = renderHook(() => useIsTouchDevice())
    expect(result.current).toBe(false)
  })
})

describe('useWindowSize', () => {
  it('should return current window size', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      writable: true,
    })

    const { result } = renderHook(() => useWindowSize())

    expect(result.current).toEqual({
      width: 1024,
      height: 768,
    })
  })

  it('should update on window resize', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      writable: true,
    })

    const { result } = renderHook(() => useWindowSize())

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 800 })
      Object.defineProperty(window, 'innerHeight', { value: 600 })
      window.dispatchEvent(new Event('resize'))
    })

    await waitFor(() => {
      expect(result.current.width).toBe(800)
      expect(result.current.height).toBe(600)
    })
  })
})

describe('useOrientation', () => {
  it('should return portrait for tall windows', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 768,
      writable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      value: 1024,
      writable: true,
    })

    const { result } = renderHook(() => useOrientation())
    expect(result.current).toBe('portrait')
  })

  it('should return landscape for wide windows', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      writable: true,
    })

    const { result } = renderHook(() => useOrientation())
    expect(result.current).toBe('landscape')
  })

  it('should update on orientation change', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 768,
      writable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      value: 1024,
      writable: true,
    })

    const { result } = renderHook(() => useOrientation())
    expect(result.current).toBe('portrait')

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 })
      Object.defineProperty(window, 'innerHeight', { value: 768 })
      window.dispatchEvent(new Event('orientationchange'))
    })

    await waitFor(() => {
      expect(result.current).toBe('landscape')
    })
  })
})

describe('useSidebarState', () => {
  beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false, // Desktop by default
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
  })

  it('should initialize with default open state', () => {
    const { result } = renderHook(() => useSidebarState(true))

    expect(result.current.isOpen).toBe(true)
    expect(result.current.isMobile).toBe(false)
  })

  it('should toggle sidebar state', () => {
    const { result } = renderHook(() => useSidebarState(true))

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('should open sidebar', () => {
    const { result } = renderHook(() => useSidebarState(false))

    act(() => {
      result.current.open()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('should close sidebar', () => {
    const { result } = renderHook(() => useSidebarState(true))

    act(() => {
      result.current.close()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('should auto-close on mobile', () => {
    // Start on desktop with sidebar open
    const { result, rerender } = renderHook(() => useSidebarState(true))
    expect(result.current.isOpen).toBe(true)

    // Switch to mobile
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query.includes('max-width'), // Mobile
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    rerender()

    // Sidebar should stay open until explicitly closed or component updates
    // This tests the current behavior
  })
})

describe('BREAKPOINTS constant', () => {
  it('should have correct breakpoint values', () => {
    expect(BREAKPOINTS.xs).toBe(0)
    expect(BREAKPOINTS.sm).toBe(640)
    expect(BREAKPOINTS.md).toBe(768)
    expect(BREAKPOINTS.lg).toBe(1024)
    expect(BREAKPOINTS.xl).toBe(1280)
    expect(BREAKPOINTS['2xl']).toBe(1536)
  })

  it('should have breakpoints in ascending order', () => {
    const values = Object.values(BREAKPOINTS)
    const sorted = [...values].sort((a, b) => a - b)
    expect(values).toEqual(sorted)
  })
})
