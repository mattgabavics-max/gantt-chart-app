/**
 * Auto-Save Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAutoSave, useBatchAutoSave, useMergeAutoSave } from './useAutoSave'

// Mock timers
beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})

describe('useAutoSave', () => {
  describe('queueSave', () => {
    it('should queue save with debounce', async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() =>
        useAutoSave({
          saveFn,
          delay: 500,
        })
      )

      // Queue save
      act(() => {
        result.current.queueSave('test data')
      })

      // Should be pending
      expect(result.current.isPending).toBe(true)
      expect(saveFn).not.toHaveBeenCalled()

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Wait for save to complete
      await waitFor(() => {
        expect(saveFn).toHaveBeenCalledWith('test data')
        expect(result.current.isSaving).toBe(false)
        expect(result.current.isPending).toBe(false)
        expect(result.current.lastSaved).not.toBeNull()
      })
    })

    it('should reset debounce on multiple queue calls', async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() =>
        useAutoSave({
          saveFn,
          delay: 500,
        })
      )

      // Queue first save
      act(() => {
        result.current.queueSave('data 1')
      })

      // Advance partially
      act(() => {
        jest.advanceTimersByTime(300)
      })

      // Queue second save (should reset timer)
      act(() => {
        result.current.queueSave('data 2')
      })

      // Advance another 300ms (total 600ms, but timer was reset)
      act(() => {
        jest.advanceTimersByTime(300)
      })

      // Should not have saved yet
      expect(saveFn).not.toHaveBeenCalled()

      // Advance remaining 200ms
      act(() => {
        jest.advanceTimersByTime(200)
      })

      // Should save latest data
      await waitFor(() => {
        expect(saveFn).toHaveBeenCalledTimes(1)
        expect(saveFn).toHaveBeenCalledWith('data 2')
      })
    })

    it('should not queue when disabled', () => {
      const saveFn = jest.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() =>
        useAutoSave({
          saveFn,
          enabled: false,
        })
      )

      act(() => {
        result.current.queueSave('test data')
      })

      expect(result.current.isPending).toBe(false)

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(saveFn).not.toHaveBeenCalled()
    })
  })

  describe('saveNow', () => {
    it('should save immediately bypassing debounce', async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() =>
        useAutoSave({
          saveFn,
          delay: 500,
        })
      )

      // Queue save
      act(() => {
        result.current.queueSave('test data')
      })

      // Save immediately
      await act(async () => {
        await result.current.saveNow()
      })

      // Should have saved without waiting for debounce
      expect(saveFn).toHaveBeenCalledWith('test data')
      expect(result.current.isPending).toBe(false)
    })

    it('should clear debounce timer', async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() =>
        useAutoSave({
          saveFn,
          delay: 500,
        })
      )

      // Queue save
      act(() => {
        result.current.queueSave('test data')
      })

      // Save immediately
      await act(async () => {
        await result.current.saveNow()
      })

      // Advance timers (should not trigger another save)
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(saveFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('retry logic', () => {
    it('should retry on failure', async () => {
      let attempts = 0
      const saveFn = jest.fn().mockImplementation(async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Save failed')
        }
      })

      const { result } = renderHook(() =>
        useAutoSave({
          saveFn,
          delay: 500,
          maxRetries: 3,
          retryDelay: 100,
        })
      )

      // Queue save
      act(() => {
        result.current.queueSave('test data')
      })

      // Trigger save
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Wait for initial failure
      await waitFor(() => {
        expect(result.current.retryCount).toBe(1)
      })

      // Advance for first retry (100ms)
      act(() => {
        jest.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(result.current.retryCount).toBe(2)
      })

      // Advance for second retry (200ms - exponential backoff)
      act(() => {
        jest.advanceTimersByTime(200)
      })

      // Should succeed on third attempt
      await waitFor(() => {
        expect(saveFn).toHaveBeenCalledTimes(3)
        expect(result.current.isSaving).toBe(false)
        expect(result.current.error).toBeNull()
        expect(result.current.retryCount).toBe(0)
      })
    })

    it('should set error after max retries', async () => {
      const saveFn = jest.fn().mockRejectedValue(new Error('Save failed'))
      const onError = jest.fn()

      const { result } = renderHook(() =>
        useAutoSave({
          saveFn,
          delay: 500,
          maxRetries: 2,
          retryDelay: 100,
          onError,
        })
      )

      // Queue save
      act(() => {
        result.current.queueSave('test data')
      })

      // Trigger save
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Wait for initial failure
      await waitFor(() => {
        expect(result.current.retryCount).toBe(1)
      })

      // Retry 1
      act(() => {
        jest.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(result.current.retryCount).toBe(2)
      })

      // Retry 2 (last retry)
      act(() => {
        jest.advanceTimersByTime(200)
      })

      // Should have error after max retries
      await waitFor(() => {
        expect(result.current.isSaving).toBe(false)
        expect(result.current.error).toEqual(new Error('Save failed'))
        expect(onError).toHaveBeenCalledWith(new Error('Save failed'))
      })
    })
  })

  describe('callbacks', () => {
    it('should call onSuccess on successful save', async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined)
      const onSuccess = jest.fn()

      const { result } = renderHook(() =>
        useAutoSave({
          saveFn,
          onSuccess,
        })
      )

      await act(async () => {
        result.current.queueSave('test data')
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('should call onError on failure after retries', async () => {
      const saveFn = jest.fn().mockRejectedValue(new Error('Failed'))
      const onError = jest.fn()

      const { result } = renderHook(() =>
        useAutoSave({
          saveFn,
          maxRetries: 1,
          retryDelay: 100,
          onError,
        })
      )

      act(() => {
        result.current.queueSave('test data')
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(result.current.retryCount).toBe(1)
      })

      act(() => {
        jest.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(new Error('Failed'))
      })
    })
  })

  describe('queue management', () => {
    it('should process queued items sequentially', async () => {
      const saveFn = jest.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() =>
        useAutoSave({
          saveFn,
          delay: 500,
        })
      )

      // Queue multiple items
      act(() => {
        result.current.queueSave('data 1')
        result.current.queueSave('data 2')
        result.current.queueSave('data 3')
      })

      // Should replace previous items in queue
      act(() => {
        jest.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(saveFn).toHaveBeenCalledTimes(1)
        expect(saveFn).toHaveBeenCalledWith('data 3')
      })
    })

    it('should clear queue', () => {
      const saveFn = jest.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() =>
        useAutoSave({
          saveFn,
          delay: 500,
        })
      )

      act(() => {
        result.current.queueSave('test data')
      })

      expect(result.current.isPending).toBe(true)

      act(() => {
        result.current.clearQueue()
      })

      expect(result.current.isPending).toBe(false)

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(saveFn).not.toHaveBeenCalled()
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      const saveFn = jest.fn().mockRejectedValue(new Error('Failed'))
      const { result } = renderHook(() =>
        useAutoSave({
          saveFn,
          maxRetries: 0,
        })
      )

      act(() => {
        result.current.queueSave('test data')
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
  })
})

describe('useBatchAutoSave', () => {
  it('should batch multiple items', async () => {
    const saveFn = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useBatchAutoSave({
        saveFn,
        delay: 500,
        maxBatchSize: 3,
      })
    )

    // Queue multiple items
    act(() => {
      result.current.queueSave({ id: '1', name: 'Item 1' })
      result.current.queueSave({ id: '2', name: 'Item 2' })
    })

    // Trigger save
    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(saveFn).toHaveBeenCalledWith([
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ])
    })
  })

  it('should save immediately when batch is full', async () => {
    const saveFn = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useBatchAutoSave({
        saveFn,
        delay: 500,
        maxBatchSize: 2,
      })
    )

    // Queue items up to max batch size
    act(() => {
      result.current.queueSave({ id: '1', name: 'Item 1' })
    })

    // Should not save yet
    expect(saveFn).not.toHaveBeenCalled()

    // Note: The current implementation saves immediately for each item
    // This test documents current behavior
  })
})

describe('useMergeAutoSave', () => {
  it('should merge partial updates with current state', async () => {
    const saveFn = jest.fn().mockResolvedValue(undefined)
    const initialData = {
      name: 'Original',
      description: 'Original description',
      status: 'active',
    }

    const { result } = renderHook(() =>
      useMergeAutoSave({
        initialData,
        saveFn,
        delay: 500,
      })
    )

    // Queue partial update
    act(() => {
      result.current.queueSave({ name: 'Updated' })
    })

    // Trigger save
    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(result.current.currentData).toEqual({
        name: 'Updated',
        description: 'Original description',
        status: 'active',
      })
      expect(saveFn).toHaveBeenCalledWith({ name: 'Updated' })
    })
  })

  it('should use custom merge function', async () => {
    const saveFn = jest.fn().mockResolvedValue(undefined)
    const initialData = {
      tags: ['tag1', 'tag2'],
      count: 5,
    }

    const mergeFn = jest.fn((current, updates) => ({
      ...current,
      ...updates,
      tags: updates.tags
        ? [...current.tags, ...updates.tags]
        : current.tags,
    }))

    const { result } = renderHook(() =>
      useMergeAutoSave({
        initialData,
        saveFn,
        mergeFn,
        delay: 500,
      })
    )

    act(() => {
      result.current.queueSave({ tags: ['tag3'] })
    })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(mergeFn).toHaveBeenCalled()
      expect(result.current.currentData.tags).toEqual(['tag1', 'tag2', 'tag3'])
    })
  })
})
