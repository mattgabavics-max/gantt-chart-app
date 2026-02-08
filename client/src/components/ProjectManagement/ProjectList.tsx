import React, { useState, useMemo, useCallback } from 'react'
import { ProjectListSkeleton } from '../Loading/LoadingStates'
import { NoProjects, NoSearchResults } from '../EmptyStates/EmptyStates'
import { useKeyboardShortcuts, createCommonShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useIsMobile, useSidebarState } from '../../hooks/useResponsive'
import { useAnnouncer } from '../../hooks/useAccessibility'
import { ShortcutHelpModal } from '../KeyboardShortcuts/ShortcutHelpModal'

export interface Project {
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

export interface ProjectListProps {
  projects: Project[]
  onCreateProject: () => void
  onSelectProject: (projectId: string) => void
  onDeleteProject?: (projectId: string) => void
  loading?: boolean
  currentUserId?: string
}

type ViewMode = 'grid' | 'list'
type SortField = 'name' | 'updatedAt' | 'createdAt'
type SortOrder = 'asc' | 'desc'

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
  loading = false,
  currentUserId,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPublic, setFilterPublic] = useState<'all' | 'public' | 'private'>('all')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(-1)
  const [showShortcutHelp, setShowShortcutHelp] = useState(false)

  const isMobile = useIsMobile()
  const { announce } = useAnnouncer()

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Public/private filter
    if (filterPublic === 'public') {
      filtered = filtered.filter(p => p.isPublic)
    } else if (filterPublic === 'private') {
      filtered = filtered.filter(p => !p.isPublic)
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case 'name':
          compareValue = a.name.localeCompare(b.name)
          break
        case 'updatedAt':
          compareValue = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          break
        case 'createdAt':
          compareValue = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          break
      }

      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    return filtered
  }, [projects, searchQuery, filterPublic, sortField, sortOrder])

  // Keyboard shortcuts
  const shortcuts = useMemo(
    () =>
      createCommonShortcuts({
        onNew: onCreateProject,
        onSearch: () => {
          const searchInput = document.querySelector<HTMLInputElement>('[placeholder="Search projects..."]')
          searchInput?.focus()
        },
        onDelete: () => {
          if (selectedProjectIndex >= 0 && filteredProjects[selectedProjectIndex]) {
            const project = filteredProjects[selectedProjectIndex]
            if (onDeleteProject && currentUserId === project.ownerId) {
              onDeleteProject(project.id)
              announce(`Deleted project: ${project.name}`, 'assertive')
            }
          }
        },
        onEscape: () => {
          setSelectedProjectIndex(-1)
          setSearchQuery('')
        },
      }),
    [onCreateProject, selectedProjectIndex, filteredProjects, onDeleteProject, currentUserId, announce]
  )

  useKeyboardShortcuts({
    shortcuts: [
      ...shortcuts,
      {
        key: 'ArrowUp',
        modifiers: [],
        handler: () => {
          setSelectedProjectIndex((prev) => Math.max(0, prev - 1))
        },
        description: 'Navigate up',
        preventDefault: true,
        enabled: filteredProjects.length > 0,
      },
      {
        key: 'ArrowDown',
        modifiers: [],
        handler: () => {
          setSelectedProjectIndex((prev) =>
            Math.min(filteredProjects.length - 1, prev + 1)
          )
        },
        description: 'Navigate down',
        preventDefault: true,
        enabled: filteredProjects.length > 0,
      },
      {
        key: 'Enter',
        modifiers: [],
        handler: () => {
          if (selectedProjectIndex >= 0 && filteredProjects[selectedProjectIndex]) {
            const project = filteredProjects[selectedProjectIndex]
            onSelectProject(project.id)
            announce(`Opening project: ${project.name}`, 'polite')
          }
        },
        description: 'Open selected project',
        preventDefault: true,
        enabled: selectedProjectIndex >= 0,
      },
      {
        key: '?',
        modifiers: ['shift'],
        handler: () => setShowShortcutHelp(true),
        description: 'Show keyboard shortcuts',
        preventDefault: true,
      },
    ],
  })

  // Announce search results to screen readers
  React.useEffect(() => {
    if (!loading && searchQuery) {
      const count = filteredProjects.length
      announce(
        count === 0
          ? 'No projects found'
          : `${count} project${count === 1 '' : 's'} found`,
        'polite'
      )
    }
  }, [filteredProjects.length, searchQuery, loading, announce])

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60))
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60))
        return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`
      }
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return `${days} days ago`
    } else {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: new Date(date).getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      })
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h1
            className="text-2xl font-bold text-gray-900"
            id="projects-heading"
            aria-level={1}
          >
            Projects
          </h1>
          <button
            onClick={onCreateProject}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label="Create new project (Cmd+N)"
          >
            <span className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{isMobile ? 'New Project' : 'Create New Project'}</span>
            </span>
          </button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <label htmlFor="search-projects" className="sr-only">
              Search projects
            </label>
            <input
              id="search-projects"
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search projects (Cmd+F)"
              aria-describedby="search-description"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span id="search-description" className="sr-only">
              Filter projects by name
            </span>
          </div>

          {!isMobile && (
            <>
              {/* Filter */}
              <label htmlFor="filter-visibility" className="sr-only">
                Filter by visibility
              </label>
              <select
                id="filter-visibility"
                value={filterPublic}
                onChange={(e) => setFilterPublic(e.target.value as typeof filterPublic)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter projects by visibility"
              >
                <option value="all">All Projects</option>
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>

              {/* Sort */}
              <label htmlFor="sort-projects" className="sr-only">
                Sort projects
              </label>
              <select
                id="sort-projects"
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortField(field as SortField)
                  setSortOrder(order as SortOrder)
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Sort projects"
              >
                <option value="updatedAt-desc">Last Modified</option>
                <option value="updatedAt-asc">Oldest Modified</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
              </select>

              {/* View mode toggle */}
              <div
                className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1"
                role="radiogroup"
                aria-label="View mode"
              >
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-label="Grid view"
                  aria-checked={viewMode === 'grid'}
                  role="radio"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-label="List view"
                  aria-checked={viewMode === 'list'}
                  role="radio"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading projects...</div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium">No projects found</p>
            <p className="text-sm mt-1">
              {searchQuery ? 'Try a different search term' : 'Create your first project to get started'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => onSelectProject(project.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate flex-1">
                      {project.name}
                    </h3>
                    {onDeleteProject && currentUserId === project.ownerId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteProject(project.id)
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete project"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                    {project.isPublic ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Private
                      </span>
                    )}
                    {project.taskCount !== undefined && (
                      <span className="text-xs text-gray-500">{project.taskCount} tasks</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {formatDate(project.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  {onDeleteProject && <th className="px-6 py-3"></th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onSelectProject(project.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      {project.owner && (
                        <div className="text-xs text-gray-500">{project.owner.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {project.isPublic ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Public
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Private
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.taskCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(project.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    {onDeleteProject && currentUserId === project.ownerId && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteProject(project.id)
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results count */}
        {!loading && filteredProjects.length > 0 && (
          <div className="mt-6 text-sm text-gray-500 text-center">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectList
