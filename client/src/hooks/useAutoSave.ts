/**
 * Auto-Save Hook
 * Debounced auto-save functionality with error handling and retry logic
 */

import { useCallback, useEffect, useRef, useState } from 'react'

// ==================== Types ====================

export interface AutoSaveOptions<T> {
  /**
   * Function to call to save data
   */
  saveFn: (data: T) => Promise<void>

  /**
   * Debounce delay in milliseconds
   * @default 500
   */
  delay?: number

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number

  /**
   * Retry delay in milliseconds
   * @default 1000
   */
  retryDelay?: number

  /**
   * Callback when save succeeds
   */
  onSuccess?: () => void

  /**
   * Callback when save fails (after all retries)
   */
  onError?: (error: Error) => void

  /**
   * Enable auto-save
   * @default true
   */
  enabled?: boolean
}

export interface AutoSaveState {
  /**
   * Whether a save is currently in progress
   */
  isSaving: boolean

  /**
   * Whether there are pending changes to save
   */
  isPending: boolean

  /**
   * Last save timestamp
   */
  lastSaved: Date | null

  /**
   * Current error (if any)
   */
  error: Error | null

  /**
   * Number of retry attempts for current save
   */
  retryCount: number
}

export interface AutoSaveReturn<T> extends AutoSaveState {
  /**
   * Queue data for saving
   */
  queueSave: (data: T) => void

  /**
   * Save immediately (bypasses debounce)
   */
  saveNow: () => Promise<void>

  /**
   * Clear pending saves
   */
  clearQueue: () => void

  /**
   * Reset error state
   */
  clearError: () => void
}

// ==================== Hook ====================

export function useAutoSave<T>(
  options: AutoSaveOptions<T>
): AutoSaveReturn<T> {
  const {
    saveFn,
    delay = 500,
    maxRetries = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    enabled = true,
  } = options

  // State
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    isPending: false,
    lastSaved: null,
    error: null,
    retryCount: 0,
  })

  // Refs
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null)
  const queueRef = useRef<T[]>([])
  const isUnmountedRef = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current)
      }
    }
  }, [])

  // Perform save with retry logic
  const performSave = useCallback(
    async (data: T, retryCount = 0): Promise<void> => {
      if (isUnmountedRef.current) return

      setState((prev) => ({
        ...prev,
        isSaving: true,
        error: null,
        retryCount,
      }))

      try {
        await saveFn(data)

        if (isUnmountedRef.current) return

        setState((prev) => ({
          ...prev,
          isSaving: false,
          isPending: queueRef.current.length > 0,
          lastSaved: new Date(),
          error: null,
          retryCount: 0,
        }))

        onSuccess?.()

        // Process next item in queue if any
        if (queueRef.current.length > 0) {
          const nextData = queueRef.current.shift()!
          await performSave(nextData, 0)
        }
      } catch (error) {
        if (isUnmountedRef.current) return

        const err = error instanceof Error ? error : new Error('Save failed')

        // Retry if under max retries
        if (retryCount < maxRetries) {
          console.warn(
            `Save failed, retrying (${retryCount + 1}/${maxRetries})...`,
            err
          )

          retryTimerRef.current = setTimeout(() => {
            performSave(data, retryCount + 1)
          }, retryDelay * Math.pow(2, retryCount)) // Exponential backoff

          setState((prev) => ({
            ...prev,
            retryCount: retryCount + 1,
          }))
        } else {
          // Max retries reached
          console.error('Save failed after max retries:', err)

          setState((prev) => ({
            ...prev,
            isSaving: false,
            isPending: queueRef.current.length > 0,
            error: err,
          }))

          onError?.(err)
        }
      }
    },
    [saveFn, maxRetries, retryDelay, onSuccess, onError]
  )

  // Queue save (debounced)
  const queueSave = useCallback(
    (data: T) => {
      if (!enabled) return

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Add to queue (replace if same type of update)
      queueRef.current = [data]

      setState((prev) => ({
        ...prev,
        isPending: true,
      }))

      // Start new timer
      debounceTimerRef.current = setTimeout(() => {
        if (queueRef.current.length > 0 && !state.isSaving) {
          const dataToSave = queueRef.current.shift()!
          performSave(dataToSave, 0)
        }
      }, delay)
    },
    [enabled, delay, performSave, state.isSaving]
  )

  // Save immediately
  const saveNow = useCallback(async () => {
    if (!enabled) return

    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    // Save all queued items
    if (queueRef.current.length > 0) {
      const dataToSave = queueRef.current.shift()!
      await performSave(dataToSave, 0)
    }
  }, [enabled, performSave])

  // Clear queue
  const clearQueue = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    queueRef.current = []

    setState((prev) => ({
      ...prev,
      isPending: false,
    }))
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      retryCount: 0,
    }))
  }, [])

  return {
    ...state,
    queueSave,
    saveNow,
    clearQueue,
    clearError,
  }
}

// ==================== Batch Auto-Save Hook ====================

export interface BatchAutoSaveOptions<T> extends Omit<AutoSaveOptions<T[]>, 'saveFn'> {
  /**
   * Function to save batch of items
   */
  saveFn: (items: T[]) => Promise<void>

  /**
   * Maximum batch size
   * @default 10
   */
  maxBatchSize?: number
}

/**
 * Auto-save hook that batches multiple updates together
 */
export function useBatchAutoSave<T>(
  options: BatchAutoSaveOptions<T>
): AutoSaveReturn<T> {
  const {
    saveFn,
    maxBatchSize = 10,
    ...autoSaveOptions
  } = options

  const batchRef = useRef<T[]>([])

  const batchSaveFn = useCallback(
    async (item: T) => {
      // Add to batch
      batchRef.current.push(item)

      // If batch is full, save immediately
      if (batchRef.current.length >= maxBatchSize) {
        const itemsToSave = [...batchRef.current]
        batchRef.current = []
        await saveFn(itemsToSave)
      } else {
        // Otherwise wait for debounce
        const itemsToSave = [...batchRef.current]
        batchRef.current = []
        await saveFn(itemsToSave)
      }
    },
    [saveFn, maxBatchSize]
  )

  return useAutoSave({
    ...autoSaveOptions,
    saveFn: batchSaveFn,
  })
}

// ==================== Auto-Save with Merge Hook ====================

export interface MergeAutoSaveOptions<T> extends AutoSaveOptions<Partial<T>> {
  /**
   * Initial data
   */
  initialData: T

  /**
   * Custom merge function
   * @default Object.assign
   */
  mergeFn?: (current: T, updates: Partial<T>) => T
}

/**
 * Auto-save hook that merges partial updates with current state
 */
export function useMergeAutoSave<T extends Record<string, any>>(
  options: MergeAutoSaveOptions<T>
): AutoSaveReturn<Partial<T>> & { currentData: T } {
  const {
    initialData,
    mergeFn = (current, updates) => ({ ...current, ...updates }),
    saveFn,
    ...autoSaveOptions
  } = options

  const [currentData, setCurrentData] = useState<T>(initialData)

  const mergedSaveFn = useCallback(
    async (updates: Partial<T>) => {
      const merged = mergeFn(currentData, updates)
      setCurrentData(merged)
      await saveFn(updates)
    },
    [currentData, mergeFn, saveFn]
  )

  const autoSave = useAutoSave({
    ...autoSaveOptions,
    saveFn: mergedSaveFn,
  })

  return {
    ...autoSave,
    currentData,
  }
}
