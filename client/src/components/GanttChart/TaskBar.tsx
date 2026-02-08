import React, { useState, useRef, useCallback } from 'react'
import { Task, TimeScale, GridMetrics, DragState } from '../../types/gantt'
import { calculateTaskBarMetrics, pixelToDate, snapToGrid, addPeriods } from '../../utils/ganttUtils'

interface TaskBarProps {
  task: Task
  gridMetrics: GridMetrics
  timeScale: TimeScale
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  readOnly?: boolean
}

export const TaskBar: React.FC<TaskBarProps> = ({
  task,
  gridMetrics,
  timeScale,
  onTaskUpdate,
  readOnly = false,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  const { left, width } = calculateTaskBarMetrics(task, gridMetrics, timeScale)

  // Handle mouse down on task bar (move)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (readOnly || task.isMilestone) return

      e.stopPropagation()
      setIsDragging(true)

      const initialState: DragState = {
        taskId: task.id,
        dragType: 'move',
        startX: e.clientX,
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
        originalStartDate: new Date(task.startDate),
        originalEndDate: new Date(task.endDate),
      }

      setDragState(initialState)
    },
    [readOnly, task, timeScale]
  )

  // Handle mouse down on left edge (resize left)
  const handleLeftEdgeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (readOnly || task.isMilestone) return

      e.stopPropagation()
      setIsDragging(true)

      const initialState: DragState = {
        taskId: task.id,
        dragType: 'resize-left',
        startX: e.clientX,
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
        originalStartDate: new Date(task.startDate),
        originalEndDate: new Date(task.endDate),
      }

      setDragState(initialState)
    },
    [readOnly, task]
  )

  // Handle mouse down on right edge (resize right)
  const handleRightEdgeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (readOnly || task.isMilestone) return

      e.stopPropagation()
      setIsDragging(true)

      const initialState: DragState = {
        taskId: task.id,
        dragType: 'resize-right',
        startX: e.clientX,
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
        originalStartDate: new Date(task.startDate),
        originalEndDate: new Date(task.endDate),
      }

      setDragState(initialState)
    },
    [readOnly, task]
  )

  // Handle mouse move during drag
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragState) return

      const deltaX = e.clientX - dragState.startX
      const { columnWidth } = gridMetrics

      if (dragState.dragType === 'move') {
        // Calculate new position
        const periodsToMove = Math.round(deltaX / columnWidth)

        if (periodsToMove !== 0) {
          const newStartDate = addPeriods(dragState.originalStartDate, periodsToMove, timeScale)
          const newEndDate = addPeriods(dragState.originalEndDate, periodsToMove, timeScale)

          setDragState({
            ...dragState,
            startDate: newStartDate,
            endDate: newEndDate,
          })
        }
      } else if (dragState.dragType === 'resize-left') {
        // Calculate new start date
        const periodsToMove = Math.round(deltaX / columnWidth)

        if (periodsToMove !== 0) {
          const newStartDate = addPeriods(dragState.originalStartDate, periodsToMove, timeScale)

          // Ensure start date is before end date
          if (newStartDate < dragState.endDate) {
            setDragState({
              ...dragState,
              startDate: newStartDate,
            })
          }
        }
      } else if (dragState.dragType === 'resize-right') {
        // Calculate new end date
        const periodsToMove = Math.round(deltaX / columnWidth)

        if (periodsToMove !== 0) {
          const newEndDate = addPeriods(dragState.originalEndDate, periodsToMove, timeScale)

          // Ensure end date is after start date
          if (newEndDate > dragState.startDate) {
            setDragState({
              ...dragState,
              endDate: newEndDate,
            })
          }
        }
      }
    },
    [isDragging, dragState, gridMetrics, timeScale]
  )

  // Handle mouse up (end drag)
  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragState) return

    setIsDragging(false)

    // Snap to grid and update task
    const snappedStartDate = snapToGrid(dragState.startDate, timeScale)
    const snappedEndDate = snapToGrid(dragState.endDate, timeScale)

    // Only update if dates changed
    if (
      snappedStartDate.getTime() !== task.startDate.getTime() ||
      snappedEndDate.getTime() !== task.endDate.getTime()
    ) {
      onTaskUpdate(task.id, {
        startDate: snappedStartDate,
        endDate: snappedEndDate,
      })
    }

    setDragState(null)
  }, [isDragging, dragState, task, timeScale, onTaskUpdate])

  // Set up event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Use drag state for position if dragging
  const displayMetrics = React.useMemo(() => {
    if (isDragging && dragState) {
      const tempTask = {
        ...task,
        startDate: dragState.startDate,
        endDate: dragState.endDate,
      }
      return calculateTaskBarMetrics(tempTask, gridMetrics, timeScale)
    }
    return { left, width }
  }, [isDragging, dragState, task, gridMetrics, timeScale, left, width])

  // Milestone rendering
  if (task.isMilestone) {
    return (
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: `${displayMetrics.left}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: isHovering ? 20 : 10,
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Diamond shape for milestone */}
        <div
          className="rotate-45 transition-all duration-150"
          style={{
            width: '16px',
            height: '16px',
            backgroundColor: task.color,
            boxShadow: isHovering ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        />
        {isHovering && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
            {task.name}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={barRef}
      className={`absolute h-8 rounded transition-all duration-150 ${
        readOnly ? 'cursor-default' : 'cursor-move'
      } ${isDragging ? 'opacity-80 shadow-lg' : 'opacity-100'}`}
      style={{
        left: `${displayMetrics.left}px`,
        width: `${displayMetrics.width}px`,
        backgroundColor: task.color,
        top: '50%',
        transform: 'translateY(-50%)',
        boxShadow: isHovering ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.2)',
        zIndex: isHovering || isDragging ? 20 : 10,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Left resize handle */}
      {!readOnly && (
        <div
          className="absolute left-0 top-0 h-full w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-30 transition-colors"
          onMouseDown={handleLeftEdgeMouseDown}
        />
      )}

      {/* Task content */}
      <div className="flex items-center h-full px-2 overflow-hidden">
        <span className="text-white text-sm font-medium truncate">{task.name}</span>
      </div>

      {/* Progress bar */}
      {task.progress !== undefined && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-40 rounded-b"
          style={{ width: `${task.progress}%` }}
        />
      )}

      {/* Right resize handle */}
      {!readOnly && (
        <div
          className="absolute right-0 top-0 h-full w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-30 transition-colors"
          onMouseDown={handleRightEdgeMouseDown}
        />
      )}

      {/* Tooltip on hover */}
      {isHovering && !isDragging && (
        <div className="absolute top-full left-0 mt-1 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
          <div className="font-semibold">{task.name}</div>
          <div>
            {new Date(task.startDate).toLocaleDateString()} -{' '}
            {new Date(task.endDate).toLocaleDateString()}
          </div>
          {task.progress !== undefined && <div>Progress: {task.progress}%</div>}
        </div>
      )}

      {/* Dragging indicator */}
      {isDragging && dragState && (
        <div className="absolute top-full left-0 mt-1 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
          {dragState.startDate.toLocaleDateString()} - {dragState.endDate.toLocaleDateString()}
        </div>
      )}
    </div>
  )
}
