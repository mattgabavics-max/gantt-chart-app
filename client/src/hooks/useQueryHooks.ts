/**
 * React Query Hooks
 * Custom hooks for data fetching and mutations with React Query
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'
import { api } from '../services/api'
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  BatchUpdateTasksRequest,
  Version,
  CreateVersionRequest,
  RestoreVersionRequest,
  PaginationParams,
  ApiResponse,
  ApiError,
  ShareLink,
  CreateShareLinkRequest,
  SharedProjectResponse,
} from '../types/api'

// ==================== Query Keys ====================

export const queryKeys = {
  // Projects
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  projectTasks: (id: string) => ['projects', id, 'tasks'] as const,
  projectVersions: (id: string) => ['projects', id, 'versions'] as const,

  // Tasks
  tasks: (projectId: string) => ['tasks', projectId] as const,
  task: (projectId: string, taskId: string) =>
    ['tasks', projectId, taskId] as const,

  // Versions
  versions: (projectId: string) => ['versions', projectId] as const,
  version: (projectId: string, versionId: string) =>
    ['versions', projectId, versionId] as const,

  // Auth
  currentUser: ['currentUser'] as const,

  // Share Links
  shareLinks: (projectId: string) => ['shareLinks', projectId] as const,
  sharedProject: (token: string) => ['sharedProject', token] as const,
}

// ==================== Project Queries ====================

export const useProjects = (
  params?: PaginationParams,
  options?: Omit<
    UseQueryOptions<ApiResponse<any>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery({
    queryKey: [...queryKeys.projects, params],
    queryFn: () => api.getProjects(params),
    ...options,
  })
}

export const useProject = (
  id: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<Project>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => api.getProject(id),
    enabled: !!id,
    ...options,
  })
}

// ==================== Project Mutations ====================

export const useCreateProject = (
  options?: UseMutationOptions<
    ApiResponse<Project>,
    ApiError,
    CreateProjectRequest
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => api.createProject(data),
    onSuccess: (response) => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })

      // Add to cache
      queryClient.setQueryData(
        queryKeys.project(response.data.id),
        response
      )
    },
    ...options,
  })
}

export const useUpdateProject = (
  options?: UseMutationOptions<
    ApiResponse<Project>,
    ApiError,
    { id: string; data: UpdateProjectRequest }
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => api.updateProject(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.project(id) })

      // Snapshot previous value
      const previousProject = queryClient.getQueryData(queryKeys.project(id))

      // Optimistically update
      queryClient.setQueryData(
        queryKeys.project(id),
        (old: ApiResponse<Project> | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: { ...old.data, ...data },
          }
        }
      )

      return { previousProject }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(queryKeys.project(id), context.previousProject)
      }
    },
    onSettled: (data, error, { id }) => {
      // Refetch to ensure data is correct
      queryClient.invalidateQueries({ queryKey: queryKeys.project(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
    ...options,
  })
}

export const useDeleteProject = (
  options?: UseMutationOptions<ApiResponse<void>, ApiError, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.project(id) })

      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
    ...options,
  })
}

// ==================== Task Queries ====================

export const useTasks = (
  projectId: string,
  params?: PaginationParams,
  options?: Omit<
    UseQueryOptions<ApiResponse<any>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery({
    queryKey: [...queryKeys.tasks(projectId), params],
    queryFn: () => api.getTasks(projectId, params),
    enabled: !!projectId,
    ...options,
  })
}

export const useTask = (
  projectId: string,
  taskId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<Task>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery({
    queryKey: queryKeys.task(projectId, taskId),
    queryFn: () => api.getTask(projectId, taskId),
    enabled: !!projectId && !!taskId,
    ...options,
  })
}

// ==================== Task Mutations ====================

export const useCreateTask = (
  options?: UseMutationOptions<
    ApiResponse<Task>,
    ApiError,
    CreateTaskRequest
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => api.createTask(data),
    onSuccess: (response, variables) => {
      // Invalidate tasks list
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks(variables.projectId),
      })

      // Add to cache
      queryClient.setQueryData(
        queryKeys.task(variables.projectId, response.data.id),
        response
      )
    },
    ...options,
  })
}

export const useUpdateTask = (
  options?: UseMutationOptions<
    ApiResponse<Task>,
    ApiError,
    { projectId: string; taskId: string; data: UpdateTaskRequest }
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, taskId, data }) =>
      api.updateTask(projectId, taskId, data),
    onMutate: async ({ projectId, taskId, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.task(projectId, taskId),
      })
      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks(projectId),
      })

      // Snapshot previous values
      const previousTask = queryClient.getQueryData(
        queryKeys.task(projectId, taskId)
      )
      const previousTasks = queryClient.getQueryData(
        queryKeys.tasks(projectId)
      )

      // Optimistically update task
      queryClient.setQueryData(
        queryKeys.task(projectId, taskId),
        (old: ApiResponse<Task> | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: { ...old.data, ...data },
          }
        }
      )

      // Optimistically update tasks list
      queryClient.setQueryData(
        queryKeys.tasks(projectId),
        (old: ApiResponse<{ tasks: Task[] }> | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              tasks: old.data.tasks.map((task) =>
                task.id === taskId ? { ...task, ...data } : task
              ),
            },
          }
        }
      )

      return { previousTask, previousTasks }
    },
    onError: (err, { projectId, taskId }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(
          queryKeys.task(projectId, taskId),
          context.previousTask
        )
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(
          queryKeys.tasks(projectId),
          context.previousTasks
        )
      }
    },
    onSettled: (data, error, { projectId, taskId }) => {
      // Refetch to ensure data is correct
      queryClient.invalidateQueries({
        queryKey: queryKeys.task(projectId, taskId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks(projectId),
      })
    },
    ...options,
  })
}

export const useBatchUpdateTasks = (
  options?: UseMutationOptions<
    ApiResponse<Task[]>,
    ApiError,
    { projectId: string; data: BatchUpdateTasksRequest }
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, data }) => api.batchUpdateTasks(projectId, data),
    onMutate: async ({ projectId, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks(projectId),
      })

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(
        queryKeys.tasks(projectId)
      )

      // Create updates map
      const updatesMap = new Map(
        data.updates.map((u) => [u.id, u.changes])
      )

      // Optimistically update tasks list
      queryClient.setQueryData(
        queryKeys.tasks(projectId),
        (old: ApiResponse<{ tasks: Task[] }> | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              tasks: old.data.tasks.map((task) => {
                const updates = updatesMap.get(task.id)
                return updates ? { ...task, ...updates } : task
              }),
            },
          }
        }
      )

      return { previousTasks }
    },
    onError: (err, { projectId }, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(
          queryKeys.tasks(projectId),
          context.previousTasks
        )
      }
    },
    onSettled: (data, error, { projectId }) => {
      // Refetch to ensure data is correct
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks(projectId),
      })
    },
    ...options,
  })
}

export const useDeleteTask = (
  options?: UseMutationOptions<
    ApiResponse<void>,
    ApiError,
    { projectId: string; taskId: string }
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, taskId }) => api.deleteTask(projectId, taskId),
    onMutate: async ({ projectId, taskId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks(projectId),
      })

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(
        queryKeys.tasks(projectId)
      )

      // Optimistically remove from list
      queryClient.setQueryData(
        queryKeys.tasks(projectId),
        (old: ApiResponse<{ tasks: Task[] }> | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              tasks: old.data.tasks.filter((task) => task.id !== taskId),
            },
          }
        }
      )

      return { previousTasks }
    },
    onError: (err, { projectId }, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(
          queryKeys.tasks(projectId),
          context.previousTasks
        )
      }
    },
    onSuccess: (_, { projectId, taskId }) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.task(projectId, taskId),
      })

      // Invalidate tasks list
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks(projectId),
      })
    },
    ...options,
  })
}

// ==================== Version Queries ====================

export const useVersions = (
  projectId: string,
  params?: PaginationParams,
  options?: Omit<
    UseQueryOptions<ApiResponse<any>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery({
    queryKey: [...queryKeys.versions(projectId), params],
    queryFn: () => api.getVersions(projectId, params),
    enabled: !!projectId,
    ...options,
  })
}

export const useVersion = (
  projectId: string,
  versionId: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<Version>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery({
    queryKey: queryKeys.version(projectId, versionId),
    queryFn: () => api.getVersion(projectId, versionId),
    enabled: !!projectId && !!versionId,
    ...options,
  })
}

// ==================== Version Mutations ====================

export const useCreateVersion = (
  options?: UseMutationOptions<
    ApiResponse<Version>,
    ApiError,
    CreateVersionRequest
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateVersionRequest) => api.createVersion(data),
    onSuccess: (response, variables) => {
      // Invalidate versions list
      queryClient.invalidateQueries({
        queryKey: queryKeys.versions(variables.projectId),
      })

      // Add to cache
      queryClient.setQueryData(
        queryKeys.version(variables.projectId, response.data.id),
        response
      )
    },
    ...options,
  })
}

export const useRestoreVersion = (
  options?: UseMutationOptions<
    ApiResponse<void>,
    ApiError,
    { projectId: string; data: RestoreVersionRequest }
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, data }) => api.restoreVersion(projectId, data),
    onSuccess: (_, { projectId }) => {
      // Invalidate tasks to reflect restored state
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks(projectId),
      })

      // Invalidate project to reflect restored settings
      queryClient.invalidateQueries({
        queryKey: queryKeys.project(projectId),
      })

      // Invalidate versions list
      queryClient.invalidateQueries({
        queryKey: queryKeys.versions(projectId),
      })
    },
    ...options,
  })
}

export const useDeleteVersion = (
  options?: UseMutationOptions<
    ApiResponse<void>,
    ApiError,
    { projectId: string; versionId: string }
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, versionId }) =>
      api.deleteVersion(projectId, versionId),
    onSuccess: (_, { projectId, versionId }) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.version(projectId, versionId),
      })

      // Invalidate versions list
      queryClient.invalidateQueries({
        queryKey: queryKeys.versions(projectId),
      })
    },
    ...options,
  })
}

// ==================== Share Link Queries ====================

export const useShareLinks = (
  projectId: string,
  params?: PaginationParams,
  options?: Omit<
    UseQueryOptions<ApiResponse<any>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery({
    queryKey: [...queryKeys.shareLinks(projectId), params],
    queryFn: () => api.getShareLinks(projectId, params),
    enabled: !!projectId,
    ...options,
  })
}

export const useSharedProject = (
  token: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<SharedProjectResponse>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery({
    queryKey: queryKeys.sharedProject(token),
    queryFn: () => api.getSharedProject(token),
    enabled: !!token,
    retry: false, // Don't retry on invalid tokens
    ...options,
  })
}

// ==================== Share Link Mutations ====================

export const useCreateShareLink = (
  options?: UseMutationOptions<
    ApiResponse<ShareLink>,
    ApiError,
    CreateShareLinkRequest
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateShareLinkRequest) => api.createShareLink(data),
    onSuccess: (response, variables) => {
      // Invalidate share links list
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareLinks(variables.projectId),
      })
    },
    ...options,
  })
}

export const useRevokeShareLink = (
  options?: UseMutationOptions<
    ApiResponse<void>,
    ApiError,
    { projectId: string; shareLinkId: string }
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, shareLinkId }) =>
      api.revokeShareLink(projectId, shareLinkId),
    onMutate: async ({ projectId, shareLinkId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.shareLinks(projectId),
      })

      // Snapshot previous value
      const previousLinks = queryClient.getQueryData(
        queryKeys.shareLinks(projectId)
      )

      // Optimistically remove from list
      queryClient.setQueryData(
        queryKeys.shareLinks(projectId),
        (old: ApiResponse<{ shareLinks: ShareLink[] }> | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              shareLinks: old.data.shareLinks.filter(
                (link) => link.id !== shareLinkId
              ),
            },
          }
        }
      )

      return { previousLinks }
    },
    onError: (err, { projectId }, context) => {
      // Rollback on error
      if (context?.previousLinks) {
        queryClient.setQueryData(
          queryKeys.shareLinks(projectId),
          context.previousLinks
        )
      }
    },
    onSuccess: (_, { projectId }) => {
      // Invalidate to ensure data is correct
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareLinks(projectId),
      })
    },
    ...options,
  })
}

export const useUpdateSharedProjectTask = (
  options?: UseMutationOptions<
    ApiResponse<Task>,
    ApiError,
    { token: string; taskId: string; data: UpdateTaskRequest }
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ token, taskId, data }) =>
      api.updateSharedProjectTask(token, taskId, data),
    onMutate: async ({ token, taskId, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.sharedProject(token),
      })

      // Snapshot previous value
      const previousProject = queryClient.getQueryData(
        queryKeys.sharedProject(token)
      )

      // Optimistically update task
      queryClient.setQueryData(
        queryKeys.sharedProject(token),
        (old: ApiResponse<SharedProjectResponse> | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              tasks: old.data.tasks.map((task) =>
                task.id === taskId ? { ...task, ...data } : task
              ),
            },
          }
        }
      )

      return { previousProject }
    },
    onError: (err, { token }, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(
          queryKeys.sharedProject(token),
          context.previousProject
        )
      }
    },
    onSettled: (data, error, { token }) => {
      // Refetch to ensure data is correct
      queryClient.invalidateQueries({
        queryKey: queryKeys.sharedProject(token),
      })
    },
    ...options,
  })
}

// ==================== Current User Query ====================

export const useCurrentUser = (
  options?: Omit<
    UseQueryOptions<ApiResponse<any>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => api.getCurrentUser(),
    ...options,
  })
}
