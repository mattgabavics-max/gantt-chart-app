/**
 * SharedProjectView Component
 * Public viewer for shared projects (via share link)
 */

import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSharedProject, useAuth } from '../../hooks'
import type { Task } from '../../types/api'

// ==================== Component ====================

export const SharedProjectView: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  const [showCopyModal, setShowCopyModal] = useState(false)

  // Fetch shared project
  const {
    data: sharedData,
    isLoading,
    error,
  } = useSharedProject(token || '', {
    enabled: !!token,
  })

  // Handlers
  const handleCopyProject = () => {
    setShowCopyModal(true)
    // This would trigger a mutation to copy the project to the user's account
  }

  const handleGoToLogin = () => {
    // Store the current URL to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
    navigate('/login')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared project...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !sharedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid or Expired Link
          </h2>
          <p className="text-gray-600 mb-6">
            {error?.error?.message ||
              'This share link is invalid, has expired, or has been revoked.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  const { project, tasks, accessType, shareLink } = sharedData.data
  const isReadonly = accessType === 'readonly'
  const isExpiringSoon =
    shareLink.expiresAt &&
    new Date(shareLink.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000 // 24 hours

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div
        className={`${
          isReadonly ? 'bg-blue-600' : 'bg-green-600'
        } text-white px-4 py-3 shadow-md`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6"
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
            <div>
              <p className="font-medium">
                {isReadonly
                  ? 'Viewing Shared Project (Read-Only)'
                  : 'Viewing Shared Project (Editable)'}
              </p>
              {isExpiringSoon && shareLink.expiresAt && (
                <p className="text-sm opacity-90">
                  Expires{' '}
                  {new Date(shareLink.expiresAt).toLocaleDateString()} at{' '}
                  {new Date(shareLink.expiresAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={handleCopyProject}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy to My Projects
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm opacity-90">
                  Want to save this project?
                </p>
                <button
                  onClick={handleGoToLogin}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-gray-600">{project.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>{tasks.length} tasks</span>
                <span>•</span>
                <span>
                  Last updated{' '}
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {isAuthenticated && (
              <div className="text-sm text-gray-600">
                Viewing as <span className="font-medium">{user?.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Readonly Notice */}
        {isReadonly && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-medium text-blue-900">Read-Only Access</p>
                <p className="text-sm text-blue-700 mt-1">
                  You can view this project but cannot make changes. Sign in and
                  copy the project to edit it.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
          </div>

          {tasks.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No tasks in this project yet
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} isReadonly={isReadonly} />
              ))}
            </div>
          )}
        </div>

        {/* Gantt Chart Placeholder */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Gantt Chart View
          </h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="font-medium">Gantt chart visualization would appear here</p>
            <p className="text-sm mt-1">
              Timeline view of all tasks with dependencies and milestones
            </p>
          </div>
        </div>
      </div>

      {/* Copy Project Modal */}
      {showCopyModal && (
        <CopyProjectModal
          projectName={project.name}
          onClose={() => setShowCopyModal(false)}
          onConfirm={() => {
            // Handle copy project
            console.log('Copying project...')
            setShowCopyModal(false)
          }}
        />
      )}
    </div>
  )
}

// ==================== Task Row Component ====================

interface TaskRowProps {
  task: Task
  isReadonly: boolean
}

const TaskRow: React.FC<TaskRowProps> = ({ task, isReadonly }) => {
  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium text-gray-900">{task.name}</h3>
            {task.isMilestone && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                Milestone
              </span>
            )}
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                task.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : task.status === 'in-progress'
                  ? 'bg-blue-100 text-blue-700'
                  : task.status === 'blocked'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {task.status}
            </span>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              {new Date(task.startDate).toLocaleDateString()} -{' '}
              {new Date(task.endDate).toLocaleDateString()}
            </span>
            {task.assignees.length > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <span>Assigned to:</span>
                  <div className="flex -space-x-2">
                    {task.assignees.slice(0, 3).map((assignee, index) => (
                      <div
                        key={assignee.userId}
                        className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-700"
                        title={assignee.name}
                      >
                        {assignee.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {task.assignees.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                        +{task.assignees.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="ml-6 w-48">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span className="font-medium">{task.progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Copy Project Modal ====================

interface CopyProjectModalProps {
  projectName: string
  onClose: () => void
  onConfirm: () => void
}

const CopyProjectModal: React.FC<CopyProjectModalProps> = ({
  projectName,
  onClose,
  onConfirm,
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Copy Project to Your Account
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            This will create a copy of "{projectName}" in your projects. You will
            have full control over the copied version.
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Copy Project
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SharedProjectView
