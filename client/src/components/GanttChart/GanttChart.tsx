import React, { useMemo, useRef, useEffect, useState } from 'react'
import { GanttChartProps, Task } from '../../types/gantt'
import { calculateGridMetrics, calculateTaskBarMetrics } from '../../utils/ganttUtils'
import { TimelineHeader } from './TimelineHeader'
import { TaskBar } from './TaskBar'

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  timeScale,
  onTaskUpdate,
  readOnly = false,
  showWeekends = true,
  showToday = true,
  minDate,
  maxDate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Calculate grid metrics
  const gridMetrics = useMemo(
    () => calculateGridMetrics(tasks, timeScale, minDate, maxDate),
    [tasks, timeScale, minDate, maxDate]
  )

  // Sort tasks by position
  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => a.position - b.position),
    [tasks]
  )

  // Calculate today indicator position
  const todayPosition = useMemo(() => {
    if (!showToday) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tempTask: Task = {
      id: 'today',
      name: 'Today',
      startDate: today,
      endDate: today,
      color: '#3b82f6',
      position: 0,
      projectId: '',
    }

    const { left } = calculateTaskBarMetrics(tempTask, gridMetrics, timeScale)
    return left
  }, [showToday, gridMetrics, timeScale])

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
    if (showToday && todayPosition !== null && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const scrollTo = todayPosition - containerWidth / 2
      container.scrollLeft = Math.max(0, scrollTo)
    }
  }, [showToday, todayPosition, containerWidth])

  const taskRowHeight = 60 // Height of each task row

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-gray-50">
      {/* Control Panel */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-300">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Timeline:</span>
          <span className="text-sm text-gray-600 capitalize">{timeScale}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>{sortedTasks.length} tasks</span>
          {!readOnly && <span className="text-green-600">● Editable</span>}
          {readOnly && <span className="text-gray-400">● Read-only</span>}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Task names sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-gray-300">
          {/* Header placeholder */}
          <div className="h-16 border-b border-gray-300 bg-gray-50 flex items-center px-4">
            <span className="text-sm font-semibold text-gray-700">Tasks</span>
          </div>

          {/* Task list */}
          <div className="flex-1 overflow-y-auto">
            {sortedTasks.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                No tasks to display
              </div>
            ) : (
              sortedTasks.map((task) => (
                <div
                  key={task.id}
                  className="border-b border-gray-200 px-4 py-4 hover:bg-gray-50 transition-colors"
                  style={{ height: `${taskRowHeight}px` }}
                >
                  <div className="flex items-center h-full">
                    <div
                      className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                      style={{ backgroundColor: task.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{task.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(task.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        -{' '}
                        {new Date(task.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Timeline area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline header */}
          <div className="overflow-x-auto" ref={scrollContainerRef}>
            <div style={{ width: `${gridMetrics.totalWidth}px` }}>
              <TimelineHeader gridMetrics={gridMetrics} timeScale={timeScale} showWeekends={showWeekends} />
            </div>
          </div>

          {/* Timeline grid and tasks */}
          <div className="flex-1 overflow-auto" ref={scrollContainerRef}>
            <div className="relative" style={{ width: `${gridMetrics.totalWidth}px` }}>
              {/* Grid background */}
              <div className="absolute inset-0">
                {/* Vertical grid lines */}
                {gridMetrics.columns.map((column, index) => (
                  <div
                    key={`grid-${index}`}
                    className={`absolute top-0 bottom-0 border-r transition-colors ${
                      column.isWeekend && showWeekends
                        ? 'bg-gray-100 border-gray-300'
                        : 'border-gray-200'
                    }`}
                    style={{
                      left: `${index * column.width}px`,
                      width: `${column.width}px`,
                    }}
                  />
                ))}

                {/* Today indicator */}
                {showToday && todayPosition !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20"
                    style={{ left: `${todayPosition}px` }}
                  >
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
                      Today
                    </div>
                  </div>
                )}
              </div>

              {/* Task rows */}
              <div className="relative">
                {sortedTasks.length === 0 ? (
                  <div
                    className="flex items-center justify-center text-gray-400 text-sm"
                    style={{ height: `${taskRowHeight * 3}px` }}
                  >
                    Add tasks to see them on the timeline
                  </div>
                ) : (
                  sortedTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="relative border-b border-gray-200"
                      style={{ height: `${taskRowHeight}px` }}
                    >
                      <TaskBar
                        task={task}
                        gridMetrics={gridMetrics}
                        timeScale={timeScale}
                        onTaskUpdate={onTaskUpdate}
                        readOnly={readOnly}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 bg-white border-t border-gray-300 flex items-center space-x-4 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span>Normal Task</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded rotate-45" />
          <span>Milestone</span>
        </div>
        {showWeekends && (
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300" />
            <span>Weekend</span>
          </div>
        )}
        {showToday && (
          <div className="flex items-center space-x-1">
            <div className="w-0.5 h-3 bg-blue-500" />
            <span>Today</span>
          </div>
        )}
        {!readOnly && (
          <div className="ml-auto text-gray-500">
            Drag tasks to move • Drag edges to resize
          </div>
        )}
      </div>
    </div>
  )
}
