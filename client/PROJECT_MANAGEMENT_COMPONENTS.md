# Project Management Components Documentation

## Overview

Four production-ready React components for managing Gantt chart projects, built with TypeScript and Tailwind CSS.

---

## Components

### 1. ProjectList
### 2. ProjectHeader
### 3. TaskCreationForm
### 4. Toolbar

---

## 1. ProjectList.tsx

Displays a list of projects with grid/list view toggle, search/filter functionality, and create project button.

### Features

✅ **View Modes**
- Grid view (cards)
- List view (table)
- Toggle between views

✅ **Search & Filter**
- Real-time search by project name
- Filter by public/private status
- Sort by: name, last modified, created date
- Sort order: ascending/descending

✅ **Project Display**
- Project name
- Public/private badge
- Task count
- Last modified timestamp (relative)
- Owner information (list view)
- Delete button (for owners)

✅ **Create New Project**
- Prominent "Create New Project" button
- Callback for creation

### Props

```typescript
interface ProjectListProps {
  projects: Project[]                                // Array of projects to display
  onCreateProject: () => void                        // Called when create button clicked
  onSelectProject: (projectId: string) => void       // Called when project is selected
  onDeleteProject?: (projectId: string) => void      // Optional delete handler
  loading?: boolean                                  // Show loading state
  currentUserId?: string                             // Current user ID for owner checks
}

interface Project {
  id: string
  name: string
  isPublic: boolean
  ownerId: string
  createdAt: Date
  updatedAt: Date
  taskCount?: number
  owner?: {
    id: string
    email: string
  }
}
```

### Usage

```tsx
import { ProjectList } from './components/ProjectManagement'

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])

  const handleCreateProject = () => {
    // Navigate to create project page or open modal
    router.push('/projects/new')
  }

  const handleSelectProject = (projectId: string) => {
    // Navigate to project details
    router.push(`/projects/${projectId}`)
  }

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await api.delete(`/projects/${projectId}`)
      // Refresh projects list
    }
  }

  return (
    <ProjectList
      projects={projects}
      onCreateProject={handleCreateProject}
      onSelectProject={handleSelectProject}
      onDeleteProject={handleDeleteProject}
      loading={false}
      currentUserId={user.id}
    />
  )
}
```

### Features Detail

#### Search
- Case-insensitive
- Searches project name only
- Real-time filtering as you type

#### Sort Options
- **Last Modified** (default) - Most recently modified first
- **Oldest Modified** - Oldest modified first
- **Name (A-Z)** - Alphabetical ascending
- **Name (Z-A)** - Alphabetical descending
- **Newest First** - Most recently created first
- **Oldest First** - Oldest created first

#### Date Formatting
Smart relative dates:
- "Just now" - Less than 1 minute ago
- "5 minutes ago"
- "2 hours ago"
- "Yesterday"
- "3 days ago"
- "Jan 15" - Less than a year ago
- "Jan 15, 2025" - Over a year ago

---

## 2. ProjectHeader.tsx

Header bar for project page with editable name, controls, and save indicator.

### Features

✅ **Editable Project Name**
- Click to edit (inline editing)
- Auto-focus and select on edit
- Enter to save, Escape to cancel
- Pencil icon indicator

✅ **Time Scale Selector**
- Dropdown with 5 options
- Day, Week, Sprint, Month, Quarter
- Updates Gantt chart view

✅ **Action Buttons**
- Share button (with icon)
- Version history button
- Conditional rendering based on ownership

✅ **Auto-save Indicator**
- Saving spinner
- "Saved just now" message
- Smart relative timestamps
- Green checkmark when saved

### Props

```typescript
interface ProjectHeaderProps {
  projectName: string                                   // Current project name
  projectId: string                                     // Project ID (shown in dev mode)
  timeScale: TimeScale                                  // Current time scale
  onProjectNameChange: (newName: string) => void       // Called when name is saved
  onTimeScaleChange: (newScale: TimeScale) => void     // Called when scale changes
  onShare?: () => void                                  // Optional share handler
  onVersionHistory?: () => void                         // Optional version history handler
  isSaving?: boolean                                    // Show saving indicator
  lastSaved?: Date                                      // Last save timestamp
  isOwner?: boolean                                     // Is current user the owner
}
```

### Usage

```tsx
import { ProjectHeader } from './components/ProjectManagement'
import { useState } from 'react'

function ProjectPage() {
  const [projectName, setProjectName] = useState('My Project')
  const [timeScale, setTimeScale] = useState<TimeScale>('week')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date())

  const handleNameChange = async (newName: string) => {
    setIsSaving(true)
    try {
      await api.put(`/projects/${projectId}`, { name: newName })
      setProjectName(newName)
      setLastSaved(new Date())
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = () => {
    // Open share dialog
    setShowShareDialog(true)
  }

  const handleVersionHistory = () => {
    // Navigate to version history
    router.push(`/projects/${projectId}/versions`)
  }

  return (
    <ProjectHeader
      projectName={projectName}
      projectId={projectId}
      timeScale={timeScale}
      onProjectNameChange={handleNameChange}
      onTimeScaleChange={setTimeScale}
      onShare={handleShare}
      onVersionHistory={handleVersionHistory}
      isSaving={isSaving}
      lastSaved={lastSaved}
      isOwner={true}
    />
  )
}
```

### Behavior

#### Inline Editing
1. User clicks on project name
2. Input field appears with current name selected
3. User types new name
4. Press Enter to save or Escape to cancel
5. Click outside to save
6. Validates: trims whitespace, prevents empty names

#### Save Indicator
- **Saving:** Shows spinner with "Saving..." text
- **Just saved:** "Saved just now" (< 10 seconds)
- **Recent:** "Saved 30s ago" (10-60 seconds)
- **Minutes:** "Saved 5m ago" (1-60 minutes)
- **Time:** "Saved at 3:45 PM" (> 1 hour)

---

## 3. TaskCreationForm.tsx

Quick add task form with inline and full modal modes.

### Features

✅ **Two Modes**
- **Inline:** Compact horizontal form for quick adds
- **Full:** Vertical form in modal/panel

✅ **Fields**
- Task name (required)
- Start date (required, defaults to today)
- End date (required, defaults to +7 days)
- Color picker with presets

✅ **Color Picker**
- 8 preset colors
- Custom color input
- Visual preview
- Dropdown interface

✅ **Keyboard Shortcuts**
- **Enter:** Save task
- **Escape:** Cancel
- Auto-focus on name field

✅ **Validation**
- Name required
- Dates required
- Start date must be before end date
- Clear error messages

### Props

```typescript
interface TaskCreationFormProps {
  onCreateTask: (task: TaskFormData) => void    // Called when task is created
  onCancel?: () => void                          // Optional cancel handler
  defaultColor?: string                          // Default color (default: #3b82f6)
  inline?: boolean                               // Use inline mode (default: false)
}

interface TaskFormData {
  name: string
  startDate: string      // ISO date string (YYYY-MM-DD)
  endDate: string        // ISO date string (YYYY-MM-DD)
  color: string          // Hex color (#RRGGBB)
}
```

### Usage

#### Inline Mode

```tsx
import { TaskCreationForm } from './components/ProjectManagement'

function ProjectPage() {
  const [showTaskForm, setShowTaskForm] = useState(false)

  const handleCreateTask = async (taskData: TaskFormData) => {
    const task = await api.post(`/projects/${projectId}/tasks`, {
      name: taskData.name,
      startDate: new Date(taskData.startDate),
      endDate: new Date(taskData.endDate),
      color: taskData.color,
    })

    // Add task to state
    setTasks([...tasks, task])

    // Form auto-resets for quick consecutive entries
  }

  return (
    <div>
      {showTaskForm ? (
        <TaskCreationForm
          onCreateTask={handleCreateTask}
          onCancel={() => setShowTaskForm(false)}
          inline={true}
          defaultColor="#3b82f6"
        />
      ) : (
        <button onClick={() => setShowTaskForm(true)}>
          Add Task
        </button>
      )}
    </div>
  )
}
```

#### Full Mode (Modal)

```tsx
import { TaskCreationForm } from './components/ProjectManagement'

function TaskModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null

  const handleCreateTask = async (taskData: TaskFormData) => {
    await api.post(`/projects/${projectId}/tasks`, taskData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <TaskCreationForm
        onCreateTask={handleCreateTask}
        onCancel={onClose}
        inline={false}
      />
    </div>
  )
}
```

### Preset Colors

```typescript
const PRESET_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
]
```

### Form Behavior

**Auto-reset after creation:**
- Name clears
- Dates reset to defaults (today + 7 days)
- Color resets to default
- Focus returns to name input
- Enables quick consecutive task creation

**Validation errors:**
- Shows below form
- Red text with warning icon
- Clears on successful submission

---

## 4. Toolbar.tsx

Toolbar with zoom controls, view options, and export functionality.

### Features

✅ **Zoom Controls**
- Zoom in button (more detail)
- Zoom out button (less detail)
- Current scale display
- Visual zoom level indicator

✅ **Time Scale Options**
- Day → Week → Sprint → Month → Quarter
- Smooth transitions
- Keyboard-friendly

✅ **View Options Menu**
- Show weekends toggle
- Show today line toggle
- Read-only mode toggle (optional)
- Dropdown interface

✅ **Export Options**
- Export as PNG
- Export as PDF
- Export as JSON
- Dropdown menu

### Props

```typescript
interface ToolbarProps {
  timeScale: TimeScale                              // Current time scale
  onTimeScaleChange: (scale: TimeScale) => void    // Called when scale changes
  showWeekends: boolean                             // Weekend visibility
  onShowWeekendsChange: (show: boolean) => void    // Toggle weekends
  showToday: boolean                                // Today line visibility
  onShowTodayChange: (show: boolean) => void       // Toggle today line
  onExportPNG?: () => void                          // Optional PNG export
  onExportPDF?: () => void                          // Optional PDF export
  onExportJSON?: () => void                         // Optional JSON export
  readOnly?: boolean                                // Read-only mode
  onReadOnlyChange?: (readOnly: boolean) => void   // Optional read-only toggle
}
```

### Usage

```tsx
import { Toolbar } from './components/ProjectManagement'
import { useState } from 'react'

function ProjectPage() {
  const [timeScale, setTimeScale] = useState<TimeScale>('week')
  const [showWeekends, setShowWeekends] = useState(true)
  const [showToday, setShowToday] = useState(true)
  const [readOnly, setReadOnly] = useState(false)

  const handleExportPNG = () => {
    // Capture Gantt chart as PNG
    const ganttElement = document.querySelector('.gantt-chart')
    html2canvas(ganttElement).then(canvas => {
      const link = document.createElement('a')
      link.download = `${projectName}-gantt.png`
      link.href = canvas.toDataURL()
      link.click()
    })
  }

  const handleExportPDF = () => {
    // Generate PDF from Gantt chart
    const doc = new jsPDF('landscape')
    // Add content to PDF
    doc.save(`${projectName}-gantt.pdf`)
  }

  const handleExportJSON = () => {
    // Export project data as JSON
    const data = {
      project: { name, id, createdAt, updatedAt },
      tasks: tasks,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.download = `${projectName}-data.json`
    link.href = URL.createObjectURL(blob)
    link.click()
  }

  return (
    <Toolbar
      timeScale={timeScale}
      onTimeScaleChange={setTimeScale}
      showWeekends={showWeekends}
      onShowWeekendsChange={setShowWeekends}
      showToday={showToday}
      onShowTodayChange={setShowToday}
      onExportPNG={handleExportPNG}
      onExportPDF={handleExportPDF}
      onExportJSON={handleExportJSON}
      readOnly={readOnly}
      onReadOnlyChange={setReadOnly}
    />
  )
}
```

### Zoom Behavior

**Zoom In:** Increase detail level
- Day ← Week ← Sprint ← Month ← Quarter
- Disabled when at Day (maximum detail)

**Zoom Out:** Decrease detail level
- Day → Week → Sprint → Month → Quarter
- Disabled when at Quarter (minimum detail)

**Visual Indicator:**
- Shows all 5 time scales as dots
- Current scale: Large blue dot
- Adjacent scales: Medium gray dots
- Other scales: Small gray dots
- Click any dot to jump to that scale

---

## Complete Integration Example

Here's how to use all four components together:

```tsx
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  ProjectList,
  ProjectHeader,
  TaskCreationForm,
  Toolbar,
} from './components/ProjectManagement'
import { GanttChart } from './components/GanttChart'
import { Task, TimeScale } from './types/gantt'

// Project list page
function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const response = await api.get('/projects')
    setProjects(response.data.data.projects)
  }

  const handleCreateProject = async () => {
    const name = prompt('Enter project name:')
    if (name) {
      const project = await api.post('/projects', { name })
      router.push(`/projects/${project.id}`)
    }
  }

  return (
    <ProjectList
      projects={projects}
      onCreateProject={handleCreateProject}
      onSelectProject={(id) => router.push(`/projects/${id}`)}
      onDeleteProject={async (id) => {
        await api.delete(`/projects/${id}`)
        fetchProjects()
      }}
      currentUserId={user.id}
    />
  )
}

// Individual project page
function ProjectPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [timeScale, setTimeScale] = useState<TimeScale>('week')
  const [showWeekends, setShowWeekends] = useState(true)
  const [showToday, setShowToday] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date())

  useEffect(() => {
    fetchProject()
    fetchTasks()
  }, [projectId])

  const fetchProject = async () => {
    const response = await api.get(`/projects/${projectId}`)
    setProject(response.data.data.project)
  }

  const fetchTasks = async () => {
    const response = await api.get(`/projects/${projectId}/tasks`)
    setTasks(response.data.data.tasks)
  }

  const handleProjectNameChange = async (newName: string) => {
    setIsSaving(true)
    try {
      await api.put(`/projects/${projectId}`, { name: newName })
      setProject({ ...project!, name: newName })
      setLastSaved(new Date())
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateTask = async (taskData: TaskFormData) => {
    const response = await api.post(`/projects/${projectId}/tasks`, {
      ...taskData,
      startDate: new Date(taskData.startDate),
      endDate: new Date(taskData.endDate),
    })
    setTasks([...tasks, response.data.data.task])
    setShowTaskForm(false)
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    setIsSaving(true)
    try {
      await api.put(`/tasks/${taskId}`, updates)
      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t))
      setLastSaved(new Date())
    } finally {
      setIsSaving(false)
    }
  }

  if (!project) return <div>Loading...</div>

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <ProjectHeader
        projectName={project.name}
        projectId={project.id}
        timeScale={timeScale}
        onProjectNameChange={handleProjectNameChange}
        onTimeScaleChange={setTimeScale}
        onShare={() => alert('Share dialog')}
        onVersionHistory={() => alert('Version history')}
        isSaving={isSaving}
        lastSaved={lastSaved}
        isOwner={true}
      />

      {/* Toolbar */}
      <Toolbar
        timeScale={timeScale}
        onTimeScaleChange={setTimeScale}
        showWeekends={showWeekends}
        onShowWeekendsChange={setShowWeekends}
        showToday={showToday}
        onShowTodayChange={setShowToday}
        onExportPNG={() => console.log('Export PNG')}
        onExportPDF={() => console.log('Export PDF')}
        onExportJSON={() => console.log('Export JSON')}
      />

      {/* Task creation form */}
      {showTaskForm && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <TaskCreationForm
            onCreateTask={handleCreateTask}
            onCancel={() => setShowTaskForm(false)}
            inline={true}
          />
        </div>
      )}

      {/* Add task button */}
      {!showTaskForm && (
        <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
          <button
            onClick={() => setShowTaskForm(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add Task
          </button>
        </div>
      )}

      {/* Gantt chart */}
      <div className="flex-1 overflow-hidden">
        <GanttChart
          tasks={tasks}
          timeScale={timeScale}
          onTaskUpdate={handleTaskUpdate}
          showWeekends={showWeekends}
          showToday={showToday}
        />
      </div>
    </div>
  )
}
```

---

## Styling

All components use **Tailwind CSS** for styling:

### Color Scheme
- Primary: Blue (`bg-blue-600`, `text-blue-600`)
- Gray scale: `gray-50` to `gray-900`
- Success: Green (`bg-green-600`)
- Danger: Red (`bg-red-600`)

### Common Classes
- Buttons: `px-4 py-2 rounded-lg font-medium`
- Inputs: `px-3 py-2 border border-gray-300 rounded-lg`
- Cards: `bg-white rounded-lg border border-gray-200 shadow-sm`
- Hover: `hover:bg-gray-50`, `hover:border-blue-500`

---

## TypeScript Support

All components are fully typed with:
- Interface exports
- Prop type definitions
- Type-safe callbacks
- Generic type parameters where appropriate

---

## Accessibility

### Keyboard Navigation
- All interactive elements focusable
- Keyboard shortcuts documented
- Escape to close menus
- Enter to submit forms

### Screen Readers
- Semantic HTML elements
- ARIA labels where needed
- Descriptive button text
- Error messages announced

### Visual
- Color contrast meets WCAG AA
- Focus indicators visible
- Error states clear
- Loading states indicated

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Dependencies

- React 18+
- TypeScript 4.5+
- Tailwind CSS 3.0+

**Optional for export:**
- `html2canvas` - For PNG export
- `jspdf` - For PDF export

---

## Summary

Four production-ready components providing complete project management UI:

1. **ProjectList** - Browse and manage projects
2. **ProjectHeader** - Project controls and metadata
3. **TaskCreationForm** - Quick task creation
4. **Toolbar** - View controls and export

All components:
- ✅ Fully typed with TypeScript
- ✅ Styled with Tailwind CSS
- ✅ Responsive and accessible
- ✅ Production-ready
- ✅ Well-documented
- ✅ Easy to integrate

Ready to build a complete Gantt chart application! 🚀
