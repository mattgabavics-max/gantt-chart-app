# State Management Documentation

This document describes the comprehensive state management system for the Gantt Chart application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Client Service](#api-client-service)
4. [React Query Setup](#react-query-setup)
5. [Auth Context](#auth-context)
6. [Project Context](#project-context)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)

---

## Overview

The application uses a layered state management approach:

- **API Layer**: Axios client with interceptors for authentication and error handling
- **Data Fetching**: React Query for server state management
- **Auth State**: React Context for authentication
- **Project State**: React Context for local project/task state with auto-save and undo/redo

### Key Features

✅ **JWT Authentication** with automatic token refresh
✅ **Optimistic Updates** for instant UI feedback
✅ **Auto-save** with debouncing
✅ **Undo/Redo** functionality
✅ **Error Handling** with retry logic
✅ **Cache Management** with React Query
✅ **Type Safety** with TypeScript throughout

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 React Components                │
├─────────────────────────────────────────────────┤
│   Hooks Layer                                   │
│   - useAuth                                     │
│   - useProject                                  │
│   - useProjects, useTasks, useVersions          │
├─────────────────────────────────────────────────┤
│   Context Layer                                 │
│   - AuthContext (user, login, logout)          │
│   - ProjectContext (tasks, auto-save, undo)    │
├─────────────────────────────────────────────────┤
│   React Query Layer                             │
│   - Query Client (caching, refetching)         │
│   - Mutations (optimistic updates)             │
├─────────────────────────────────────────────────┤
│   API Client Layer                              │
│   - Axios interceptors                         │
│   - Token management                           │
│   - Error handling                             │
└─────────────────────────────────────────────────┘
```

---

## API Client Service

### Location
`src/services/api.ts`

### Features

#### 1. Token Management
```typescript
import { tokenManager } from '../services/api'

// Get current token
const token = tokenManager.getToken()

// Set new token
tokenManager.setToken('new-token')

// Clear all tokens (logout)
tokenManager.clearAll()
```

#### 2. Automatic Token Refresh
The API client automatically refreshes expired tokens:
- Intercepts 401 responses
- Attempts to refresh using refresh token
- Retries failed requests with new token
- Queues requests during refresh
- Logs out if refresh fails

#### 3. Error Handling
```typescript
// Errors are transformed to a consistent format
interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
  statusCode: number
}
```

#### 4. Retry Logic
- Automatically retries network errors
- Retries 5xx server errors
- Exponential backoff (1s, 2s, 4s)
- Max 3 retries
- No retry for 4xx client errors

### Usage

```typescript
import { api } from '../services/api'

// Login
const response = await api.login({
  email: 'user@example.com',
  password: 'password123'
})

// Fetch projects
const projects = await api.getProjects({ page: 1, limit: 10 })

// Create task
const task = await api.createTask({
  projectId: 'project-123',
  name: 'New Task',
  startDate: new Date(),
  endDate: new Date()
})
```

---

## React Query Setup

### Location
- Provider: `src/providers/QueryProvider.tsx`
- Hooks: `src/hooks/useQueryHooks.ts`

### Configuration

```typescript
{
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,        // 30 minutes
      retry: 2,                       // Retry failed queries twice
      refetchOnWindowFocus: true,     // Refetch on window focus
      refetchOnReconnect: true,       // Refetch on reconnect
    },
    mutations: {
      retry: 1,                       // Retry failed mutations once
    }
  }
}
```

### Query Hooks

#### Projects
```typescript
import { useProjects, useProjectQuery } from '../hooks'

// List projects
const { data, isLoading, error } = useProjects({
  page: 1,
  limit: 10,
  sortBy: 'updatedAt',
  sortOrder: 'desc'
})

// Single project
const { data: project } = useProjectQuery('project-id')
```

#### Tasks
```typescript
import { useTasks, useTask } from '../hooks'

// List tasks
const { data } = useTasks('project-id')

// Single task
const { data: task } = useTask('project-id', 'task-id')
```

### Mutation Hooks

#### With Optimistic Updates
```typescript
import { useUpdateTask } from '../hooks'

const updateTask = useUpdateTask({
  onMutate: async ({ projectId, taskId, data }) => {
    // UI updates immediately (optimistic)
    // Rolled back if mutation fails
  },
  onError: (error) => {
    // Handle error, rollback applied automatically
  },
  onSuccess: () => {
    // Mutation succeeded
  }
})

// Update task
updateTask.mutate({
  projectId: 'project-123',
  taskId: 'task-456',
  data: { progress: 75 }
})
```

#### Batch Updates (for Drag & Drop)
```typescript
import { useBatchUpdateTasks } from '../hooks'

const batchUpdate = useBatchUpdateTasks()

batchUpdate.mutate({
  projectId: 'project-123',
  data: {
    updates: [
      { id: 'task-1', changes: { startDate: new Date() } },
      { id: 'task-2', changes: { endDate: new Date() } }
    ]
  }
})
```

---

## Auth Context

### Location
`src/contexts/AuthContext.tsx`

### Features
- Login/logout
- User state management
- Token storage
- Protected routes

### Usage

```typescript
import { useAuth, ProtectedRoute } from '../hooks'

function MyComponent() {
  const {
    user,              // Current user object
    isAuthenticated,   // Auth status
    isLoading,         // Loading state
    error,             // Error message
    login,             // Login function
    logout,            // Logout function
    clearError         // Clear error
  } = useAuth()

  const handleLogin = async () => {
    try {
      await login({
        email: 'user@example.com',
        password: 'password123'
      })
    } catch (err) {
      // Error is set in context
    }
  }

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.name}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  )
}
```

### Protected Routes

```typescript
import { ProtectedRoute } from '../hooks'

// Requires authentication
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>

// Redirect authenticated users (login page)
<ProtectedRoute requireAuth={false} redirectTo="/dashboard">
  <LoginPage />
</ProtectedRoute>
```

---

## Project Context

### Location
`src/contexts/ProjectContext.tsx`

### Features
- Current project state
- Task list management
- Auto-save with debouncing (configurable interval)
- Undo/redo functionality (up to 50 actions)
- Dirty state tracking

### Usage

```typescript
import { useProject } from '../hooks'

function ProjectEditor() {
  const {
    // State
    currentProject,    // Current project
    tasks,             // Task list
    isDirty,           // Has unsaved changes
    isSaving,          // Save in progress
    lastSaved,         // Last save timestamp

    // Undo/Redo
    canUndo,
    canRedo,
    undo,
    redo,

    // Actions
    setCurrentProject,
    setTasks,
    updateTask,
    addTask,
    deleteTask,
    batchUpdateTasks,
    saveChanges,
    discardChanges
  } = useProject()

  // Update a task (triggers auto-save after 5s)
  const handleUpdate = () => {
    updateTask('task-id', {
      progress: 75,
      status: 'in-progress'
    })
  }

  // Manual save
  const handleSave = async () => {
    await saveChanges()
  }

  return (
    <div>
      <div className="toolbar">
        <button onClick={undo} disabled={!canUndo}>Undo</button>
        <button onClick={redo} disabled={!canRedo}>Redo</button>
        <button onClick={handleSave} disabled={!isDirty}>
          Save {isSaving && '...'}
        </button>
        {lastSaved && <span>Saved at {lastSaved.toLocaleTimeString()}</span>}
      </div>

      {/* Your UI */}
    </div>
  )
}
```

### Auto-Save Configuration

```typescript
// In your app setup
<ProjectProvider
  autoSaveInterval={5000}  // 5 seconds (0 to disable)
  maxHistorySize={50}      // Max undo/redo history
>
  {children}
</ProjectProvider>
```

---

## Usage Examples

See `src/examples/StateManagementExample.tsx` for comprehensive examples.

### Complete App Setup

```typescript
// App.tsx
import { AppProviders } from './providers'
import { BrowserRouter } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <AppProviders
        enableDevtools={true}
        autoSaveInterval={5000}
        maxHistorySize={50}
      >
        <Routes>
          {/* Your routes */}
        </Routes>
      </AppProviders>
    </BrowserRouter>
  )
}
```

### Drag and Drop with Optimistic Updates

```typescript
import { useProject, useBatchUpdateTasks } from '../hooks'

function GanttChart() {
  const { tasks, currentProject } = useProject()
  const batchUpdate = useBatchUpdateTasks()

  const handleDragEnd = (result) => {
    // Calculate new dates for dragged task
    const updates = calculateTaskUpdates(result)

    // Optimistic update - UI updates immediately
    batchUpdate.mutate({
      projectId: currentProject.id,
      data: { updates }
    })
  }

  return <DragDropContext onDragEnd={handleDragEnd}>...</DragDropContext>
}
```

---

## Best Practices

### 1. Use React Query for Server State
```typescript
// ✅ Good - Use React Query for data from server
const { data } = useTasks(projectId)

// ❌ Bad - Don't store server data in useState
const [tasks, setTasks] = useState([])
```

### 2. Use Project Context for Local State
```typescript
// ✅ Good - Use context for local editing state
const { updateTask } = useProject()
updateTask(taskId, { progress: 75 })

// ❌ Bad - Don't bypass context for state updates
setTasks(prev => prev.map(...))
```

### 3. Handle Loading and Error States
```typescript
// ✅ Good - Handle all states
const { data, isLoading, error } = useTasks(projectId)

if (isLoading) return <Spinner />
if (error) return <ErrorMessage error={error} />
return <TaskList tasks={data.tasks} />
```

### 4. Use Optimistic Updates for Better UX
```typescript
// ✅ Good - UI responds immediately
const updateTask = useUpdateTask({
  onMutate: async (variables) => {
    // Update UI optimistically
  }
})
```

### 5. Batch Related Updates
```typescript
// ✅ Good - Batch multiple updates
batchUpdateTasks({
  projectId,
  data: {
    updates: [
      { id: 'task-1', changes: {...} },
      { id: 'task-2', changes: {...} }
    ]
  }
})

// ❌ Bad - Multiple individual updates
tasks.forEach(task => updateTask(task.id, changes))
```

### 6. Let Auto-Save Handle Persistence
```typescript
// ✅ Good - Make changes, let auto-save handle it
updateTask(taskId, { progress: 75 })

// ❌ Bad - Manually save after every change
updateTask(taskId, { progress: 75 })
saveChanges()
```

### 7. Clean Up on Unmount
```typescript
// ✅ Good - Prompt user if unsaved changes
useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (isDirty) {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [isDirty])
```

---

## Environment Variables

Create a `.env` file in the client directory:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Feature Flags
VITE_ENABLE_DEVTOOLS=true
VITE_AUTO_SAVE_INTERVAL=5000
VITE_MAX_HISTORY_SIZE=50
```

---

## Troubleshooting

### Tokens Not Persisting
- Check localStorage is enabled
- Verify token is being set: `tokenManager.getToken()`
- Check browser console for errors

### Auto-Save Not Working
- Verify `autoSaveInterval` is not 0
- Check `isDirty` state is true
- Look for errors in console during save

### Optimistic Updates Reverting
- This is expected behavior when mutation fails
- Check network tab for failed requests
- Verify error handling in mutation

### Cache Not Updating
- Ensure cache invalidation in mutations
- Check query keys are correct
- Try manual refetch: `refetch()`

---

## Performance Tips

1. **Use Query Keys Wisely** - Include all relevant parameters in query keys
2. **Set Appropriate Stale Times** - Balance freshness vs. performance
3. **Debounce User Input** - Don't update on every keystroke
4. **Batch Updates** - Combine multiple changes into one mutation
5. **Use Pagination** - Don't fetch all data at once
6. **Disable Queries When Not Needed** - Use `enabled` option

---

## TypeScript Support

All types are fully typed. Import from `../types/api`:

```typescript
import type {
  User,
  Project,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  ApiResponse,
  ApiError
} from '../types/api'
```

---

## Further Reading

- [React Query Docs](https://tanstack.com/query/latest)
- [Axios Docs](https://axios-http.com/)
- [React Context Docs](https://react.dev/reference/react/useContext)
