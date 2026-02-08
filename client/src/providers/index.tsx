/**
 * Providers Index
 * Combines all providers for easy app setup
 */

import React, { ReactNode } from 'react'
import { QueryProvider } from './QueryProvider'
import { AuthProvider } from '../contexts/AuthContext'
import { ProjectProvider } from '../contexts/ProjectContext'
import { VersionProvider } from '../contexts/VersionContext'

// ==================== Combined Provider Props ====================

interface AppProvidersProps {
  children: ReactNode
  enableDevtools?: boolean
  autoSaveInterval?: number
  maxHistorySize?: number
}

// ==================== Combined Providers ====================

/**
 * AppProviders
 * Wraps the application with all necessary providers
 * Order matters: QueryProvider > AuthProvider > ProjectProvider > VersionProvider
 */
export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  enableDevtools = import.meta.env.DEV,
  autoSaveInterval = 5000,
  maxHistorySize = 50,
}) => {
  return (
    <QueryProvider enableDevtools={enableDevtools}>
      <AuthProvider>
        <ProjectProvider
          autoSaveInterval={autoSaveInterval}
          maxHistorySize={maxHistorySize}
        >
          <VersionProvider>{children}</VersionProvider>
        </ProjectProvider>
      </AuthProvider>
    </QueryProvider>
  )
}

// ==================== Exports ====================

export { QueryProvider } from './QueryProvider'
export { AuthProvider, ProtectedRoute } from '../contexts/AuthContext'
export { ProjectProvider } from '../contexts/ProjectContext'
export { VersionProvider } from '../contexts/VersionContext'

export default AppProviders
