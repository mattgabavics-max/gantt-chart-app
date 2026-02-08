/**
 * Time Scale Utilities Usage Examples
 */

import React, { useState } from 'react'
import {
  generateTimeHeaders,
  calculateTaskPosition,
  snapToGrid,
  getVisibleDateRange,
  getDatePosition,
  getDateAtPosition,
  formatPeriodLabel,
  addPeriod,
  type TimeScale,
} from '../utils/timeScaleUtils'
import type { Task } from '../types/api'

// ==================== Example 1: Time Header Generation ====================

export const TimeHeaderExample: React.FC = () => {
  const [scale, setScale] = useState<TimeScale>('week')

  const startDate = new Date('2024-06-01')
  const endDate = new Date('2024-06-30')

  const { primaryHeaders, secondaryHeaders } = generateTimeHeaders(
    startDate,
    endDate,
    scale
  )

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Time Header Generation</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Scale:</label>
        <select
          value={scale}
          onChange={(e) => setScale(e.target.value as TimeScale)}
          className="border rounded px-3 py-2"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="sprint">Sprint</option>
          <option value="month">Month</option>
          <option value="quarter">Quarter</option>
        </select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Primary Headers */}
        <div className="flex border-b bg-gray-50">
          {primaryHeaders.map((header) => (
            <div
              key={header.id}
              className="border-r px-2 py-2 text-xs font-medium text-center"
              style={{ width: header.width }}
            >
              {header.label}
            </div>
          ))}
        </div>

        {/* Secondary Headers */}
        {secondaryHeaders.length > 0 && (
          <div className="flex bg-white">
            {secondaryHeaders.map((header) => (
              <div
                key={header.id}
                className={`border-r px-2 py-2 text-xs text-center ${
                  header.isWeekend ? 'bg-gray-100' : ''
                } ${header.isToday ? 'bg-blue-100 font-bold' : ''}`}
                style={{ width: header.width }}
              >
                {header.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>Primary headers: {primaryHeaders.length}</p>
        <p>Secondary headers: {secondaryHeaders.length}</p>
      </div>
    </div>
  )
}

// ==================== Example 2: Task Positioning ====================

export const TaskPositioningExample: React.FC = () => {
  const [scale, setScale] = useState<TimeScale>('day')

  const startDate = new Date('2024-06-01')
  const endDate = new Date('2024-06-30')

  const mockTasks: Partial<Task>[] = [
    {
      id: '1',
      name: 'Task 1',
      startDate: new Date('2024-06-05'),
      endDate: new Date('2024-06-10'),
      color: '#3b82f6',
    },
    {
      id: '2',
      name: 'Task 2',
      startDate: new Date('2024-06-12'),
      endDate: new Date('2024-06-18'),
      color: '#10b981',
    },
    {
      id: '3',
      name: 'Task 3',
      startDate: new Date('2024-06-08'),
      endDate: new Date('2024-06-22'),
      color: '#f59e0b',
    },
  ]

  const positions = mockTasks.map((task) =>
    calculateTaskPosition(task as Task, startDate, endDate, scale)
  )

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Task Positioning</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Scale:</label>
        <select
          value={scale}
          onChange={(e) => setScale(e.target.value as TimeScale)}
          className="border rounded px-3 py-2"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="relative h-64">
          {mockTasks.map((task, index) => {
            const position = positions[index]
            return (
              <div
                key={task.id}
                className="absolute rounded px-2 py-1 text-xs text-white font-medium"
                style={{
                  left: position.left,
                  width: position.width,
                  top: index * 50 + 20,
                  backgroundColor: task.color,
                }}
              >
                {task.name}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {mockTasks.map((task, index) => (
          <div key={task.id} className="flex justify-between">
            <span>{task.name}</span>
            <span className="text-gray-600">
              Left: {positions[index].left}px, Width: {positions[index].width}px
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== Example 3: Date Snapping ====================

export const DateSnappingExample: React.FC = () => {
  const [scale, setScale] = useState<TimeScale>('day')
  const [inputDate, setInputDate] = useState('2024-06-15T14:30:00')

  const originalDate = new Date(inputDate)
  const snappedDate = snapToGrid(originalDate, scale)

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Date Snapping</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Scale:</label>
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value as TimeScale)}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="sprint">Sprint</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Input Date:</label>
          <input
            type="datetime-local"
            value={inputDate}
            onChange={(e) => setInputDate(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
          <div>
            <strong>Original:</strong> {originalDate.toLocaleString()}
          </div>
          <div>
            <strong>Snapped:</strong> {snappedDate.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">
            Snapped to {scale} boundary
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Example 4: Visible Date Range ====================

export const VisibleDateRangeExample: React.FC = () => {
  const [scale, setScale] = useState<TimeScale>('week')
  const [centerDate, setCenterDate] = useState('2024-06-15')

  const range = getVisibleDateRange(scale, new Date(centerDate))

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Visible Date Range</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Scale:</label>
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value as TimeScale)}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="day">Day (30 days)</option>
            <option value="week">Week (12 weeks)</option>
            <option value="sprint">Sprint (8 sprints)</option>
            <option value="month">Month (12 months)</option>
            <option value="quarter">Quarter (8 quarters)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Center Date:</label>
          <input
            type="date"
            value={centerDate}
            onChange={(e) => setCenterDate(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
          <div>
            <strong>Start Date:</strong> {range.startDate.toLocaleDateString()}
          </div>
          <div>
            <strong>End Date:</strong> {range.endDate.toLocaleDateString()}
          </div>
          <div>
            <strong>Total Days:</strong> {range.totalDays}
          </div>
          <div>
            <strong>Total Width:</strong> {range.totalWidth}px
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Example 5: Date Position Conversion ====================

export const DatePositionExample: React.FC = () => {
  const [scale, setScale] = useState<TimeScale>('day')
  const [pixelPosition, setPixelPosition] = useState(200)

  const startDate = new Date('2024-06-01')
  const endDate = new Date('2024-06-30')
  const targetDate = new Date('2024-06-15')

  const calculatedPosition = getDatePosition(targetDate, startDate, endDate, scale)
  const dateAtPosition = getDateAtPosition(pixelPosition, startDate, scale)

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Date ↔ Position Conversion</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Scale:</label>
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value as TimeScale)}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>

        <div className="border rounded-lg p-4 bg-blue-50">
          <h3 className="font-semibold mb-2">Date → Position</h3>
          <div>
            Date: <strong>{targetDate.toLocaleDateString()}</strong>
          </div>
          <div>
            Position: <strong>{calculatedPosition}px</strong>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-green-50">
          <h3 className="font-semibold mb-2">Position → Date</h3>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">
              Pixel Position:
            </label>
            <input
              type="number"
              value={pixelPosition}
              onChange={(e) => setPixelPosition(Number(e.target.value))}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            Date: <strong>{dateAtPosition.toLocaleDateString()}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Example 6: Period Operations ====================

export const PeriodOperationsExample: React.FC = () => {
  const [scale, setScale] = useState<TimeScale>('day')
  const [startDate, setStartDate] = useState('2024-06-15')
  const [count, setCount] = useState(5)

  const baseDate = new Date(startDate)
  const resultDate = addPeriod(baseDate, count, scale)

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Period Operations</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Scale:</label>
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value as TimeScale)}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="day">Days</option>
            <option value="week">Weeks</option>
            <option value="sprint">Sprints</option>
            <option value="month">Months</option>
            <option value="quarter">Quarters</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Add/Subtract Count:
          </label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
          <div>
            <strong>Operation:</strong> Add {count} {scale}(s)
          </div>
          <div>
            <strong>From:</strong> {baseDate.toLocaleDateString()}
          </div>
          <div>
            <strong>To:</strong> {resultDate.toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Combined Example ====================

export const TimeScaleUtilitiesDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)

  const examples = [
    { title: 'Time Headers', component: <TimeHeaderExample /> },
    { title: 'Task Positioning', component: <TaskPositioningExample /> },
    { title: 'Date Snapping', component: <DateSnappingExample /> },
    { title: 'Visible Range', component: <VisibleDateRangeExample /> },
    { title: 'Date Position', component: <DatePositionExample /> },
    { title: 'Period Operations', component: <PeriodOperationsExample /> },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Time Scale Utilities Demo</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {examples.map((example, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === index
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {example.title}
          </button>
        ))}
      </div>

      {/* Active Example */}
      <div className="bg-white rounded-lg shadow-lg">
        {examples[activeTab].component}
      </div>
    </div>
  )
}
