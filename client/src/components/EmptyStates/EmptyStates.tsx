/**
 * Empty State Components
 * Call-to-action components for empty data scenarios
 */

import React from 'react'

// ==================== Base Empty State ====================

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => (
  <div
    className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
    role="status"
    aria-label={title}
  >
    {icon && <div className="mb-4 text-gray-400">{icon}</div>}

    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

    {description && <p className="text-sm text-gray-600 mb-6 max-w-md">{description}</p>}

    {action && (
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-label={action.label}
        >
          {action.icon}
          {action.label}
        </button>

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="inline-flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:underline"
            aria-label={secondaryAction.label}
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    )}
  </div>
)

// ==================== No Projects ====================

export const NoProjects: React.FC<{
  onCreateProject: () => void
  onImport?: () => void
}> = ({ onCreateProject, onImport }) => (
  <EmptyState
    icon={
      <svg
        className="w-16 h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
    }
    title="No projects yet"
    description="Get started by creating your first project. You can add tasks, set timelines, and track progress all in one place."
    action={{
      label: 'Create Your First Project',
      onClick: onCreateProject,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
    }}
    secondaryAction={
      onImport
        ? {
            label: 'Import from file',
            onClick: onImport,
          }
        : undefined
    }
  />
)

// ==================== No Tasks ====================

export const NoTasks: React.FC<{
  onAddTask: () => void
  onImport?: () => void
}> = ({ onAddTask, onImport }) => (
  <EmptyState
    icon={
      <svg
        className="w-16 h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    }
    title="No tasks in this project"
    description="Start adding tasks to build your project timeline. Break down your work into manageable pieces and track progress."
    action={{
      label: 'Add Your First Task',
      onClick: onAddTask,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
    }}
    secondaryAction={
      onImport
        ? {
            label: 'Import tasks',
            onClick: onImport,
          }
        : undefined
    }
  />
)

// ==================== No Versions ====================

export const NoVersions: React.FC<{
  onCreateVersion: () => void
}> = ({ onCreateVersion }) => (
  <EmptyState
    icon={
      <svg
        className="w-16 h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    }
    title="No saved versions"
    description="Create snapshots of your project to track changes over time. You can restore previous versions at any time."
    action={{
      label: 'Save Current Version',
      onClick: onCreateVersion,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
          />
        </svg>
      ),
    }}
  />
)

// ==================== No Search Results ====================

export const NoSearchResults: React.FC<{
  searchQuery: string
  onClear: () => void
}> = ({ searchQuery, onClear }) => (
  <EmptyState
    icon={
      <svg
        className="w-16 h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    }
    title="No results found"
    description={`We couldn't find any results for "${searchQuery}". Try adjusting your search terms.`}
    action={{
      label: 'Clear Search',
      onClick: onClear,
    }}
  />
)

// ==================== No Team Members ====================

export const NoTeamMembers: React.FC<{
  onInvite: () => void
}> = ({ onInvite }) => (
  <EmptyState
    icon={
      <svg
        className="w-16 h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    }
    title="No team members yet"
    description="Invite team members to collaborate on this project. They'll be able to view and edit tasks based on their permissions."
    action={{
      label: 'Invite Team Members',
      onClick: onInvite,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
    }}
  />
)

// ==================== Error State ====================

export const ErrorState: React.FC<{
  title?: string
  description?: string
  onRetry?: () => void
  onGoBack?: () => void
}> = ({
  title = 'Something went wrong',
  description = 'An error occurred while loading this content. Please try again.',
  onRetry,
  onGoBack,
}) => (
  <EmptyState
    icon={
      <svg
        className="w-16 h-16 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    }
    title={title}
    description={description}
    action={
      onRetry
        ? {
            label: 'Try Again',
            onClick: onRetry,
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            ),
          }
        : undefined
    }
    secondaryAction={
      onGoBack
        ? {
            label: 'Go Back',
            onClick: onGoBack,
          }
        : undefined
    }
  />
)

// ==================== Offline State ====================

export const OfflineState: React.FC<{
  onRetry?: () => void
}> = ({ onRetry }) => (
  <EmptyState
    icon={
      <svg
        className="w-16 h-16 text-orange-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>
    }
    title="You're offline"
    description="It looks like you've lost your internet connection. Some features may not be available until you're back online."
    action={
      onRetry
        ? {
            label: 'Try Again',
            onClick: onRetry,
          }
        : undefined
    }
  />
)

// ==================== Compact Empty State (for smaller areas) ====================

export const CompactEmptyState: React.FC<{
  icon?: React.ReactNode
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}> = ({ icon, message, action }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
    {icon && <div className="mb-2 text-gray-400">{icon}</div>}
    <p className="text-sm text-gray-600 mb-3">{message}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:underline"
        aria-label={action.label}
      >
        {action.label}
      </button>
    )}
  </div>
)

// ==================== Permission Denied ====================

export const PermissionDenied: React.FC<{
  onGoBack?: () => void
}> = ({ onGoBack }) => (
  <EmptyState
    icon={
      <svg
        className="w-16 h-16 text-yellow-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    }
    title="Access Denied"
    description="You don't have permission to view this content. Contact your administrator if you believe this is an error."
    action={
      onGoBack
        ? {
            label: 'Go Back',
            onClick: onGoBack,
          }
        : undefined
    }
  />
)
