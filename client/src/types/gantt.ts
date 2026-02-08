/**
 * Gantt Chart Type Definitions
 */

export type TimeScale = 'day' | 'week' | 'sprint' | 'month' | 'quarter'

export interface Task {
  id: string
  name: string
  startDate: Date
  endDate: Date
  color: string
  position: number
  projectId: string
  isMilestone?: boolean
  progress?: number
}

export interface GanttChartProps {
  tasks: Task[]
  timeScale: TimeScale
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  readOnly?: boolean
  showWeekends?: boolean
  showToday?: boolean
  minDate?: Date
  maxDate?: Date
}

export interface TimelineColumn {
  date: Date
  label: string
  isWeekend: boolean
  isToday: boolean
  width: number
}

export interface DragState {
  taskId: string
  dragType: 'move' | 'resize-left' | 'resize-right'
  startX: number
  startDate: Date
  endDate: Date
  originalStartDate: Date
  originalEndDate: Date
}

export interface GridMetrics {
  columnWidth: number
  columns: TimelineColumn[]
  totalWidth: number
  startDate: Date
  endDate: Date
}
