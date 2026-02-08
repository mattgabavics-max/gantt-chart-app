import React, { useState, useRef, useEffect } from 'react'
import { TimeScale } from '../../types/gantt'

export interface ProjectHeaderProps {
  projectName: string
  projectId: string
  timeScale: TimeScale
  onProjectNameChange: (newName: string) => void
  onTimeScaleChange: (newScale: TimeScale) => void
  onShare?: () => void
  onVersionHistory?: () => void
  isSaving?: boolean
  lastSaved?: Date
  isOwner?: boolean
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  projectName,
  projectId,
  timeScale,
  onProjectNameChange,
  onTimeScaleChange,
  onShare,
  onVersionHistory,
  isSaving = false,
  lastSaved,
  isOwner = true,
}) => {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(projectName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditedName(projectName)
  }, [projectName])

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingName])

  const handleNameClick = () => {
    if (isOwner) {
      setIsEditingName(true)
    }
  }

  const handleNameSave = () => {
    const trimmedName = editedName.trim()
    if (trimmedName && trimmedName !== projectName) {
      onProjectNameChange(trimmedName)
    } else {
      setEditedName(projectName)
    }
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave()
    } else if (e.key === 'Escape') {
      setEditedName(projectName)
      setIsEditingName(false)
    }
  }

  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)

    if (seconds < 10) {
      return 'Saved just now'
    } else if (seconds < 60) {
      return `Saved ${seconds}s ago`
    } else if (minutes < 60) {
      return `Saved ${minutes}m ago`
    } else {
      return `Saved at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left section - Project name */}
        <div className="flex items-center space-x-4">
          {isEditingName ? (
            <input
              ref={inputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              className="text-xl font-semibold text-gray-900 border-2 border-blue-500 rounded px-2 py-1 focus:outline-none"
              maxLength={200}
            />
          ) : (
            <h1
              className={`text-xl font-semibold text-gray-900 ${
                isOwner ? 'cursor-pointer hover:text-blue-600' : ''
              } transition-colors`}
              onClick={handleNameClick}
              title={isOwner ? 'Click to edit' : ''}
            >
              {projectName}
              {isOwner && (
                <svg
                  className="inline-block w-4 h-4 ml-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              )}
            </h1>
          )}

          {/* Save indicator */}
          <div className="flex items-center space-x-2 text-sm">
            {isSaving ? (
              <span className="flex items-center text-blue-600">
                <svg
                  className="animate-spin h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center text-gray-500">
                <svg
                  className="w-4 h-4 mr-1 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {formatLastSaved(lastSaved)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Right section - Controls */}
        <div className="flex items-center space-x-3">
          {/* Time scale selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">View:</label>
            <select
              value={timeScale}
              onChange={(e) => onTimeScaleChange(e.target.value as TimeScale)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="sprint">Sprint</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
            </select>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300" />

          {/* Version history button */}
          {onVersionHistory && (
            <button
              onClick={onVersionHistory}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="View version history"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>History</span>
            </button>
          )}

          {/* Share button */}
          {onShare && isOwner && (
            <button
              onClick={onShare}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Share project"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span>Share</span>
            </button>
          )}
        </div>
      </div>

      {/* Project ID (for debugging/development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-400">
          Project ID: {projectId}
        </div>
      )}
    </div>
  )
}

export default ProjectHeader
