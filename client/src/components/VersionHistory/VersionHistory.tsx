/**
 * Version History Component
 * Displays a side panel with project version history
 */

import React, { useState, useEffect } from 'react'
import { useVersionHistory } from '../../contexts/VersionContext'
import { ProjectVersion } from '../../types/version'
import { formatVersionDate, formatVersionDateTime, getDiffSummary } from '../../utils/versionUtils'

export interface VersionHistoryProps {
  projectId: string
  onClose: () => void
  onCompare?: (versionId: string) => void
  className?: string
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  projectId,
  onClose,
  onCompare,
  className = '',
}) => {
  const {
    versions,
    currentVersionId,
    compareVersionId,
    isLoading,
    error,
    loadVersions,
    createVersion,
    restoreVersion,
    deleteVersion,
    setCompareVersion,
    getDiff,
    autoVersionConfig,
    setAutoVersionConfig,
  } = useVersionHistory()

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)
  const [versionDescription, setVersionDescription] = useState('')

  useEffect(() => {
    loadVersions(projectId)
  }, [projectId, loadVersions])

  const handleCreateVersion = async () => {
    if (!versionDescription.trim()) {
      alert('Please enter a version description')
      return
    }

    try {
      setIsCreatingVersion(true)
      await createVersion(projectId, versionDescription, false)
      setVersionDescription('')
    } catch (err) {
      console.error('Failed to create version:', err)
    } finally {
      setIsCreatingVersion(false)
    }
  }

  const handleRestoreVersion = async (versionId: string) => {
    try {
      await restoreVersion(versionId)
      setShowRestoreConfirm(null)
      alert('Version restored successfully')
    } catch (err) {
      alert('Failed to restore version')
    }
  }

  const handleDeleteVersion = async (versionId: string) => {
    try {
      await deleteVersion(versionId)
      setShowDeleteConfirm(null)
    } catch (err) {
      alert('Failed to delete version')
    }
  }

  const handleCompareToggle = (versionId: string) => {
    if (compareVersionId === versionId) {
      setCompareVersion(null)
      if (onCompare) onCompare('')
    } else {
      setCompareVersion(versionId)
      if (onCompare) onCompare(versionId)
    }
  }

  const renderVersionItem = (version: ProjectVersion, index: number) => {
    const isSelected = selectedVersionId === version.id
    const isCurrent = currentVersionId === version.id
    const isComparing = compareVersionId === version.id

    // Get diff summary if comparing
    let diffSummary = ''
    if (currentVersionId && version.id !== currentVersionId) {
      const diff = getDiff(currentVersionId, version.id)
      if (diff) {
        diffSummary = getDiffSummary(diff)
      }
    }

    return (
      <div
        key={version.id}
        className={`border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
          isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
        } ${isComparing ? 'bg-yellow-50' : ''}`}
        onClick={() => setSelectedVersionId(isSelected ? null : version.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Version number and label */}
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-gray-900">
                Version {version.versionNumber}
              </span>
              {isCurrent && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                  Current
                </span>
              )}
              {version.isAutomatic && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  Auto
                </span>
              )}
              {isComparing && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                  Comparing
                </span>
              )}
            </div>

            {/* Description */}
            {version.changeDescription && (
              <p className="text-sm text-gray-600 mb-2">{version.changeDescription}</p>
            )}

            {/* Metadata */}
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <span title={formatVersionDateTime(version.createdAt)}>
                {formatVersionDate(version.createdAt)}
              </span>
              <span>•</span>
              <span>{version.createdBy.name}</span>
              <span>•</span>
              <span>{version.snapshot.metadata.totalTasks} tasks</span>
            </div>

            {/* Diff summary */}
            {diffSummary && (
              <div className="mt-2 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {diffSummary}
              </div>
            )}
          </div>

          {/* Actions button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedVersionId(version.id)
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>

        {/* Expanded actions */}
        {isSelected && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
            {!isCurrent && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowRestoreConfirm(version.id)
                  }}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Restore
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCompareToggle(version.id)
                  }}
                  className={`text-xs px-3 py-1.5 rounded transition-colors ${
                    isComparing
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {isComparing ? 'Stop Comparing' : 'Compare'}
                </button>
              </>
            )}
            {version.isAutomatic && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteConfirm(version.id)
                }}
                className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}

        {/* Restore confirmation */}
        {showRestoreConfirm === version.id && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800 mb-2">
              Restore to this version? Current changes will be saved as a new version.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRestoreVersion(version.id)
                }}
                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm Restore
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowRestoreConfirm(null)
                }}
                className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {showDeleteConfirm === version.id && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800 mb-2">Delete this version permanently?</p>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteVersion(version.id)
                }}
                className="text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirm Delete
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteConfirm(null)
                }}
                className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white border-l border-gray-200 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Auto-version settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
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
          </div>
        </div>

        {/* Auto-version settings */}
        {showSettings && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Auto-Version Settings</h3>
            <div className="space-y-2">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={autoVersionConfig.enabled}
                  onChange={(e) =>
                    setAutoVersionConfig({ ...autoVersionConfig, enabled: e.target.checked })
                  }
                  className="mr-2"
                />
                <span>Enable auto-versioning</span>
              </label>
              {autoVersionConfig.enabled && (
                <>
                  <label className="flex items-center text-sm ml-6">
                    <input
                      type="checkbox"
                      checked={autoVersionConfig.onTaskAdd}
                      onChange={(e) =>
                        setAutoVersionConfig({
                          ...autoVersionConfig,
                          onTaskAdd: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span>On task add</span>
                  </label>
                  <label className="flex items-center text-sm ml-6">
                    <input
                      type="checkbox"
                      checked={autoVersionConfig.onTaskDelete}
                      onChange={(e) =>
                        setAutoVersionConfig({
                          ...autoVersionConfig,
                          onTaskDelete: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span>On task delete</span>
                  </label>
                  <label className="flex items-center text-sm ml-6">
                    <input
                      type="checkbox"
                      checked={autoVersionConfig.onTaskModify}
                      onChange={(e) =>
                        setAutoVersionConfig({
                          ...autoVersionConfig,
                          onTaskModify: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span>On task modify</span>
                  </label>
                  <div className="ml-6">
                    <label className="text-sm text-gray-600">
                      Min changes: {autoVersionConfig.minChangeThreshold}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={autoVersionConfig.minChangeThreshold}
                      onChange={(e) =>
                        setAutoVersionConfig({
                          ...autoVersionConfig,
                          minChangeThreshold: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Create version form */}
        <div className="space-y-2">
          <input
            type="text"
            value={versionDescription}
            onChange={(e) => setVersionDescription(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateVersion()}
            placeholder="Enter version description..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreateVersion}
            disabled={isCreatingVersion || !versionDescription.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {isCreatingVersion ? 'Creating...' : 'Create New Version'}
          </button>
        </div>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && versions.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : versions.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 text-center">
            No versions yet. Create your first version above.
          </div>
        ) : (
          versions.map((version, index) => renderVersionItem(version, index))
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
        {versions.length} version{versions.length !== 1 ? 's' : ''} total
      </div>
    </div>
  )
}

export default VersionHistory
