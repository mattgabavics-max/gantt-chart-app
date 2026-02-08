/**
 * State Management Usage Examples
 * Demonstrates how to use the state management system
 */

import React, { useEffect } from 'react'
import {
  useAuth,
  useProject,
  useProjects,
  useProjectQuery,
  useTasks,
  useCreateTask,
  useUpdateTask,
  useBatchUpdateTasks,
  useDeleteTask,
  useVersions,
  useCreateVersion,
  useRestoreVersion,
} from '../hooks'
import type { CreateTaskRequest, UpdateTaskRequest } from '../types/api'

// ==================== Example 1: Authentication ====================

export const AuthExample: React.FC = () => {
  const { user, isAuthenticated, login, logout, isLoading, error } = useAuth()

  const handleLogin = async () => {
    try {
      await login({
        email: 'user@example.com',
        password: 'password123',
      })
      console.log('Login successful!')
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          <button onClick={handleLogin}>Login</button>
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  )
}

// ==================== Example 2: Project List with React Query ====================

export const ProjectListExample: React.FC = () => {
  const { data, isLoading, error, refetch } = useProjects({
    page: 1,
    limit: 10,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })

  if (isLoading) return <div>Loading projects...</div>
  if (error) return <div>Error: {error.error.message}</div>

  return (
    <div>
      <h2>Projects</h2>
      <button onClick={() => refetch()}>Refresh</button>
      <ul>
        {data?.data.projects.map((project) => (
          <li key={project.id}>
            {project.name} - {project.description}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ==================== Example 3: Project Context with Auto-Save ====================

export const ProjectEditorExample: React.FC = () => {
  const {
    currentProject,
    tasks,
    isDirty,
    isSaving,
    lastSaved,
    updateTask,
    addTask,
    deleteTask,
    saveChanges,
    discardChanges,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useProject()

  // Auto-save indicator
  const autoSaveStatus = isSaving
    ? 'Saving...'
    : isDirty
    ? 'Unsaved changes'
    : lastSaved
    ? `Saved at ${lastSaved.toLocaleTimeString()}`
    : 'No changes'

  const handleUpdateTask = (taskId: string) => {
    updateTask(taskId, {
      progress: 75,
      status: 'in-progress',
    })
  }

  const handleManualSave = async () => {
    try {
      await saveChanges()
      console.log('Changes saved!')
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  return (
    <div>
      <div className="toolbar">
        <span>{autoSaveStatus}</span>
        <button onClick={handleManualSave} disabled={!isDirty || isSaving}>
          Save Now
        </button>
        <button onClick={discardChanges} disabled={!isDirty}>
          Discard
        </button>
        <button onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo}>
          Redo
        </button>
      </div>

      <h2>{currentProject?.name}</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            {task.name} - {task.progress}%
            <button onClick={() => handleUpdateTask(task.id)}>
              Update Progress
            </button>
            <button onClick={() => deleteTask(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ==================== Example 4: Task Management with React Query ====================

export const TaskManagementExample: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  // Fetch tasks
  const { data: tasksData, isLoading } = useTasks(projectId)

  // Create task mutation
  const createTask = useCreateTask({
    onSuccess: () => {
      console.log('Task created successfully!')
    },
    onError: (error) => {
      console.error('Failed to create task:', error.error.message)
    },
  })

  // Update task mutation with optimistic updates
  const updateTask = useUpdateTask({
    onSuccess: () => {
      console.log('Task updated successfully!')
    },
  })

  // Batch update tasks (for drag-and-drop)
  const batchUpdate = useBatchUpdateTasks({
    onSuccess: () => {
      console.log('Tasks updated successfully!')
    },
  })

  // Delete task mutation
  const deleteTask = useDeleteTask({
    onSuccess: () => {
      console.log('Task deleted successfully!')
    },
  })

  const handleCreateTask = () => {
    const newTask: CreateTaskRequest = {
      projectId,
      name: 'New Task',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week later
      progress: 0,
      color: '#3b82f6',
      priority: 'medium',
      status: 'not-started',
    }

    createTask.mutate(newTask)
  }

  const handleDragAndDrop = (taskUpdates: Array<{ id: string; changes: UpdateTaskRequest }>) => {
    // Optimistic update - UI updates immediately
    batchUpdate.mutate({
      projectId,
      data: { updates: taskUpdates },
    })
  }

  if (isLoading) return <div>Loading tasks...</div>

  return (
    <div>
      <button onClick={handleCreateTask} disabled={createTask.isPending}>
        {createTask.isPending ? 'Creating...' : 'Create Task'}
      </button>

      <ul>
        {tasksData?.data.tasks.map((task) => (
          <li key={task.id}>
            {task.name}
            <button
              onClick={() =>
                updateTask.mutate({
                  projectId,
                  taskId: task.id,
                  data: { progress: 100, status: 'completed' },
                })
              }
              disabled={updateTask.isPending}
            >
              Mark Complete
            </button>
            <button
              onClick={() =>
                deleteTask.mutate({ projectId, taskId: task.id })
              }
              disabled={deleteTask.isPending}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ==================== Example 5: Version History ====================

export const VersionHistoryExample: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const { data: versionsData } = useVersions(projectId)

  const createVersion = useCreateVersion({
    onSuccess: () => {
      console.log('Version created!')
    },
  })

  const restoreVersion = useRestoreVersion({
    onSuccess: () => {
      console.log('Version restored!')
    },
  })

  const handleCreateVersion = () => {
    createVersion.mutate({
      projectId,
      changeDescription: 'Manual checkpoint',
    })
  }

  const handleRestore = (versionId: string) => {
    if (confirm('Are you sure you want to restore this version?')) {
      restoreVersion.mutate({
        projectId,
        data: { versionId },
      })
    }
  }

  return (
    <div>
      <button onClick={handleCreateVersion} disabled={createVersion.isPending}>
        Create Version
      </button>

      <h3>Version History</h3>
      <ul>
        {versionsData?.data.versions.map((version) => (
          <li key={version.id}>
            Version {version.versionNumber} -{' '}
            {new Date(version.createdAt).toLocaleString()}
            <button
              onClick={() => handleRestore(version.id)}
              disabled={restoreVersion.isPending}
            >
              Restore
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ==================== Example 6: Combined App Setup ====================

export const AppExample: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { setCurrentProject, setTasks } = useProject()

  // Fetch project when authenticated
  const { data: projectsData } = useProjects(
    { limit: 1 },
    { enabled: isAuthenticated }
  )

  // Fetch tasks for current project
  const currentProjectId = projectsData?.data.projects[0]?.id
  const { data: tasksData } = useTasks(currentProjectId || '', {
    enabled: !!currentProjectId,
  })

  // Load project and tasks into context
  useEffect(() => {
    if (projectsData?.data.projects[0]) {
      setCurrentProject(projectsData.data.projects[0])
    }
  }, [projectsData, setCurrentProject])

  useEffect(() => {
    if (tasksData?.data.tasks) {
      setTasks(tasksData.data.tasks)
    }
  }, [tasksData, setTasks])

  if (authLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <AuthExample />
  }

  return (
    <div>
      <ProjectListExample />
      {currentProjectId && (
        <>
          <ProjectEditorExample />
          <TaskManagementExample projectId={currentProjectId} />
          <VersionHistoryExample projectId={currentProjectId} />
        </>
      )}
    </div>
  )
}
