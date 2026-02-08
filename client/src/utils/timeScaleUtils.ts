/**
 * Time Scale Utilities
 * Utilities for calculating time-based positioning and headers in Gantt charts
 */

import type { Task } from '../types/api'

// ==================== Types ====================

export type TimeScale = 'day' | 'week' | 'sprint' | 'month' | 'quarter'

export interface TimeHeader {
  id: string
  label: string
  startDate: Date
  endDate: Date
  width: number
  level: number // 0 for primary, 1 for secondary headers
  isWeekend?: boolean
  isToday?: boolean
}

export interface TaskPosition {
  left: number // pixels from left
  width: number // width in pixels
  startDate: Date
  endDate: Date
}

export interface VisibleDateRange {
  startDate: Date
  endDate: Date
  totalDays: number
  totalWidth: number
}

export interface GridMetrics {
  columnWidth: number // width of one unit in pixels
  totalColumns: number
  startDate: Date
  endDate: Date
  scale: TimeScale
}

// ==================== Constants ====================

const COLUMN_WIDTHS: Record<TimeScale, number> = {
  day: 40, // pixels per day
  week: 120, // pixels per week
  sprint: 240, // pixels per 2-week sprint
  month: 180, // pixels per month
  quarter: 300, // pixels per quarter
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

// ==================== Date Helper Functions ====================

/**
 * Get the start of a period for a given date
 */
export function getStartOfPeriod(date: Date, scale: TimeScale): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)

  switch (scale) {
    case 'day':
      return result

    case 'week':
      // Start of week (Monday)
      const day = result.getDay()
      const diff = day === 0 ? -6 : 1 - day // Adjust for Sunday (0) or other days
      result.setDate(result.getDate() + diff)
      return result

    case 'sprint':
      // Start of 2-week period (align to epoch)
      const epochStart = new Date(2024, 0, 1) // Jan 1, 2024 (Monday)
      const daysSinceEpoch = Math.floor(
        (result.getTime() - epochStart.getTime()) / MILLISECONDS_PER_DAY
      )
      const sprintNumber = Math.floor(daysSinceEpoch / 14)
      const sprintStart = new Date(epochStart)
      sprintStart.setDate(sprintStart.getDate() + sprintNumber * 14)
      return sprintStart

    case 'month':
      result.setDate(1)
      return result

    case 'quarter':
      const month = result.getMonth()
      const quarterStartMonth = Math.floor(month / 3) * 3
      result.setMonth(quarterStartMonth, 1)
      return result

    default:
      return result
  }
}

/**
 * Get the end of a period for a given date
 */
export function getEndOfPeriod(date: Date, scale: TimeScale): Date {
  const start = getStartOfPeriod(date, scale)
  const result = new Date(start)

  switch (scale) {
    case 'day':
      result.setDate(result.getDate() + 1)
      break

    case 'week':
      result.setDate(result.getDate() + 7)
      break

    case 'sprint':
      result.setDate(result.getDate() + 14)
      break

    case 'month':
      result.setMonth(result.getMonth() + 1)
      break

    case 'quarter':
      result.setMonth(result.getMonth() + 3)
      break
  }

  return result
}

/**
 * Add a period to a date
 */
export function addPeriod(date: Date, count: number, scale: TimeScale): Date {
  const result = new Date(date)

  switch (scale) {
    case 'day':
      result.setDate(result.getDate() + count)
      break

    case 'week':
      result.setDate(result.getDate() + count * 7)
      break

    case 'sprint':
      result.setDate(result.getDate() + count * 14)
      break

    case 'month':
      result.setMonth(result.getMonth() + count)
      break

    case 'quarter':
      result.setMonth(result.getMonth() + count * 3)
      break
  }

  return result
}

/**
 * Format a period label for display
 */
export function formatPeriodLabel(date: Date, scale: TimeScale): string {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const monthNamesFull = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  switch (scale) {
    case 'day':
      return `${monthNames[date.getMonth()]} ${date.getDate()}`

    case 'week': {
      const endOfWeek = new Date(date)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      return `Week of ${monthNames[date.getMonth()]} ${date.getDate()}`
    }

    case 'sprint': {
      const endOfSprint = new Date(date)
      endOfSprint.setDate(endOfSprint.getDate() + 13)
      return `Sprint ${monthNames[date.getMonth()]} ${date.getDate()}`
    }

    case 'month':
      return `${monthNamesFull[date.getMonth()]} ${date.getFullYear()}`

    case 'quarter': {
      const quarter = Math.floor(date.getMonth() / 3) + 1
      return `Q${quarter} ${date.getFullYear()}`
    }

    default:
      return date.toLocaleDateString()
  }
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Calculate the number of days between two dates
 */
export function daysBetween(start: Date, end: Date): number {
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / MILLISECONDS_PER_DAY)
}

// ==================== Main Utility Functions ====================

/**
 * Generate time headers for the Gantt chart
 * Returns a two-level header structure (e.g., months and weeks, or weeks and days)
 */
export function generateTimeHeaders(
  startDate: Date,
  endDate: Date,
  scale: TimeScale
): { primaryHeaders: TimeHeader[]; secondaryHeaders: TimeHeader[] } {
  const primaryHeaders: TimeHeader[] = []
  const secondaryHeaders: TimeHeader[] = []

  const columnWidth = COLUMN_WIDTHS[scale]
  let currentDate = getStartOfPeriod(startDate, scale)
  const end = getEndOfPeriod(endDate, scale)

  // Determine secondary scale (more granular)
  let secondaryScale: TimeScale | null = null
  switch (scale) {
    case 'quarter':
      secondaryScale = 'month'
      break
    case 'month':
      secondaryScale = 'week'
      break
    case 'sprint':
      secondaryScale = 'week'
      break
    case 'week':
      secondaryScale = 'day'
      break
    case 'day':
      secondaryScale = null // No secondary header for day view
      break
  }

  let primaryId = 0
  let secondaryId = 0

  // Generate primary headers
  while (currentDate < end) {
    const periodEnd = getEndOfPeriod(currentDate, scale)
    const days = daysBetween(currentDate, periodEnd)

    primaryHeaders.push({
      id: `primary-${primaryId++}`,
      label: formatPeriodLabel(currentDate, scale),
      startDate: new Date(currentDate),
      endDate: new Date(periodEnd),
      width: columnWidth,
      level: 0,
      isToday: isToday(currentDate),
    })

    currentDate = periodEnd
  }

  // Generate secondary headers if applicable
  if (secondaryScale) {
    currentDate = getStartOfPeriod(startDate, secondaryScale)
    const secondaryColumnWidth = COLUMN_WIDTHS[secondaryScale]

    while (currentDate < end) {
      const periodEnd = getEndOfPeriod(currentDate, secondaryScale)

      secondaryHeaders.push({
        id: `secondary-${secondaryId++}`,
        label: formatPeriodLabel(currentDate, secondaryScale),
        startDate: new Date(currentDate),
        endDate: new Date(periodEnd),
        width: secondaryColumnWidth,
        level: 1,
        isWeekend: scale === 'week' && isWeekend(currentDate),
        isToday: isToday(currentDate),
      })

      currentDate = periodEnd
    }
  }

  return { primaryHeaders, secondaryHeaders }
}

/**
 * Calculate the position and width of a task in pixels
 */
export function calculateTaskPosition(
  task: Task | { startDate: Date; endDate: Date },
  startDate: Date,
  endDate: Date,
  scale: TimeScale,
  containerWidth?: number
): TaskPosition {
  const taskStart = new Date(task.startDate)
  const taskEnd = new Date(task.endDate)
  const rangeStart = getStartOfPeriod(startDate, 'day')
  const rangeEnd = getEndOfPeriod(endDate, 'day')

  // Clamp task dates to visible range
  const clampedStart = taskStart < rangeStart ? rangeStart : taskStart
  const clampedEnd = taskEnd > rangeEnd ? rangeEnd : taskEnd

  // Calculate total days in range
  const totalDays = daysBetween(rangeStart, rangeEnd)

  // Calculate task offset and duration in days
  const offsetDays = daysBetween(rangeStart, clampedStart)
  const durationDays = Math.max(1, daysBetween(clampedStart, clampedEnd))

  // Calculate column width
  const columnWidth = COLUMN_WIDTHS[scale]

  // For day scale, each column is one day
  // For other scales, calculate proportionally
  let pixelsPerDay: number
  switch (scale) {
    case 'day':
      pixelsPerDay = columnWidth
      break
    case 'week':
      pixelsPerDay = columnWidth / 7
      break
    case 'sprint':
      pixelsPerDay = columnWidth / 14
      break
    case 'month':
      // Approximate, varies by month
      pixelsPerDay = columnWidth / 30
      break
    case 'quarter':
      // Approximate
      pixelsPerDay = columnWidth / 90
      break
    default:
      pixelsPerDay = columnWidth
  }

  const left = offsetDays * pixelsPerDay
  const width = durationDays * pixelsPerDay

  return {
    left,
    width: Math.max(width, 20), // Minimum width for visibility
    startDate: clampedStart,
    endDate: clampedEnd,
  }
}

/**
 * Snap a date to the grid based on the current scale
 */
export function snapToGrid(date: Date, scale: TimeScale): Date {
  switch (scale) {
    case 'day':
      // Snap to midnight
      const dayResult = new Date(date)
      dayResult.setHours(0, 0, 0, 0)
      return dayResult

    case 'week':
      // Snap to Monday
      return getStartOfPeriod(date, 'week')

    case 'sprint':
      // Snap to start of 2-week period
      return getStartOfPeriod(date, 'sprint')

    case 'month':
      // Snap to first of month
      return getStartOfPeriod(date, 'month')

    case 'quarter':
      // Snap to first of quarter
      return getStartOfPeriod(date, 'quarter')

    default:
      return date
  }
}

/**
 * Get the optimal visible date range based on scale and center date
 */
export function getVisibleDateRange(
  scale: TimeScale,
  centerDate: Date = new Date(),
  options?: {
    minColumns?: number
    maxColumns?: number
    tasks?: Task[]
  }
): VisibleDateRange {
  const {
    minColumns = 10,
    maxColumns = 60,
    tasks = [],
  } = options || {}

  let numColumns: number

  // Determine number of columns to show based on scale
  switch (scale) {
    case 'day':
      numColumns = 30 // Show 30 days
      break
    case 'week':
      numColumns = 12 // Show 12 weeks (3 months)
      break
    case 'sprint':
      numColumns = 8 // Show 8 sprints (4 months)
      break
    case 'month':
      numColumns = 12 // Show 12 months (1 year)
      break
    case 'quarter':
      numColumns = 8 // Show 8 quarters (2 years)
      break
    default:
      numColumns = 20
  }

  // Clamp to min/max
  numColumns = Math.max(minColumns, Math.min(maxColumns, numColumns))

  // If tasks are provided, expand range to include all tasks
  if (tasks.length > 0) {
    const taskDates = tasks.flatMap((task) => [
      new Date(task.startDate),
      new Date(task.endDate),
    ])
    const minTaskDate = new Date(Math.min(...taskDates.map((d) => d.getTime())))
    const maxTaskDate = new Date(Math.max(...taskDates.map((d) => d.getTime())))

    // Start a bit before the earliest task
    const startDate = getStartOfPeriod(
      addPeriod(minTaskDate, -2, scale),
      scale
    )

    // End a bit after the latest task
    const endDate = getEndOfPeriod(
      addPeriod(maxTaskDate, 2, scale),
      scale
    )

    const totalDays = daysBetween(startDate, endDate)
    const totalWidth = totalDays * (COLUMN_WIDTHS[scale] / getDaysPerColumn(scale))

    return {
      startDate,
      endDate,
      totalDays,
      totalWidth,
    }
  }

  // Center the range around the center date
  const columnsBeforeCenter = Math.floor(numColumns / 2)
  const columnsAfterCenter = Math.ceil(numColumns / 2)

  const startDate = getStartOfPeriod(
    addPeriod(centerDate, -columnsBeforeCenter, scale),
    scale
  )

  const endDate = getEndOfPeriod(
    addPeriod(startDate, numColumns, scale),
    scale
  )

  const totalDays = daysBetween(startDate, endDate)
  const totalWidth = numColumns * COLUMN_WIDTHS[scale]

  return {
    startDate,
    endDate,
    totalDays,
    totalWidth,
  }
}

/**
 * Get the number of days per column for a given scale
 */
function getDaysPerColumn(scale: TimeScale): number {
  switch (scale) {
    case 'day':
      return 1
    case 'week':
      return 7
    case 'sprint':
      return 14
    case 'month':
      return 30 // Approximate
    case 'quarter':
      return 90 // Approximate
    default:
      return 1
  }
}

/**
 * Calculate the pixel position for a specific date
 */
export function getDatePosition(
  date: Date,
  startDate: Date,
  endDate: Date,
  scale: TimeScale
): number {
  const rangeStart = getStartOfPeriod(startDate, 'day')
  const offsetDays = daysBetween(rangeStart, new Date(date))

  const pixelsPerDay = COLUMN_WIDTHS[scale] / getDaysPerColumn(scale)
  return offsetDays * pixelsPerDay
}

/**
 * Calculate the date at a specific pixel position
 */
export function getDateAtPosition(
  pixelX: number,
  startDate: Date,
  scale: TimeScale
): Date {
  const pixelsPerDay = COLUMN_WIDTHS[scale] / getDaysPerColumn(scale)
  const days = Math.floor(pixelX / pixelsPerDay)

  const result = new Date(startDate)
  result.setDate(result.getDate() + days)
  return snapToGrid(result, scale)
}

/**
 * Calculate grid metrics for the entire timeline
 */
export function calculateGridMetrics(
  startDate: Date,
  endDate: Date,
  scale: TimeScale
): GridMetrics {
  const rangeStart = getStartOfPeriod(startDate, scale)
  const rangeEnd = getEndOfPeriod(endDate, scale)

  let currentDate = new Date(rangeStart)
  let columnCount = 0

  while (currentDate < rangeEnd) {
    columnCount++
    currentDate = getEndOfPeriod(currentDate, scale)
  }

  return {
    columnWidth: COLUMN_WIDTHS[scale],
    totalColumns: columnCount,
    startDate: rangeStart,
    endDate: rangeEnd,
    scale,
  }
}

/**
 * Check if two date ranges overlap
 */
export function dateRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 <= end2 && start2 <= end1
}

/**
 * Get the column index for a date
 */
export function getColumnIndex(
  date: Date,
  startDate: Date,
  scale: TimeScale
): number {
  const rangeStart = getStartOfPeriod(startDate, scale)
  const targetDate = getStartOfPeriod(date, scale)

  let currentDate = new Date(rangeStart)
  let index = 0

  while (currentDate < targetDate) {
    index++
    currentDate = getEndOfPeriod(currentDate, scale)
  }

  return index
}

/**
 * Format a date range for display
 */
export function formatDateRange(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()

  if (sameMonth) {
    return `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} - ${end.toLocaleDateString('en-US', {
      day: 'numeric',
      year: 'numeric',
    })}`
  }

  if (sameYear) {
    return `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} - ${end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`
  }

  return `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} - ${end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`
}

/**
 * Get the width in pixels for a date range
 */
export function getDateRangeWidth(
  start: Date,
  end: Date,
  scale: TimeScale
): number {
  const days = daysBetween(start, end)
  const pixelsPerDay = COLUMN_WIDTHS[scale] / getDaysPerColumn(scale)
  return days * pixelsPerDay
}

/**
 * Auto-scroll to today's date
 */
export function getScrollPositionForToday(
  startDate: Date,
  scale: TimeScale,
  containerWidth: number
): number {
  const today = new Date()
  const position = getDatePosition(today, startDate, new Date(), scale)

  // Center today in the viewport
  return Math.max(0, position - containerWidth / 2)
}
