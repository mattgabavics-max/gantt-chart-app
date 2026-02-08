/**
 * Enhanced Gantt Chart Component
 * Uses new time scale utilities for improved rendering and interaction
 */

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import {
  generateTimeHeaders,
  calculateTaskPosition,
  snapToGrid,
  getVisibleDateRange,
  getScrollPositionForToday,
  getDateAtPosition,
  isWeekend,
  isToday,
  type TimeScale,
  type TimeHeader,
} from '../../utils/timeScaleUtils'
import type { Task } from '../../types/api'

// ==================== Types ====================

export interface EnhancedGanttChartProps {
  tasks: Task[]
  timeScale: TimeScale
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
  onTaskClick?: (task: Task) => void
  readOnly?: boolean
  showWeekends?: boolean
  showToday?: boolean
  centerDate?: Date
  autoScrollToToday?: boolean
  minColumns?: number
  maxColumns?: number
}

interface DragState {
  taskId: string
  type: 'move' | 'resize-left' | 'resize-right'
  startX: number
  originalStartDate: Date
  originalEndDate: Date
}

// ==================== Component ====================

export const EnhancedGanttChart: React.FC<EnhancedGanttChartProps> = ({
  tasks,
  timeScale,
  onTaskUpdate,
  onTaskClick,
  readOnly = false,
  showWeekends = true,
  showToday = true,
  centerDate,
  autoScrollToToday = true,
  minColumns = 10,
  maxColumns = 60,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  const [containerWidth, setContainerWidth] = useState(0)
  const [dragState, setDragState] = useState<DragState | null>(null)

  // Calculate visible date range
  const dateRange = useMemo(() => {
    return getVisibleDateRange(timeScale, centerDate, {
      minColumns,
      maxColumns,
      tasks,
    })
  }, [timeScale, centerDate, minColumns, maxColumns, tasks])

  // Generate time headers
  const { primaryHeaders, secondaryHeaders } = useMemo(() => {
    return generateTimeHeaders(
      dateRange.startDate,
      dateRange.endDate,
      timeScale
    )
  }, [dateRange, timeScale])

  // Calculate task positions
  const taskPositions = useMemo(() => {
    return tasks.map((task) => ({
      task,
      position: calculateTaskPosition(
        task,
        dateRange.startDate,
        dateRange.endDate,
        timeScale,
        containerWidth
      ),
    }))
  }, [tasks, dateRange, timeScale, containerWidth])

  // Calculate today indicator position
  const todayPosition = useMemo(() => {
    if (!showToday) return null

    const today = new Date()
    const todayTask = {
      startDate: today,
      endDate: today,
    }

    const position = calculateTaskPosition(
      todayTask,
      dateRange.startDate,
      dateRange.endDate,
      timeScale
    )

    return position.left
  }, [showToday, dateRange, timeScale])

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Auto-scroll to today on mount
  useEffect(() => {
    if (
      autoScrollToToday &&
      showToday &&
      todayPosition !== null &&
      scrollContainerRef.current &&
      containerWidth > 0
    ) {
      const scrollPos = getScrollPositionForToday(
        dateRange.startDate,
        timeScale,
        containerWidth
      )
      scrollContainerRef.current.scrollLeft = scrollPos
    }
  }, [autoScrollToToday, showToday, todayPosition, dateRange, timeScale, containerWidth])

  // Drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, task: Task, type: DragState['type']) => {
      if (readOnly) return

      e.preventDefault()
      setDragState({
        taskId: task.id,
        type,
        startX: e.clientX,
        originalStartDate: new Date(task.startDate),
        originalEndDate: new Date(task.endDate),
      })
    },
    [readOnly]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState || !timelineRef.current) return

      const deltaX = e.clientX - dragState.startX
      const timelineRect = timelineRef.current.getBoundingClientRect()
      const relativeX = e.clientX - timelineRect.left + scrollContainerRef.current!.scrollLeft

      const newDate = getDateAtPosition(relativeX, dateRange.startDate, timeScale)

      const task = tasks.find((t) => t.id === dragState.taskId)
      if (!task) return

      let newStartDate = new Date(dragState.originalStartDate)
      let newEndDate = new Date(dragState.originalEndDate)

      if (dragState.type === 'move') {
        const originalStartPos = calculateTaskPosition(
          { startDate: dragState.originalStartDate, endDate: dragState.originalEndDate },
          dateRange.startDate,
          dateRange.endDate,
          timeScale
        ).left

        const newStartPos = originalStartPos + deltaX
        newStartDate = snapToGrid(
          getDateAtPosition(newStartPos, dateRange.startDate, timeScale),
          timeScale
        )

        const duration = dragState.originalEndDate.getTime() - dragState.originalStartDate.getTime()
        newEndDate = new Date(newStartDate.getTime() + duration)
      } else if (dragState.type === 'resize-left') {
        newStartDate = snapToGrid(newDate, timeScale)
        if (newStartDate >= dragState.originalEndDate) {
          newStartDate = new Date(dragState.originalEndDate.getTime() - 24 * 60 * 60 * 1000)
        }
      } else if (dragState.type === 'resize-right') {
        newEndDate = snapToGrid(newDate, timeScale)
        if (newEndDate <= dragState.originalStartDate) {
          newEndDate = new Date(dragState.originalStartDate.getTime() + 24 * 60 * 60 * 1000)
        }
      }

      // Update task immediately for visual feedback
      if (onTaskUpdate) {
        onTaskUpdate(dragState.taskId, {
          startDate: newStartDate,
          endDate: newEndDate,
        })
      }
    },
    [dragState, dateRange, timeScale, tasks, onTaskUpdate]
  )

  const handleMouseUp = useCallback(() => {
    setDragState(null)
  }, [])

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState, handleMouseMove, handleMouseUp])

  const taskRowHeight = 60

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-gray-50">
      {/* Control Panel */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-300">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Timeline:</span>
            <span className="text-sm text-gray-600 capitalize">{timeScale}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{tasks.length} tasks</span>
            <span>•</span>
            <span>
              {dateRange.startDate.toLocaleDateString()} -{' '}
              {dateRange.endDate.toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!readOnly && <span className="text-xs text-green-600">● Editable</span>}
          {readOnly && <span className="text-xs text-gray-400">● Read-only</span>}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Task names sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-gray-300">
          {/* Header */}
          <div
            className="border-b border-gray-300 bg-gray-50"
            style={{ height: secondaryHeaders.length > 0 ? 80 : 40 }}
          >
            <div className="flex items-center px-4 h-full">
              <span className="text-sm font-semibold text-gray-700">Tasks</span>
            </div>
          </div>

          {/* Task names */}
          <div className="flex-1 overflow-y-auto">
            {taskPositions.map(({ task }) => (
              <div
                key={task.id}
                className="flex items-center px-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ height: taskRowHeight }}
                onClick={() => onTaskClick?.(task)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: task.color }}
                    />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {task.name}
                    </span>
                    {task.isMilestone && (
                      <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                        Milestone
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {task.progress}% complete
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Time headers */}
          <div className="bg-white border-b border-gray-300">
            {/* Primary headers */}
            <div className="flex border-b border-gray-200" style={{ height: 40 }}>
              {primaryHeaders.map((header) => (
                <TimeHeaderCell key={header.id} header={header} isPrimary />
              ))}
            </div>

            {/* Secondary headers */}
            {secondaryHeaders.length > 0 && (
              <div className="flex" style={{ height: 40 }}>
                {secondaryHeaders.map((header) => (
                  <TimeHeaderCell
                    key={header.id}
                    header={header}
                    isPrimary={false}
                    showWeekends={showWeekends}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Timeline content */}
          <div ref={scrollContainerRef} className="flex-1 overflow-auto relative">
            <div
              ref={timelineRef}
              className="relative"
              style={{
                width: dateRange.totalWidth,
                height: taskPositions.length * taskRowHeight,
              }}
            >
              {/* Weekend/grid background */}
              {secondaryHeaders.map((header) => (
                <div
                  key={header.id}
                  className={`absolute top-0 bottom-0 border-r border-gray-200 ${
                    showWeekends && header.isWeekend
                      ? 'bg-gray-100'
                      : 'bg-white'
                  }`}
                  style={{
                    left: primaryHeaders
                      .slice(
                        0,
                        secondaryHeaders.findIndex((h) => h.id === header.id)
                      )
                      .reduce((sum, h) => sum + h.width, 0),
                    width: header.width,
                  }}
                />
              ))}

              {/* Today indicator */}
              {showToday && todayPosition !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                  style={{ left: todayPosition }}
                >
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full" />
                </div>
              )}

              {/* Task bars */}
              {taskPositions.map(({ task, position }, index) => (
                <TaskBarComponent
                  key={task.id}
                  task={task}
                  position={position}
                  top={index * taskRowHeight}
                  height={taskRowHeight}
                  readOnly={readOnly}
                  onMouseDown={handleMouseDown}
                  onClick={() => onTaskClick?.(task)}
                />
              ))}

              {/* Row separators */}
              {taskPositions.map((_, index) => (
                <div
                  key={`separator-${index}`}
                  className="absolute left-0 right-0 border-b border-gray-200 pointer-events-none"
                  style={{ top: (index + 1) * taskRowHeight }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Time Header Cell ====================

const TimeHeaderCell: React.FC<{
  header: TimeHeader
  isPrimary: boolean
  showWeekends?: boolean
}> = ({ header, isPrimary, showWeekends }) => {
  const isCurrentToday = header.isToday && !isPrimary

  return (
    <div
      className={`
        flex items-center justify-center border-r border-gray-200 text-xs font-medium
        ${isPrimary ? 'bg-gray-50 text-gray-700' : 'bg-white text-gray-600'}
        ${isCurrentToday ? 'bg-blue-50 text-blue-700 font-semibold' : ''}
        ${!isPrimary && showWeekends && header.isWeekend ? 'bg-gray-50' : ''}
      `}
      style={{ width: header.width }}
    >
      {header.label}
    </div>
  )
}

// ==================== Task Bar Component ====================

const TaskBarComponent: React.FC<{
  task: Task
  position: { left: number; width: number }
  top: number
  height: number
  readOnly: boolean
  onMouseDown: (e: React.MouseEvent, task: Task, type: DragState['type']) => void
  onClick: () => void
}> = ({ task, position, top, height, readOnly, onMouseDown, onClick }) => {
  const barHeight = 32
  const barTop = (height - barHeight) / 2

  return (
    <div
      className="absolute"
      style={{
        left: position.left,
        width: position.width,
        top: top + barTop,
        height: barHeight,
      }}
    >
      {/* Resize handle left */}
      {!readOnly && (
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500 hover:bg-opacity-30 z-10"
          onMouseDown={(e) => onMouseDown(e, task, 'resize-left')}
        />
      )}

      {/* Task bar */}
      <div
        className={`
          relative h-full rounded px-2 flex items-center
          ${!readOnly ? 'cursor-move' : 'cursor-pointer'}
          hover:opacity-90 transition-opacity
          ${task.isMilestone ? 'rounded-full' : ''}
        `}
        style={{
          backgroundColor: task.color,
          opacity: 0.9,
        }}
        onMouseDown={(e) => !readOnly && onMouseDown(e, task, 'move')}
        onClick={onClick}
      >
        {/* Progress bar */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-black bg-opacity-20 rounded-l"
          style={{ width: `${task.progress}%` }}
        />

        {/* Task name */}
        <span className="relative z-10 text-xs font-medium text-white truncate">
          {task.name}
        </span>

        {/* Milestone indicator */}
        {task.isMilestone && (
          <div className="absolute -right-1 -top-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Resize handle right */}
      {!readOnly && (
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500 hover:bg-opacity-30 z-10"
          onMouseDown={(e) => onMouseDown(e, task, 'resize-right')}
        />
      )}
    </div>
  )
}

export default EnhancedGanttChart
