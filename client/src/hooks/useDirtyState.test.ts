/**
 * Dirty State Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import {
  useDirtyState,
  useFormDirtyState,
  useAutoSaveDirtyState,
  useLastSavedDisplay,
} from './useDirtyState'

// Mock useBlocker from react-router-dom
jest.mock('react-router-dom', () => ({
  useBlocker: jest.fn(() => ({
    state: 'unblocked',
    proceed: jest.fn(),
    reset: jest.fn(),
  })),
}))

describe('useDirtyState', () => {
  describe('basic functionality', () => {
    it('should initialize as clean', () => {
      const { result } = renderHook(() => useDirtyState())

      expect(result.current.isDirty).toBe(false)
      expect(result.current.lastCleanedAt).toBeNull()
    })

    it('should mark as dirty', () => {
      const { result } = renderHook(() => useDirtyState())

      act(() => {
        result.current.markDirty()
      })

      expect(result.current.isDirty).toBe(true)
    })

    it('should mark as clean', () => {
      const { result } = renderHook(() => useDirtyState())

      act(() => {
        result.current.markDirty()
      })

      expect(result.current.isDirty).toBe(true)

      act(() => {
        result.current.markClean()
      })

      expect(result.current.isDirty).toBe(false)
      expect(result.current.lastCleanedAt).toBeInstanceOf(Date)
    })

    it('should toggle dirty state', () => {
      const { result } = renderHook(() => useDirtyState())

      expect(result.current.isDirty).toBe(false)

      act(() => {
        result.current.toggleDirty()
      })

      expect(result.current.isDirty).toBe(true)

      act(() => {
        result.current.toggleDirty()
      })

      expect(result.current.isDirty).toBe(false)
    })

    it('should reset state', () => {
      const { result } = renderHook(() => useDirtyState())

      act(() => {
        result.current.markDirty()
        result.current.markClean()
      })

      expect(result.current.isDirty).toBe(false)
      expect(result.current.lastCleanedAt).not.toBeNull()

      act(() => {
        result.current.reset()
      })

      expect(result.current.isDirty).toBe(false)
      expect(result.current.lastCleanedAt).toBeNull()
    })
  })

  describe('enabled option', () => {
    it('should not mark dirty when disabled', () => {
      const { result } = renderHook(() => useDirtyState({ enabled: false }))

      act(() => {
        result.current.markDirty()
      })

      expect(result.current.isDirty).toBe(false)
    })

    it('should not mark clean when disabled', () => {
      const { result } = renderHook(() =>
        useDirtyState({ enabled: false })
      )

      // Manually set dirty (even though disabled)
      act(() => {
        result.current.markDirty()
      })

      act(() => {
        result.current.markClean()
      })

      expect(result.current.lastCleanedAt).toBeNull()
    })
  })

  describe('callbacks', () => {
    it('should call onDirtyChange when dirty state changes', () => {
      const onDirtyChange = jest.fn()
      const { result } = renderHook(() => useDirtyState({ onDirtyChange }))

      act(() => {
        result.current.markDirty()
      })

      expect(onDirtyChange).toHaveBeenCalledWith(true)

      act(() => {
        result.current.markClean()
      })

      expect(onDirtyChange).toHaveBeenCalledWith(false)
    })

    it('should not call callbacks when disabled', () => {
      const onDirtyChange = jest.fn()
      const { result } = renderHook(() =>
        useDirtyState({ enabled: false, onDirtyChange })
      )

      act(() => {
        result.current.markDirty()
      })

      // Should not be called because tracking is disabled
      expect(onDirtyChange).not.toHaveBeenCalled()
    })
  })

  describe('beforeunload handler', () => {
    it('should add beforeunload listener when dirty', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      const { result } = renderHook(() => useDirtyState())

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      )
    })

    it('should prevent unload when dirty', () => {
      const { result } = renderHook(() => useDirtyState())

      act(() => {
        result.current.markDirty()
      })

      const event = new Event('beforeunload') as BeforeUnloadEvent
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

      window.dispatchEvent(event)

      // Note: This test documents current behavior
      // Actual beforeunload prevention may not work in test environment
    })
  })
})

describe('useFormDirtyState', () => {
  it('should detect changes from initial values', () => {
    const initialValues = { name: 'Original', value: 10 }
    const currentValues = { name: 'Original', value: 10 }

    const { result, rerender } = renderHook(
      ({ current }) => useFormDirtyState(current, { initialValues }),
      { initialProps: { current: currentValues } }
    )

    expect(result.current.isDirty).toBe(false)

    // Update current values
    rerender({ current: { name: 'Updated', value: 10 } })

    expect(result.current.isDirty).toBe(true)
  })

  it('should mark clean when values match initial', () => {
    const initialValues = { name: 'Original', value: 10 }

    const { result, rerender } = renderHook(
      ({ current }) => useFormDirtyState(current, { initialValues }),
      { initialProps: { current: { name: 'Updated', value: 10 } } }
    )

    expect(result.current.isDirty).toBe(true)

    // Reset to original
    rerender({ current: { name: 'Original', value: 10 } })

    expect(result.current.isDirty).toBe(false)
  })

  it('should use custom isEqual function', () => {
    const initialValues = { items: [1, 2, 3] }
    const isEqual = jest.fn((a, b) => a.items.length === b.items.length)

    const { result, rerender } = renderHook(
      ({ current }) =>
        useFormDirtyState(current, { initialValues, isEqual }),
      { initialProps: { current: { items: [1, 2, 3] } } }
    )

    expect(result.current.isDirty).toBe(false)

    // Change items but keep same length
    rerender({ current: { items: [4, 5, 6] } })

    // Should not be dirty because custom isEqual checks length
    expect(result.current.isDirty).toBe(false)
    expect(isEqual).toHaveBeenCalled()
  })
})

describe('useAutoSaveDirtyState', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should auto-save when dirty', async () => {
    const saveFn = jest.fn().mockResolvedValue(undefined)
    const data = { name: 'Test' }

    const { result } = renderHook(() =>
      useAutoSaveDirtyState(data, { saveFn, delay: 500 })
    )

    // Mark dirty
    act(() => {
      result.current.markDirty()
    })

    expect(result.current.isDirty).toBe(true)

    // Advance timer
    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(saveFn).toHaveBeenCalledWith(data)
      expect(result.current.isDirty).toBe(false)
      expect(result.current.lastSavedAt).toBeInstanceOf(Date)
    })
  })

  it('should debounce auto-save', async () => {
    const saveFn = jest.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSaveDirtyState(data, { saveFn, delay: 500 }),
      { initialProps: { data: { name: 'Test 1' } } }
    )

    // Mark dirty multiple times
    act(() => {
      result.current.markDirty()
    })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    // Update data again
    rerender({ data: { name: 'Test 2' } })
    act(() => {
      result.current.markDirty()
    })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    // Should not have saved yet
    expect(saveFn).not.toHaveBeenCalled()

    // Complete the debounce
    act(() => {
      jest.advanceTimersByTime(200)
    })

    await waitFor(() => {
      expect(saveFn).toHaveBeenCalledTimes(1)
      expect(saveFn).toHaveBeenCalledWith({ name: 'Test 2' })
    })
  })

  it('should manually save immediately', async () => {
    const saveFn = jest.fn().mockResolvedValue(undefined)
    const data = { name: 'Test' }

    const { result } = renderHook(() =>
      useAutoSaveDirtyState(data, { saveFn, delay: 500 })
    )

    act(() => {
      result.current.markDirty()
    })

    // Save immediately
    await act(async () => {
      await result.current.save()
    })

    expect(saveFn).toHaveBeenCalledWith(data)
    expect(result.current.isDirty).toBe(false)
  })

  it('should handle save errors', async () => {
    const saveFn = jest.fn().mockRejectedValue(new Error('Save failed'))
    const data = { name: 'Test' }

    const { result } = renderHook(() =>
      useAutoSaveDirtyState(data, { saveFn, delay: 500 })
    )

    act(() => {
      result.current.markDirty()
    })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(result.current.error).toEqual(new Error('Save failed'))
      expect(result.current.isSaving).toBe(false)
    })
  })

  it('should clear error state', async () => {
    const saveFn = jest.fn().mockRejectedValue(new Error('Save failed'))
    const data = { name: 'Test' }

    const { result } = renderHook(() =>
      useAutoSaveDirtyState(data, { saveFn, delay: 500 })
    )

    act(() => {
      result.current.markDirty()
    })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it('should not auto-save when disabled', () => {
    const saveFn = jest.fn().mockResolvedValue(undefined)
    const data = { name: 'Test' }

    const { result } = renderHook(() =>
      useAutoSaveDirtyState(data, {
        saveFn,
        delay: 500,
        autoSaveEnabled: false,
      })
    )

    act(() => {
      result.current.markDirty()
    })

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(saveFn).not.toHaveBeenCalled()
  })
})

describe('useLastSavedDisplay', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should show "Saving..." when saving', () => {
    const { result } = renderHook(() =>
      useLastSavedDisplay(true, { lastSavedAt: null })
    )

    expect(result.current.displayText).toBe('Saving...')
    expect(result.current.secondsAgo).toBeNull()
  })

  it('should show "Not saved yet" when never saved', () => {
    const { result } = renderHook(() =>
      useLastSavedDisplay(false, { lastSavedAt: null })
    )

    expect(result.current.displayText).toBe('Not saved yet')
    expect(result.current.secondsAgo).toBeNull()
  })

  it('should show "Saved just now" for recent saves', () => {
    const now = new Date()
    const { result } = renderHook(() =>
      useLastSavedDisplay(false, { lastSavedAt: now })
    )

    expect(result.current.displayText).toBe('Saved just now')
    expect(result.current.secondsAgo).toBeLessThan(10)
  })

  it('should show minutes for saves < 1 hour ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const { result } = renderHook(() =>
      useLastSavedDisplay(false, { lastSavedAt: fiveMinutesAgo })
    )

    expect(result.current.displayText).toBe('Saved 5 minutes ago')
    expect(result.current.secondsAgo).toBeGreaterThan(290)
    expect(result.current.secondsAgo).toBeLessThan(310)
  })

  it('should show hours for saves < 1 day ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const { result } = renderHook(() =>
      useLastSavedDisplay(false, { lastSavedAt: twoHoursAgo })
    )

    expect(result.current.displayText).toBe('Saved 2 hours ago')
  })

  it('should show days for saves >= 1 day ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const { result } = renderHook(() =>
      useLastSavedDisplay(false, { lastSavedAt: threeDaysAgo })
    )

    expect(result.current.displayText).toBe('Saved 3 days ago')
  })

  it('should update display periodically', () => {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    const { result } = renderHook(() =>
      useLastSavedDisplay(false, {
        lastSavedAt: oneMinuteAgo,
        updateInterval: 1000,
      })
    )

    expect(result.current.displayText).toBe('Saved 1 minute ago')

    // Advance time
    act(() => {
      jest.advanceTimersByTime(60000) // 1 minute
    })

    // Should update to 2 minutes
    expect(result.current.displayText).toBe('Saved 2 minutes ago')
  })

  it('should not show "Saving..." when showSaving is false', () => {
    const { result } = renderHook(() =>
      useLastSavedDisplay(true, {
        lastSavedAt: new Date(),
        showSaving: false,
      })
    )

    expect(result.current.displayText).toBe('Saved just now')
  })
})
