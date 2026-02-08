/**
 * Hooks Index
 * Re-exports all custom hooks for easy imports
 */

// Auth hooks
export { useAuth } from '../contexts/AuthContext'

// Project hooks
export { useProject } from '../contexts/ProjectContext'

// Version hooks
export { useVersion } from '../contexts/VersionContext'

// React Query hooks
export {
  // Query keys
  queryKeys,

  // Project queries
  useProjects,
  useProject as useProjectQuery,

  // Project mutations
  useCreateProject,
  useUpdateProject,
  useDeleteProject,

  // Task queries
  useTasks,
  useTask,

  // Task mutations
  useCreateTask,
  useUpdateTask,
  useBatchUpdateTasks,
  useDeleteTask,

  // Version queries
  useVersions,
  useVersion as useVersionQuery,

  // Version mutations
  useCreateVersion,
  useRestoreVersion,
  useDeleteVersion,

  // User query
  useCurrentUser,

  // Share link queries
  useShareLinks,
  useSharedProject,

  // Share link mutations
  useCreateShareLink,
  useRevokeShareLink,
  useUpdateSharedProjectTask,
} from './useQueryHooks'
