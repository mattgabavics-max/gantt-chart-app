/**
 * Version Diff Viewer Component
 * Shows side-by-side comparison of two project versions
 */

import React, { useMemo } from 'react'
import { useVersionHistory } from '../../contexts/VersionContext'
import { Task } from '../../types/gantt'
import { VersionDiff, ModifiedTask } from '../../types/version'
import { formatChangeDescription, formatVersionDateTime } from '../../utils/versionUtils'

export interface VersionDiffViewerProps {
  versionId1: string // Older version (left side)
  versionId2: string // Newer version (right side)
  onClose?: () => void
  showGanttPreview?: boolean
}

export const VersionDiffViewer: React.FC<VersionDiffViewerProps> = ({
  versionId1,
  versionId2,
  onClose,
  showGanttPreview = true,
}) => {
  const { versions, getDiff } = useVersionHistory()

  const version1 = useMemo(
    () => versions.find((v) => v.id === versionId1),
    [versions, versionId1]
  )
  const version2 = useMemo(
    () => versions.find((v) => v.id === versionId2),
    [versions, versionId2]
  )

  const diff = useMemo(() => {
    if (!version1 || !version2) return null
    return getDiff(versionId1, versionId2)
  }, [version1, version2, versionId1, versionId2, getDiff])

  if (!version1 || !version2 || !diff) {
    return (
      <div className="p-8 text-center text-gray-500">
        Unable to load version comparison
      </div>
    )
  }

  const renderTaskBar = (task: Task, highlight: 'none' | 'added' | 'removed' | 'modified') => {
    const colorClass =
      highlight === 'added'
        ? 'bg-green-100 border-green-500'
        : highlight === 'removed'
        ? 'bg-red-100 border-red-500'
        : highlight === 'modified'
        ? 'bg-yellow-100 border-yellow-500'
        : 'bg-gray-100 border-gray-300'

    return (
      <div
        className={`p-3 mb-2 rounded-lg border-2 ${colorClass} transition-all hover:shadow-md`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: task.color }}
                title={`Color: ${task.color}`}
              />
              <span className="font-medium text-gray-900">{task.name}</span>
              {task.isMilestone && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  Milestone
                </span>
              )}
            </div>
            <div className="text-xs text-gray-600 space-y-0.5">
              <div>
                Start: {new Date(task.startDate).toLocaleDateString()} | End:{' '}
                {new Date(task.endDate).toLocaleDateString()}
              </div>
              {task.progress !== undefined && <div>Progress: {task.progress}%</div>}
              <div>Position: {task.position}</div>
            </div>
          </div>
          {highlight !== 'none' && (
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${
                highlight === 'added'
                  ? 'bg-green-200 text-green-800'
                  : highlight === 'removed'
                  ? 'bg-red-200 text-red-800'
                  : 'bg-yellow-200 text-yellow-800'
              }`}
            >
              {highlight.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    )
  }

  const renderModifiedTask = (modified: ModifiedTask) => {
    return (
      <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
        <div className="font-medium text-gray-900 mb-3 flex items-center">
          <span className="text-yellow-700 mr-2">Modified:</span>
          {modified.after.name}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Before */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">BEFORE</div>
            {renderTaskBar(modified.before, 'none')}
          </div>

          {/* After */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">AFTER</div>
            {renderTaskBar(modified.after, 'none')}
          </div>
        </div>

        {/* Changes list */}
        <div className="mt-3 pt-3 border-t border-yellow-200">
          <div className="text-xs font-medium text-gray-700 mb-2">Changes:</div>
          <ul className="space-y-1">
            {modified.changes.map((change, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-start">
                <svg
                  className="w-3 h-3 mr-1 mt-0.5 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                    clipRule="evenodd"
                  />
                </svg>
                {formatChangeDescription(change)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  const totalChanges = diff.added.length + diff.removed.length + diff.modified.length

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Version Comparison</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Version info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-3 rounded border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">FROM</div>
            <div className="font-medium text-gray-900">Version {version1.versionNumber}</div>
            <div className="text-xs text-gray-600">{formatVersionDateTime(version1.createdAt)}</div>
            <div className="text-xs text-gray-500">{version1.snapshot.metadata.totalTasks} tasks</div>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">TO</div>
            <div className="font-medium text-gray-900">Version {version2.versionNumber}</div>
            <div className="text-xs text-gray-600">{formatVersionDateTime(version2.createdAt)}</div>
            <div className="text-xs text-gray-500">{version2.snapshot.metadata.totalTasks} tasks</div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-3 flex items-center justify-around p-3 bg-white rounded border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{diff.added.length}</div>
            <div className="text-xs text-gray-600">Added</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{diff.modified.length}</div>
            <div className="text-xs text-gray-600">Modified</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{diff.removed.length}</div>
            <div className="text-xs text-gray-600">Removed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalChanges}</div>
            <div className="text-xs text-gray-600">Total Changes</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {totalChanges === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium">No changes between versions</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Added tasks */}
            {diff.added.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Added Tasks ({diff.added.length})
                </h3>
                {diff.added.map((task) => (
                  <div key={task.id}>{renderTaskBar(task, 'added')}</div>
                ))}
              </div>
            )}

            {/* Modified tasks */}
            {diff.modified.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Modified Tasks ({diff.modified.length})
                </h3>
                {diff.modified.map((modified) => (
                  <div key={modified.taskId}>{renderModifiedTask(modified)}</div>
                ))}
              </div>
            )}

            {/* Removed tasks */}
            {diff.removed.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Removed Tasks ({diff.removed.length})
                </h3>
                {diff.removed.map((task) => (
                  <div key={task.id}>{renderTaskBar(task, 'removed')}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default VersionDiffViewer
