/**
 * Loading State Components
 * Skeleton loaders and spinners for different views
 */

import React from 'react'

// ==================== Spinner ====================

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white'
  className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  }

  const colorClasses = {
    primary: 'border-blue-600 border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent',
  }

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// ==================== Full Page Spinner ====================

export const FullPageSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <div
    className="flex flex-col items-center justify-center min-h-screen bg-gray-50"
    role="status"
    aria-live="polite"
  >
    <Spinner size="xl" />
    {message && (
      <p className="mt-4 text-lg text-gray-600" aria-live="polite">
        {message}
      </p>
    )}
  </div>
)

// ==================== Inline Spinner ====================

export const InlineSpinner: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="flex items-center gap-2" role="status" aria-live="polite">
    <Spinner size="sm" />
    <span className="text-sm text-gray-600">{text}</span>
  </div>
)

// ==================== Skeleton Components ====================

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    role="status"
    aria-label="Loading content"
  >
    <span className="sr-only">Loading...</span>
  </div>
)

// ==================== Project List Skeleton ====================

export const ProjectListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3" role="status" aria-label="Loading projects">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Title */}
            <Skeleton className="h-6 w-2/3 mb-3" />

            {/* Description */}
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/5 mb-3" />

            {/* Metadata */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Actions */}
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    ))}
  </div>
)

// ==================== Gantt Chart Skeleton ====================

export const GanttChartSkeleton: React.FC = () => (
  <div className="w-full h-full p-4" role="status" aria-label="Loading chart">
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Timeline header */}
      <div className="flex gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-12 flex-1" />
        ))}
      </div>

      {/* Task rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {/* Task name */}
          <Skeleton className="h-10 w-48" />

          {/* Task bar */}
          <div className="flex-1 relative h-10">
            <Skeleton
              className="h-8 absolute"
              style={{
                left: `${Math.random() * 30}%`,
                width: `${20 + Math.random() * 40}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
)

// ==================== Task List Skeleton ====================

export const TaskListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-2" role="status" aria-label="Loading tasks">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 bg-white border rounded">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="h-5 flex-1" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
    ))}
  </div>
)

// ==================== Version List Skeleton ====================

export const VersionListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3" role="status" aria-label="Loading versions">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-4 bg-white border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    ))}
  </div>
)

// ==================== Card Skeleton ====================

export const CardSkeleton: React.FC = () => (
  <div className="p-6 bg-white border rounded-lg" role="status">
    <Skeleton className="h-8 w-48 mb-4" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-3/4 mb-4" />
    <div className="flex gap-2">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
)

// ==================== Table Skeleton ====================

export const TableSkeleton: React.FC<{
  rows?: number
  columns?: number
}> = ({ rows = 5, columns = 4 }) => (
  <div className="w-full overflow-x-auto" role="status" aria-label="Loading table">
    <table className="w-full">
      <thead>
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="p-3 text-left">
              <Skeleton className="h-5 w-24" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="border-t">
            {Array.from({ length: columns }).map((_, j) => (
              <td key={j} className="p-3">
                <Skeleton className="h-5 w-full" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

// ==================== Progressive Loading ====================

export interface ProgressiveLoaderProps {
  isLoading: boolean
  itemsLoaded: number
  totalItems: number
  children: React.ReactNode
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  isLoading,
  itemsLoaded,
  totalItems,
  children,
}) => {
  const progress = totalItems > 0 ? (itemsLoaded / totalItems) * 100 : 0

  return (
    <div className="relative">
      {children}

      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <div className="mt-4 w-64">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Loading...</span>
              <span>
                {itemsLoaded} / {totalItems}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== Loading Overlay ====================

export interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  children: React.ReactNode
  blur?: boolean
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message,
  children,
  blur = true,
}) => (
  <div className="relative">
    <div className={isLoading && blur ? 'filter blur-sm' : ''}>{children}</div>

    {isLoading && (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90"
        role="status"
        aria-live="polite"
      >
        <Spinner size="lg" />
        {message && <p className="mt-4 text-gray-600">{message}</p>}
      </div>
    )}
  </div>
)

// ==================== Pulse Loader (for in-progress actions) ====================

export const PulseLoader: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="flex items-center gap-1" role="status" aria-label="Loading">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
)

// ==================== Skeleton Text Lines ====================

export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className="h-4"
        style={{
          width: i === lines - 1 ? '75%' : '100%',
        }}
      />
    ))}
  </div>
)
