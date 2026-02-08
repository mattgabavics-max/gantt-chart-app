# State Management Setup Summary

This document provides a quick overview of the state management system that has been set up.

## 📁 Files Created

### 1. Type Definitions
- **`src/types/api.ts`** - Complete TypeScript interfaces for all API requests/responses
  - Auth types (Login, Register, User)
  - Project types (Project, ProjectMember, ProjectSettings)
  - Task types (Task, TaskAssignee, CRUD requests)
  - Version types (Version, Version snapshots)
  - API response wrappers

### 2. API Client Service
- **`src/services/api.ts`** - Axios-based API client
  - ✅ JWT token management (localStorage)
  - ✅ Automatic token refresh on 401
  - ✅ Request/response interceptors
  - ✅ Retry logic with exponential backoff
  - ✅ Error transformation
  - ✅ All endpoints (auth, projects, tasks, versions)

### 3. React Query Setup
- **`src/providers/QueryProvider.tsx`** - React Query configuration
  - Query client with caching strategy
  - Global error handling
  - Devtools integration
  - 5min stale time, 30min cache time

- **`src/hooks/useQueryHooks.ts`** - Custom React Query hooks
  - Queries: `useProjects`, `useTasks`, `useVersions`
  - Mutations: `useCreateTask`, `useUpdateTask`, `useDeleteTask`, etc.
  - Optimistic updates for all mutations
  - Cache invalidation strategies

### 4. Context Providers

#### Auth Context
- **`src/contexts/AuthContext.tsx`**
  - Login/logout functionality
  - User state management
  - Token storage
  - Protected route wrapper
  - Auto-load user on mount

#### Project Context
- **`src/contexts/ProjectContext.tsx`**
  - Current project state
  - Task list management
  - **Auto-save** with configurable debouncing (default: 5s)
  - **Undo/Redo** functionality (up to 50 actions)
  - Dirty state tracking
  - Batch updates

### 5. Unified Exports
- **`src/providers/index.tsx`** - Combined providers wrapper
- **`src/hooks/index.ts`** - All hooks re-exported for easy imports

### 6. Documentation & Examples
- **`STATE_MANAGEMENT.md`** - Comprehensive documentation
- **`src/examples/StateManagementExample.tsx`** - Usage examples
- **`.env.example`** - Environment variable template

## 📦 Dependencies Installed

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.90.20",
    "@tanstack/react-query-devtools": "^5.91.3",
    "axios": "^1.6.5",
    "react-router-dom": "^7.13.0"
  }
}
```

## 🚀 Quick Start

### 1. Setup Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update the API URL in `.env`:
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 2. Wrap Your App

```tsx
// src/main.tsx or src/App.tsx
import { AppProviders } from './providers'

function App() {
  return (
    <AppProviders>
      {/* Your app routes and components */}
    </AppProviders>
  )
}
```

### 3. Use Authentication

```tsx
import { useAuth, ProtectedRoute } from './hooks'

function LoginPage() {
  const { login, isLoading, error } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    await login({
      email: 'user@example.com',
      password: 'password'
    })
  }

  return <form onSubmit={handleLogin}>...</form>
}

// Protected route
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

### 4. Fetch Data with React Query

```tsx
import { useProjects, useTasks } from './hooks'

function ProjectList() {
  const { data, isLoading, error } = useProjects()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.error.message}</div>

  return (
    <ul>
      {data.data.projects.map(project => (
        <li key={project.id}>{project.name}</li>
      ))}
    </ul>
  )
}
```

### 5. Manage Local State with Project Context

```tsx
import { useProject } from './hooks'

function TaskEditor() {
  const {
    tasks,
    isDirty,
    updateTask,
    undo,
    redo,
    canUndo,
    canRedo
  } = useProject()

  const handleUpdateTask = (taskId: string) => {
    // Auto-saves after 5 seconds
    updateTask(taskId, { progress: 75 })
  }

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
      {isDirty && <span>Unsaved changes</span>}
      {/* Your task list */}
    </div>
  )
}
```

### 6. Create/Update Data with Mutations

```tsx
import { useCreateTask, useUpdateTask } from './hooks'

function TaskManager({ projectId }) {
  const createTask = useCreateTask({
    onSuccess: () => {
      console.log('Task created!')
    }
  })

  const updateTask = useUpdateTask({
    // Optimistic updates - UI updates immediately
    onSuccess: () => {
      console.log('Task updated!')
    }
  })

  const handleCreate = () => {
    createTask.mutate({
      projectId,
      name: 'New Task',
      startDate: new Date(),
      endDate: new Date()
    })
  }

  return <button onClick={handleCreate}>Create Task</button>
}
```

### 7. Batch Updates (Drag & Drop)

```tsx
import { useBatchUpdateTasks } from './hooks'

function GanttChart({ projectId }) {
  const batchUpdate = useBatchUpdateTasks()

  const handleDragEnd = (result) => {
    // Calculate new positions
    const updates = calculateUpdates(result)

    // Optimistic update - UI updates immediately
    batchUpdate.mutate({
      projectId,
      data: { updates }
    })
  }

  return <DragDropContext onDragEnd={handleDragEnd}>...</DragDropContext>
}
```

## 🎯 Key Features

### 1. Authentication Flow
```
User enters credentials
  ↓
Login mutation
  ↓
Token stored in localStorage
  ↓
Auto-attached to all requests
  ↓
Auto-refresh on expiry
  ↓
Logout clears tokens
```

### 2. Data Flow
```
Component requests data
  ↓
React Query checks cache
  ↓
If stale, fetch from API
  ↓
API client adds auth token
  ↓
Response cached
  ↓
Component re-renders
```

### 3. Auto-Save Flow
```
User modifies task
  ↓
updateTask() called
  ↓
Local state updated immediately
  ↓
Added to undo history
  ↓
5 second timer starts
  ↓
Timer expires → API called
  ↓
Server synced
```

### 4. Optimistic Updates Flow
```
User clicks delete
  ↓
Mutation starts
  ↓
UI updates immediately (removed from list)
  ↓
API request sent
  ↓
If success: change persists
  ↓
If error: UI reverts (item restored)
```

## 🔧 Configuration

### Auto-Save Interval
```tsx
<ProjectProvider autoSaveInterval={5000}> {/* 5 seconds */}
  {children}
</ProjectProvider>

// Or disable auto-save
<ProjectProvider autoSaveInterval={0}>
  {children}
</ProjectProvider>
```

### React Query Cache Time
```tsx
// In QueryProvider.tsx
{
  staleTime: 1000 * 60 * 5,  // 5 minutes
  gcTime: 1000 * 60 * 30,    // 30 minutes
}
```

### Retry Configuration
```tsx
// In QueryProvider.tsx
{
  retry: 2,  // Retry failed queries twice
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
}
```

## 📊 State Management Layers

| Layer | Purpose | Location | Examples |
|-------|---------|----------|----------|
| **API Client** | HTTP requests, auth, errors | `src/services/api.ts` | Token refresh, retry logic |
| **React Query** | Server state, caching | `src/hooks/useQueryHooks.ts` | Fetch projects, optimistic updates |
| **Auth Context** | User auth state | `src/contexts/AuthContext.tsx` | Login, logout, user info |
| **Project Context** | Local project state | `src/contexts/ProjectContext.tsx` | Auto-save, undo/redo |

## 🎨 Best Practices

### ✅ DO:
- Use React Query hooks for fetching data
- Use Project Context for local editing state
- Use optimistic updates for better UX
- Handle loading and error states
- Batch related updates together
- Let auto-save handle persistence

### ❌ DON'T:
- Store server data in local useState
- Make API calls directly (use hooks)
- Update state outside of context
- Save manually after every change
- Skip error handling
- Ignore loading states

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Tokens not persisting** | Check localStorage is enabled, verify browser console |
| **Auto-save not working** | Check `autoSaveInterval` config, verify `isDirty` state |
| **Cache not updating** | Check query keys, try manual refetch |
| **Optimistic updates reverting** | Expected on error - check network tab for failed requests |
| **401 errors** | Token expired - should auto-refresh, check refresh token |

## 📚 Next Steps

1. **Implement Login UI** - Use `useAuth()` hook
2. **Create Project Dashboard** - Use `useProjects()` hook
3. **Build Gantt Chart** - Use `useTasks()` + `useProject()` context
4. **Add Drag & Drop** - Use `useBatchUpdateTasks()` mutation
5. **Implement Version History** - Use `useVersions()` hooks

## 🔗 Related Files

- [Complete Documentation](./STATE_MANAGEMENT.md)
- [Usage Examples](./src/examples/StateManagementExample.tsx)
- [API Types](./src/types/api.ts)
- [API Client](./src/services/api.ts)

## 📞 Support

For detailed documentation, see `STATE_MANAGEMENT.md`.

For examples, see `src/examples/StateManagementExample.tsx`.
