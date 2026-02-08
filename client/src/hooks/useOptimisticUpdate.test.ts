/**
 * Optimistic Update Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import {
  useOptimisticUpdate,
  useBatchOptimisticUpdate,
} from './useOptimisticUpdate'

interface TestItem {
  id: string
  name: string
  value: number
}

describe('useOptimisticUpdate', () => {
  describe('update', () => {
    it('should update optimistically and confirm with server response', async () => {
      const items: TestItem[] = [
        { id: '1', name: 'Item 1', value: 10 },
        { id: '2', name: 'Item 2', value: 20 },
      ]

      const setItems = jest.fn()
      const updateFn = jest.fn().mockImplementation(async (id, data) => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return { ...items.find((i) => i.id === id)!, ...data, value: 999 }
      })

      const { result } = renderHook(() =>
        useOptimisticUpdate(items, setItems, { updateFn })
      )

      // Perform update
      act(() => {
        result.current.update('1', { value: 50 })
      })

      // Should immediately update UI
      await waitFor(() => {
        expect(setItems).toHaveBeenCalledWith(expect.any(Function))
        const updateFn = setItems.mock.calls[0][0]
        const newItems = updateFn(items)
        expect(newItems[0].value).toBe(50)
      })

      // Should be pending
      expect(result.current.isPending('1')).toBe(true)
      expect(result.current.isUpdating).toBe(true)

      // Wait for server response
      await waitFor(
        () => {
          expect(result.current.isUpdating).toBe(false)
          expect(result.current.isPending('1')).toBe(false)
        },
        { timeout: 200 }
      )

      // Should update with server response
      expect(setItems).toHaveBeenCalledTimes(2)
      const finalUpdate = setItems.mock.calls[1][0]
      const finalItems = finalUpdate(items)
      expect(finalItems[0].value).toBe(999)
    })

    it('should support different optimistic and server data', async () => {
      const items: TestItem[] = [{ id: '1', name: 'Item 1', value: 10 }]
      const setItems = jest.fn()
      const updateFn = jest.fn().mockResolvedValue({
        id: '1',
        name: 'Server Name',
        value: 100,
      })

      const { result } = renderHook(() =>
        useOptimisticUpdate(items, setItems, { updateFn })
      )

      // Update with different optimistic and server data
      await act(async () => {
        await result.current.update(
          '1',
          { value: 50 }, // optimistic
          { value: 100 } // server
        )
      })

      // Should call updateFn with server data
      expect(updateFn).toHaveBeenCalledWith('1', { value: 100 })
    })

    it('should throw error if item not found', async () => {
      const items: TestItem[] = []
      const setItems = jest.fn()
      const updateFn = jest.fn()

      const { result } = renderHook(() =>
        useOptimisticUpdate(items, setItems, { updateFn })
      )

      await expect(
        act(async () => {
          await result.current.update('nonexistent', { value: 50 })
        })
      ).rejects.toThrow('Item with id nonexistent not found')
    })
  })

  describe('rollback', () => {
    it('should rollback on error when autoRollback is true', async () => {
      const items: TestItem[] = [{ id: '1', name: 'Item 1', value: 10 }]
      const setItems = jest.fn()
      const updateFn = jest.fn().mockRejectedValue(new Error('Update failed'))
      const onRollback = jest.fn()

      const { result } = renderHook(() =>
        useOptimisticUpdate(items, setItems, {
          updateFn,
          autoRollback: true,
          onRollback,
        })
      )

      // Perform update
      try {
        await act(async () => {
          await result.current.update('1', { value: 50 })
        })
      } catch (error) {
        // Expected to throw
      }

      // Should have applied optimistic update
      expect(setItems).toHaveBeenCalledTimes(2) // optimistic + rollback

      // Should have rolled back
      const rollbackUpdate = setItems.mock.calls[1][0]
      const rolledBackItems = rollbackUpdate(items)
      expect(rolledBackItems[0].value).toBe(10)

      expect(onRollback).toHaveBeenCalledWith('1', { id: '1', name: 'Item 1', value: 10 })
    })

    it('should not rollback when autoRollback is false', async () => {
      const items: TestItem[] = [{ id: '1', name: 'Item 1', value: 10 }]
      const setItems = jest.fn()
      const updateFn = jest.fn().mockRejectedValue(new Error('Update failed'))

      const { result } = renderHook(() =>
        useOptimisticUpdate(items, setItems, {
          updateFn,
          autoRollback: false,
        })
      )

      try {
        await act(async () => {
          await result.current.update('1', { value: 50 })
        })
      } catch (error) {
        // Expected to throw
      }

      // Should only have optimistic update, no rollback
      expect(setItems).toHaveBeenCalledTimes(1)
    })

    it('should manually rollback specific update', async () => {
      const items: TestItem[] = [{ id: '1', name: 'Item 1', value: 10 }]
      const setItems = jest.fn()
      const updateFn = jest.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )
      const onRollback = jest.fn()

      const { result } = renderHook(() =>
        useOptimisticUpdate(items, setItems, { updateFn, onRollback })
      )

      // Start update
      act(() => {
        result.current.update('1', { value: 50 })
      })

      // Wait for optimistic update
      await waitFor(() => {
        expect(result.current.isPending('1')).toBe(true)
      })

      // Manually rollback
      act(() => {
        result.current.rollback('1')
      })

      expect(onRollback).toHaveBeenCalledWith('1', { id: '1', name: 'Item 1', value: 10 })
      expect(result.current.isPending('1')).toBe(false)
    })

    it('should rollback all pending updates', async () => {
      const items: TestItem[] = [
        { id: '1', name: 'Item 1', value: 10 },
        { id: '2', name: 'Item 2', value: 20 },
      ]
      const setItems = jest.fn()
      const updateFn = jest.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )
      const onRollback = jest.fn()

      const { result } = renderHook(() =>
        useOptimisticUpdate(items, setItems, { updateFn, onRollback })
      )

      // Start multiple updates
      act(() => {
        result.current.update('1', { value: 50 })
        result.current.update('2', { value: 60 })
      })

      await waitFor(() => {
        expect(result.current.pendingIds.size).toBe(2)
      })

      // Rollback all
      act(() => {
        result.current.rollbackAll()
      })

      expect(onRollback).toHaveBeenCalledTimes(2)
      expect(result.current.pendingIds.size).toBe(0)
      expect(result.current.isUpdating).toBe(false)
    })
  })

  describe('callbacks', () => {
    it('should call onSuccess on successful update', async () => {
      const items: TestItem[] = [{ id: '1', name: 'Item 1', value: 10 }]
      const setItems = jest.fn()
      const updateFn = jest.fn().mockResolvedValue({
        id: '1',
        name: 'Updated',
        value: 50,
      })
      const onSuccess = jest.fn()

      const { result } = renderHook(() =>
        useOptimisticUpdate(items, setItems, { updateFn, onSuccess })
      )

      await act(async () => {
        await result.current.update('1', { value: 50 })
      })

      expect(onSuccess).toHaveBeenCalledWith({
        id: '1',
        name: 'Updated',
        value: 50,
      })
    })

    it('should call onError on failure', async () => {
      const items: TestItem[] = [{ id: '1', name: 'Item 1', value: 10 }]
      const setItems = jest.fn()
      const error = new Error('Update failed')
      const updateFn = jest.fn().mockRejectedValue(error)
      const onError = jest.fn()

      const { result } = renderHook(() =>
        useOptimisticUpdate(items, setItems, { updateFn, onError })
      )

      try {
        await act(async () => {
          await result.current.update('1', { value: 50 })
        })
      } catch (e) {
        // Expected
      }

      expect(onError).toHaveBeenCalledWith(error, '1', { value: 50 })
    })
  })

  describe('error handling', () => {
    it('should set error state on failure', async () => {
      const items: TestItem[] = [{ id: '1', name: 'Item 1', value: 10 }]
      const setItems = jest.fn()
      const updateFn = jest.fn().mockRejectedValue(new Error('Update failed'))

      const { result } = renderHook(() =>
        useOptimisticUpdate(items, setItems, { updateFn })
      )

      try {
        await act(async () => {
          await result.current.update('1', { value: 50 })
        })
      } catch (e) {
        // Expected
      }

      expect(result.current.error).toEqual(new Error('Update failed'))
    })

    it('should clear error state', async () => {
      const items: TestItem[] = [{ id: '1', name: 'Item 1', value: 10 }]
      const setItems = jest.fn()
      const updateFn = jest.fn().mockRejectedValue(new Error('Update failed'))

      const { result } = renderHook(() =>
        useOptimisticUpdate(items, setItems, { updateFn })
      )

      try {
        await act(async () => {
          await result.current.update('1', { value: 50 })
        })
      } catch (e) {
        // Expected
      }

      expect(result.current.error).not.toBeNull()

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('pending state', () => {
    it('should track pending items', async () => {
      const items: TestItem[] = [
        { id: '1', name: 'Item 1', value: 10 },
        { id: '2', name: 'Item 2', value: 20 },
      ]
      const setItems = jest.fn()
      const updateFn = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      const { result } = renderHook(() =>
        useOptimisticUpdate(items, setItems, { updateFn })
      )

      // Start updates
      act(() => {
        result.current.update('1', { value: 50 })
        result.current.update('2', { value: 60 })
      })

      await waitFor(() => {
        expect(result.current.isPending('1')).toBe(true)
        expect(result.current.isPending('2')).toBe(true)
        expect(result.current.pendingIds.size).toBe(2)
        expect(result.current.isUpdating).toBe(true)
      })

      // Wait for completion
      await waitFor(
        () => {
          expect(result.current.isUpdating).toBe(false)
          expect(result.current.pendingIds.size).toBe(0)
        },
        { timeout: 200 }
      )
    })
  })
})

describe('useBatchOptimisticUpdate', () => {
  it('should batch update multiple items', async () => {
    const items: TestItem[] = [
      { id: '1', name: 'Item 1', value: 10 },
      { id: '2', name: 'Item 2', value: 20 },
    ]
    const setItems = jest.fn()
    const updateFn = jest.fn().mockImplementation(async (updates) => {
      return updates.map(({ id, data }: any) => ({
        ...items.find((i) => i.id === id)!,
        ...data,
      }))
    })

    const { result } = renderHook(() =>
      useBatchOptimisticUpdate(items, setItems, { updateFn })
    )

    await act(async () => {
      await result.current.batchUpdate([
        { id: '1', optimisticData: { value: 50 } },
        { id: '2', optimisticData: { value: 60 } },
      ])
    })

    // Should have called updateFn with batch
    expect(updateFn).toHaveBeenCalledWith([
      { id: '1', data: { value: 50 } },
      { id: '2', data: { value: 60 } },
    ])

    // Should have updated all items
    expect(setItems).toHaveBeenCalledTimes(2) // optimistic + server
  })

  it('should rollback batch on error', async () => {
    const items: TestItem[] = [
      { id: '1', name: 'Item 1', value: 10 },
      { id: '2', name: 'Item 2', value: 20 },
    ]
    const setItems = jest.fn()
    const updateFn = jest.fn().mockRejectedValue(new Error('Batch update failed'))
    const onRollback = jest.fn()

    const { result } = renderHook(() =>
      useBatchOptimisticUpdate(items, setItems, {
        updateFn,
        autoRollback: true,
        onRollback,
      })
    )

    try {
      await act(async () => {
        await result.current.batchUpdate([
          { id: '1', optimisticData: { value: 50 } },
          { id: '2', optimisticData: { value: 60 } },
        ])
      })
    } catch (e) {
      // Expected
    }

    // Should have rolled back both items
    expect(onRollback).toHaveBeenCalledWith(
      ['1', '2'],
      expect.arrayContaining([
        expect.objectContaining({ id: '1', value: 10 }),
        expect.objectContaining({ id: '2', value: 20 }),
      ])
    )
  })

  it('should support different optimistic and server data', async () => {
    const items: TestItem[] = [{ id: '1', name: 'Item 1', value: 10 }]
    const setItems = jest.fn()
    const updateFn = jest.fn().mockResolvedValue([
      { id: '1', name: 'Server Name', value: 100 },
    ])

    const { result } = renderHook(() =>
      useBatchOptimisticUpdate(items, setItems, { updateFn })
    )

    await act(async () => {
      await result.current.batchUpdate([
        {
          id: '1',
          optimisticData: { value: 50 },
          serverData: { value: 100 },
        },
      ])
    })

    // Should call updateFn with server data
    expect(updateFn).toHaveBeenCalledWith([{ id: '1', data: { value: 100 } }])
  })

  it('should track pending items during batch update', async () => {
    const items: TestItem[] = [
      { id: '1', name: 'Item 1', value: 10 },
      { id: '2', name: 'Item 2', value: 20 },
    ]
    const setItems = jest.fn()
    const updateFn = jest.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    const { result } = renderHook(() =>
      useBatchOptimisticUpdate(items, setItems, { updateFn })
    )

    act(() => {
      result.current.batchUpdate([
        { id: '1', optimisticData: { value: 50 } },
        { id: '2', optimisticData: { value: 60 } },
      ])
    })

    await waitFor(() => {
      expect(result.current.pendingIds.size).toBe(2)
      expect(result.current.isUpdating).toBe(true)
    })

    await waitFor(
      () => {
        expect(result.current.isUpdating).toBe(false)
        expect(result.current.pendingIds.size).toBe(0)
      },
      { timeout: 200 }
    )
  })
})
