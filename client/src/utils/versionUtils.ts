/**
 * Version History Utility Functions
 */

import { Task } from '../types/gantt'
import {
  VersionDiff,
  ModifiedTask,
  TaskChange,
  TaskChangeType,
  ProjectVersion,
} from '../types/version'

/**
 * Calculate the difference between two versions
 */
export function calculateVersionDiff(
  oldVersion: ProjectVersion,
  newVersion: ProjectVersion
): VersionDiff {
  const oldTasks = oldVersion.snapshot.tasks
  const newTasks = newVersion.snapshot.tasks

  const oldTaskMap = new Map(oldTasks.map((t) => [t.id, t]))
  const newTaskMap = new Map(newTasks.map((t) => [t.id, t]))

  // Find added tasks (in new but not in old)
  const added: Task[] = newTasks.filter((task) => !oldTaskMap.has(task.id))

  // Find removed tasks (in old but not in new)
  const removed: Task[] = oldTasks.filter((task) => !newTaskMap.has(task.id))

  // Find modified tasks (in both but with changes)
  const modified: ModifiedTask[] = []

  newTasks.forEach((newTask) => {
    const oldTask = oldTaskMap.get(newTask.id)
    if (oldTask) {
      const changes = getTaskChanges(oldTask, newTask)
      if (changes.length > 0) {
        modified.push({
          taskId: newTask.id,
          before: oldTask,
          after: newTask,
          changes,
        })
      }
    }
  })

  return { added, removed, modified }
}

/**
 * Get list of changes between two task versions
 */
export function getTaskChanges(oldTask: Task, newTask: Task): TaskChange[] {
  const changes: TaskChange[] = []

  // Check each field for changes
  const fieldsToCheck: TaskChangeType[] = [
    'name',
    'startDate',
    'endDate',
    'color',
    'position',
    'progress',
    'isMilestone',
  ]

  fieldsToCheck.forEach((field) => {
    const oldValue = oldTask[field]
    const newValue = newTask[field]

    // Compare values (handle dates specially)
    let isChanged = false
    if (field === 'startDate' || field === 'endDate') {
      const oldDate = new Date(oldValue as Date).getTime()
      const newDate = new Date(newValue as Date).getTime()
      isChanged = oldDate !== newDate
    } else {
      isChanged = oldValue !== newValue
    }

    if (isChanged) {
      changes.push({
        field,
        oldValue,
        newValue,
      })
    }
  })

  return changes
}

/**
 * Format a change description for display
 */
export function formatChangeDescription(change: TaskChange): string {
  const { field, oldValue, newValue } = change

  switch (field) {
    case 'name':
      return `Name: "${oldValue}" → "${newValue}"`

    case 'startDate':
    case 'endDate':
      const oldDate = new Date(oldValue).toLocaleDateString()
      const newDate = new Date(newValue).toLocaleDateString()
      const label = field === 'startDate' ? 'Start' : 'End'
      return `${label}: ${oldDate} → ${newDate}`

    case 'color':
      return `Color changed`

    case 'position':
      return `Position: ${oldValue} → ${newValue}`

    case 'progress':
      return `Progress: ${oldValue}% → ${newValue}%`

    case 'isMilestone':
      return newValue ? 'Converted to milestone' : 'Converted from milestone'

    default:
      return `${field} changed`
  }
}

/**
 * Get a summary of changes in a diff
 */
export function getDiffSummary(diff: VersionDiff): string {
  const parts: string[] = []

  if (diff.added.length > 0) {
    parts.push(`${diff.added.length} task${diff.added.length !== 1 ? 's' : ''} added`)
  }

  if (diff.removed.length > 0) {
    parts.push(`${diff.removed.length} task${diff.removed.length !== 1 ? 's' : ''} removed`)
  }

  if (diff.modified.length > 0) {
    parts.push(`${diff.modified.length} task${diff.modified.length !== 1 ? 's' : ''} modified`)
  }

  if (parts.length === 0) {
    return 'No changes'
  }

  return parts.join(', ')
}

/**
 * Calculate change count for auto-versioning
 */
export function calculateChangeCount(diff: VersionDiff): number {
  return diff.added.length + diff.removed.length + diff.modified.length
}

/**
 * Format version timestamp for display
 */
export function formatVersionDate(date: Date): string {
  const now = new Date()
  const versionDate = new Date(date)
  const diff = now.getTime() - versionDate.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return 'Just now'
  } else if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  } else if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''} ago`
  } else if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  } else {
    return versionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: versionDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }
}

/**
 * Format full version date with time
 */
export function formatVersionDateTime(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Generate automatic version description based on diff
 */
export function generateAutoVersionDescription(diff: VersionDiff): string {
  const summary = getDiffSummary(diff)
  return `Auto-save: ${summary}`
}

/**
 * Check if a new version should be created based on config and changes
 */
export function shouldCreateAutoVersion(
  diff: VersionDiff,
  config: {
    enabled: boolean
    onTaskAdd: boolean
    onTaskDelete: boolean
    onTaskModify: boolean
    minChangeThreshold: number
  }
): boolean {
  if (!config.enabled) {
    return false
  }

  const changeCount = calculateChangeCount(diff)

  if (changeCount < config.minChangeThreshold) {
    return false
  }

  // Check specific change types
  const hasAdds = diff.added.length > 0
  const hasDeletes = diff.removed.length > 0
  const hasModifies = diff.modified.length > 0

  if (hasAdds && !config.onTaskAdd) {
    return false
  }

  if (hasDeletes && !config.onTaskDelete) {
    return false
  }

  if (hasModifies && !hasAdds && !hasDeletes && !config.onTaskModify) {
    return false
  }

  return true
}
