# Auto-Save System - Quick Setup Guide

Quick reference for implementing auto-save functionality in your Gantt chart application.

## 📁 Files Created

### 1. Core Hooks

**`src/hooks/useAutoSave.ts`** - Debounced auto-save with retry logic
- ✅ Debounced saves (default 500ms)
- ✅ Retry logic with exponential backoff
- ✅ Queue management for pending saves
- ✅ `useAutoSave`, `useBatchAutoSave`, `useMergeAutoSave`

**`src/hooks/useOptimisticUpdate.ts`** - Optimistic UI updates with rollback
- ✅ Immediate UI updates
- ✅ Automatic rollback on failure
- ✅ Per-item pending state tracking
- ✅ `useOptimisticUpdate`, `useBatchOptimisticUpdate`

**`src/hooks/useDirtyState.ts`** - Track unsaved changes
- ✅ Navigation warnings (browser and in-app)
- ✅ Last saved timestamp tracking
- ✅ `useDirtyState`, `useFormDirtyState`, `useAutoSaveDirtyState`, `useLastSavedDisplay`

### 2. Examples

**`src/examples/AutoSaveExample.tsx`** - Interactive demonstrations
- ✅ 5 complete examples
- ✅ Live demos for all hooks
- ✅ Visual demonstrations of features

### 3. Tests

**`src/hooks/useAutoSave.test.ts`** - Auto-save tests (50+ test cases)
**`src/hooks/useOptimisticUpdate.test.ts`** - Optimistic update tests (40+ test cases)
**`src/hooks/useDirtyState.test.ts`** - Dirty state tests (30+ test cases)

### 4. Documentation

**`AUTO_SAVE.md`** - Complete documentation
- ✅ API reference
- ✅ Usage examples
- ✅ Best practices
- ✅ Troubleshooting guide

---

## 🚀 Quick Start

### 1. Basic Auto-Save

```typescript
import { useAutoSave } from './hooks/useAutoSave'

function TaskEditor({ task }) {
  const autoSave = useAutoSave({
    saveFn: async (data) => {
      await api.updateTask(task.id, data)
    },
    delay: 500,
  })

  const handleChange = (name: string) => {
    const newTask = { ...task, name }
    autoSave.queueSave(newTask)
  }

  return (
    <div>
      <input onChange={(e) => handleChange(e.target.value)} />
      {autoSave.isSaving && <Spinner />}
    </div>
  )
}
```

### 2. Optimistic Updates

```typescript
import { useOptimisticUpdate } from './hooks/useOptimisticUpdate'

function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])

  const optimistic = useOptimisticUpdate(tasks, setTasks, {
    updateFn: async (id, data) => {
      return await api.updateTask(id, data)
    },
  })

  const handleUpdate = async (taskId: string, progress: number) => {
    await optimistic.update(taskId, { progress })
  }

  return (
    <div>
      {tasks.map(task => (
        <TaskRow
          key={task.id}
          task={task}
          onUpdate={handleUpdate}
          isPending={optimistic.isPending(task.id)}
        />
      ))}
    </div>
  )
}
```

### 3. Dirty State Tracking

```typescript
import { useDirtyState } from './hooks/useDirtyState'

function ProjectForm({ project }) {
  const [formData, setFormData] = useState(project)

  const dirtyState = useDirtyState({
    warnOnNavigate: true,
    warnOnPageLeave: true,
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    dirtyState.markDirty()
  }

  const handleSave = async () => {
    await api.save(formData)
    dirtyState.markClean()
  }

  return (
    <form>
      {dirtyState.isDirty && <div>⚠️ Unsaved changes</div>}
      <input onChange={(e) => handleChange('name', e.target.value)} />
      <button onClick={handleSave}>Save</button>
    </form>
  )
}
```

### 4. Combined Auto-Save + Dirty State

```typescript
import { useAutoSaveDirtyState, useLastSavedDisplay } from './hooks/useDirtyState'

function SmartForm({ data }) {
  const [formData, setFormData] = useState(data)

  const autoSaveDirty = useAutoSaveDirtyState(formData, {
    saveFn: async (data) => await api.save(data),
    delay: 1000,
    warnOnNavigate: true,
  })

  const lastSaved = useLastSavedDisplay(autoSaveDirty.isSaving, {
    lastSavedAt: autoSaveDirty.lastSavedAt,
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    autoSaveDirty.markDirty()
  }

  return (
    <div>
      <input onChange={(e) => handleChange('title', e.target.value)} />

      <div className="status">
        {autoSaveDirty.isSaving && '💾 Saving...'}
        {autoSaveDirty.isDirty && !autoSaveDirty.isSaving && '⏳ Pending...'}
        {!autoSaveDirty.isDirty && !autoSaveDirty.isSaving && `✓ ${lastSaved.displayText}`}
      </div>
    </div>
  )
}
```

---

## 🎯 Key Hooks

### useAutoSave()

**Purpose:** Debounced auto-save with retry logic

```typescript
const { isSaving, isPending, lastSaved, error, queueSave, saveNow } = useAutoSave({
  saveFn: async (data) => { /* save logic */ },
  delay: 500,           // Debounce delay
  maxRetries: 3,        // Max retry attempts
  retryDelay: 1000,     // Retry delay
  onSuccess: () => {},
  onError: (err) => {},
})
```

### useOptimisticUpdate()

**Purpose:** Instant UI updates with automatic rollback

```typescript
const { isUpdating, update, rollback, isPending } = useOptimisticUpdate(items, setItems, {
  updateFn: async (id, data) => { /* update logic */ },
  autoRollback: true,   // Auto-rollback on error
  onSuccess: (item) => {},
  onError: (err) => {},
  onRollback: (id, prev) => {},
})
```

### useDirtyState()

**Purpose:** Track unsaved changes with navigation warnings

```typescript
const { isDirty, markDirty, markClean, lastCleanedAt } = useDirtyState({
  warnOnNavigate: true,   // In-app navigation warning
  warnOnPageLeave: true,  // Browser warning
  warningMessage: 'You have unsaved changes...',
})
```

### useAutoSaveDirtyState()

**Purpose:** Combined auto-save and dirty state

```typescript
const { isDirty, isSaving, lastSavedAt, save } = useAutoSaveDirtyState(data, {
  saveFn: async (data) => { /* save logic */ },
  delay: 1000,
  warnOnNavigate: true,
})
```

### useLastSavedDisplay()

**Purpose:** Format last saved timestamp

```typescript
const { displayText, secondsAgo } = useLastSavedDisplay(isSaving, {
  lastSavedAt: new Date(),
  updateInterval: 10000, // Update every 10s
})

// displayText: "Saved 2 minutes ago"
```

---

## 📊 Hook Comparison

| Hook | Use Case | Key Feature |
|------|----------|-------------|
| `useAutoSave` | Auto-save text input | Debouncing + retry logic |
| `useOptimisticUpdate` | Drag-and-drop, toggles | Instant UI feedback |
| `useDirtyState` | Form unsaved warnings | Navigation blocking |
| `useAutoSaveDirtyState` | Smart forms | Combined auto-save + dirty |
| `useLastSavedDisplay` | Status display | Human-readable timestamps |

---

## 💡 Common Patterns

### Pattern 1: Save Indicator

```typescript
function SaveIndicator({ isSaving, isPending, lastSaved }) {
  const display = useLastSavedDisplay(isSaving, { lastSavedAt: lastSaved })

  if (isSaving) return <div>💾 Saving...</div>
  if (isPending) return <div>⏳ Pending...</div>
  return <div>✓ {display.displayText}</div>
}
```

### Pattern 2: Error Display

```typescript
function ErrorDisplay({ error, onDismiss }) {
  if (!error) return null

  return (
    <div className="error">
      ⚠️ {error.message}
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  )
}
```

### Pattern 3: Batch Operations

```typescript
const handleBulkUpdate = async (updates) => {
  await batchOptimistic.batchUpdate(
    updates.map(({ id, data }) => ({
      id,
      optimisticData: data,
    }))
  )
}
```

### Pattern 4: Manual Save Button

```typescript
<button
  onClick={autoSave.saveNow}
  disabled={autoSave.isSaving || !autoSave.isPending}
>
  {autoSave.isSaving ? 'Saving...' : 'Save Now'}
</button>
```

### Pattern 5: Unsaved Changes Warning

```typescript
{dirtyState.isDirty && (
  <div className="warning">
    <span>⚠️ You have unsaved changes</span>
    <button onClick={handleSave}>Save</button>
    <button onClick={dirtyState.reset}>Discard</button>
  </div>
)}
```

---

## ⚙️ Configuration Options

### Debounce Delays (Recommended)

| Input Type | Delay | Reason |
|-----------|-------|---------|
| Text input | 500-1000ms | Allow user to finish typing |
| Slider | 300-500ms | Smooth interaction |
| Toggle | 200-300ms | Quick feedback |
| Large form | 1000-2000ms | Batch multiple field changes |

### Retry Settings

```typescript
{
  maxRetries: 3,        // Standard: 3 retries
  retryDelay: 1000,     // Base delay: 1 second
  // Actual delays: 1s, 2s, 4s (exponential backoff)
}
```

### Navigation Warnings

```typescript
{
  warnOnPageLeave: true,    // Browser tab close/refresh
  warnOnNavigate: true,     // In-app routing
  warningMessage: 'You have unsaved changes. Are you sure?',
}
```

---

## 🧪 Testing

Run tests:
```bash
npm test useAutoSave
npm test useOptimisticUpdate
npm test useDirtyState
```

Test coverage:
- ✅ 50+ tests for `useAutoSave`
- ✅ 40+ tests for `useOptimisticUpdate`
- ✅ 30+ tests for `useDirtyState`
- ✅ All edge cases covered

---

## 🔍 Debugging

### Enable Console Logs

```typescript
const autoSave = useAutoSave({
  saveFn: async (data) => {
    console.log('Saving:', data)
    await api.save(data)
  },
  onSuccess: () => console.log('✓ Saved'),
  onError: (err) => console.error('✗ Error:', err),
})
```

### Check State

```typescript
console.log({
  isSaving: autoSave.isSaving,
  isPending: autoSave.isPending,
  error: autoSave.error,
  retryCount: autoSave.retryCount,
})
```

### Monitor Optimistic Updates

```typescript
const optimistic = useOptimisticUpdate(items, setItems, {
  updateFn: api.update,
  onSuccess: (item) => console.log('✓ Updated:', item),
  onError: (err) => console.error('✗ Failed:', err),
  onRollback: (id, prev) => console.warn('↩ Rolled back:', id, prev),
})
```

---

## 🐛 Common Issues

### Issue: Save not triggering

**Solution:** Check debounce delay or call `saveNow()`
```typescript
autoSave.saveNow() // Bypass debounce
```

### Issue: Updates not showing

**Solution:** Check for errors and rollback
```typescript
if (optimistic.error) {
  console.error('Update failed:', optimistic.error)
}
```

### Issue: Warning not showing

**Solution:** Ensure dirty state is marked
```typescript
dirtyState.markDirty() // Explicitly mark as dirty
```

### Issue: Multiple saves

**Solution:** Increase debounce delay
```typescript
const autoSave = useAutoSave({ delay: 1000 }) // Longer delay
```

---

## 📚 Full Documentation

See [`AUTO_SAVE.md`](./AUTO_SAVE.md) for:
- Complete API reference
- Advanced usage examples
- Best practices guide
- Troubleshooting details

---

## 🎉 You're Ready!

The auto-save system is fully implemented and tested. Use the hooks directly in your components or check the examples for complete implementations.

```typescript
// Import and use
import { useAutoSave, useOptimisticUpdate, useDirtyState } from './hooks'

// See examples
// src/examples/AutoSaveExample.tsx

// Read docs
// AUTO_SAVE.md
```

Happy coding! 🚀
