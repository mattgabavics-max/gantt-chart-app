/**
 * Auto-Save Examples
 * Demonstrations of auto-save, optimistic updates, and dirty state tracking
 */

import React, { useState } from 'react'
import {
  useAutoSave,
  useBatchAutoSave,
  useMergeAutoSave,
} from '../hooks/useAutoSave'
import {
  useOptimisticUpdate,
  useBatchOptimisticUpdate,
} from '../hooks/useOptimisticUpdate'
import {
  useDirtyState,
  useFormDirtyState,
  useAutoSaveDirtyState,
  useLastSavedDisplay,
} from '../hooks/useDirtyState'
import type { Task } from '../types'

// ==================== Example 1: Basic Auto-Save ====================

export const BasicAutoSaveExample: React.FC = () => {
  const [taskName, setTaskName] = useState('My Task')

  const autoSave = useAutoSave({
    saveFn: async (data: string) => {
      console.log('Saving task name:', data)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (Math.random() < 0.1) {
        throw new Error('Random save error')
      }
    },
    delay: 500,
    onSuccess: () => console.log('Save successful'),
    onError: (error) => console.error('Save failed:', error),
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setTaskName(newValue)
    autoSave.queueSave(newValue)
  }

  const lastSaved = useLastSavedDisplay(autoSave.isSaving, {
    lastSavedAt: autoSave.lastSaved,
  })

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Example 1: Basic Auto-Save</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Task Name</label>
          <input
            type="text"
            value={taskName}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            placeholder="Enter task name..."
          />
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            {autoSave.isSaving && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
            <span className={autoSave.isSaving ? 'text-blue-600' : 'text-gray-600'}>
              {lastSaved.displayText}
            </span>
          </div>

          {autoSave.isPending && (
            <span className="text-yellow-600">• Pending save</span>
          )}

          {autoSave.error && (
            <span className="text-red-600">
              Error: {autoSave.error.message}
              <button
                onClick={autoSave.clearError}
                className="ml-2 text-xs underline"
              >
                Dismiss
              </button>
            </span>
          )}

          {autoSave.retryCount > 0 && (
            <span className="text-orange-600">
              Retry {autoSave.retryCount}/3
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={autoSave.saveNow}
            disabled={autoSave.isSaving || !autoSave.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Save Now
          </button>
          <button
            onClick={autoSave.clearQueue}
            disabled={!autoSave.isPending}
            className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== Example 2: Optimistic Updates ====================

export const OptimisticUpdateExample: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: 'Task 1',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-05'),
      progress: 50,
      assignees: [],
      status: 'in-progress',
      priority: 'medium',
      projectId: 'project-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Task 2',
      startDate: new Date('2024-06-06'),
      endDate: new Date('2024-06-10'),
      progress: 0,
      assignees: [],
      status: 'not-started',
      priority: 'low',
      projectId: 'project-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])

  const optimistic = useOptimisticUpdate(tasks, setTasks, {
    updateFn: async (id: string, data: Partial<Task>) => {
      console.log('Updating task:', id, data)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate occasional failure
      if (Math.random() < 0.2) {
        throw new Error('Update failed')
      }

      const task = tasks.find((t) => t.id === id)!
      return { ...task, ...data, updatedAt: new Date() }
    },
    onSuccess: (updated) => console.log('Update successful:', updated),
    onError: (error) => console.error('Update failed:', error),
    onRollback: (id, previous) => console.log('Rolled back:', id, previous),
  })

  const handleProgressChange = async (taskId: string, progress: number) => {
    try {
      await optimistic.update(taskId, { progress })
    } catch (error) {
      // Error already handled by hook
    }
  }

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        Example 2: Optimistic Updates
      </h3>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="p-4 bg-gray-50 rounded">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{task.name}</div>
              {optimistic.isPending(task.id) && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Updating...
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-600 w-20">Progress:</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={task.progress}
                  onChange={(e) =>
                    handleProgressChange(task.id, parseInt(e.target.value))
                  }
                  className="flex-1"
                  disabled={optimistic.isPending(task.id)}
                />
                <span className="text-sm font-medium w-12">{task.progress}%</span>
              </div>

              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-4 text-sm">
          <span>
            {optimistic.isUpdating ? 'Updating...' : 'All changes saved'}
          </span>
          {optimistic.error && (
            <span className="text-red-600">
              Error: {optimistic.error.message}
              <button
                onClick={optimistic.clearError}
                className="ml-2 text-xs underline"
              >
                Dismiss
              </button>
            </span>
          )}
        </div>

        {optimistic.pendingIds.size > 0 && (
          <button
            onClick={optimistic.rollbackAll}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm"
          >
            Rollback All ({optimistic.pendingIds.size})
          </button>
        )}
      </div>
    </div>
  )
}

// ==================== Example 3: Dirty State Tracking ====================

export const DirtyStateExample: React.FC = () => {
  const [formData, setFormData] = useState({
    title: 'Project Alpha',
    description: 'A great project',
    status: 'active',
  })

  const dirtyState = useDirtyState({
    warnOnNavigate: true,
    warnOnPageLeave: true,
    onDirtyChange: (isDirty) => console.log('Dirty state changed:', isDirty),
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    dirtyState.markDirty()
  }

  const handleSave = async () => {
    console.log('Saving:', formData)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    dirtyState.markClean()
  }

  const lastSaved = useLastSavedDisplay(false, {
    lastSavedAt: dirtyState.lastCleanedAt,
  })

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        Example 3: Dirty State Tracking
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Project Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border rounded"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4">
            {dirtyState.isDirty && (
              <span className="flex items-center gap-2 text-sm text-orange-600">
                <span className="w-2 h-2 bg-orange-600 rounded-full" />
                Unsaved changes
              </span>
            )}
            <span className="text-sm text-gray-600">{lastSaved.displayText}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={dirtyState.reset}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!dirtyState.isDirty}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Example 4: Form with Auto-Save ====================

export const FormAutoSaveExample: React.FC = () => {
  const initialValues = {
    name: 'Task Alpha',
    description: 'Important task',
    priority: 'high',
  }

  const [formData, setFormData] = useState(initialValues)

  const autoSaveDirty = useAutoSaveDirtyState(formData, {
    saveFn: async (data) => {
      console.log('Auto-saving form:', data)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    },
    delay: 1000,
    warnOnNavigate: true,
  })

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    autoSaveDirty.markDirty()
  }

  const lastSaved = useLastSavedDisplay(autoSaveDirty.isSaving, {
    lastSavedAt: autoSaveDirty.lastSavedAt,
  })

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        Example 4: Form with Auto-Save
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Task Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border rounded"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm">
            {autoSaveDirty.isSaving && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            )}

            {autoSaveDirty.isDirty && !autoSaveDirty.isSaving && (
              <span className="flex items-center gap-2 text-orange-600">
                <span className="w-2 h-2 bg-orange-600 rounded-full" />
                Unsaved changes (auto-saving in 1s)
              </span>
            )}

            {!autoSaveDirty.isDirty && !autoSaveDirty.isSaving && (
              <span className="text-green-600">✓ {lastSaved.displayText}</span>
            )}
          </div>

          <button
            onClick={autoSaveDirty.save}
            disabled={autoSaveDirty.isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Save Now
          </button>
        </div>

        {autoSaveDirty.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            Error: {autoSaveDirty.error.message}
            <button
              onClick={autoSaveDirty.clearError}
              className="ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== Example 5: Batch Updates ====================

export const BatchUpdateExample: React.FC = () => {
  const [items, setItems] = useState([
    { id: '1', name: 'Item 1', completed: false },
    { id: '2', name: 'Item 2', completed: false },
    { id: '3', name: 'Item 3', completed: false },
  ])

  const batchOptimistic = useBatchOptimisticUpdate(items, setItems, {
    updateFn: async (updates) => {
      console.log('Batch updating:', updates)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      return updates.map(({ id, data }) => {
        const item = items.find((i) => i.id === id)!
        return { ...item, ...data }
      })
    },
    onSuccess: (updated) => console.log('Batch update successful:', updated),
  })

  const handleToggleAll = async () => {
    const allCompleted = items.every((item) => item.completed)
    const updates = items.map((item) => ({
      id: item.id,
      optimisticData: { completed: !allCompleted },
    }))

    try {
      await batchOptimistic.batchUpdate(updates)
    } catch (error) {
      console.error('Batch update failed:', error)
    }
  }

  const handleToggle = async (id: string) => {
    const item = items.find((i) => i.id === id)!
    try {
      await batchOptimistic.batchUpdate([
        {
          id,
          optimisticData: { completed: !item.completed },
        },
      ])
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Example 5: Batch Updates</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {items.filter((i) => i.completed).length} of {items.length} completed
          </span>
          <button
            onClick={handleToggleAll}
            disabled={batchOptimistic.isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
          >
            {items.every((i) => i.completed) ? 'Uncheck All' : 'Check All'}
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded"
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => handleToggle(item.id)}
                disabled={batchOptimistic.isUpdating}
                className="w-5 h-5"
              />
              <span
                className={`flex-1 ${
                  item.completed ? 'line-through text-gray-500' : ''
                }`}
              >
                {item.name}
              </span>
              {batchOptimistic.pendingIds.has(item.id) && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          ))}
        </div>

        {batchOptimistic.isUpdating && (
          <div className="text-sm text-blue-600">
            Updating {batchOptimistic.pendingIds.size} item(s)...
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== Main Demo Component ====================

export const AutoSaveDemo: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Auto-Save Examples</h1>
        <p className="text-gray-600">
          Demonstrations of auto-save, optimistic updates, and dirty state tracking
        </p>
      </div>

      <div className="space-y-8">
        <BasicAutoSaveExample />
        <OptimisticUpdateExample />
        <DirtyStateExample />
        <FormAutoSaveExample />
        <BatchUpdateExample />
      </div>

      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">Features Demonstrated:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Debounced auto-save with configurable delay</li>
          <li>Optimistic UI updates with automatic rollback</li>
          <li>Dirty state tracking with navigation warnings</li>
          <li>Last saved timestamp display</li>
          <li>Error handling with retry logic</li>
          <li>Batch operations for multiple items</li>
          <li>Manual save triggers</li>
          <li>Queue management</li>
        </ul>
      </div>
    </div>
  )
}

export default AutoSaveDemo
