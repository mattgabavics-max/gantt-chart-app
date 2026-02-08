/**
 * Time Scale Utilities Tests
 */

import {
  getStartOfPeriod,
  getEndOfPeriod,
  addPeriod,
  formatPeriodLabel,
  isWeekend,
  isToday,
  daysBetween,
  generateTimeHeaders,
  calculateTaskPosition,
  snapToGrid,
  getVisibleDateRange,
  getDatePosition,
  getDateAtPosition,
  calculateGridMetrics,
  dateRangesOverlap,
  getColumnIndex,
  formatDateRange,
  getDateRangeWidth,
  type TimeScale,
} from './timeScaleUtils'
import type { Task } from '../types/api'

describe('timeScaleUtils', () => {
  describe('getStartOfPeriod', () => {
    it('should get start of day', () => {
      const date = new Date('2024-06-15T14:30:00')
      const result = getStartOfPeriod(date, 'day')
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
    })

    it('should get start of week (Monday)', () => {
      const thursday = new Date('2024-06-13') // Thursday
      const result = getStartOfPeriod(thursday, 'week')
      expect(result.getDay()).toBe(1) // Monday
      expect(result.getDate()).toBe(10) // June 10, 2024 is a Monday
    })

    it('should get start of month', () => {
      const date = new Date('2024-06-15')
      const result = getStartOfPeriod(date, 'month')
      expect(result.getDate()).toBe(1)
      expect(result.getMonth()).toBe(5) // June
    })

    it('should get start of quarter', () => {
      const date = new Date('2024-05-15')
      const result = getStartOfPeriod(date, 'quarter')
      expect(result.getMonth()).toBe(3) // April (Q2 starts in April)
      expect(result.getDate()).toBe(1)
    })

    it('should get start of sprint (2-week period)', () => {
      const date = new Date('2024-06-15')
      const result = getStartOfPeriod(date, 'sprint')
      // Should align to 2-week boundaries from epoch
      expect(result.getDay()).toBe(1) // Should be a Monday
    })
  })

  describe('getEndOfPeriod', () => {
    it('should get end of day', () => {
      const date = new Date('2024-06-15')
      const result = getEndOfPeriod(date, 'day')
      expect(result.getDate()).toBe(16)
    })

    it('should get end of week', () => {
      const monday = new Date('2024-06-10')
      const result = getEndOfPeriod(monday, 'week')
      expect(result.getDate()).toBe(17) // Next Monday
    })

    it('should get end of month', () => {
      const date = new Date('2024-06-15')
      const result = getEndOfPeriod(date, 'month')
      expect(result.getMonth()).toBe(6) // July
      expect(result.getDate()).toBe(1)
    })

    it('should handle February in leap year', () => {
      const date = new Date('2024-02-15')
      const result = getEndOfPeriod(date, 'month')
      expect(result.getMonth()).toBe(2) // March
      expect(result.getDate()).toBe(1)
    })
  })

  describe('addPeriod', () => {
    it('should add days', () => {
      const date = new Date('2024-06-15')
      const result = addPeriod(date, 5, 'day')
      expect(result.getDate()).toBe(20)
    })

    it('should add weeks', () => {
      const date = new Date('2024-06-10')
      const result = addPeriod(date, 2, 'week')
      expect(result.getDate()).toBe(24)
    })

    it('should add months', () => {
      const date = new Date('2024-06-15')
      const result = addPeriod(date, 3, 'month')
      expect(result.getMonth()).toBe(8) // September
    })

    it('should add sprints (2-week periods)', () => {
      const date = new Date('2024-06-10')
      const result = addPeriod(date, 1, 'sprint')
      expect(result.getDate()).toBe(24)
    })

    it('should add quarters', () => {
      const date = new Date('2024-06-15')
      const result = addPeriod(date, 1, 'quarter')
      expect(result.getMonth()).toBe(8) // September
    })

    it('should handle negative values', () => {
      const date = new Date('2024-06-15')
      const result = addPeriod(date, -5, 'day')
      expect(result.getDate()).toBe(10)
    })
  })

  describe('formatPeriodLabel', () => {
    it('should format day label', () => {
      const date = new Date('2024-06-15')
      const result = formatPeriodLabel(date, 'day')
      expect(result).toBe('Jun 15')
    })

    it('should format week label', () => {
      const date = new Date('2024-06-10')
      const result = formatPeriodLabel(date, 'week')
      expect(result).toContain('Week of')
      expect(result).toContain('Jun')
    })

    it('should format month label', () => {
      const date = new Date('2024-06-15')
      const result = formatPeriodLabel(date, 'month')
      expect(result).toBe('June 2024')
    })

    it('should format quarter label', () => {
      const date = new Date('2024-06-15')
      const result = formatPeriodLabel(date, 'quarter')
      expect(result).toBe('Q2 2024')
    })
  })

  describe('isWeekend', () => {
    it('should return true for Saturday', () => {
      const saturday = new Date('2024-06-15') // Saturday
      expect(isWeekend(saturday)).toBe(true)
    })

    it('should return true for Sunday', () => {
      const sunday = new Date('2024-06-16') // Sunday
      expect(isWeekend(sunday)).toBe(true)
    })

    it('should return false for weekdays', () => {
      const monday = new Date('2024-06-10') // Monday
      expect(isWeekend(monday)).toBe(false)
    })
  })

  describe('daysBetween', () => {
    it('should calculate days between dates', () => {
      const start = new Date('2024-06-10')
      const end = new Date('2024-06-15')
      expect(daysBetween(start, end)).toBe(5)
    })

    it('should handle same day', () => {
      const date = new Date('2024-06-10')
      expect(daysBetween(date, date)).toBe(0)
    })

    it('should handle negative range', () => {
      const start = new Date('2024-06-15')
      const end = new Date('2024-06-10')
      expect(daysBetween(start, end)).toBe(-5)
    })
  })

  describe('generateTimeHeaders', () => {
    it('should generate day headers', () => {
      const start = new Date('2024-06-10')
      const end = new Date('2024-06-15')
      const { primaryHeaders, secondaryHeaders } = generateTimeHeaders(
        start,
        end,
        'day'
      )

      expect(primaryHeaders.length).toBeGreaterThan(0)
      expect(secondaryHeaders.length).toBe(0) // No secondary for day scale
    })

    it('should generate week headers with day sub-headers', () => {
      const start = new Date('2024-06-01')
      const end = new Date('2024-06-30')
      const { primaryHeaders, secondaryHeaders } = generateTimeHeaders(
        start,
        end,
        'week'
      )

      expect(primaryHeaders.length).toBeGreaterThan(0)
      expect(secondaryHeaders.length).toBeGreaterThan(0)
      expect(secondaryHeaders.length).toBeGreaterThan(primaryHeaders.length)
    })

    it('should generate month headers with week sub-headers', () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-06-30')
      const { primaryHeaders, secondaryHeaders } = generateTimeHeaders(
        start,
        end,
        'month'
      )

      expect(primaryHeaders.length).toBe(6) // 6 months
      expect(secondaryHeaders.length).toBeGreaterThan(primaryHeaders.length)
    })

    it('should mark weekends in secondary headers', () => {
      const start = new Date('2024-06-10') // Monday
      const end = new Date('2024-06-17')
      const { secondaryHeaders } = generateTimeHeaders(start, end, 'week')

      const weekendHeaders = secondaryHeaders.filter((h) => h.isWeekend)
      expect(weekendHeaders.length).toBeGreaterThan(0)
    })

    it('should mark today', () => {
      const today = new Date()
      const start = addPeriod(today, -7, 'day')
      const end = addPeriod(today, 7, 'day')
      const { primaryHeaders } = generateTimeHeaders(start, end, 'day')

      const todayHeader = primaryHeaders.find((h) => h.isToday)
      expect(todayHeader).toBeDefined()
    })
  })

  describe('calculateTaskPosition', () => {
    const mockTask: Partial<Task> = {
      startDate: new Date('2024-06-10'),
      endDate: new Date('2024-06-15'),
    }

    it('should calculate position for day scale', () => {
      const start = new Date('2024-06-01')
      const end = new Date('2024-06-30')

      const position = calculateTaskPosition(
        mockTask as Task,
        start,
        end,
        'day'
      )

      expect(position.left).toBeGreaterThan(0)
      expect(position.width).toBeGreaterThan(0)
    })

    it('should clamp task to visible range', () => {
      const task = {
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-07-31'),
      }
      const start = new Date('2024-06-01')
      const end = new Date('2024-06-30')

      const position = calculateTaskPosition(task, start, end, 'day')

      expect(position.startDate.getTime()).toBeGreaterThanOrEqual(
        start.getTime()
      )
      expect(position.endDate.getTime()).toBeLessThanOrEqual(
        end.getTime()
      )
    })

    it('should respect minimum width', () => {
      const task = {
        startDate: new Date('2024-06-10T00:00:00'),
        endDate: new Date('2024-06-10T06:00:00'), // 6 hours
      }
      const start = new Date('2024-06-01')
      const end = new Date('2024-06-30')

      const position = calculateTaskPosition(task, start, end, 'day')

      expect(position.width).toBeGreaterThanOrEqual(20) // Minimum width
    })
  })

  describe('snapToGrid', () => {
    it('should snap to day boundary', () => {
      const date = new Date('2024-06-15T14:30:00')
      const result = snapToGrid(date, 'day')

      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
    })

    it('should snap to week boundary (Monday)', () => {
      const thursday = new Date('2024-06-13')
      const result = snapToGrid(thursday, 'week')

      expect(result.getDay()).toBe(1) // Monday
    })

    it('should snap to month boundary', () => {
      const date = new Date('2024-06-15')
      const result = snapToGrid(date, 'month')

      expect(result.getDate()).toBe(1)
      expect(result.getMonth()).toBe(5) // June
    })

    it('should snap to quarter boundary', () => {
      const date = new Date('2024-05-15')
      const result = snapToGrid(date, 'quarter')

      expect(result.getMonth()).toBe(3) // April (Q2 starts)
      expect(result.getDate()).toBe(1)
    })
  })

  describe('getVisibleDateRange', () => {
    it('should return range centered on today by default', () => {
      const today = new Date()
      const range = getVisibleDateRange('day')

      expect(range.startDate.getTime()).toBeLessThan(today.getTime())
      expect(range.endDate.getTime()).toBeGreaterThan(today.getTime())
    })

    it('should return range centered on custom date', () => {
      const centerDate = new Date('2024-06-15')
      const range = getVisibleDateRange('day', centerDate)

      expect(range.startDate.getTime()).toBeLessThan(centerDate.getTime())
      expect(range.endDate.getTime()).toBeGreaterThan(centerDate.getTime())
    })

    it('should expand range to include tasks', () => {
      const tasks: Partial<Task>[] = [
        {
          id: '1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-10'),
        } as Task,
        {
          id: '2',
          startDate: new Date('2024-12-20'),
          endDate: new Date('2024-12-31'),
        } as Task,
      ]

      const range = getVisibleDateRange('day', new Date('2024-06-15'), {
        tasks: tasks as Task[],
      })

      expect(range.startDate.getFullYear()).toBe(2024)
      expect(range.startDate.getMonth()).toBeLessThanOrEqual(0) // Before January
      expect(range.endDate.getFullYear()).toBe(2024)
      expect(range.endDate.getMonth()).toBeGreaterThanOrEqual(11) // After December
    })

    it('should respect min and max columns', () => {
      const range = getVisibleDateRange('day', new Date('2024-06-15'), {
        minColumns: 50,
        maxColumns: 100,
      })

      expect(range.totalDays).toBeGreaterThanOrEqual(50)
      expect(range.totalDays).toBeLessThanOrEqual(100)
    })
  })

  describe('getDatePosition', () => {
    it('should calculate position for date within range', () => {
      const start = new Date('2024-06-01')
      const end = new Date('2024-06-30')
      const target = new Date('2024-06-15')

      const position = getDatePosition(target, start, end, 'day')

      expect(position).toBeGreaterThan(0)
    })

    it('should return 0 for date at start', () => {
      const start = new Date('2024-06-01')
      const end = new Date('2024-06-30')

      const position = getDatePosition(start, start, end, 'day')

      expect(position).toBe(0)
    })
  })

  describe('getDateAtPosition', () => {
    it('should get date at pixel position', () => {
      const start = new Date('2024-06-01')
      const position = 40 // 1 day at 40px/day

      const result = getDateAtPosition(position, start, 'day')

      expect(result.getDate()).toBe(2) // June 2
    })

    it('should snap result to grid', () => {
      const start = new Date('2024-06-01')
      const position = 45 // Between days

      const result = getDateAtPosition(position, start, 'day')

      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
    })
  })

  describe('calculateGridMetrics', () => {
    it('should calculate metrics for date range', () => {
      const start = new Date('2024-06-01')
      const end = new Date('2024-06-30')

      const metrics = calculateGridMetrics(start, end, 'day')

      expect(metrics.columnWidth).toBe(40) // Day column width
      expect(metrics.totalColumns).toBeGreaterThan(0)
      expect(metrics.scale).toBe('day')
    })

    it('should align to scale boundaries', () => {
      const start = new Date('2024-06-15')
      const end = new Date('2024-06-25')

      const metrics = calculateGridMetrics(start, end, 'week')

      expect(metrics.startDate.getDay()).toBe(1) // Monday
    })
  })

  describe('dateRangesOverlap', () => {
    it('should detect overlapping ranges', () => {
      const start1 = new Date('2024-06-10')
      const end1 = new Date('2024-06-15')
      const start2 = new Date('2024-06-12')
      const end2 = new Date('2024-06-20')

      expect(dateRangesOverlap(start1, end1, start2, end2)).toBe(true)
    })

    it('should detect non-overlapping ranges', () => {
      const start1 = new Date('2024-06-01')
      const end1 = new Date('2024-06-10')
      const start2 = new Date('2024-06-15')
      const end2 = new Date('2024-06-20')

      expect(dateRangesOverlap(start1, end1, start2, end2)).toBe(false)
    })

    it('should detect touching ranges', () => {
      const start1 = new Date('2024-06-01')
      const end1 = new Date('2024-06-10')
      const start2 = new Date('2024-06-10')
      const end2 = new Date('2024-06-20')

      expect(dateRangesOverlap(start1, end1, start2, end2)).toBe(true)
    })
  })

  describe('getColumnIndex', () => {
    it('should get column index for date', () => {
      const start = new Date('2024-06-01')
      const target = new Date('2024-06-05')

      const index = getColumnIndex(target, start, 'day')

      expect(index).toBe(4) // 4 days from start
    })

    it('should return 0 for start date', () => {
      const start = new Date('2024-06-01')

      const index = getColumnIndex(start, start, 'day')

      expect(index).toBe(0)
    })
  })

  describe('formatDateRange', () => {
    it('should format range in same month', () => {
      const start = new Date('2024-06-10')
      const end = new Date('2024-06-15')

      const result = formatDateRange(start, end)

      expect(result).toContain('Jun')
      expect(result).toContain('10')
      expect(result).toContain('15')
    })

    it('should format range in same year', () => {
      const start = new Date('2024-06-10')
      const end = new Date('2024-08-15')

      const result = formatDateRange(start, end)

      expect(result).toContain('Jun')
      expect(result).toContain('Aug')
      expect(result).toContain('2024')
    })

    it('should format range across years', () => {
      const start = new Date('2024-12-10')
      const end = new Date('2025-01-15')

      const result = formatDateRange(start, end)

      expect(result).toContain('2024')
      expect(result).toContain('2025')
    })
  })

  describe('getDateRangeWidth', () => {
    it('should calculate width for date range', () => {
      const start = new Date('2024-06-10')
      const end = new Date('2024-06-15')

      const width = getDateRangeWidth(start, end, 'day')

      expect(width).toBe(200) // 5 days * 40px/day
    })

    it('should handle different scales', () => {
      const start = new Date('2024-06-01')
      const end = new Date('2024-06-08')

      const widthDay = getDateRangeWidth(start, end, 'day')
      const widthWeek = getDateRangeWidth(start, end, 'week')

      expect(widthDay).toBeGreaterThan(0)
      expect(widthWeek).toBeGreaterThan(0)
    })
  })
})
