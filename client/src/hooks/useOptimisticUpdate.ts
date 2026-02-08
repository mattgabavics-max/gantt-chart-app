/**
 * Optimistic Update Hook
 * Update UI immediately and rollback on failure
 */

import { useCallback, useRef, useState } from 'react'

// ==================== Types ====================

export interface OptimisticUpdateOptions<T, U = Partial<T>> {
  /**
   * Function to perform the actual update
   */
  updateFn: (id: string, data: U) => Promise<T>

  /**
   * Callback when update succeeds
   */
  onSuccess?: (updated: T) => void

  /**
   * Callback when update fails
   */
  onError?: (error: Error, id: string, data: U) => void

  /**
   * Callback when update is rolled back
   */
  onRollback?: (id: string, previous: T) => void

  /**
   * Whether to automatically rollback on error
   * @default true
   */
  autoRollback?: boolean
}

export interface OptimisticUpdateState {
  /**
   * Whether an update is in progress
   */
  isUpdating: boolean

  /**
   * Current error (if any)
   */
  error: Error | null

  /**
   * IDs of items currently being updated
   */
  pendingIds: Set<string>
}

export interface OptimisticUpdateReturn<T, U = Partial<T>> extends OptimisticUpdateState {
  /**
   * Perform optimistic update
   */
  update: (id: string, optimisticData: U, serverData?: U) => Promise<void>

  /**
   * Rollback a specific update
   */
  rollback: (id: string) => void

  /**
   * Rollback all pending updates
   */
  rollbackAll: () => void

  /**
   * Clear error state
   */
  clearError: () => void

  /**
   * Check if an item is being updated
   */
  isPending: (id: string) => boolean
}

// ==================== Hook ====================

export function useOptimisticUpdate<T extends { id: string }, U = Partial<T>>(
  items: T[],
  setItems: React.Dispatch<React.SetStateAction<T[]>>,
  options: OptimisticUpdateOptions<T, U>
): OptimisticUpdateReturn<T, U> {
  const {
    updateFn,
    onSuccess,
    onError,
    onRollback,
    autoRollback = true,
  } = options

  const [state, setState] = useState<OptimisticUpdateState>({
    isUpdating: false,
    error: null,
    pendingIds: new Set<string>(),
  })

  // Store previous states for rollback
  const previousStatesRef = useRef<Map<string, T>>(new Map())

  // Perform optimistic update
  const update = useCallback(
    async (id: string, optimisticData: U, serverData?: U) => {
      // Find current item
      const currentItem = items.find((item) => item.id === id)
      if (!currentItem) {
        throw new Error(`Item with id ${id} not found`)
      }

      // Store previous state
      previousStatesRef.current.set(id, { ...currentItem })

      // Update state to show pending
      setState((prev) => ({
        ...prev,
        isUpdating: true,
        pendingIds: new Set([...prev.pendingIds, id]),
      }))

      // Apply optimistic update immediately
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...optimisticData }
            : item
        )
      )

      try {
        // Perform server update
        const updated = await updateFn(id, serverData ?? optimisticData)

        // Update with server response
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        )

        // Clear previous state
        previousStatesRef.current.delete(id)

        // Update state
        setState((prev) => {
          const newPendingIds = new Set(prev.pendingIds)
          newPendingIds.delete(id)

          return {
            ...prev,
            isUpdating: newPendingIds.size > 0,
            pendingIds: newPendingIds,
            error: null,
          }
        })

        onSuccess?.(updated)
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Update failed')

        console.error('Optimistic update failed:', err)

        // Rollback if enabled
        if (autoRollback) {
          const previous = previousStatesRef.current.get(id)
          if (previous) {
            setItems((prev) =>
              prev.map((item) => (item.id === id ? previous : item))
            )
            previousStatesRef.current.delete(id)
            onRollback?.(id, previous)
          }
        }

        // Update state
        setState((prev) => {
          const newPendingIds = new Set(prev.pendingIds)
          newPendingIds.delete(id)

          return {
            ...prev,
            isUpdating: newPendingIds.size > 0,
            pendingIds: newPendingIds,
            error: err,
          }
        })

        onError?.(err, id, optimisticData)

        throw err
      }
    },
    [items, setItems, updateFn, onSuccess, onError, onRollback, autoRollback]
  )

  // Rollback specific update
  const rollback = useCallback(
    (id: string) => {
      const previous = previousStatesRef.current.get(id)
      if (previous) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? previous : item))
        )
        previousStatesRef.current.delete(id)

        setState((prev) => {
          const newPendingIds = new Set(prev.pendingIds)
          newPendingIds.delete(id)

          return {
            ...prev,
            isUpdating: newPendingIds.size > 0,
            pendingIds: newPendingIds,
          }
        })

        onRollback?.(id, previous)
      }
    },
    [setItems, onRollback]
  )

  // Rollback all pending updates
  const rollbackAll = useCallback(() => {
    previousStatesRef.current.forEach((previous, id) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? previous : item))
      )
      onRollback?.(id, previous)
    })

    previousStatesRef.current.clear()

    setState({
      isUpdating: false,
      error: null,
      pendingIds: new Set<string>(),
    })
  }, [setItems, onRollback])

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }))
  }, [])

  // Check if item is pending
  const isPending = useCallback(
    (id: string) => state.pendingIds.has(id),
    [state.pendingIds]
  )

  return {
    ...state,
    update,
    rollback,
    rollbackAll,
    clearError,
    isPending,
  }
}

// ==================== Batch Optimistic Update Hook ====================

export interface BatchOptimisticUpdateOptions<T, U = Partial<T>> {
  /**
   * Function to perform batch update
   */
  updateFn: (updates: Array<{ id: string; data: U }>) => Promise<T[]>

  /**
   * Callback when update succeeds
   */
  onSuccess?: (updated: T[]) => void

  /**
   * Callback when update fails
   */
  onError?: (error: Error, updates: Array<{ id: string; data: U }>) => void

  /**
   * Callback when updates are rolled back
   */
  onRollback?: (ids: string[], previous: T[]) => void

  /**
   * Whether to automatically rollback on error
   * @default true
   */
  autoRollback?: boolean
}

/**
 * Optimistic update hook for batch operations
 */
export function useBatchOptimisticUpdate<T extends { id: string }, U = Partial<T>>(
  items: T[],
  setItems: React.Dispatch<React.SetStateAction<T[]>>,
  options: BatchOptimisticUpdateOptions<T, U>
) {
  const {
    updateFn,
    onSuccess,
    onError,
    onRollback,
    autoRollback = true,
  } = options

  const [state, setState] = useState<OptimisticUpdateState>({
    isUpdating: false,
    error: null,
    pendingIds: new Set<string>(),
  })

  const previousStatesRef = useRef<Map<string, T>>(new Map())

  const batchUpdate = useCallback(
    async (updates: Array<{ id: string; optimisticData: U; serverData?: U }>) => {
      // Store previous states
      updates.forEach(({ id }) => {
        const currentItem = items.find((item) => item.id === id)
        if (currentItem) {
          previousStatesRef.current.set(id, { ...currentItem })
        }
      })

      // Update state to show pending
      const updatedIds = new Set(updates.map((u) => u.id))
      setState((prev) => ({
        ...prev,
        isUpdating: true,
        pendingIds: new Set([...prev.pendingIds, ...updatedIds]),
      }))

      // Apply optimistic updates
      setItems((prev) => {
        const updatesMap = new Map(
          updates.map((u) => [u.id, u.optimisticData])
        )
        return prev.map((item) => {
          const update = updatesMap.get(item.id)
          return update ? { ...item, ...update } : item
        })
      })

      try {
        // Perform server update
        const serverUpdates = updates.map(({ id, serverData, optimisticData }) => ({
          id,
          data: serverData ?? optimisticData,
        }))

        const updatedItems = await updateFn(serverUpdates)

        // Update with server response
        setItems((prev) => {
          const updatedMap = new Map(updatedItems.map((item) => [item.id, item]))
          return prev.map((item) => updatedMap.get(item.id) || item)
        })

        // Clear previous states
        updates.forEach(({ id }) => {
          previousStatesRef.current.delete(id)
        })

        // Update state
        setState((prev) => {
          const newPendingIds = new Set(prev.pendingIds)
          updatedIds.forEach((id) => newPendingIds.delete(id))

          return {
            ...prev,
            isUpdating: newPendingIds.size > 0,
            pendingIds: newPendingIds,
            error: null,
          }
        })

        onSuccess?.(updatedItems)
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Batch update failed')

        console.error('Batch optimistic update failed:', err)

        // Rollback if enabled
        if (autoRollback) {
          const previousItems: T[] = []
          updates.forEach(({ id }) => {
            const previous = previousStatesRef.current.get(id)
            if (previous) {
              previousItems.push(previous)
              previousStatesRef.current.delete(id)
            }
          })

          if (previousItems.length > 0) {
            setItems((prev) => {
              const previousMap = new Map(previousItems.map((item) => [item.id, item]))
              return prev.map((item) => previousMap.get(item.id) || item)
            })
            onRollback?.(Array.from(updatedIds), previousItems)
          }
        }

        // Update state
        setState((prev) => {
          const newPendingIds = new Set(prev.pendingIds)
          updatedIds.forEach((id) => newPendingIds.delete(id))

          return {
            ...prev,
            isUpdating: newPendingIds.size > 0,
            pendingIds: newPendingIds,
            error: err,
          }
        })

        onError?.(err, updates.map(({ id, serverData, optimisticData }) => ({
          id,
          data: serverData ?? optimisticData,
        })))

        throw err
      }
    },
    [items, setItems, updateFn, onSuccess, onError, onRollback, autoRollback]
  )

  return {
    ...state,
    batchUpdate,
    clearError: () => setState((prev) => ({ ...prev, error: null })),
  }
}
