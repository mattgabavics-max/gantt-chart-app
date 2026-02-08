import React, { useState } from 'react'
import { GanttChart } from './GanttChart'
import { Task, TimeScale } from '../../types/gantt'

/**
 * Example component demonstrating GanttChart usage
 */
export const GanttChartExample: React.FC = () => {
  const [timeScale, setTimeScale] = useState<TimeScale>('week')
  const [readOnly, setReadOnly] = useState(false)

  // Sample tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: 'Project Planning',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-14'),
      color: '#3b82f6',
      position: 0,
      projectId: 'project-1',
      progress: 100,
    },
    {
      id: '2',
      name: 'Design Phase',
      startDate: new Date('2026-02-15'),
      endDate: new Date('2026-03-01'),
      color: '#8b5cf6',
      position: 1,
      projectId: 'project-1',
      progress: 75,
    },
    {
      id: '3',
      name: 'Development Sprint 1',
      startDate: new Date('2026-03-02'),
      endDate: new Date('2026-03-16'),
      color: '#10b981',
      position: 2,
      projectId: 'project-1',
      progress: 50,
    },
    {
      id: '4',
      name: 'Development Sprint 2',
      startDate: new Date('2026-03-17'),
      endDate: new Date('2026-03-31'),
      color: '#10b981',
      position: 3,
      projectId: 'project-1',
      progress: 25,
    },
    {
      id: '5',
      name: 'Testing & QA',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-15'),
      color: '#f59e0b',
      position: 4,
      projectId: 'project-1',
      progress: 0,
    },
    {
      id: '6',
      name: 'Launch',
      startDate: new Date('2026-04-16'),
      endDate: new Date('2026-04-16'),
      color: '#ef4444',
      position: 5,
      projectId: 'project-1',
      isMilestone: true,
    },
  ])

  // Handle task updates from drag and drop
  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    )

    // Here you would typically call your API to persist the changes
    console.log('Task updated:', { taskId, updates })
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Controls */}
      <div className="bg-white border-b border-gray-300 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Gantt Chart Example</h1>

          <div className="flex items-center space-x-4">
            {/* Time scale selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Time Scale:</label>
              <select
                value={timeScale}
                onChange={(e) => setTimeScale(e.target.value as TimeScale)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="sprint">Sprint (2 weeks)</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
              </select>
            </div>

            {/* Read-only toggle */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={readOnly}
                  onChange={(e) => setReadOnly(e.target.checked)}
                  className="mr-2"
                />
                Read-only
              </label>
            </div>

            {/* Add task button */}
            <button
              onClick={() => {
                const newTask: Task = {
                  id: `task-${Date.now()}`,
                  name: `New Task ${tasks.length + 1}`,
                  startDate: new Date(),
                  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
                  color: '#6366f1',
                  position: tasks.length,
                  projectId: 'project-1',
                  progress: 0,
                }
                setTasks([...tasks, newTask])
              }}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Try it:</strong> Drag tasks horizontally to change dates, or drag the edges to resize duration.
            Toggle the time scale to see different views. Turn on read-only mode to disable editing.
          </p>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-hidden">
        <GanttChart
          tasks={tasks}
          timeScale={timeScale}
          onTaskUpdate={handleTaskUpdate}
          readOnly={readOnly}
          showWeekends={true}
          showToday={true}
        />
      </div>

      {/* Task info panel */}
      <div className="bg-white border-t border-gray-300 px-6 py-3">
        <div className="text-sm text-gray-600">
          <strong>Tasks:</strong> {tasks.length} total
          {' • '}
          <strong>Milestones:</strong> {tasks.filter(t => t.isMilestone).length}
          {' • '}
          <strong>Date Range:</strong>{' '}
          {new Date(Math.min(...tasks.map(t => new Date(t.startDate).getTime()))).toLocaleDateString()} -{' '}
          {new Date(Math.max(...tasks.map(t => new Date(t.endDate).getTime()))).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

export default GanttChartExample
