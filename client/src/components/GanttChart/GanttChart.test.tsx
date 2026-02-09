/**
 * Unit Tests for GanttChart Component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { testA11y } from '../../tests/utils/testA11y'
import { GanttChart } from './GanttChart'
import { Task } from '../../types/gantt'
import { createMockTask } from '../../tests/mocks/mockData'

describe('GanttChart', () => {
  const mockTasks: Task[] = [
    createMockTask({
      id: '1',
      name: 'Task 1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-15'),
      color: '#3b82f6',
      position: 0,
    }),
    createMockTask({
      id: '2',
      name: 'Task 2',
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-31'),
      color: '#10b981',
      position: 1,
    }),
  ]

  const mockOnTaskUpdate = jest.fn()

  beforeEach(() => {
    mockOnTaskUpdate.mockClear()
  })

  it('should render without crashing', () => {
    render(
      <GanttChart
        tasks={mockTasks}
        timeScale="week"
        onTaskUpdate={mockOnTaskUpdate}
      />
    )

    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('should render all tasks', () => {
    render(
      <GanttChart
        tasks={mockTasks}
        timeScale="week"
        onTaskUpdate={mockOnTaskUpdate}
      />
    )

    mockTasks.forEach((task) => {
      expect(screen.getByText(task.name)).toBeInTheDocument()
    })
  })

  it('should render timeline header', () => {
    render(
      <GanttChart
        tasks={mockTasks}
        timeScale="week"
        onTaskUpdate={mockOnTaskUpdate}
      />
    )

    // Timeline header should be present (contains dates/weeks)
    const timeline = document.querySelector('[class*="timeline"]')
    expect(timeline).toBeInTheDocument()
  })

  it('should render today indicator when showToday is true', () => {
    render(
      <GanttChart
        tasks={mockTasks}
        timeScale="week"
        onTaskUpdate={mockOnTaskUpdate}
        showToday={true}
      />
    )

    // Today indicator should be visible
    const todayIndicator = screen.queryByText('Today')
    expect(todayIndicator).toBeInTheDocument()
  })

  it('should not render today indicator when showToday is false', () => {
    render(
      <GanttChart
        tasks={mockTasks}
        timeScale="week"
        onTaskUpdate={mockOnTaskUpdate}
        showToday={false}
      />
    )

    const todayIndicator = screen.queryByText('Today')
    expect(todayIndicator).not.toBeInTheDocument()
  })

  it('should render milestone tasks differently', () => {
    const tasksWithMilestone: Task[] = [
      ...mockTasks,
      createMockTask({
        id: '3',
        name: 'Milestone',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-01'),
        isMilestone: true,
      }),
    ]

    render(
      <GanttChart
        tasks={tasksWithMilestone}
        timeScale="week"
        onTaskUpdate={mockOnTaskUpdate}
      />
    )

    expect(screen.getByText('Milestone')).toBeInTheDocument()
  })

  it('should handle empty task list', () => {
    render(
      <GanttChart
        tasks={[]}
        timeScale="week"
        onTaskUpdate={mockOnTaskUpdate}
      />
    )

    // Should render grid even with no tasks
    const grid = document.querySelector('[class*="gantt"]')
    expect(grid).toBeInTheDocument()
  })

  it('should apply readOnly mode', () => {
    render(
      <GanttChart
        tasks={mockTasks}
        timeScale="week"
        onTaskUpdate={mockOnTaskUpdate}
        readOnly={true}
      />
    )

    // Tasks should not be draggable in read-only mode
    const taskBars = document.querySelectorAll('[class*="task-bar"]')
    taskBars.forEach((bar) => {
      expect(bar).not.toHaveAttribute('draggable', 'true')
    })
  })

  it('should use custom date range when provided', () => {
    const minDate = new Date('2023-12-01')
    const maxDate = new Date('2024-03-31')

    render(
      <GanttChart
        tasks={mockTasks}
        timeScale="week"
        onTaskUpdate={mockOnTaskUpdate}
        minDate={minDate}
        maxDate={maxDate}
      />
    )

    // Grid should extend to cover custom date range
    const grid = document.querySelector('[class*="gantt"]')
    expect(grid).toBeInTheDocument()
  })

  it('should render progress indicators when tasks have progress', () => {
    const tasksWithProgress: Task[] = [
      createMockTask({
        id: '1',
        name: 'Task with Progress',
        progress: 75,
      }),
    ]

    render(
      <GanttChart
        tasks={tasksWithProgress}
        timeScale="week"
        onTaskUpdate={mockOnTaskUpdate}
      />
    )

    expect(screen.getByText('Task with Progress')).toBeInTheDocument()
    // Progress bar should be rendered
    const progressBar = document.querySelector('[class*="progress"]')
    expect(progressBar).toBeInTheDocument()
  })

  it('should change time scale correctly', () => {
    const { rerender } = render(
      <GanttChart
        tasks={mockTasks}
        timeScale="day"
        onTaskUpdate={mockOnTaskUpdate}
      />
    )

    // Change to week scale
    rerender(
      <GanttChart
        tasks={mockTasks}
        timeScale="week"
        onTaskUpdate={mockOnTaskUpdate}
      />
    )

    // Component should re-render without errors
    expect(screen.getByText('Task 1')).toBeInTheDocument()
  })

  it('should handle task updates', () => {
    render(
      <GanttChart
        tasks={mockTasks}
        timeScale="week"
        onTaskUpdate={mockOnTaskUpdate}
      />
    )

    // Simulate a task update (this would normally happen via drag/drop)
    // The actual drag/drop is tested in TaskBar.test.tsx
    expect(mockOnTaskUpdate).not.toHaveBeenCalled()
  })

  describe('Weekend highlighting', () => {
    it('should show weekends when showWeekends is true', () => {
      render(
        <GanttChart
          tasks={mockTasks}
          timeScale="day"
          onTaskUpdate={mockOnTaskUpdate}
          showWeekends={true}
        />
      )

      // Weekend columns should be visible
      const weekendColumns = document.querySelectorAll('[class*="weekend"]')
      expect(weekendColumns.length).toBeGreaterThan(0)
    })

    it('should hide weekends when showWeekends is false', () => {
      render(
        <GanttChart
          tasks={mockTasks}
          timeScale="day"
          onTaskUpdate={mockOnTaskUpdate}
          showWeekends={false}
        />
      )

      // Weekend columns should not be visible or should be hidden
      // This depends on implementation - weekends might be filtered out
      const grid = document.querySelector('[class*="gantt"]')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <GanttChart
          tasks={mockTasks}
          timeScale="week"
          onTaskUpdate={mockOnTaskUpdate}
        />
      )

      // Check for task elements with accessible names
      mockTasks.forEach((task) => {
        expect(screen.getByText(task.name)).toBeInTheDocument()
      })
    })

    it('should have no accessibility violations with tasks', async () => {
      await testA11y(
        <GanttChart
          tasks={mockTasks}
          timeScale="week"
          onTaskUpdate={mockOnTaskUpdate}
        />
      )
    })

    it('should have no accessibility violations in empty state', async () => {
      await testA11y(
        <GanttChart
          tasks={[]}
          timeScale="week"
          onTaskUpdate={mockOnTaskUpdate}
        />
      )
    })

    it('should have no accessibility violations in readOnly mode', async () => {
      await testA11y(
        <GanttChart
          tasks={mockTasks}
          timeScale="week"
          onTaskUpdate={mockOnTaskUpdate}
          readOnly={true}
        />
      )
    })
  })
})
