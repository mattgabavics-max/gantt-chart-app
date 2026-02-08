# Auto-Save System Documentation

Comprehensive auto-save, optimistic updates, and dirty state tracking for the Gantt Chart application.

## Table of Contents

1. [Overview](#overview)
2. [Hooks](#hooks)
3. [Usage Examples](#usage-examples)
4. [Integration Guide](#integration-guide)
5. [Best Practices](#best-practices)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The auto-save system provides three main capabilities:

1. **Auto-Save** - Debounced automatic saving with retry logic
2. **Optimistic Updates** - Immediate UI updates with rollback on failure
3. **Dirty State Tracking** - Track unsaved changes and warn before navigation

### Key Features

✅ **Debounced Saves** - Batch multiple changes into single save operations
✅ **Retry Logic** - Automatic retry with exponential backoff on failure
✅ **Optimistic Updates** - Instant UI feedback with automatic rollback
✅ **Dirty State Tracking** - Warn users before losing unsaved changes
✅ **Queue Management** - Handle multiple pending updates efficiently
✅ **Type-Safe** - Full TypeScript support with comprehensive types
✅ **Error Handling** - Graceful error handling with user feedback
✅ **Last Saved Display** - Show when data was last saved

---

## Hooks

### useAutoSave

Debounced auto-save with retry logic and queue management.

```typescript
import { useAutoSave } from './hooks/useAutoSave'

const autoSave = useAutoSave({
  saveFn: async (data) => {
    await api.saveTask(data)
  },
  delay: 500,           // Debounce delay in ms
  maxRetries: 3,        // Max retry attempts
  retryDelay: 1000,     // Retry delay in ms
  onSuccess: () => {},  // Success callback
  onError: (err) => {}, // Error callback
  enabled: true,        // Enable/disable auto-save
})
```

**Returns:**
```typescript
{
  isSaving: boolean          // Save in progress
  isPending: boolean         // Changes queued
  lastSaved: Date | null     // Last successful save
  error: Error | null        // Current error
  retryCount: number         // Current retry attempt
  queueSave: (data) => void  // Queue data for save
  saveNow: () => Promise     // Save immediately
  clearQueue: () => void     // Clear pending saves
  clearError: () => void     // Clear error state
}
```

### useOptimisticUpdate

Optimistic UI updates with automatic rollback on failure.

```typescript
import { useOptimisticUpdate } from './hooks/useOptimisticUpdate'

const optimistic = useOptimisticUpdate(tasks, setTasks, {
  updateFn: async (id, data) => {
    return await api.updateTask(id, data)
  },
  onSuccess: (updated) => {},
  onError: (error, id, data) => {},
  onRollback: (id, previous) => {},
  autoRollback: true, // Auto rollback on error
})
```

**Returns:**
```typescript
{
  isUpdating: boolean             // Any update in progress
  error: Error | null             // Current error
  pendingIds: Set<string>         // IDs being updated
  update: (id, data) => Promise   // Perform optimistic update
  rollback: (id) => void          // Rollback specific update
  rollbackAll: () => void         // Rollback all updates
  clearError: () => void          // Clear error
  isPending: (id) => boolean      // Check if ID is updating
}
```

### useDirtyState

Track unsaved changes with navigation warnings.

```typescript
import { useDirtyState } from './hooks/useDirtyState'

const dirtyState = useDirtyState({
  enabled: true,
  warnOnPageLeave: true,   // Browser beforeunload warning
  warnOnNavigate: true,    // In-app navigation warning
  warningMessage: 'You have unsaved changes...',
  onNavigateAway: () => {},
  onDirtyChange: (isDirty) => {},
})
```

**Returns:**
```typescript
{
  isDirty: boolean              // Has unsaved changes
  lastCleanedAt: Date | null    // Last save timestamp
  markDirty: () => void         // Mark as dirty
  markClean: () => void         // Mark as clean
  toggleDirty: () => void       // Toggle state
  reset: () => void             // Reset state
}
```

### useFormDirtyState

Automatic dirty state tracking for forms.

```typescript
import { useFormDirtyState } from './hooks/useDirtyState'

const dirtyState = useFormDirtyState(currentValues, {
  initialValues: originalValues,
  isEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  // ... other dirty state options
})
```

### useAutoSaveDirtyState

Combined auto-save and dirty state tracking.

```typescript
import { useAutoSaveDirtyState } from './hooks/useDirtyState'

const autoSaveDirty = useAutoSaveDirtyState(formData, {
  saveFn: async (data) => await api.save(data),
  delay: 1000,
  autoSaveEnabled: true,
  warnOnNavigate: true,
})
```

**Returns:** Combination of `useDirtyState` and auto-save state:
```typescript
{
  // Dirty state
  isDirty: boolean
  lastCleanedAt: Date | null
  markDirty: () => void
  markClean: () => void

  // Auto-save state
  isSaving: boolean
  lastSavedAt: Date | null
  error: Error | null
  save: () => Promise<void>
  clearError: () => void
}
```

### useLastSavedDisplay

Format last saved timestamp for display.

```typescript
import { useLastSavedDisplay } from './hooks/useDirtyState'

const display = useLastSavedDisplay(isSaving, {
  lastSavedAt: new Date(),
  updateInterval: 10000, // Update every 10s
  showSaving: true,
})
```

**Returns:**
```typescript
{
  displayText: string        // e.g., "Saved 2 minutes ago"
  secondsAgo: number | null  // Raw seconds since save
}
```

---

## Usage Examples

### Example 1: Basic Auto-Save

```typescript
function TaskEditor() {
  const [task, setTask] = useState<Task>(initialTask)

  const autoSave = useAutoSave({
    saveFn: async (data: Task) => {
      await api.updateTask(task.id, data)
    },
    delay: 500,
    onSuccess: () => console.log('Saved!'),
    onError: (error) => console.error('Save failed:', error),
  })

  const handleChange = (updates: Partial<Task>) => {
    const newTask = { ...task, ...updates }
    setTask(newTask)
    autoSave.queueSave(newTask)
  }

  const lastSaved = useLastSavedDisplay(autoSave.isSaving, {
    lastSavedAt: autoSave.lastSaved,
  })

  return (
    <div>
      <input
        value={task.name}
        onChange={(e) => handleChange({ name: e.target.value })}
      />

      <div className="status">
        {autoSave.isSaving && 'Saving...'}
        {!autoSave.isSaving && lastSaved.displayText}
        {autoSave.error && `Error: ${autoSave.error.message}`}
      </div>
    </div>
  )
}
```

### Example 2: Optimistic Updates

```typescript
function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])

  const optimistic = useOptimisticUpdate(tasks, setTasks, {
    updateFn: async (id, data) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      return await api.updateTask(id, data)
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`)
    },
  })

  const handleProgressChange = async (taskId: string, progress: number) => {
    try {
      await optimistic.update(taskId, { progress })
    } catch (error) {
      // Error already handled by hook
    }
  }

  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>
          <span>{task.name}</span>
          <input
            type="range"
            value={task.progress}
            onChange={(e) => handleProgressChange(
              task.id,
              parseInt(e.target.value)
            )}
            disabled={optimistic.isPending(task.id)}
          />
          {optimistic.isPending(task.id) && <Spinner />}
        </div>
      ))}
    </div>
  )
}
```

### Example 3: Form with Dirty State

```typescript
function ProjectForm({ project }: { project: Project }) {
  const [formData, setFormData] = useState(project)

  const dirtyState = useDirtyState({
    warnOnNavigate: true,
    warnOnPageLeave: true,
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    dirtyState.markDirty()
  }

  const handleSave = async () => {
    await api.updateProject(project.id, formData)
    dirtyState.markClean()
    toast.success('Project saved!')
  }

  return (
    <form onSubmit={handleSave}>
      {dirtyState.isDirty && (
        <div className="warning">
          ⚠️ You have unsaved changes
        </div>
      )}

      <input
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />

      <button
        type="submit"
        disabled={!dirtyState.isDirty}
      >
        Save
      </button>
    </form>
  )
}
```

### Example 4: Combined Auto-Save + Dirty State

```typescript
function SmartForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })

  const autoSaveDirty = useAutoSaveDirtyState(formData, {
    saveFn: async (data) => {
      await api.saveForm(data)
    },
    delay: 1000,
    warnOnNavigate: true,
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    autoSaveDirty.markDirty()
  }

  const lastSaved = useLastSavedDisplay(autoSaveDirty.isSaving, {
    lastSavedAt: autoSaveDirty.lastSavedAt,
  })

  return (
    <div>
      <input
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
      />

      <div className="status">
        {autoSaveDirty.isSaving && '💾 Saving...'}
        {autoSaveDirty.isDirty && !autoSaveDirty.isSaving && (
          '⏳ Pending save...'
        )}
        {!autoSaveDirty.isDirty && !autoSaveDirty.isSaving && (
          `✓ ${lastSaved.displayText}`
        )}
      </div>
    </div>
  )
}
```

### Example 5: Batch Updates

```typescript
function BulkTaskEditor() {
  const [tasks, setTasks] = useState<Task[]>([])

  const batchOptimistic = useBatchOptimisticUpdate(tasks, setTasks, {
    updateFn: async (updates) => {
      return await api.batchUpdateTasks(updates)
    },
  })

  const handleSelectAll = async (completed: boolean) => {
    const updates = tasks.map(task => ({
      id: task.id,
      optimisticData: { completed },
    }))

    try {
      await batchOptimistic.batchUpdate(updates)
    } catch (error) {
      toast.error('Batch update failed')
    }
  }

  return (
    <div>
      <button onClick={() => handleSelectAll(true)}>
        Mark All Complete
      </button>

      {batchOptimistic.isUpdating && (
        <div>Updating {batchOptimistic.pendingIds.size} tasks...</div>
      )}
    </div>
  )
}
```

---

## Integration Guide

### Step 1: Install Dependencies

No additional dependencies required - uses React hooks.

### Step 2: Import Hooks

```typescript
import {
  useAutoSave,
  useOptimisticUpdate,
  useDirtyState,
  useAutoSaveDirtyState,
  useLastSavedDisplay,
} from './hooks'
```

### Step 3: Integrate with Gantt Chart

```typescript
function GanttChartWithAutoSave() {
  const [tasks, setTasks] = useState<Task[]>([])

  // Auto-save for task updates
  const autoSave = useAutoSave({
    saveFn: async (tasks: Task[]) => {
      await api.batchUpdateTasks(tasks)
    },
    delay: 500,
  })

  // Optimistic updates for drag-and-drop
  const optimistic = useOptimisticUpdate(tasks, setTasks, {
    updateFn: async (id, data) => {
      return await api.updateTask(id, data)
    },
    autoRollback: true,
  })

  // Dirty state tracking
  const dirtyState = useDirtyState({
    warnOnNavigate: true,
  })

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    dirtyState.markDirty()

    try {
      await optimistic.update(taskId, updates)
      dirtyState.markClean()
    } catch (error) {
      // Error handled by optimistic hook
    }
  }

  return (
    <div>
      <GanttChart
        tasks={tasks}
        onTaskUpdate={handleTaskUpdate}
      />

      <StatusBar
        isSaving={optimistic.isUpdating}
        isDirty={dirtyState.isDirty}
        lastSaved={dirtyState.lastCleanedAt}
      />
    </div>
  )
}
```

---

## Best Practices

### 1. Debounce Delays

Choose appropriate debounce delays based on update frequency:

- **Text input**: 500-1000ms
- **Slider/range**: 300-500ms
- **Toggle/checkbox**: 200-300ms
- **Large forms**: 1000-2000ms

```typescript
// Good - appropriate delays
const textAutoSave = useAutoSave({ delay: 1000 })
const sliderAutoSave = useAutoSave({ delay: 300 })
```

### 2. Error Handling

Always provide user feedback for errors:

```typescript
const autoSave = useAutoSave({
  saveFn: async (data) => await api.save(data),
  onError: (error) => {
    toast.error(`Save failed: ${error.message}`)
  },
})
```

### 3. Optimistic Updates

Use optimistic updates for immediate feedback:

```typescript
// Good - instant UI feedback
const optimistic = useOptimisticUpdate(items, setItems, {
  updateFn: api.update,
  autoRollback: true, // Automatically rollback on error
})

// Bad - waiting for server
const handleUpdate = async (id, data) => {
  const result = await api.update(id, data)
  setItems(prev => prev.map(i => i.id === id ? result : i))
}
```

### 4. Dirty State Warnings

Enable warnings for forms with significant data:

```typescript
// Good - warn for important forms
const dirtyState = useDirtyState({
  warnOnNavigate: true,
  warnOnPageLeave: true,
})

// Optional - disable for simple forms
const dirtyState = useDirtyState({
  warnOnNavigate: false,
  warnOnPageLeave: false,
})
```

### 5. Save Status Display

Show clear save status to users:

```typescript
function SaveStatus({ isSaving, isDirty, lastSavedAt }) {
  const display = useLastSavedDisplay(isSaving, { lastSavedAt })

  if (isSaving) return <div>💾 Saving...</div>
  if (isDirty) return <div>⏳ Unsaved changes</div>
  return <div>✓ {display.displayText}</div>
}
```

### 6. Batch Updates

Use batch operations for multiple items:

```typescript
// Good - single API call
await batchOptimistic.batchUpdate([
  { id: '1', optimisticData: { status: 'done' } },
  { id: '2', optimisticData: { status: 'done' } },
])

// Bad - multiple API calls
await optimistic.update('1', { status: 'done' })
await optimistic.update('2', { status: 'done' })
```

### 7. Cleanup

Hooks automatically cleanup on unmount, but you can manually clear:

```typescript
useEffect(() => {
  return () => {
    autoSave.clearQueue()
    optimistic.rollbackAll()
  }
}, [])
```

---

## API Reference

See individual hook documentation for complete API details:

- [`useAutoSave.ts`](./src/hooks/useAutoSave.ts)
- [`useOptimisticUpdate.ts`](./src/hooks/useOptimisticUpdate.ts)
- [`useDirtyState.ts`](./src/hooks/useDirtyState.ts)

---

## Troubleshooting

### Problem: Save not triggering

**Cause:** Debounce timer not expired

**Solution:**
```typescript
// Manually trigger save
autoSave.saveNow()
```

### Problem: Updates not appearing

**Cause:** Optimistic update failed and rolled back

**Solution:**
```typescript
// Check error state
if (optimistic.error) {
  console.error('Update failed:', optimistic.error)
}
```

### Problem: Navigation warning not showing

**Cause:** Dirty state not enabled or not marked dirty

**Solution:**
```typescript
// Ensure enabled and marked dirty
const dirtyState = useDirtyState({ enabled: true })
dirtyState.markDirty()
```

### Problem: Multiple saves for same data

**Cause:** Debounce delay too short or data changing rapidly

**Solution:**
```typescript
// Increase debounce delay
const autoSave = useAutoSave({ delay: 1000 })
```

### Problem: Rollback not working

**Cause:** `autoRollback` disabled

**Solution:**
```typescript
const optimistic = useOptimisticUpdate(items, setItems, {
  updateFn: api.update,
  autoRollback: true, // Enable auto-rollback
})
```

---

## Examples

Complete examples available in:
- [`AutoSaveExample.tsx`](./src/examples/AutoSaveExample.tsx)

Run examples:
```bash
npm start
# Navigate to /examples/auto-save
```

---

## Testing

Test files:
- [`useAutoSave.test.ts`](./src/hooks/useAutoSave.test.ts)
- [`useOptimisticUpdate.test.ts`](./src/hooks/useOptimisticUpdate.test.ts)
- [`useDirtyState.test.ts`](./src/hooks/useDirtyState.test.ts)

Run tests:
```bash
npm test useAutoSave
npm test useOptimisticUpdate
npm test useDirtyState
```

---

## Further Reading

- [React Query - Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Debouncing in React](https://dmitripavlutin.com/react-throttle-debounce/)
- [Preventing Navigation](https://reactrouter.com/en/main/hooks/use-blocker)
