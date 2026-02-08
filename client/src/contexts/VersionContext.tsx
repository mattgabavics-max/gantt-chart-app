/**
 * Version History Context
 * Provides version management state and actions to components
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  ProjectVersion,
  VersionHistoryState,
  VersionHistoryActions,
  AutoVersionConfig,
  DEFAULT_AUTO_VERSION_CONFIG,
  VersionDiff,
} from '../types/version'
import { Task } from '../types/gantt'
import {
  calculateVersionDiff,
  shouldCreateAutoVersion,
  generateAutoVersionDescription,
} from '../utils/versionUtils'

interface VersionContextValue extends VersionHistoryState, VersionHistoryActions {
  autoVersionConfig: AutoVersionConfig
  setAutoVersionConfig: (config: AutoVersionConfig) => void
  getCurrentVersion: () => ProjectVersion | null
  getCompareVersion: () => ProjectVersion | null
  getDiff: (versionId1: string, versionId2: string) => VersionDiff | null
}

const VersionContext = createContext<VersionContextValue | null>(null)

export const useVersionHistory = () => {
  const context = useContext(VersionContext)
  if (!context) {
    throw new Error('useVersionHistory must be used within a VersionProvider')
  }
  return context
}

interface VersionProviderProps {
  children: ReactNode
  apiBaseUrl?: string
}

export const VersionProvider: React.FC<VersionProviderProps> = ({
  children,
  apiBaseUrl = '/api',
}) => {
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null)
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoVersionConfig, setAutoVersionConfig] = useState<AutoVersionConfig>(
    DEFAULT_AUTO_VERSION_CONFIG
  )

  /**
   * Load versions for a project
   */
  const loadVersions = useCallback(
    async (projectId: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${apiBaseUrl}/projects/${projectId}/versions`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to load versions')
        }

        const data = await response.json()
        const loadedVersions: ProjectVersion[] = data.versions.map((v: any) => ({
          ...v,
          createdAt: new Date(v.createdAt),
          snapshot: {
            ...v.snapshot,
            tasks: v.snapshot.tasks.map((t: any) => ({
              ...t,
              startDate: new Date(t.startDate),
              endDate: new Date(t.endDate),
            })),
            metadata: {
              ...v.snapshot.metadata,
              dateRange: {
                start: new Date(v.snapshot.metadata.dateRange.start),
                end: new Date(v.snapshot.metadata.dateRange.end),
              },
            },
          },
        }))

        setVersions(loadedVersions)

        // Set current version to the latest
        if (loadedVersions.length > 0) {
          setCurrentVersionId(loadedVersions[0].id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Error loading versions:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [apiBaseUrl]
  )

  /**
   * Create a new version
   */
  const createVersion = useCallback(
    async (projectId: string, description?: string, isAutomatic = false) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${apiBaseUrl}/projects/${projectId}/versions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            description,
            isAutomatic,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create version')
        }

        const data = await response.json()
        const newVersion: ProjectVersion = {
          ...data.version,
          createdAt: new Date(data.version.createdAt),
          snapshot: {
            ...data.version.snapshot,
            tasks: data.version.snapshot.tasks.map((t: any) => ({
              ...t,
              startDate: new Date(t.startDate),
              endDate: new Date(t.endDate),
            })),
            metadata: {
              ...data.version.snapshot.metadata,
              dateRange: {
                start: new Date(data.version.snapshot.metadata.dateRange.start),
                end: new Date(data.version.snapshot.metadata.dateRange.end),
              },
            },
          },
        }

        setVersions((prev) => [newVersion, ...prev])
        setCurrentVersionId(newVersion.id)

        // Cleanup old versions if exceeds max
        if (
          autoVersionConfig.enabled &&
          versions.length >= autoVersionConfig.maxVersionsToKeep
        ) {
          const versionsToDelete = versions
            .filter((v) => v.isAutomatic)
            .slice(autoVersionConfig.maxVersionsToKeep)

          for (const version of versionsToDelete) {
            await deleteVersion(version.id)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Error creating version:', err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [apiBaseUrl, versions, autoVersionConfig]
  )

  /**
   * Restore a version
   */
  const restoreVersion = useCallback(
    async (versionId: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const version = versions.find((v) => v.id === versionId)
        if (!version) {
          throw new Error('Version not found')
        }

        const response = await fetch(
          `${apiBaseUrl}/projects/${version.projectId}/versions/${versionId}/restore`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to restore version')
        }

        // Reload versions to get the new current state
        await loadVersions(version.projectId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Error restoring version:', err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [apiBaseUrl, versions, loadVersions]
  )

  /**
   * Delete a version
   */
  const deleteVersion = useCallback(
    async (versionId: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const version = versions.find((v) => v.id === versionId)
        if (!version) {
          throw new Error('Version not found')
        }

        const response = await fetch(
          `${apiBaseUrl}/projects/${version.projectId}/versions/${versionId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to delete version')
        }

        setVersions((prev) => prev.filter((v) => v.id !== versionId))

        if (currentVersionId === versionId) {
          setCurrentVersionId(versions[0]?.id || null)
        }

        if (compareVersionId === versionId) {
          setCompareVersionId(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Error deleting version:', err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [apiBaseUrl, versions, currentVersionId, compareVersionId]
  )

  /**
   * Get current version
   */
  const getCurrentVersion = useCallback((): ProjectVersion | null => {
    if (!currentVersionId) return null
    return versions.find((v) => v.id === currentVersionId) || null
  }, [versions, currentVersionId])

  /**
   * Get compare version
   */
  const getCompareVersion = useCallback((): ProjectVersion | null => {
    if (!compareVersionId) return null
    return versions.find((v) => v.id === compareVersionId) || null
  }, [versions, compareVersionId])

  /**
   * Get diff between two versions
   */
  const getDiff = useCallback(
    (versionId1: string, versionId2: string): VersionDiff | null => {
      const v1 = versions.find((v) => v.id === versionId1)
      const v2 = versions.find((v) => v.id === versionId2)

      if (!v1 || !v2) return null

      return calculateVersionDiff(v1, v2)
    },
    [versions]
  )

  /**
   * Check and create auto-version if needed
   */
  const checkAutoVersion = useCallback(
    async (projectId: string, currentTasks: Task[], previousTasks: Task[]) => {
      if (!autoVersionConfig.enabled) return

      // Create temporary version objects for diff calculation
      const tempOldVersion: ProjectVersion = {
        id: 'temp-old',
        versionNumber: 0,
        projectId,
        createdAt: new Date(),
        createdBy: { id: '', name: '', email: '' },
        snapshot: {
          projectName: '',
          tasks: previousTasks,
          metadata: {
            totalTasks: previousTasks.length,
            dateRange: { start: new Date(), end: new Date() },
          },
        },
        isAutomatic: true,
      }

      const tempNewVersion: ProjectVersion = {
        id: 'temp-new',
        versionNumber: 1,
        projectId,
        createdAt: new Date(),
        createdBy: { id: '', name: '', email: '' },
        snapshot: {
          projectName: '',
          tasks: currentTasks,
          metadata: {
            totalTasks: currentTasks.length,
            dateRange: { start: new Date(), end: new Date() },
          },
        },
        isAutomatic: true,
      }

      const diff = calculateVersionDiff(tempOldVersion, tempNewVersion)

      if (shouldCreateAutoVersion(diff, autoVersionConfig)) {
        const description = generateAutoVersionDescription(diff)
        await createVersion(projectId, description, true)
      }
    },
    [autoVersionConfig, createVersion]
  )

  const value: VersionContextValue = {
    versions,
    currentVersionId,
    compareVersionId,
    isLoading,
    error,
    loadVersions,
    createVersion,
    restoreVersion,
    setCompareVersion: setCompareVersionId,
    deleteVersion,
    autoVersionConfig,
    setAutoVersionConfig,
    getCurrentVersion,
    getCompareVersion,
    getDiff,
  }

  return <VersionContext.Provider value={value}>{children}</VersionContext.Provider>
}
