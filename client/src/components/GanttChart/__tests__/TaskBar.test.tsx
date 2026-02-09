import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskBar } from '../TaskBar'
import { Task, TimeScale, GridMetrics } from '../../../types/gantt'
import * as ganttUtils from '../../../utils/ganttUtils'

// Mock ganttUtils
jest.mock('../../../utils/ganttUtils', () => ({
  calculateTaskBarMetrics: jest.fn(),
  addPeriods: jest.fn(),
  snapToGrid: jest.fn(),
}))

const mockCalculateTaskBarMetrics = ganttUtils.calculateTaskBarMetrics as jest.MockedFunction<
  typeof ganttUtils.calculateTaskBarMetrics
>
const mockAddPeriods = ganttUtils.addPeriods as jest.MockedFunction<typeof ganttUtils.addPeriods>
const mockSnapToGrid = ganttUtils.snapToGrid as jest.MockedFunction<typeof ganttUtils.snapToGrid>

describe('TaskBar', () => {
  const mockOnTaskUpdate = jest.fn()
  const mockGridMetrics: GridMetrics = {
    columnWidth: 40,
    columns: [],
    totalWidth: 1000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  }
  const timeScale: TimeScale = 'day'

  const mockTask: Task = {
    id: 'task-1',
    name: 'Test Task',
    startDate: new Date('2024-01-05'),
    endDate: new Date('2024-01-10'),
    color: '#3b82f6',
    position: 0,
    projectId: 'project-1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCalculateTaskBarMetrics.mockReturnValue({ left: 200, width: 200 })
    mockSnapToGrid.mockImplementation((date) => date)
  })

  describe('Rendering', () => {
    it('should render task bar with correct name', () => {
      render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    it('should render milestone as diamond shape', () => {
      const milestoneTask: Task = { ...mockTask, isMilestone: true }

      const { container } = render(
        <TaskBar
          task={milestoneTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const diamond = container.querySelector('.rotate-45')
      expect(diamond).toBeInTheDocument()
    })

    it('should show progress bar when progress is defined', () => {
      const taskWithProgress: Task = { ...mockTask, progress: 50 }

      const { container } = render(
        <TaskBar
          task={taskWithProgress}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const progressBar = container.querySelector('.bg-white.bg-opacity-40')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveStyle({ width: '50%' })
    })

    it('should render resize handles when not readOnly', () => {
      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
          readOnly={false}
        />
      )

      const handles = container.querySelectorAll('.cursor-ew-resize')
      expect(handles).toHaveLength(2) // left and right handles
    })

    it('should not render resize handles when readOnly', () => {
      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
          readOnly={true}
        />
      )

      const handles = container.querySelectorAll('.cursor-ew-resize')
      expect(handles).toHaveLength(0)
    })

    it('should have move cursor when not readOnly', () => {
      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
          readOnly={false}
        />
      )

      const taskBar = container.querySelector('.cursor-move')
      expect(taskBar).toBeInTheDocument()
    })

    it('should have default cursor when readOnly', () => {
      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
          readOnly={true}
        />
      )

      const taskBar = container.querySelector('.cursor-default')
      expect(taskBar).toBeInTheDocument()
    })
  })

  describe('Tooltip on Hover', () => {
    it('should show tooltip when hovering over task bar', async () => {
      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move')
      expect(taskBar).toBeInTheDocument()

      fireEvent.mouseEnter(taskBar!)

      await waitFor(() => {
        // Tooltip contains dates, so check for date text that's only in tooltip
        const tooltipDateText = screen.getByText(/1\/4\/2024/i)
        expect(tooltipDateText).toBeInTheDocument()
      })
    })

    it('should hide tooltip when mouse leaves', async () => {
      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move')!
      fireEvent.mouseEnter(taskBar)

      await waitFor(() => {
        expect(screen.getAllByText('Test Task').length).toBeGreaterThan(1)
      })

      fireEvent.mouseLeave(taskBar)

      await waitFor(() => {
        expect(screen.getAllByText('Test Task').length).toBe(1)
      })
    })
  })

  describe('Drag to Move Task', () => {
    it('should initiate drag state when mouse down on task bar', () => {
      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move')!
      fireEvent.mouseDown(taskBar, { clientX: 100 })

      // Verify dragging state by checking opacity change
      expect(taskBar).toHaveClass('opacity-80')
    })

    it('should update task position during horizontal drag', () => {
      mockAddPeriods.mockImplementation((date, count) => {
        const newDate = new Date(date)
        newDate.setDate(newDate.getDate() + count)
        return newDate
      })

      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move')!

      // Start drag
      fireEvent.mouseDown(taskBar, { clientX: 100 })

      // Move mouse 80 pixels (2 columns at 40px each)
      fireEvent.mouseMove(document, { clientX: 180 })

      expect(mockAddPeriods).toHaveBeenCalled()
    })

    it('should finalize task position on mouse up and call onTaskUpdate', () => {
      const newStartDate = new Date('2024-01-07')
      const newEndDate = new Date('2024-01-12')

      mockAddPeriods
        .mockReturnValueOnce(newStartDate) // for start date
        .mockReturnValueOnce(newEndDate) // for end date

      mockSnapToGrid
        .mockReturnValueOnce(newStartDate)
        .mockReturnValueOnce(newEndDate)

      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move')!

      // Start drag
      fireEvent.mouseDown(taskBar, { clientX: 100 })

      // Move mouse
      fireEvent.mouseMove(document, { clientX: 180 })

      // End drag
      fireEvent.mouseUp(document)

      expect(mockSnapToGrid).toHaveBeenCalled()
      expect(mockOnTaskUpdate).toHaveBeenCalledWith('task-1', {
        startDate: newStartDate,
        endDate: newEndDate,
      })
    })

    it('should not update task if dates did not change', () => {
      mockSnapToGrid
        .mockReturnValueOnce(mockTask.startDate)
        .mockReturnValueOnce(mockTask.endDate)

      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move')!

      // Start and end drag without moving
      fireEvent.mouseDown(taskBar, { clientX: 100 })
      fireEvent.mouseUp(document)

      expect(mockOnTaskUpdate).not.toHaveBeenCalled()
    })

    it('should not allow drag when readOnly is true', () => {
      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
          readOnly={true}
        />
      )

      const taskBar = container.querySelector('.cursor-default')!
      fireEvent.mouseDown(taskBar, { clientX: 100 })

      // Should not have dragging state
      expect(taskBar).not.toHaveClass('opacity-80')
    })

    it('should not allow drag for milestone tasks', () => {
      const milestoneTask: Task = { ...mockTask, isMilestone: true }

      const { container } = render(
        <TaskBar
          task={milestoneTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const milestone = container.querySelector('.rotate-45')!
      fireEvent.mouseDown(milestone, { clientX: 100 })
      fireEvent.mouseMove(document, { clientX: 180 })
      fireEvent.mouseUp(document)

      expect(mockOnTaskUpdate).not.toHaveBeenCalled()
    })
  })

  describe('Resize Left (Change Start Date)', () => {
    it('should initiate resize-left drag when mouse down on left handle', () => {
      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const leftHandle = container.querySelectorAll('.cursor-ew-resize')[0] as HTMLElement
      fireEvent.mouseDown(leftHandle, { clientX: 200 })

      const taskBar = container.querySelector('.cursor-move')!
      expect(taskBar).toHaveClass('opacity-80')
    })

    it('should update start date during left resize', () => {
      const newStartDate = new Date('2024-01-03')

      mockAddPeriods.mockReturnValue(newStartDate)

      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const leftHandle = container.querySelectorAll('.cursor-ew-resize')[0] as HTMLElement

      // Start resize
      fireEvent.mouseDown(leftHandle, { clientX: 200 })

      // Move left by 80 pixels (2 days)
      fireEvent.mouseMove(document, { clientX: 120 })

      expect(mockAddPeriods).toHaveBeenCalled()
    })

    it('should prevent start date from going past end date', () => {
      const invalidStartDate = new Date('2024-01-15') // After end date

      mockAddPeriods.mockReturnValue(invalidStartDate)

      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const leftHandle = container.querySelectorAll('.cursor-ew-resize')[0] as HTMLElement

      // Start resize
      fireEvent.mouseDown(leftHandle, { clientX: 200 })

      // Try to move past end date
      fireEvent.mouseMove(document, { clientX: 500 })

      // End resize
      fireEvent.mouseUp(document)

      // Should not update because start date would be after end date
      expect(mockOnTaskUpdate).not.toHaveBeenCalled()
    })

    it('should finalize start date change on mouse up', () => {
      const newStartDate = new Date('2024-01-03')

      mockAddPeriods.mockReturnValue(newStartDate)
      mockSnapToGrid.mockImplementation((date) => date)

      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const leftHandle = container.querySelectorAll('.cursor-ew-resize')[0] as HTMLElement

      // Perform resize
      fireEvent.mouseDown(leftHandle, { clientX: 200 })
      fireEvent.mouseMove(document, { clientX: 120 })
      fireEvent.mouseUp(document)

      expect(mockOnTaskUpdate).toHaveBeenCalledWith('task-1', {
        startDate: newStartDate,
        endDate: mockTask.endDate,
      })
    })
  })

  describe('Resize Right (Change End Date)', () => {
    it('should initiate resize-right drag when mouse down on right handle', () => {
      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const rightHandle = container.querySelectorAll('.cursor-ew-resize')[1] as HTMLElement
      fireEvent.mouseDown(rightHandle, { clientX: 400 })

      const taskBar = container.querySelector('.cursor-move')!
      expect(taskBar).toHaveClass('opacity-80')
    })

    it('should update end date during right resize', () => {
      const newEndDate = new Date('2024-01-15')

      mockAddPeriods.mockReturnValue(newEndDate)

      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const rightHandle = container.querySelectorAll('.cursor-ew-resize')[1] as HTMLElement

      // Start resize
      fireEvent.mouseDown(rightHandle, { clientX: 400 })

      // Move right by 80 pixels (2 days)
      fireEvent.mouseMove(document, { clientX: 480 })

      expect(mockAddPeriods).toHaveBeenCalled()
    })

    it('should prevent end date from going before start date', () => {
      const invalidEndDate = new Date('2024-01-01') // Before start date

      mockAddPeriods.mockReturnValue(invalidEndDate)

      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const rightHandle = container.querySelectorAll('.cursor-ew-resize')[1] as HTMLElement

      // Start resize
      fireEvent.mouseDown(rightHandle, { clientX: 400 })

      // Try to move before start date
      fireEvent.mouseMove(document, { clientX: 100 })

      // End resize
      fireEvent.mouseUp(document)

      // Should not update because end date would be before start date
      expect(mockOnTaskUpdate).not.toHaveBeenCalled()
    })

    it('should finalize end date change on mouse up', () => {
      const newEndDate = new Date('2024-01-15')

      mockAddPeriods.mockReturnValue(newEndDate)
      mockSnapToGrid.mockImplementation((date) => date)

      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const rightHandle = container.querySelectorAll('.cursor-ew-resize')[1] as HTMLElement

      // Perform resize
      fireEvent.mouseDown(rightHandle, { clientX: 400 })
      fireEvent.mouseMove(document, { clientX: 480 })
      fireEvent.mouseUp(document)

      expect(mockOnTaskUpdate).toHaveBeenCalledWith('task-1', {
        startDate: mockTask.startDate,
        endDate: newEndDate,
      })
    })
  })

  describe('Visual Feedback During Drag', () => {
    it('should show opacity change during drag', () => {
      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move')!

      // Before drag
      expect(taskBar).toHaveClass('opacity-100')

      // During drag
      fireEvent.mouseDown(taskBar, { clientX: 100 })
      expect(taskBar).toHaveClass('opacity-80')

      // After drag
      fireEvent.mouseUp(document)
      expect(taskBar).toHaveClass('opacity-100')
    })

    it('should show dragging indicator with updated dates during drag', () => {
      const newStartDate = new Date('2024-01-07')
      const newEndDate = new Date('2024-01-12')

      mockAddPeriods
        .mockReturnValueOnce(newStartDate)
        .mockReturnValueOnce(newEndDate)

      mockCalculateTaskBarMetrics
        .mockReturnValueOnce({ left: 200, width: 200 }) // initial
        .mockReturnValueOnce({ left: 280, width: 200 }) // during drag

      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move')!

      // Start drag
      fireEvent.mouseDown(taskBar, { clientX: 100 })

      // Move to trigger indicator
      fireEvent.mouseMove(document, { clientX: 180 })

      // Check for dragging indicator
      const indicator = container.querySelector('.bg-blue-600')
      expect(indicator).toBeInTheDocument()
    })

    it('should hide tooltip during drag', async () => {
      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move')!

      // Show tooltip
      fireEvent.mouseEnter(taskBar)
      await waitFor(() => {
        expect(screen.getAllByText('Test Task').length).toBeGreaterThan(1)
      })

      // Start drag - tooltip should hide
      fireEvent.mouseDown(taskBar, { clientX: 100 })

      // Dragging indicator should show instead
      const indicator = container.querySelector('.bg-blue-600')
      expect(indicator).toBeInTheDocument()
    })

    it('should show shadow on hover', async () => {
      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move') as HTMLElement

      // Hover
      fireEvent.mouseEnter(taskBar)

      await waitFor(() => {
        expect(taskBar.style.boxShadow).toBe('0 4px 6px rgba(0, 0, 0, 0.3)')
      })
    })
  })

  describe('Event Listener Cleanup', () => {
    it('should add event listeners during drag', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener')

      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move')!
      fireEvent.mouseDown(taskBar, { clientX: 100 })

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))

      addEventListenerSpy.mockRestore()
    })

    it('should remove event listeners after drag ends', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move')!

      // Start and end drag
      fireEvent.mouseDown(taskBar, { clientX: 100 })
      fireEvent.mouseUp(document)

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    it('should cleanup event listeners on unmount during drag', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

      const { container, unmount } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move')!
      fireEvent.mouseDown(taskBar, { clientX: 100 })

      // Unmount while dragging
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Date Calculation with snapToGrid', () => {
    it('should snap dates to grid on mouse up', () => {
      const draggedStartDate = new Date('2024-01-07T14:30:00') // Mid-day
      const draggedEndDate = new Date('2024-01-12T18:45:00')
      const snappedStartDate = new Date('2024-01-07T00:00:00') // Start of day
      const snappedEndDate = new Date('2024-01-12T00:00:00')

      mockAddPeriods
        .mockReturnValueOnce(draggedStartDate)
        .mockReturnValueOnce(draggedEndDate)

      mockSnapToGrid
        .mockReturnValueOnce(snappedStartDate)
        .mockReturnValueOnce(snappedEndDate)

      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move')!

      // Drag task
      fireEvent.mouseDown(taskBar, { clientX: 100 })
      fireEvent.mouseMove(document, { clientX: 180 })
      fireEvent.mouseUp(document)

      expect(mockSnapToGrid).toHaveBeenCalledWith(draggedStartDate, timeScale)
      expect(mockSnapToGrid).toHaveBeenCalledWith(draggedEndDate, timeScale)

      expect(mockOnTaskUpdate).toHaveBeenCalledWith('task-1', {
        startDate: snappedStartDate,
        endDate: snappedEndDate,
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero movement (no periods to move)', () => {
      const { container } = render(
        <TaskBar
          task={mockTask}
          gridMetrics={mockGridMetrics}
          timeScale={timeScale}
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      const taskBar = container.querySelector('.cursor-move')!

      // Drag with very small movement (less than one column)
      fireEvent.mouseDown(taskBar, { clientX: 100 })
      fireEvent.mouseMove(document, { clientX: 105 }) // Only 5 pixels
      fireEvent.mouseUp(document)

      // Should not call addPeriods or update task
      expect(mockOnTaskUpdate).not.toHaveBeenCalled()
    })

    it('should stop propagation on mouse down to prevent conflicts', () => {
      const parentHandler = jest.fn()
      const { container } = render(
        <div onMouseDown={parentHandler}>
          <TaskBar
            task={mockTask}
            gridMetrics={mockGridMetrics}
            timeScale={timeScale}
            onTaskUpdate={mockOnTaskUpdate}
          />
        </div>
      )

      const taskBar = container.querySelector('.cursor-move')!
      fireEvent.mouseDown(taskBar, { clientX: 100 })

      // Parent handler should not be called due to stopPropagation
      expect(parentHandler).not.toHaveBeenCalled()
    })
  })
})
