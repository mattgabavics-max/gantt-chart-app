/**
 * Gantt Chart Utility Functions
 */

import { TimeScale, TimelineColumn, GridMetrics, Task } from '../types/gantt'

/**
 * Get the start of a period based on time scale
 */
export function getStartOfPeriod(date: Date, scale: TimeScale): Date {
  const d = new Date(date)

  switch (scale) {
    case 'day':
      d.setHours(0, 0, 0, 0)
      return d

    case 'week':
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
      d.setDate(diff)
      d.setHours(0, 0, 0, 0)
      return d

    case 'sprint': // 2-week sprint
      const weekStart = getStartOfPeriod(d, 'week')
      const weekNumber = getWeekNumber(weekStart)
      const isEvenWeek = weekNumber % 2 === 0
      if (isEvenWeek) {
        weekStart.setDate(weekStart.getDate() - 7)
      }
      return weekStart

    case 'month':
      d.setDate(1)
      d.setHours(0, 0, 0, 0)
      return d

    case 'quarter':
      const month = d.getMonth()
      const quarterStartMonth = Math.floor(month / 3) * 3
      d.setMonth(quarterStartMonth)
      d.setDate(1)
      d.setHours(0, 0, 0, 0)
      return d
  }
}

/**
 * Get the end of a period based on time scale
 */
export function getEndOfPeriod(date: Date, scale: TimeScale): Date {
  const d = new Date(date)

  switch (scale) {
    case 'day':
      d.setHours(23, 59, 59, 999)
      return d

    case 'week':
      const weekStart = getStartOfPeriod(d, 'week')
      weekStart.setDate(weekStart.getDate() + 6)
      weekStart.setHours(23, 59, 59, 999)
      return weekStart

    case 'sprint':
      const sprintStart = getStartOfPeriod(d, 'sprint')
      sprintStart.setDate(sprintStart.getDate() + 13)
      sprintStart.setHours(23, 59, 59, 999)
      return sprintStart

    case 'month':
      d.setMonth(d.getMonth() + 1)
      d.setDate(0)
      d.setHours(23, 59, 59, 999)
      return d

    case 'quarter':
      const quarterStart = getStartOfPeriod(d, 'quarter')
      quarterStart.setMonth(quarterStart.getMonth() + 3)
      quarterStart.setDate(0)
      quarterStart.setHours(23, 59, 59, 999)
      return quarterStart
  }
}

/**
 * Add periods to a date
 */
export function addPeriods(date: Date, count: number, scale: TimeScale): Date {
  const d = new Date(date)

  switch (scale) {
    case 'day':
      d.setDate(d.getDate() + count)
      return d

    case 'week':
      d.setDate(d.getDate() + (count * 7))
      return d

    case 'sprint':
      d.setDate(d.getDate() + (count * 14))
      return d

    case 'month':
      d.setMonth(d.getMonth() + count)
      return d

    case 'quarter':
      d.setMonth(d.getMonth() + (count * 3))
      return d
  }
}

/**
 * Get week number of the year
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
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
 * Format date for display based on time scale
 */
export function formatDateForScale(date: Date, scale: TimeScale): string {
  const options: Intl.DateTimeFormatOptions = {}

  switch (scale) {
    case 'day':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    case 'week':
      const weekNum = getWeekNumber(date)
      return `W${weekNum}`

    case 'sprint':
      const sprintNum = Math.floor(getWeekNumber(date) / 2) + 1
      return `S${sprintNum}`

    case 'month':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    case 'quarter':
      const quarter = Math.floor(date.getMonth() / 3) + 1
      return `Q${quarter} ${date.getFullYear()}`
  }
}

/**
 * Get column width in pixels based on time scale
 */
export function getColumnWidth(scale: TimeScale): number {
  switch (scale) {
    case 'day':
      return 40
    case 'week':
      return 80
    case 'sprint':
      return 120
    case 'month':
      return 100
    case 'quarter':
      return 150
  }
}

/**
 * Calculate the date range for all tasks
 */
export function getTasksDateRange(tasks: Task[]): { startDate: Date; endDate: Date } {
  if (tasks.length === 0) {
    const today = new Date()
    return {
      startDate: today,
      endDate: addPeriods(today, 30, 'day'),
    }
  }

  let minDate = new Date(tasks[0].startDate)
  let maxDate = new Date(tasks[0].endDate)

  tasks.forEach(task => {
    const taskStart = new Date(task.startDate)
    const taskEnd = new Date(task.endDate)

    if (taskStart < minDate) minDate = taskStart
    if (taskEnd > maxDate) maxDate = taskEnd
  })

  // Add padding
  minDate = addPeriods(minDate, -1, 'week')
  maxDate = addPeriods(maxDate, 2, 'week')

  return { startDate: minDate, endDate: maxDate }
}

/**
 * Generate timeline columns based on date range and time scale
 */
export function generateTimelineColumns(
  startDate: Date,
  endDate: Date,
  scale: TimeScale
): TimelineColumn[] {
  const columns: TimelineColumn[] = []
  let currentDate = getStartOfPeriod(startDate, scale)
  const end = getEndOfPeriod(endDate, scale)
  const columnWidth = getColumnWidth(scale)

  while (currentDate <= end) {
    columns.push({
      date: new Date(currentDate),
      label: formatDateForScale(currentDate, scale),
      isWeekend: isWeekend(currentDate),
      isToday: isToday(currentDate),
      width: columnWidth,
    })

    currentDate = addPeriods(currentDate, 1, scale)
  }

  return columns
}

/**
 * Calculate grid metrics for the Gantt chart
 */
export function calculateGridMetrics(
  tasks: Task[],
  scale: TimeScale,
  minDate?: Date,
  maxDate?: Date
): GridMetrics {
  const dateRange = getTasksDateRange(tasks)
  const startDate = minDate || dateRange.startDate
  const endDate = maxDate || dateRange.endDate

  const columns = generateTimelineColumns(startDate, endDate, scale)
  const columnWidth = getColumnWidth(scale)
  const totalWidth = columns.length * columnWidth

  return {
    columnWidth,
    columns,
    totalWidth,
    startDate,
    endDate,
  }
}

/**
 * Calculate task bar position and width
 */
export function calculateTaskBarMetrics(
  task: Task,
  gridMetrics: GridMetrics,
  scale: TimeScale
): { left: number; width: number } {
  const { startDate: gridStart, columnWidth } = gridMetrics
  const taskStart = new Date(task.startDate)
  const taskEnd = new Date(task.endDate)

  // Calculate position based on time scale
  let left = 0
  let width = 0

  switch (scale) {
    case 'day': {
      const daysFromStart = Math.floor((taskStart.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24))
      const taskDuration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24))
      left = daysFromStart * columnWidth
      width = Math.max(taskDuration * columnWidth, columnWidth * 0.5)
      break
    }

    case 'week': {
      const weeksFromStart = Math.floor((taskStart.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24 * 7))
      const taskDuration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24 * 7))
      left = weeksFromStart * columnWidth
      width = Math.max(taskDuration * columnWidth, columnWidth * 0.5)
      break
    }

    case 'sprint': {
      const daysFromStart = Math.floor((taskStart.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24))
      const sprintsFromStart = Math.floor(daysFromStart / 14)
      const taskDays = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24))
      const taskSprints = Math.ceil(taskDays / 14)
      left = sprintsFromStart * columnWidth
      width = Math.max(taskSprints * columnWidth, columnWidth * 0.5)
      break
    }

    case 'month': {
      const monthsFromStart = (taskStart.getFullYear() - gridStart.getFullYear()) * 12 +
        (taskStart.getMonth() - gridStart.getMonth())
      const taskMonths = (taskEnd.getFullYear() - taskStart.getFullYear()) * 12 +
        (taskEnd.getMonth() - taskStart.getMonth()) + 1
      left = monthsFromStart * columnWidth
      width = Math.max(taskMonths * columnWidth, columnWidth * 0.5)
      break
    }

    case 'quarter': {
      const startQuarter = Math.floor(taskStart.getMonth() / 3)
      const gridStartQuarter = Math.floor(gridStart.getMonth() / 3)
      const quartersFromStart = (taskStart.getFullYear() - gridStart.getFullYear()) * 4 +
        (startQuarter - gridStartQuarter)
      const endQuarter = Math.floor(taskEnd.getMonth() / 3)
      const taskQuarters = (taskEnd.getFullYear() - taskStart.getFullYear()) * 4 +
        (endQuarter - startQuarter) + 1
      left = quartersFromStart * columnWidth
      width = Math.max(taskQuarters * columnWidth, columnWidth * 0.5)
      break
    }
  }

  return { left, width }
}

/**
 * Convert pixel position to date
 */
export function pixelToDate(
  pixelX: number,
  gridMetrics: GridMetrics,
  scale: TimeScale
): Date {
  const { startDate, columnWidth } = gridMetrics
  const periodsFromStart = Math.floor(pixelX / columnWidth)
  return addPeriods(startDate, periodsFromStart, scale)
}

/**
 * Snap date to grid based on time scale
 */
export function snapToGrid(date: Date, scale: TimeScale): Date {
  return getStartOfPeriod(date, scale)
}
