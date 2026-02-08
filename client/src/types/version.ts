/**
 * Version History Types
 */

import { Task } from './gantt'

export interface ProjectVersion {
  id: string
  versionNumber: number
  projectId: string
  createdAt: Date
  createdBy: {
    id: string
    name: string
    email: string
  }
  snapshot: VersionSnapshot
  changeDescription?: string
  isAutomatic: boolean
}

export interface VersionSnapshot {
  projectName: string
  tasks: Task[]
  metadata: {
    totalTasks: number
    dateRange: {
      start: Date
      end: Date
    }
  }
}

export interface VersionDiff {
  added: Task[]
  removed: Task[]
  modified: ModifiedTask[]
}

export interface ModifiedTask {
  taskId: string
  before: Task
  after: Task
  changes: TaskChange[]
}

export type TaskChangeType =
  | 'name'
  | 'startDate'
  | 'endDate'
  | 'color'
  | 'position'
  | 'progress'
  | 'isMilestone'

export interface TaskChange {
  field: TaskChangeType
  oldValue: any
  newValue: any
}

export interface VersionHistoryState {
  versions: ProjectVersion[]
  currentVersionId: string | null
  compareVersionId: string | null
  isLoading: boolean
  error: string | null
}

export interface VersionHistoryActions {
  loadVersions: (projectId: string) => Promise<void>
  createVersion: (projectId: string, description?: string, isAutomatic?: boolean) => Promise<void>
  restoreVersion: (versionId: string) => Promise<void>
  setCompareVersion: (versionId: string | null) => void
  deleteVersion: (versionId: string) => Promise<void>
}

export interface AutoVersionConfig {
  enabled: boolean
  onTaskAdd: boolean
  onTaskDelete: boolean
  onTaskModify: boolean
  minChangeThreshold: number // Minimum number of changes before auto-version
  maxVersionsToKeep: number
}

export const DEFAULT_AUTO_VERSION_CONFIG: AutoVersionConfig = {
  enabled: true,
  onTaskAdd: true,
  onTaskDelete: true,
  onTaskModify: false, // Don't auto-version on every small edit
  minChangeThreshold: 3, // At least 3 changes
  maxVersionsToKeep: 50,
}
