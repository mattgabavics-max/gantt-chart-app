/**
 * Unit Tests for Version Utils
 */

import {
  calculateVersionDiff,
  getTaskChanges,
  formatChangeDescription,
  getDiffSummary,
  calculateChangeCount,
  formatVersionDate,
  formatVersionDateTime,
  generateAutoVersionDescription,
  shouldCreateAutoVersion,
} from './versionUtils'
import { Task } from '../types/gantt'
import { ProjectVersion, VersionDiff } from '../types/version'
import { createMockTask, createMockVersion } from '../tests/mocks/mockData'

describe('versionUtils', () => {
  describe('calculateVersionDiff', () => {
    it('should identify added tasks', () => {
      const oldVersion = createMockVersion({
        snapshot: {
          projectName: 'Test',
          tasks: [createMockTask({ id: '1', name: 'Task 1' })],
          metadata: { totalTasks: 1, dateRange: { start: new Date(), end: new Date() } },
        },
      })

      const newVersion = createMockVersion({
        snapshot: {
          projectName: 'Test',
          tasks: [
            createMockTask({ id: '1', name: 'Task 1' }),
            createMockTask({ id: '2', name: 'Task 2' }),
          ],
          metadata: { totalTasks: 2, dateRange: { start: new Date(), end: new Date() } },
        },
      })

      const diff = calculateVersionDiff(oldVersion, newVersion)

      expect(diff.added).toHaveLength(1)
      expect(diff.added[0].id).toBe('2')
      expect(diff.removed).toHaveLength(0)
      expect(diff.modified).toHaveLength(0)
    })

    it('should identify removed tasks', () => {
      const oldVersion = createMockVersion({
        snapshot: {
          projectName: 'Test',
          tasks: [
            createMockTask({ id: '1', name: 'Task 1' }),
            createMockTask({ id: '2', name: 'Task 2' }),
          ],
          metadata: { totalTasks: 2, dateRange: { start: new Date(), end: new Date() } },
        },
      })

      const newVersion = createMockVersion({
        snapshot: {
          projectName: 'Test',
          tasks: [createMockTask({ id: '1', name: 'Task 1' })],
          metadata: { totalTasks: 1, dateRange: { start: new Date(), end: new Date() } },
        },
      })

      const diff = calculateVersionDiff(oldVersion, newVersion)

      expect(diff.added).toHaveLength(0)
      expect(diff.removed).toHaveLength(1)
      expect(diff.removed[0].id).toBe('2')
      expect(diff.modified).toHaveLength(0)
    })

    it('should identify modified tasks', () => {
      const oldVersion = createMockVersion({
        snapshot: {
          projectName: 'Test',
          tasks: [createMockTask({ id: '1', name: 'Old Name', progress: 0 })],
          metadata: { totalTasks: 1, dateRange: { start: new Date(), end: new Date() } },
        },
      })

      const newVersion = createMockVersion({
        snapshot: {
          projectName: 'Test',
          tasks: [createMockTask({ id: '1', name: 'New Name', progress: 50 })],
          metadata: { totalTasks: 1, dateRange: { start: new Date(), end: new Date() } },
        },
      })

      const diff = calculateVersionDiff(oldVersion, newVersion)

      expect(diff.added).toHaveLength(0)
      expect(diff.removed).toHaveLength(0)
      expect(diff.modified).toHaveLength(1)
      expect(diff.modified[0].taskId).toBe('1')
      expect(diff.modified[0].changes.length).toBeGreaterThan(0)
    })

    it('should handle no changes', () => {
      const task = createMockTask({ id: '1', name: 'Task 1' })
      const version1 = createMockVersion({
        snapshot: {
          projectName: 'Test',
          tasks: [task],
          metadata: { totalTasks: 1, dateRange: { start: new Date(), end: new Date() } },
        },
      })

      const version2 = createMockVersion({
        snapshot: {
          projectName: 'Test',
          tasks: [{ ...task }],
          metadata: { totalTasks: 1, dateRange: { start: new Date(), end: new Date() } },
        },
      })

      const diff = calculateVersionDiff(version1, version2)

      expect(diff.added).toHaveLength(0)
      expect(diff.removed).toHaveLength(0)
      expect(diff.modified).toHaveLength(0)
    })
  })

  describe('getTaskChanges', () => {
    it('should detect name change', () => {
      const oldTask = createMockTask({ name: 'Old Name' })
      const newTask = createMockTask({ name: 'New Name' })

      const changes = getTaskChanges(oldTask, newTask)

      expect(changes).toHaveLength(1)
      expect(changes[0].field).toBe('name')
      expect(changes[0].oldValue).toBe('Old Name')
      expect(changes[0].newValue).toBe('New Name')
    })

    it('should detect date changes', () => {
      const oldTask = createMockTask({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
      })
      const newTask = createMockTask({
        startDate: new Date('2024-01-02'),
        endDate: new Date('2024-01-08'),
      })

      const changes = getTaskChanges(oldTask, newTask)

      expect(changes.length).toBeGreaterThanOrEqual(2)
      expect(changes.some((c) => c.field === 'startDate')).toBe(true)
      expect(changes.some((c) => c.field === 'endDate')).toBe(true)
    })

    it('should detect color change', () => {
      const oldTask = createMockTask({ color: '#ff0000' })
      const newTask = createMockTask({ color: '#00ff00' })

      const changes = getTaskChanges(oldTask, newTask)

      expect(changes.some((c) => c.field === 'color')).toBe(true)
    })

    it('should detect progress change', () => {
      const oldTask = createMockTask({ progress: 25 })
      const newTask = createMockTask({ progress: 75 })

      const changes = getTaskChanges(oldTask, newTask)

      expect(changes.some((c) => c.field === 'progress')).toBe(true)
    })

    it('should detect milestone conversion', () => {
      const oldTask = createMockTask({ isMilestone: false })
      const newTask = createMockTask({ isMilestone: true })

      const changes = getTaskChanges(oldTask, newTask)

      expect(changes.some((c) => c.field === 'isMilestone')).toBe(true)
    })

    it('should return empty array for no changes', () => {
      const task = createMockTask()
      const changes = getTaskChanges(task, { ...task })

      expect(changes).toHaveLength(0)
    })
  })

  describe('formatChangeDescription', () => {
    it('should format name change', () => {
      const change = {
        field: 'name' as const,
        oldValue: 'Old',
        newValue: 'New',
      }

      const description = formatChangeDescription(change)
      expect(description).toContain('Old')
      expect(description).toContain('New')
    })

    it('should format date change', () => {
      const change = {
        field: 'startDate' as const,
        oldValue: new Date('2024-01-01'),
        newValue: new Date('2024-01-02'),
      }

      const description = formatChangeDescription(change)
      expect(description).toContain('Start')
    })

    it('should format progress change', () => {
      const change = {
        field: 'progress' as const,
        oldValue: 25,
        newValue: 75,
      }

      const description = formatChangeDescription(change)
      expect(description).toContain('25')
      expect(description).toContain('75')
    })

    it('should format milestone conversion', () => {
      const change = {
        field: 'isMilestone' as const,
        oldValue: false,
        newValue: true,
      }

      const description = formatChangeDescription(change)
      expect(description).toContain('milestone')
    })
  })

  describe('getDiffSummary', () => {
    it('should summarize added tasks', () => {
      const diff: VersionDiff = {
        added: [createMockTask(), createMockTask()],
        removed: [],
        modified: [],
      }

      const summary = getDiffSummary(diff)
      expect(summary).toContain('2 tasks added')
    })

    it('should summarize removed tasks', () => {
      const diff: VersionDiff = {
        added: [],
        removed: [createMockTask()],
        modified: [],
      }

      const summary = getDiffSummary(diff)
      expect(summary).toContain('1 task removed')
    })

    it('should summarize modified tasks', () => {
      const diff: VersionDiff = {
        added: [],
        removed: [],
        modified: [
          {
            taskId: '1',
            before: createMockTask(),
            after: createMockTask(),
            changes: [],
          },
        ],
      }

      const summary = getDiffSummary(diff)
      expect(summary).toContain('1 task modified')
    })

    it('should summarize multiple change types', () => {
      const diff: VersionDiff = {
        added: [createMockTask()],
        removed: [createMockTask()],
        modified: [
          {
            taskId: '1',
            before: createMockTask(),
            after: createMockTask(),
            changes: [],
          },
        ],
      }

      const summary = getDiffSummary(diff)
      expect(summary).toContain('added')
      expect(summary).toContain('removed')
      expect(summary).toContain('modified')
    })

    it('should return "No changes" for empty diff', () => {
      const diff: VersionDiff = {
        added: [],
        removed: [],
        modified: [],
      }

      const summary = getDiffSummary(diff)
      expect(summary).toBe('No changes')
    })
  })

  describe('calculateChangeCount', () => {
    it('should calculate total change count', () => {
      const diff: VersionDiff = {
        added: [createMockTask(), createMockTask()],
        removed: [createMockTask()],
        modified: [
          {
            taskId: '1',
            before: createMockTask(),
            after: createMockTask(),
            changes: [],
          },
        ],
      }

      const count = calculateChangeCount(diff)
      expect(count).toBe(4)
    })

    it('should return 0 for no changes', () => {
      const diff: VersionDiff = {
        added: [],
        removed: [],
        modified: [],
      }

      const count = calculateChangeCount(diff)
      expect(count).toBe(0)
    })
  })

  describe('formatVersionDate', () => {
    it('should format recent dates as "Just now"', () => {
      const date = new Date()
      const formatted = formatVersionDate(date)
      expect(formatted).toBe('Just now')
    })

    it('should format dates in minutes', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      const formatted = formatVersionDate(date)
      expect(formatted).toMatch(/\d+ minute/)
    })

    it('should format dates in hours', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      const formatted = formatVersionDate(date)
      expect(formatted).toMatch(/\d+ hour/)
    })

    it('should format dates in days', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      const formatted = formatVersionDate(date)
      expect(formatted).toMatch(/\d+ day/)
    })

    it('should format old dates with month and day', () => {
      const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
      const formatted = formatVersionDate(date)
      expect(formatted).toMatch(/[A-Z][a-z]{2} \d+/)
    })
  })

  describe('formatVersionDateTime', () => {
    it('should format date with time', () => {
      const date = new Date('2024-01-15T14:30:00')
      const formatted = formatVersionDateTime(date)
      expect(formatted).toContain('Jan')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })
  })

  describe('generateAutoVersionDescription', () => {
    it('should generate description from diff', () => {
      const diff: VersionDiff = {
        added: [createMockTask(), createMockTask()],
        removed: [],
        modified: [],
      }

      const description = generateAutoVersionDescription(diff)
      expect(description).toContain('Auto-save')
      expect(description).toContain('2 tasks added')
    })
  })

  describe('shouldCreateAutoVersion', () => {
    const config = {
      enabled: true,
      onTaskAdd: true,
      onTaskDelete: true,
      onTaskModify: false,
      minChangeThreshold: 3,
    }

    it('should return false if disabled', () => {
      const diff: VersionDiff = {
        added: [createMockTask(), createMockTask(), createMockTask()],
        removed: [],
        modified: [],
      }

      const result = shouldCreateAutoVersion(diff, { ...config, enabled: false })
      expect(result).toBe(false)
    })

    it('should return false if below threshold', () => {
      const diff: VersionDiff = {
        added: [createMockTask()],
        removed: [],
        modified: [],
      }

      const result = shouldCreateAutoVersion(diff, config)
      expect(result).toBe(false)
    })

    it('should return true for task adds when enabled', () => {
      const diff: VersionDiff = {
        added: [createMockTask(), createMockTask(), createMockTask()],
        removed: [],
        modified: [],
      }

      const result = shouldCreateAutoVersion(diff, config)
      expect(result).toBe(true)
    })

    it('should return false for task adds when disabled', () => {
      const diff: VersionDiff = {
        added: [createMockTask(), createMockTask(), createMockTask()],
        removed: [],
        modified: [],
      }

      const result = shouldCreateAutoVersion(diff, { ...config, onTaskAdd: false })
      expect(result).toBe(false)
    })

    it('should return true for task deletes when enabled', () => {
      const diff: VersionDiff = {
        added: [],
        removed: [createMockTask(), createMockTask(), createMockTask()],
        modified: [],
      }

      const result = shouldCreateAutoVersion(diff, config)
      expect(result).toBe(true)
    })

    it('should return false for task modifies when disabled', () => {
      const diff: VersionDiff = {
        added: [],
        removed: [],
        modified: [
          {
            taskId: '1',
            before: createMockTask(),
            after: createMockTask(),
            changes: [],
          },
          {
            taskId: '2',
            before: createMockTask(),
            after: createMockTask(),
            changes: [],
          },
          {
            taskId: '3',
            before: createMockTask(),
            after: createMockTask(),
            changes: [],
          },
        ],
      }

      const result = shouldCreateAutoVersion(diff, config)
      expect(result).toBe(false)
    })
  })
})
