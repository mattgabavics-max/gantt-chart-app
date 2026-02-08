/**
 * Dirty State Tracking Hook
 * Track unsaved changes and warn before navigation
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useBlocker } from 'react-router-dom'

// ==================== Types ====================

export interface DirtyStateOptions {
  /**
   * Enable dirty state tracking
   * @default true
   */
  enabled?: boolean

  /**
   * Show browser warning when leaving page
   * @default true
   */
  warnOnPageLeave?: boolean

  /**
   * Show warning when navigating within app
   * @default true
   */
  warnOnNavigate?: boolean

  /**
   * Custom warning message
   * @default "You have unsaved changes. Are you sure you want to leave?"
   */
  warningMessage?: string

  /**
   * Callback when user confirms navigation despite dirty state
   */
  onNavigateAway?: () => void

  /**
   * Callback when dirty state changes
   */
  onDirtyChange?: (isDirty: boolean) => void
}

export interface DirtyStateReturn {
  /**
   * Whether there are unsaved changes
   */
  isDirty: boolean

  /**
   * Mark state as dirty
   */
  markDirty: () => void

  /**
   * Mark state as clean
   */
  markClean: () => void

  /**
   * Toggle dirty state
   */
  toggleDirty: () => void

  /**
   * Last time state was marked clean (usually after save)
   */
  lastCleanedAt: Date | null

  /**
   * Reset dirty state and timestamp
   */
  reset: () => void
}

// ==================== Hook ====================

export function useDirtyState(
  options: DirtyStateOptions = {}
): DirtyStateReturn {
  const {
    enabled = true,
    warnOnPageLeave = true,
    warnOnNavigate = true,
    warningMessage = 'You have unsaved changes. Are you sure you want to leave?',
    onNavigateAway,
    onDirtyChange,
  } = options

  const [isDirty, setIsDirty] = useState(false)
  const [lastCleanedAt, setLastCleanedAt] = useState<Date | null>(null)

  // Use blocker for in-app navigation
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      enabled &&
      warnOnNavigate &&
      isDirty &&
      currentLocation.pathname !== nextLocation.pathname
  )

  // Handle browser beforeunload event
  useEffect(() => {
    if (!enabled || !warnOnPageLeave) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = warningMessage
        return warningMessage
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, warnOnPageLeave, isDirty, warningMessage])

  // Notify on dirty state change
  useEffect(() => {
    if (enabled) {
      onDirtyChange?.(isDirty)
    }
  }, [enabled, isDirty, onDirtyChange])

  // Handle blocker
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(warningMessage)
      if (confirmed) {
        onNavigateAway?.()
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker, warningMessage, onNavigateAway])

  const markDirty = useCallback(() => {
    if (enabled) {
      setIsDirty(true)
    }
  }, [enabled])

  const markClean = useCallback(() => {
    if (enabled) {
      setIsDirty(false)
      setLastCleanedAt(new Date())
    }
  }, [enabled])

  const toggleDirty = useCallback(() => {
    setIsDirty((prev) => !prev)
  }, [])

  const reset = useCallback(() => {
    setIsDirty(false)
    setLastCleanedAt(null)
  }, [])

  return {
    isDirty,
    markDirty,
    markClean,
    toggleDirty,
    lastCleanedAt,
    reset,
  }
}

// ==================== Form Dirty State Hook ====================

export interface FormDirtyStateOptions<T> extends DirtyStateOptions {
  /**
   * Initial form values
   */
  initialValues: T

  /**
   * Custom comparison function
   * @default deep equality check
   */
  isEqual?: (a: T, b: T) => boolean
}

/**
 * Track dirty state for forms by comparing current values to initial values
 */
export function useFormDirtyState<T extends Record<string, any>>(
  currentValues: T,
  options: FormDirtyStateOptions<T>
): DirtyStateReturn {
  const {
    initialValues,
    isEqual = defaultIsEqual,
    ...dirtyStateOptions
  } = options

  const dirtyState = useDirtyState(dirtyStateOptions)

  // Track if values have changed
  useEffect(() => {
    const valuesChanged = !isEqual(currentValues, initialValues)

    if (valuesChanged && !dirtyState.isDirty) {
      dirtyState.markDirty()
    } else if (!valuesChanged && dirtyState.isDirty) {
      dirtyState.markClean()
    }
  }, [currentValues, initialValues, isEqual, dirtyState])

  return dirtyState
}

// Default deep equality check
function defaultIsEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

// ==================== Auto-Save with Dirty State Hook ====================

export interface AutoSaveDirtyStateOptions<T> extends DirtyStateOptions {
  /**
   * Auto-save function
   */
  saveFn: (data: T) => Promise<void>

  /**
   * Debounce delay in milliseconds
   * @default 500
   */
  delay?: number

  /**
   * Enable auto-save
   * @default true
   */
  autoSaveEnabled?: boolean
}

export interface AutoSaveDirtyStateReturn extends DirtyStateReturn {
  /**
   * Whether auto-save is currently in progress
   */
  isSaving: boolean

  /**
   * Last successful save timestamp
   */
  lastSavedAt: Date | null

  /**
   * Save error (if any)
   */
  error: Error | null

  /**
   * Manually trigger save
   */
  save: () => Promise<void>

  /**
   * Clear error state
   */
  clearError: () => void
}

/**
 * Combine dirty state tracking with auto-save functionality
 */
export function useAutoSaveDirtyState<T>(
  data: T,
  options: AutoSaveDirtyStateOptions<T>
): AutoSaveDirtyStateReturn {
  const {
    saveFn,
    delay = 500,
    autoSaveEnabled = true,
    ...dirtyStateOptions
  } = options

  const dirtyState = useDirtyState(dirtyStateOptions)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const dataRef = useRef<T>(data)

  // Update data ref
  useEffect(() => {
    dataRef.current = data
  }, [data])

  // Auto-save when dirty
  useEffect(() => {
    if (!autoSaveEnabled || !dirtyState.isDirty) return

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Start new timer
    saveTimerRef.current = setTimeout(() => {
      performSave()
    }, delay)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [dirtyState.isDirty, autoSaveEnabled, delay])

  const performSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      await saveFn(dataRef.current)
      setLastSavedAt(new Date())
      dirtyState.markClean()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Save failed')
      setError(error)
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const save = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    await performSave()
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    ...dirtyState,
    isSaving,
    lastSavedAt,
    error,
    save,
    clearError,
  }
}

// ==================== Last Saved Display Hook ====================

export interface LastSavedDisplayOptions {
  /**
   * Date of last save
   */
  lastSavedAt: Date | null

  /**
   * Update interval in milliseconds
   * @default 10000 (10 seconds)
   */
  updateInterval?: number

  /**
   * Show "Saving..." when saving
   * @default true
   */
  showSaving?: boolean
}

export interface LastSavedDisplayReturn {
  /**
   * Formatted last saved text (e.g., "Saved 2 minutes ago")
   */
  displayText: string

  /**
   * Raw time ago in seconds
   */
  secondsAgo: number | null
}

/**
 * Format last saved timestamp for display
 */
export function useLastSavedDisplay(
  isSaving: boolean,
  options: LastSavedDisplayOptions
): LastSavedDisplayReturn {
  const {
    lastSavedAt,
    updateInterval = 10000,
    showSaving = true,
  } = options

  const [, setTick] = useState(0)

  // Update display periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1)
    }, updateInterval)

    return () => clearInterval(interval)
  }, [updateInterval])

  if (isSaving && showSaving) {
    return {
      displayText: 'Saving...',
      secondsAgo: null,
    }
  }

  if (!lastSavedAt) {
    return {
      displayText: 'Not saved yet',
      secondsAgo: null,
    }
  }

  const now = new Date()
  const secondsAgo = Math.floor((now.getTime() - lastSavedAt.getTime()) / 1000)

  let displayText: string

  if (secondsAgo < 10) {
    displayText = 'Saved just now'
  } else if (secondsAgo < 60) {
    displayText = 'Saved less than a minute ago'
  } else if (secondsAgo < 3600) {
    const minutes = Math.floor(secondsAgo / 60)
    displayText = `Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (secondsAgo < 86400) {
    const hours = Math.floor(secondsAgo / 3600)
    displayText = `Saved ${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(secondsAgo / 86400)
    displayText = `Saved ${days} day${days > 1 ? 's' : ''} ago`
  }

  return {
    displayText,
    secondsAgo,
  }
}
