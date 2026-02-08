/**
 * Full Integration Example
 * Demonstrates how to use all components together:
 * - Project Management Components
 * - Gantt Chart
 * - Version History
 */

import React, { useState, useEffect } from 'react'
import { VersionProvider, useVersionHistory } from '../contexts/VersionContext'
import { VersionHistory } from '../components/VersionHistory/VersionHistory'
import { VersionDiffViewer } from '../components/VersionHistory/VersionDiffViewer'
import { ProjectHeader } from '../components/ProjectManagement/ProjectHeader'
import { TaskCreationForm } from '../components/ProjectManagement/TaskCreationForm'
import { Toolbar } from '../components/ProjectManagement/Toolbar'
import { GanttChart } from '../components/GanttChart/GanttChart'
import { Task, TimeScale } from '../types/gantt'
import { TaskFormData } from '../components/ProjectManagement/TaskCreationForm'

/**
 * Main Project View Component
 */
const ProjectView: React.FC<{ projectId: string }> = ({ projectId }) => {
  // Project state
  const [projectName, setProjectName] = useState('My Gantt Project')
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: 'Project Planning',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-14'),
      color: '#3b82f6',
      position: 0,
      projectId,
      progress: 100,
    },
    {
      id: '2',
      name: 'Design Phase',
      startDate: new Date('2024-01-08'),
      endDate: new Date('2024-01-28'),
      color: '#8b5cf6',
      position: 1,
      projectId,
      progress: 75,
    },
    {
      id: '3',
      name: 'Development Sprint 1',
      startDate: new Date('2024-01-22'),
      endDate: new Date('2024-02-11'),
      color: '#10b981',
      position: 2,
      projectId,
      progress: 45,
    },
    {
      id: '4',
      name: 'Testing & QA',
      startDate: new Date('2024-02-05'),
      endDate: new Date('2024-02-18'),
      color: '#f59e0b',
      position: 3,
      projectId,
      progress: 0,
    },
    {
      id: '5',
      name: 'Launch',
      startDate: new Date('2024-02-19'),
      endDate: new Date('2024-02-19'),
      color: '#ef4444',
      position: 4,
      projectId,
      isMilestone: true,
    },
  ])

  // View state
  const [timeScale, setTimeScale] = useState<TimeScale>('week')
  const [showWeekends, setShowWeekends] = useState(true)
  const [showToday, setShowToday] = useState(true)
  const [readOnly, setReadOnly] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)

  // Version history state
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null)

  // Auto-save state
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date())

  // Version history context
  const { currentVersionId, createVersion } = useVersionHistory()

  // Simulate auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSaving(true)
      setTimeout(() => {
        setIsSaving(false)
        setLastSaved(new Date())
      }, 1000)
    }, 2000)

    return () => clearTimeout(timer)
  }, [tasks, projectName])

  /**
   * Handle task updates from Gantt chart
   */
  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    )
  }

  /**
   * Handle creating a new task
   */
  const handleCreateTask = (formData: TaskFormData) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: formData.name,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      color: formData.color,
      position: tasks.length,
      projectId,
      progress: 0,
    }

    setTasks((prev) => [...prev, newTask])
    setShowTaskForm(false)
  }

  /**
   * Handle exporting as PNG
   */
  const handleExportPNG = () => {
    console.log('Exporting as PNG...')
    // Implementation would use html2canvas or similar
    alert('PNG export functionality would be implemented here')
  }

  /**
   * Handle exporting as PDF
   */
  const handleExportPDF = () => {
    console.log('Exporting as PDF...')
    // Implementation would use jsPDF or similar
    alert('PDF export functionality would be implemented here')
  }

  /**
   * Handle exporting as JSON
   */
  const handleExportJSON = () => {
    const data = {
      projectName,
      projectId,
      tasks,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Handle version history button click
   */
  const handleVersionHistory = () => {
    setShowVersionHistory(!showVersionHistory)
    setCompareVersionId(null)
  }

  /**
   * Handle compare version selection
   */
  const handleCompareVersion = (versionId: string) => {
    setCompareVersionId(versionId || null)
  }

  /**
   * Handle share button click
   */
  const handleShare = () => {
    alert('Share functionality would be implemented here')
  }

  /**
   * Handle manual version creation
   */
  const handleCreateManualVersion = async () => {
    const description = prompt('Enter version description:')
    if (description) {
      try {
        await createVersion(projectId, description, false)
        alert('Version created successfully!')
      } catch (err) {
        alert('Failed to create version')
      }
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Project Header */}
      <ProjectHeader
        projectName={projectName}
        projectId={projectId}
        timeScale={timeScale}
        onProjectNameChange={setProjectName}
        onTimeScaleChange={setTimeScale}
        onShare={handleShare}
        onVersionHistory={handleVersionHistory}
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
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        onExportJSON={handleExportJSON}
        readOnly={readOnly}
        onReadOnlyChange={setReadOnly}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side - Gantt chart */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Task creation form */}
          {showTaskForm && !readOnly && (
            <div className="p-4 border-b border-gray-200">
              <TaskCreationForm
                onCreateTask={handleCreateTask}
                onCancel={() => setShowTaskForm(false)}
                inline={true}
              />
            </div>
          )}

          {/* Add task button */}
          {!showTaskForm && !readOnly && (
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={() => setShowTaskForm(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Add Task
              </button>
            </div>
          )}

          {/* Gantt Chart */}
          <div className="flex-1 overflow-hidden">
            <GanttChart
              tasks={tasks}
              timeScale={timeScale}
              onTaskUpdate={handleTaskUpdate}
              readOnly={readOnly}
              showWeekends={showWeekends}
              showToday={showToday}
            />
          </div>
        </div>

        {/* Right side - Version History */}
        {showVersionHistory && (
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            {compareVersionId && currentVersionId ? (
              <VersionDiffViewer
                versionId1={compareVersionId}
                versionId2={currentVersionId}
                onClose={() => setCompareVersionId(null)}
              />
            ) : (
              <VersionHistory
                projectId={projectId}
                onClose={() => setShowVersionHistory(false)}
                onCompare={handleCompareVersion}
              />
            )}
          </div>
        )}
      </div>

      {/* Floating action button - Manual version creation */}
      <button
        onClick={handleCreateManualVersion}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:shadow-xl flex items-center justify-center"
        title="Create manual version"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  )
}

/**
 * App wrapper with context provider
 */
export const FullIntegrationExample: React.FC = () => {
  const [projectId] = useState('demo-project-123')

  return (
    <VersionProvider apiBaseUrl="/api">
      <ProjectView projectId={projectId} />
    </VersionProvider>
  )
}

export default FullIntegrationExample
