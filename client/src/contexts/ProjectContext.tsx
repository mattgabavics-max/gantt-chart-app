/**
 * Project Context
 * Manages current project state, tasks, auto-save, and undo/redo
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import type { Project, Task, UpdateTaskRequest } from '../types/api'

// ==================== Types ====================

export interface ProjectState {
  currentProject: Project | null
  tasks: Task[]
  isLoading: boolean
  error: string | null
  isDirty: boolean // Has unsaved changes
  isSaving: boolean
  lastSaved: Date | null
}

export interface UndoRedoState {
  canUndo: boolean
  canRedo: boolean
}

export interface ProjectContextValue extends ProjectState, UndoRedoState {
  setCurrentProject: (project: Project | null) => void
  setTasks: (tasks: Task[]) => void
  updateTask: (taskId: string, updates: UpdateTaskRequest) => void
  addTask: (task: Task) => void
  deleteTask: (taskId: string) => void
  batchUpdateTasks: (updates: Array<{ id: string; changes: UpdateTaskRequest }>) => void
  saveChanges: () => Promise<void>
  discardChanges: () => void
  undo: () => void
  redo: () => void
  clearError: () => void
}

// ==================== Context ====================

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

// ==================== History Entry ====================

interface HistoryEntry {
  tasks: Task[]
  timestamp: Date
  description: string
}

// ==================== Provider Props ====================

interface ProjectProviderProps {
  children: ReactNode
  autoSaveInterval?: number // milliseconds (0 to disable)
  maxHistorySize?: number
}

// ==================== Provider ====================

export const ProjectProvider: React.FC<ProjectProviderProps> = ({
  children,
  autoSaveInterval = 5000,
  maxHistorySize = 50,
}) => {
  const queryClient = useQueryClient()

  const [state, setState] = useState<ProjectState>({
    currentProject: null,
    tasks: [],
    isLoading: false,
    error: null,
    isDirty: false,
    isSaving: false,
    lastSaved: null,
  })

  // Undo/Redo stacks
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Track original tasks for discard
  const originalTasksRef = useRef<Task[]>([])

  // Auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingChangesRef = useRef<Map<string, UpdateTaskRequest>>(new Map())

  // ==================== Auto-Save ====================

  useEffect(() => {
    if (!state.isDirty || !state.currentProject || autoSaveInterval === 0) {
      return
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(() => {
      saveChanges()
    }, autoSaveInterval)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [state.isDirty, state.currentProject, autoSaveInterval])

  // ==================== History Management ====================

  const addToHistory = useCallback(
    (tasks: Task[], description: string) => {
      setHistory((prev) => {
        // Remove any entries after current index (if we're not at the end)
        const newHistory = prev.slice(0, historyIndex + 1)

        // Add new entry
        newHistory.push({
          tasks: JSON.parse(JSON.stringify(tasks)), // Deep copy
          timestamp: new Date(),
          description,
        })

        // Limit history size
        if (newHistory.length > maxHistorySize) {
          newHistory.shift()
          return newHistory
        }

        return newHistory
      })

      setHistoryIndex((prev) => Math.min(prev + 1, maxHistorySize - 1))
    },
    [historyIndex, maxHistorySize]
  )

  // ==================== Set Current Project ====================

  const setCurrentProject = useCallback((project: Project | null) => {
    setState((prev) => ({
      ...prev,
      currentProject: project,
      isDirty: false,
    }))

    // Reset history
    setHistory([])
    setHistoryIndex(-1)
  }, [])

  // ==================== Set Tasks ====================

  const setTasks = useCallback(
    (tasks: Task[]) => {
      setState((prev) => ({
        ...prev,
        tasks,
      }))

      // Store original tasks for discard
      originalTasksRef.current = JSON.parse(JSON.stringify(tasks))

      // Add to history
      if (tasks.length > 0) {
        addToHistory(tasks, 'Initial state')
      }
    },
    [addToHistory]
  )

  // ==================== Update Task ====================

  const updateTask = useCallback(
    (taskId: string, updates: UpdateTaskRequest) => {
      setState((prev) => {
        const newTasks = prev.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        )

        // Track pending changes
        const existing = pendingChangesRef.current.get(taskId) || {}
        pendingChangesRef.current.set(taskId, { ...existing, ...updates })

        return {
          ...prev,
          tasks: newTasks,
          isDirty: true,
        }
      })

      // Add to history (debounced to avoid too many entries)
      addToHistory(
        state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        ),
        `Update task: ${taskId}`
      )
    },
    [state.tasks, addToHistory]
  )

  // ==================== Add Task ====================

  const addTask = useCallback(
    (task: Task) => {
      setState((prev) => ({
        ...prev,
        tasks: [...prev.tasks, task],
        isDirty: true,
      }))

      addToHistory([...state.tasks, task], `Add task: ${task.name}`)
    },
    [state.tasks, addToHistory]
  )

  // ==================== Delete Task ====================

  const deleteTask = useCallback(
    (taskId: string) => {
      setState((prev) => {
        const task = prev.tasks.find((t) => t.id === taskId)
        const newTasks = prev.tasks.filter((t) => t.id !== taskId)

        // Add to history
        addToHistory(newTasks, `Delete task: ${task?.name || taskId}`)

        // Remove from pending changes
        pendingChangesRef.current.delete(taskId)

        return {
          ...prev,
          tasks: newTasks,
          isDirty: true,
        }
      })
    },
    [addToHistory]
  )

  // ==================== Batch Update Tasks ====================

  const batchUpdateTasks = useCallback(
    (updates: Array<{ id: string; changes: UpdateTaskRequest }>) => {
      setState((prev) => {
        const updatesMap = new Map(updates.map((u) => [u.id, u.changes]))
        const newTasks = prev.tasks.map((task) => {
          const taskUpdates = updatesMap.get(task.id)
          return taskUpdates ? { ...task, ...taskUpdates } : task
        })

        // Track all pending changes
        updates.forEach(({ id, changes }) => {
          const existing = pendingChangesRef.current.get(id) || {}
          pendingChangesRef.current.set(id, { ...existing, ...changes })
        })

        return {
          ...prev,
          tasks: newTasks,
          isDirty: true,
        }
      })

      addToHistory(
        state.tasks.map((task) => {
          const update = updates.find((u) => u.id === task.id)
          return update ? { ...task, ...update.changes } : task
        }),
        `Batch update ${updates.length} tasks`
      )
    },
    [state.tasks, addToHistory]
  )

  // ==================== Save Changes ====================

  const saveChanges = useCallback(async () => {
    if (!state.currentProject || !state.isDirty) {
      return
    }

    setState((prev) => ({ ...prev, isSaving: true, error: null }))

    try {
      const projectId = state.currentProject.id
      const pendingUpdates = Array.from(pendingChangesRef.current.entries()).map(
        ([id, changes]) => ({ id, changes })
      )

      if (pendingUpdates.length > 0) {
        // Batch update all changed tasks
        await api.batchUpdateTasks(projectId, { updates: pendingUpdates })
      }

      // Clear pending changes
      pendingChangesRef.current.clear()

      // Update original tasks
      originalTasksRef.current = JSON.parse(JSON.stringify(state.tasks))

      setState((prev) => ({
        ...prev,
        isDirty: false,
        isSaving: false,
        lastSaved: new Date(),
      }))

      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    } catch (error: any) {
      const errorMessage =
        error?.error?.message || 'Failed to save changes. Please try again.'

      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
      }))

      throw error
    }
  }, [state.currentProject, state.isDirty, state.tasks, queryClient])

  // ==================== Discard Changes ====================

  const discardChanges = useCallback(() => {
    setState((prev) => ({
      ...prev,
      tasks: JSON.parse(JSON.stringify(originalTasksRef.current)),
      isDirty: false,
    }))

    // Clear pending changes
    pendingChangesRef.current.clear()

    // Reset history to original state
    if (originalTasksRef.current.length > 0) {
      setHistory([
        {
          tasks: JSON.parse(JSON.stringify(originalTasksRef.current)),
          timestamp: new Date(),
          description: 'Discarded changes',
        },
      ])
      setHistoryIndex(0)
    }
  }, [])

  // ==================== Undo ====================

  const undo = useCallback(() => {
    if (historyIndex <= 0) {
      return
    }

    const previousEntry = history[historyIndex - 1]

    setState((prev) => ({
      ...prev,
      tasks: JSON.parse(JSON.stringify(previousEntry.tasks)),
      isDirty: true,
    }))

    setHistoryIndex((prev) => prev - 1)
  }, [history, historyIndex])

  // ==================== Redo ====================

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) {
      return
    }

    const nextEntry = history[historyIndex + 1]

    setState((prev) => ({
      ...prev,
      tasks: JSON.parse(JSON.stringify(nextEntry.tasks)),
      isDirty: true,
    }))

    setHistoryIndex((prev) => prev + 1)
  }, [history, historyIndex])

  // ==================== Clear Error ====================

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  // ==================== Context Value ====================

  const value: ProjectContextValue = {
    ...state,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    setCurrentProject,
    setTasks,
    updateTask,
    addTask,
    deleteTask,
    batchUpdateTasks,
    saveChanges,
    discardChanges,
    undo,
    redo,
    clearError,
  }

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  )
}

// ==================== Hook ====================

export const useProject = (): ProjectContextValue => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

export default ProjectContext
