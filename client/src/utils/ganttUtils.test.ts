/**
 * Unit Tests for Gantt Utils
 */

import {
  getStartOfPeriod,
  getEndOfPeriod,
  addPeriod,
  getColumnWidth,
  formatPeriodLabel,
  calculateGridMetrics,
  getDatePosition,
  snapToGrid,
} from './ganttUtils'
import { Task, TimeScale } from '../types/gantt'

describe('ganttUtils', () => {
  describe('getStartOfPeriod', () => {
    it('should get start of day', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = getStartOfPeriod(date, 'day')
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
    })

    it('should get start of week (Monday)', () => {
      const date = new Date('2024-01-17') // Wednesday
      const result = getStartOfPeriod(date, 'week')
      expect(result.getDay()).toBe(1) // Monday
      expect(result.getDate()).toBe(15)
    })

    it('should get start of month', () => {
      const date = new Date('2024-01-15')
      const result = getStartOfPeriod(date, 'month')
      expect(result.getDate()).toBe(1)
      expect(result.getMonth()).toBe(0) // January
    })

    it('should get start of quarter', () => {
      const date = new Date('2024-05-15') // Q2
      const result = getStartOfPeriod(date, 'quarter')
      expect(result.getMonth()).toBe(3) // April (start of Q2)
      expect(result.getDate()).toBe(1)
    })

    it('should get start of sprint (2-week period)', () => {
      const date = new Date('2024-01-15')
      const result = getStartOfPeriod(date, 'sprint')
      expect(result.getDay()).toBe(1) // Should be a Monday
    })
  })

  describe('getEndOfPeriod', () => {
    it('should get end of day', () => {
      const date = new Date('2024-01-15T10:00:00')
      const result = getEndOfPeriod(date, 'day')
      expect(result.getHours()).toBe(23)
      expect(result.getMinutes()).toBe(59)
      expect(result.getSeconds()).toBe(59)
    })

    it('should get end of week (Sunday)', () => {
      const date = new Date('2024-01-17') // Wednesday
      const result = getEndOfPeriod(date, 'week')
      expect(result.getDay()).toBe(0) // Sunday
    })

    it('should get end of month', () => {
      const date = new Date('2024-01-15')
      const result = getEndOfPeriod(date, 'month')
      expect(result.getDate()).toBe(31) // January has 31 days
      expect(result.getMonth()).toBe(0)
    })

    it('should handle February in leap year', () => {
      const date = new Date('2024-02-15')
      const result = getEndOfPeriod(date, 'month')
      expect(result.getDate()).toBe(29) // 2024 is leap year
    })
  })

  describe('addPeriod', () => {
    it('should add days', () => {
      const date = new Date('2024-01-15')
      const result = addPeriod(date, 5, 'day')
      expect(result.getDate()).toBe(20)
    })

    it('should add weeks', () => {
      const date = new Date('2024-01-15')
      const result = addPeriod(date, 2, 'week')
      expect(result.getDate()).toBe(29)
    })

    it('should add months', () => {
      const date = new Date('2024-01-15')
      const result = addPeriod(date, 3, 'month')
      expect(result.getMonth()).toBe(3) // April
    })

    it('should add sprints (2-week periods)', () => {
      const date = new Date('2024-01-15')
      const result = addPeriod(date, 1, 'sprint')
      expect(result.getDate()).toBe(29) // 14 days later
    })

    it('should add quarters', () => {
      const date = new Date('2024-01-15')
      const result = addPeriod(date, 1, 'quarter')
      expect(result.getMonth()).toBe(3) // April
    })
  })

  describe('getColumnWidth', () => {
    it('should return correct width for day', () => {
      expect(getColumnWidth('day')).toBe(40)
    })

    it('should return correct width for week', () => {
      expect(getColumnWidth('week')).toBe(80)
    })

    it('should return correct width for sprint', () => {
      expect(getColumnWidth('sprint')).toBe(120)
    })

    it('should return correct width for month', () => {
      expect(getColumnWidth('month')).toBe(100)
    })

    it('should return correct width for quarter', () => {
      expect(getColumnWidth('quarter')).toBe(150)
    })
  })

  describe('formatPeriodLabel', () => {
    it('should format day label', () => {
      const date = new Date('2024-01-15')
      const result = formatPeriodLabel(date, 'day')
      expect(result).toMatch(/15/) // Should include day number
    })

    it('should format week label', () => {
      const date = new Date('2024-01-15')
      const result = formatPeriodLabel(date, 'week')
      expect(result).toMatch(/Jan/) // Should include month
    })

    it('should format month label', () => {
      const date = new Date('2024-01-15')
      const result = formatPeriodLabel(date, 'month')
      expect(result).toBe('Jan')
    })

    it('should format quarter label', () => {
      const date = new Date('2024-04-15')
      const result = formatPeriodLabel(date, 'quarter')
      expect(result).toBe('Q2')
    })
  })

  describe('calculateGridMetrics', () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        name: 'Task 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-15'),
        color: '#3b82f6',
        position: 0,
        projectId: 'p1',
      },
      {
        id: '2',
        name: 'Task 2',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-31'),
        color: '#10b981',
        position: 1,
        projectId: 'p1',
      },
    ]

    it('should calculate grid metrics for day scale', () => {
      const metrics = calculateGridMetrics(mockTasks, 'day')
      expect(metrics.columnWidth).toBe(40)
      expect(metrics.columns.length).toBeGreaterThan(0)
      expect(metrics.totalWidth).toBeGreaterThan(0)
    })

    it('should calculate grid metrics for week scale', () => {
      const metrics = calculateGridMetrics(mockTasks, 'week')
      expect(metrics.columnWidth).toBe(80)
      expect(metrics.columns.length).toBeGreaterThan(0)
    })

    it('should use minDate if provided', () => {
      const minDate = new Date('2023-12-01')
      const metrics = calculateGridMetrics(mockTasks, 'day', minDate)
      expect(metrics.startDate.getTime()).toBeLessThanOrEqual(minDate.getTime())
    })

    it('should use maxDate if provided', () => {
      const maxDate = new Date('2024-02-28')
      const metrics = calculateGridMetrics(mockTasks, 'day', undefined, maxDate)
      expect(metrics.endDate.getTime()).toBeGreaterThanOrEqual(maxDate.getTime())
    })

    it('should handle empty task list', () => {
      const metrics = calculateGridMetrics([], 'day')
      expect(metrics.columns.length).toBeGreaterThan(0)
      expect(metrics.totalWidth).toBeGreaterThan(0)
    })
  })

  describe('getDatePosition', () => {
    const mockMetrics = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      columnWidth: 40,
      columns: [],
      totalWidth: 1240,
    }

    it('should calculate position for date within range', () => {
      const date = new Date('2024-01-15')
      const position = getDatePosition(date, mockMetrics, 'day')
      expect(position).toBeGreaterThan(0)
      expect(position).toBeLessThan(mockMetrics.totalWidth)
    })

    it('should return 0 for date before start', () => {
      const date = new Date('2023-12-15')
      const position = getDatePosition(date, mockMetrics, 'day')
      expect(position).toBe(0)
    })

    it('should return totalWidth for date after end', () => {
      const date = new Date('2024-02-15')
      const position = getDatePosition(date, mockMetrics, 'day')
      expect(position).toBe(mockMetrics.totalWidth)
    })
  })

  describe('snapToGrid', () => {
    it('should snap to nearest day', () => {
      const date = new Date('2024-01-15T14:00:00')
      const snapped = snapToGrid(date, 'day')
      expect(snapped.getHours()).toBe(0)
    })

    it('should snap to nearest week start', () => {
      const date = new Date('2024-01-17') // Wednesday
      const snapped = snapToGrid(date, 'week')
      expect(snapped.getDay()).toBe(1) // Monday
    })

    it('should snap to nearest month start', () => {
      const date = new Date('2024-01-15')
      const snapped = snapToGrid(date, 'month')
      expect(snapped.getDate()).toBe(1)
    })
  })
})
