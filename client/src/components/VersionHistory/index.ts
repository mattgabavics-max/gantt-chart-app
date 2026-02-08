/**
 * Version History Components
 */

export { VersionHistory } from './VersionHistory'
export type { VersionHistoryProps } from './VersionHistory'

export { VersionDiffViewer } from './VersionDiffViewer'
export type { VersionDiffViewerProps } from './VersionDiffViewer'

export { VersionHistoryExample } from './VersionHistoryExample'

// Re-export context
export { VersionProvider, useVersionHistory } from '../../contexts/VersionContext'

// Re-export types
export type {
  ProjectVersion,
  VersionSnapshot,
  VersionDiff,
  ModifiedTask,
  TaskChange,
  TaskChangeType,
  VersionHistoryState,
  VersionHistoryActions,
  AutoVersionConfig,
} from '../../types/version'

// Re-export utilities
export {
  calculateVersionDiff,
  getTaskChanges,
  formatChangeDescription,
  getDiffSummary,
  calculateChangeCount,
  formatVersionDate,
  formatVersionDateTime,
  generateAutoVersionDescription,
  shouldCreateAutoVersion,
} from '../../utils/versionUtils'
