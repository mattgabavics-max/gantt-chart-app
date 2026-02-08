# Version History System

A comprehensive version history and comparison system for the Gantt Chart application. Provides automatic and manual versioning, side-by-side comparison, and version restoration capabilities.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Components](#components)
- [State Management](#state-management)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Auto-Versioning](#auto-versioning)
- [Styling](#styling)
- [Type Definitions](#type-definitions)

## Overview

The Version History System allows users to:
- Track changes to their Gantt chart projects over time
- Create manual snapshots of project state
- Automatically create versions based on configurable triggers
- Compare two versions side-by-side with detailed diffs
- Restore previous versions
- View change summaries and metadata

## Features

### Version Management
- **Manual versioning**: Create versions with custom descriptions
- **Automatic versioning**: Configure automatic version creation based on:
  - Task additions
  - Task deletions
  - Task modifications
  - Configurable change thresholds
- **Version metadata**: Track creator, timestamp, and task count
- **Version cleanup**: Automatic deletion of old auto-versions

### Version Comparison
- **Diff calculation**: Identifies added, removed, and modified tasks
- **Visual highlighting**: Color-coded changes (green for added, red for removed, yellow for modified)
- **Change details**: Field-level change tracking with before/after values
- **Side-by-side view**: Compare task details across versions

### Version Restoration
- **One-click restore**: Revert to any previous version
- **Safety first**: Current state is saved before restoration
- **Confirmation prompts**: Prevent accidental restores

## Installation

### 1. Install Dependencies

No additional dependencies required beyond the base project.

### 2. Set Up Context Provider

Wrap your application with the `VersionProvider`:

```tsx
import { VersionProvider } from './contexts/VersionContext'

function App() {
  return (
    <VersionProvider apiBaseUrl="/api">
      {/* Your app components */}
    </VersionProvider>
  )
}
```

### 3. Import Components

```tsx
import {
  VersionHistory,
  VersionDiffViewer,
  useVersionHistory,
} from './components/VersionHistory'
```

## Components

### VersionHistory

A side panel component that displays a list of project versions with actions.

**Props:**

```typescript
interface VersionHistoryProps {
  projectId: string        // Project to show versions for
  onClose: () => void      // Called when user closes panel
  onCompare?: (versionId: string) => void  // Called when user selects version to compare
  className?: string       // Additional CSS classes
}
```

**Features:**
- Version list with metadata (number, creator, timestamp, task count)
- Create new version with custom description
- Restore to previous version
- Compare versions
- Delete auto-versions
- Auto-version settings configuration
- Search and filter (coming soon)

**Usage:**

```tsx
import { VersionHistory } from './components/VersionHistory'

function MyComponent() {
  const [showHistory, setShowHistory] = useState(false)

  return (
    <>
      <button onClick={() => setShowHistory(true)}>
        View History
      </button>

      {showHistory && (
        <VersionHistory
          projectId="my-project-123"
          onClose={() => setShowHistory(false)}
          onCompare={(versionId) => console.log('Compare:', versionId)}
        />
      )}
    </>
  )
}
```

### VersionDiffViewer

A detailed comparison view showing differences between two versions.

**Props:**

```typescript
interface VersionDiffViewerProps {
  versionId1: string       // Older version (left/from)
  versionId2: string       // Newer version (right/to)
  onClose?: () => void     // Called when user closes viewer
  showGanttPreview?: boolean  // Show visual Gantt preview (future feature)
}
```

**Features:**
- Summary statistics (added, modified, removed counts)
- Version metadata comparison
- Grouped changes by type
- Task-level comparison with before/after values
- Field-level change details
- Color-coded visual indicators

**Usage:**

```tsx
import { VersionDiffViewer } from './components/VersionHistory'

function MyComponent() {
  return (
    <VersionDiffViewer
      versionId1="version-old-123"
      versionId2="version-new-456"
      onClose={() => console.log('Close diff viewer')}
    />
  )
}
```

## State Management

The version history system uses React Context API for state management.

### VersionContext

Provides centralized version state and actions to all components.

**Context Value:**

```typescript
interface VersionContextValue {
  // State
  versions: ProjectVersion[]
  currentVersionId: string | null
  compareVersionId: string | null
  isLoading: boolean
  error: string | null
  autoVersionConfig: AutoVersionConfig

  // Actions
  loadVersions: (projectId: string) => Promise<void>
  createVersion: (projectId: string, description?: string, isAutomatic?: boolean) => Promise<void>
  restoreVersion: (versionId: string) => Promise<void>
  deleteVersion: (versionId: string) => Promise<void>
  setCompareVersion: (versionId: string | null) => void
  setAutoVersionConfig: (config: AutoVersionConfig) => void

  // Helpers
  getCurrentVersion: () => ProjectVersion | null
  getCompareVersion: () => ProjectVersion | null
  getDiff: (versionId1: string, versionId2: string) => VersionDiff | null
}
```

**Hook Usage:**

```tsx
import { useVersionHistory } from './contexts/VersionContext'

function MyComponent() {
  const {
    versions,
    loadVersions,
    createVersion,
    restoreVersion,
  } = useVersionHistory()

  useEffect(() => {
    loadVersions('my-project-id')
  }, [])

  const handleCreateVersion = async () => {
    await createVersion('my-project-id', 'My custom version')
  }

  return (
    <div>
      {versions.map(v => (
        <div key={v.id}>Version {v.versionNumber}</div>
      ))}
    </div>
  )
}
```

## API Reference

### VersionProvider

**Props:**
- `children: ReactNode` - Child components
- `apiBaseUrl?: string` - API base URL (default: '/api')

**API Endpoints:**

The provider expects the following endpoints:

```
GET    /api/projects/:projectId/versions
POST   /api/projects/:projectId/versions
POST   /api/projects/:projectId/versions/:versionId/restore
DELETE /api/projects/:projectId/versions/:versionId
```

### Utility Functions

#### calculateVersionDiff

Calculates the difference between two versions.

```typescript
function calculateVersionDiff(
  oldVersion: ProjectVersion,
  newVersion: ProjectVersion
): VersionDiff
```

**Returns:**
```typescript
interface VersionDiff {
  added: Task[]           // Tasks in new but not in old
  removed: Task[]         // Tasks in old but not in new
  modified: ModifiedTask[] // Tasks that changed
}
```

#### formatVersionDate

Formats a version timestamp as relative time.

```typescript
function formatVersionDate(date: Date): string
```

**Examples:**
- "Just now"
- "5 minutes ago"
- "2 hours ago"
- "Yesterday"
- "3 days ago"
- "Jan 15, 2024"

#### shouldCreateAutoVersion

Determines if an auto-version should be created based on config.

```typescript
function shouldCreateAutoVersion(
  diff: VersionDiff,
  config: AutoVersionConfig
): boolean
```

## Usage Examples

### Basic Integration

```tsx
import React, { useState } from 'react'
import { VersionProvider, VersionHistory } from './components/VersionHistory'
import { GanttChart } from './components/GanttChart'

function App() {
  const [showHistory, setShowHistory] = useState(false)

  return (
    <VersionProvider apiBaseUrl="/api">
      <div className="flex h-screen">
        {/* Main content */}
        <div className="flex-1">
          <GanttChart {...ganttProps} />
        </div>

        {/* Version history sidebar */}
        {showHistory && (
          <div className="w-96">
            <VersionHistory
              projectId="project-123"
              onClose={() => setShowHistory(false)}
            />
          </div>
        )}
      </div>
    </VersionProvider>
  )
}
```

### With Comparison View

```tsx
import React, { useState } from 'react'
import {
  VersionProvider,
  VersionHistory,
  VersionDiffViewer,
} from './components/VersionHistory'

function App() {
  const [showHistory, setShowHistory] = useState(false)
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null)
  const [currentVersionId] = useState('current-version-id')

  const handleCompare = (versionId: string) => {
    setCompareVersionId(versionId)
  }

  return (
    <VersionProvider>
      <div className="flex h-screen">
        <div className="flex-1">{/* Main content */}</div>

        {showHistory && (
          <div className="w-96">
            {compareVersionId ? (
              <VersionDiffViewer
                versionId1={compareVersionId}
                versionId2={currentVersionId}
                onClose={() => setCompareVersionId(null)}
              />
            ) : (
              <VersionHistory
                projectId="project-123"
                onClose={() => setShowHistory(false)}
                onCompare={handleCompare}
              />
            )}
          </div>
        )}
      </div>
    </VersionProvider>
  )
}
```

### Manual Version Creation

```tsx
import { useVersionHistory } from './contexts/VersionContext'

function CreateVersionButton({ projectId }: { projectId: string }) {
  const { createVersion } = useVersionHistory()
  const [description, setDescription] = useState('')

  const handleCreate = async () => {
    try {
      await createVersion(projectId, description, false)
      setDescription('')
      alert('Version created!')
    } catch (err) {
      alert('Failed to create version')
    }
  }

  return (
    <div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Version description"
      />
      <button onClick={handleCreate}>Create Version</button>
    </div>
  )
}
```

### Version Restoration

```tsx
import { useVersionHistory } from './contexts/VersionContext'

function RestoreButton({ versionId }: { versionId: string }) {
  const { restoreVersion } = useVersionHistory()

  const handleRestore = async () => {
    if (confirm('Restore to this version?')) {
      try {
        await restoreVersion(versionId)
        alert('Version restored!')
      } catch (err) {
        alert('Failed to restore version')
      }
    }
  }

  return (
    <button onClick={handleRestore}>
      Restore Version
    </button>
  )
}
```

## Auto-Versioning

### Configuration

Auto-versioning can be configured per-project using the `AutoVersionConfig`:

```typescript
interface AutoVersionConfig {
  enabled: boolean              // Enable/disable auto-versioning
  onTaskAdd: boolean           // Create version when tasks are added
  onTaskDelete: boolean        // Create version when tasks are deleted
  onTaskModify: boolean        // Create version when tasks are modified
  minChangeThreshold: number   // Minimum changes before auto-version
  maxVersionsToKeep: number    // Maximum auto-versions to keep
}
```

**Default Configuration:**

```typescript
{
  enabled: true,
  onTaskAdd: true,
  onTaskDelete: true,
  onTaskModify: false,  // Don't auto-version on every edit
  minChangeThreshold: 3, // At least 3 changes
  maxVersionsToKeep: 50,
}
```

### Setting Auto-Version Config

```tsx
import { useVersionHistory } from './contexts/VersionContext'

function AutoVersionSettings() {
  const { autoVersionConfig, setAutoVersionConfig } = useVersionHistory()

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={autoVersionConfig.enabled}
          onChange={(e) => setAutoVersionConfig({
            ...autoVersionConfig,
            enabled: e.target.checked
          })}
        />
        Enable Auto-Versioning
      </label>

      <label>
        Min Changes:
        <input
          type="number"
          value={autoVersionConfig.minChangeThreshold}
          onChange={(e) => setAutoVersionConfig({
            ...autoVersionConfig,
            minChangeThreshold: parseInt(e.target.value)
          })}
        />
      </label>
    </div>
  )
}
```

### Triggering Auto-Version

Auto-versioning is triggered by checking the `checkAutoVersion` function (internal to context):

```typescript
// Example: After task updates
const handleTaskUpdate = async (updatedTasks: Task[]) => {
  // Update tasks
  setTasks(updatedTasks)

  // Check if auto-version should be created
  // This is handled internally by the context when using its actions
}
```

## Styling

All components use Tailwind CSS for styling. Color scheme:

**Change Type Colors:**
- **Added**: Green (`bg-green-100`, `border-green-500`, `text-green-800`)
- **Modified**: Yellow (`bg-yellow-100`, `border-yellow-500`, `text-yellow-800`)
- **Removed**: Red (`bg-red-100`, `border-red-500`, `text-red-800`)

**Status Colors:**
- **Current**: Green badge
- **Automatic**: Gray badge
- **Comparing**: Yellow badge

**Interactive Elements:**
- Hover states on all buttons and clickable items
- Smooth transitions for color changes
- Loading spinners for async operations
- Disabled states for buttons

### Customization

Override default styles by passing `className` prop:

```tsx
<VersionHistory
  projectId="123"
  onClose={() => {}}
  className="custom-version-history"
/>
```

Or use Tailwind's `@apply` directive:

```css
.custom-version-history {
  @apply bg-gray-100 border-2 border-blue-500;
}
```

## Type Definitions

### ProjectVersion

```typescript
interface ProjectVersion {
  id: string
  versionNumber: number
  projectId: string
  createdAt: Date
  createdBy: {
    id: string
    name: string
    email: string
  }
  snapshot: VersionSnapshot
  changeDescription?: string
  isAutomatic: boolean
}
```

### VersionSnapshot

```typescript
interface VersionSnapshot {
  projectName: string
  tasks: Task[]
  metadata: {
    totalTasks: number
    dateRange: {
      start: Date
      end: Date
    }
  }
}
```

### VersionDiff

```typescript
interface VersionDiff {
  added: Task[]           // Tasks added in newer version
  removed: Task[]         // Tasks removed from older version
  modified: ModifiedTask[] // Tasks that changed
}
```

### ModifiedTask

```typescript
interface ModifiedTask {
  taskId: string
  before: Task            // Task state in older version
  after: Task             // Task state in newer version
  changes: TaskChange[]   // List of specific field changes
}
```

### TaskChange

```typescript
interface TaskChange {
  field: TaskChangeType
  oldValue: any
  newValue: any
}

type TaskChangeType =
  | 'name'
  | 'startDate'
  | 'endDate'
  | 'color'
  | 'position'
  | 'progress'
  | 'isMilestone'
```

## Best Practices

### 1. Version Descriptions

Provide clear, descriptive version names:

```typescript
// Good
createVersion(projectId, 'Milestone 1 complete - all design tasks done')
createVersion(projectId, 'Before client review meeting')

// Bad
createVersion(projectId, 'v1')
createVersion(projectId, 'asdf')
```

### 2. Auto-Version Configuration

Balance between too many and too few versions:

```typescript
// For active projects with frequent changes
{
  minChangeThreshold: 5,  // Higher threshold
  maxVersionsToKeep: 100, // Keep more versions
}

// For stable projects with few changes
{
  minChangeThreshold: 1,  // Lower threshold
  maxVersionsToKeep: 20,  // Keep fewer versions
}
```

### 3. Version Cleanup

Regularly clean up auto-versions to prevent clutter:

```typescript
// Delete old auto-versions manually
versions
  .filter(v => v.isAutomatic)
  .slice(50) // Keep only 50 most recent
  .forEach(v => deleteVersion(v.id))
```

### 4. Error Handling

Always handle errors when working with versions:

```typescript
try {
  await createVersion(projectId, description)
} catch (err) {
  console.error('Failed to create version:', err)
  // Show user-friendly error message
  toast.error('Could not create version. Please try again.')
}
```

### 5. Loading States

Show loading indicators during async operations:

```tsx
const { isLoading } = useVersionHistory()

return (
  <div>
    {isLoading && <LoadingSpinner />}
    {/* Version content */}
  </div>
)
```

## Troubleshooting

### Versions Not Loading

**Problem**: Version list is empty or not loading.

**Solutions**:
1. Check API endpoint is correct in `VersionProvider`
2. Verify authentication token is valid
3. Check network tab for failed requests
4. Ensure project ID is correct

### Auto-Versioning Not Working

**Problem**: Auto-versions are not being created.

**Solutions**:
1. Check `autoVersionConfig.enabled` is `true`
2. Verify change threshold is met
3. Check that appropriate triggers are enabled (`onTaskAdd`, etc.)
4. Look for errors in console

### Diff Calculation Issues

**Problem**: Version comparison shows incorrect changes.

**Solutions**:
1. Ensure task IDs are consistent across versions
2. Check date serialization (dates should be ISO strings in API)
3. Verify all task fields are properly tracked

### Performance Issues

**Problem**: Slow loading with many versions.

**Solutions**:
1. Implement pagination in version list
2. Limit `maxVersionsToKeep` in auto-version config
3. Add virtual scrolling for long version lists
4. Lazy load version snapshots

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- IE11: Not supported (uses modern JavaScript features)

## Accessibility

- Keyboard navigation for all interactive elements
- ARIA labels on buttons and controls
- Focus indicators on interactive elements
- Screen reader compatible

## License

MIT License - Same as main project

## Contributing

Contributions welcome! Please follow the project's contribution guidelines.

## Support

For issues or questions, please open a GitHub issue or contact the development team.
