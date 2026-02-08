/**
 * Version History Integration Example
 * Shows how to use version history components with a Gantt chart
 */

import React, { useState } from 'react'
import { VersionProvider } from '../../contexts/VersionContext'
import { VersionHistory } from './VersionHistory'
import { VersionDiffViewer } from './VersionDiffViewer'
import { GanttChart } from '../GanttChart/GanttChart'
import { Task, TimeScale } from '../../types/gantt'

export const VersionHistoryExample: React.FC = () => {
  const [projectId] = useState('example-project-123')
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: 'Design Phase',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-15'),
      color: '#3b82f6',
      position: 0,
      projectId: 'example-project-123',
      progress: 75,
    },
    {
      id: '2',
      name: 'Development',
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-02-28'),
      color: '#10b981',
      position: 1,
      projectId: 'example-project-123',
      progress: 45,
    },
    {
      id: '3',
      name: 'Testing',
      startDate: new Date('2024-02-20'),
      endDate: new Date('2024-03-15'),
      color: '#f59e0b',
      position: 2,
      projectId: 'example-project-123',
      progress: 0,
    },
  ])

  const [timeScale, setTimeScale] = useState<TimeScale>('week')
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [compareVersionId, setCompareVersionId] = useState<string>('')
  const [showDiffViewer, setShowDiffViewer] = useState(false)
  const [currentVersionId] = useState('version-current-123')

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    )
  }

  const handleCompareVersion = (versionId: string) => {
    setCompareVersionId(versionId)
    setShowDiffViewer(!!versionId)
  }

  return (
    <VersionProvider apiBaseUrl="/api">
      <div className="h-screen flex flex-col">
        {/* Top toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Project Timeline</h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showVersionHistory
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg
                  className="w-4 h-4 inline-block mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Version History
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Gantt chart */}
          <div className="flex-1 overflow-hidden">
            <GanttChart
              tasks={tasks}
              timeScale={timeScale}
              onTaskUpdate={handleTaskUpdate}
              showWeekends={true}
              showToday={true}
            />
          </div>

          {/* Version history sidebar */}
          {showVersionHistory && (
            <div className="w-96 border-l border-gray-200 flex flex-col">
              {showDiffViewer && compareVersionId ? (
                <VersionDiffViewer
                  versionId1={compareVersionId}
                  versionId2={currentVersionId}
                  onClose={() => {
                    setShowDiffViewer(false)
                    setCompareVersionId('')
                  }}
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
      </div>
    </VersionProvider>
  )
}

export default VersionHistoryExample
