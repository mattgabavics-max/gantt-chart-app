import React, { useState, useRef, useEffect } from 'react'

export interface TaskFormData {
  name: string
  startDate: string
  endDate: string
  color: string
}

export interface TaskCreationFormProps {
  onCreateTask: (task: TaskFormData) => void
  onCancel?: () => void
  defaultColor?: string
  inline?: boolean
}

const PRESET_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
]

export const TaskCreationForm: React.FC<TaskCreationFormProps> = ({
  onCreateTask,
  onCancel,
  defaultColor = '#3b82f6',
  inline = false,
}) => {
  const [taskName, setTaskName] = useState('')
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    return nextWeek.toISOString().split('T')[0]
  })
  const [color, setColor] = useState(defaultColor)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameInputRef = useRef<HTMLInputElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [])

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false)
      }
    }

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColorPicker])

  const validateForm = (): boolean => {
    if (!taskName.trim()) {
      setError('Task name is required')
      return false
    }

    if (!startDate || !endDate) {
      setError('Start and end dates are required')
      return false
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      setError('End date must be after start date')
      return false
    }

    setError(null)
    return true
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!validateForm()) {
      return
    }

    onCreateTask({
      name: taskName.trim(),
      startDate,
      endDate,
      color,
    })

    // Reset form
    setTaskName('')
    const today = new Date()
    setStartDate(today.toISOString().split('T')[0])
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    setEndDate(nextWeek.toISOString().split('T')[0])
    setColor(defaultColor)
    setError(null)

    // Focus back on name input for quick consecutive entries
    if (nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape' && onCancel) {
      onCancel()
    }
  }

  if (inline) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          {/* Color selector */}
          <div className="relative" ref={colorPickerRef}>
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ backgroundColor: color }}
              title="Choose color"
            />
            {showColorPicker && (
              <div className="absolute z-50 mt-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setColor(preset.value)
                        setShowColorPicker(false)
                      }}
                      className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full mt-2 h-8 rounded cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Task name */}
          <input
            ref={nameInputRef}
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Task name"
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={200}
          />

          {/* Start date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* End date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Submit button */}
          <button
            type="submit"
            className="px-4 py-1.5 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Add
          </button>

          {/* Cancel button */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-900 font-medium rounded hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          )}
        </form>

        {/* Error message */}
        {error && (
          <div className="mt-2 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Keyboard shortcut hint */}
        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
          <span>Press Enter to save • Esc to cancel</span>
        </div>
      </div>
    )
  }

  // Full form (non-inline)
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Task</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Name <span className="text-red-500">*</span>
          </label>
          <input
            ref={nameInputRef}
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter task name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={200}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Color picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div className="flex items-center space-x-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setColor(preset.value)}
                className={`w-8 h-8 rounded border-2 transition-all ${
                  color === preset.value
                    ? 'border-gray-900 ring-2 ring-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.name}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-8 rounded border-2 border-gray-300 cursor-pointer"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-600 flex items-center bg-red-50 p-3 rounded">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Create Task
          </button>
        </div>

        {/* Keyboard shortcuts help */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <strong>Keyboard shortcuts:</strong> Enter to save • Esc to cancel
        </div>
      </form>
    </div>
  )
}

export default TaskCreationForm
