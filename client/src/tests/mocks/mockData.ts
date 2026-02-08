/**
 * Mock Test Data
 * Provides sample data for testing
 */

import { Task } from '../../types/gantt'
import { ProjectVersion } from '../../types/version'

// Mock Projects
export const mockProjects = [
  {
    id: 'project-1',
    name: 'Test Project 1',
    description: 'A test project for unit tests',
    ownerId: 'user-1',
    ownerName: 'Test User',
    isPublic: false,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
    taskCount: 3,
  },
  {
    id: 'project-2',
    name: 'Test Project 2',
    description: 'Another test project',
    ownerId: 'user-1',
    ownerName: 'Test User',
    isPublic: true,
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString(),
    taskCount: 2,
  },
  {
    id: 'project-3',
    name: 'Public Project',
    description: 'A public test project',
    ownerId: 'user-2',
    ownerName: 'Other User',
    isPublic: true,
    createdAt: new Date('2024-01-05').toISOString(),
    updatedAt: new Date('2024-01-18').toISOString(),
    taskCount: 1,
  },
]

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    name: 'Design Phase',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-15'),
    color: '#3b82f6',
    position: 0,
    projectId: 'project-1',
    progress: 75,
  },
  {
    id: 'task-2',
    name: 'Development',
    startDate: new Date('2024-01-10'),
    endDate: new Date('2024-02-28'),
    color: '#10b981',
    position: 1,
    projectId: 'project-1',
    progress: 45,
  },
  {
    id: 'task-3',
    name: 'Testing',
    startDate: new Date('2024-02-20'),
    endDate: new Date('2024-03-15'),
    color: '#f59e0b',
    position: 2,
    projectId: 'project-1',
    progress: 0,
  },
  {
    id: 'task-4',
    name: 'Launch',
    startDate: new Date('2024-03-16'),
    endDate: new Date('2024-03-16'),
    color: '#ef4444',
    position: 3,
    projectId: 'project-1',
    isMilestone: true,
  },
  {
    id: 'task-5',
    name: 'Project 2 Task 1',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-10'),
    color: '#8b5cf6',
    position: 0,
    projectId: 'project-2',
    progress: 50,
  },
  {
    id: 'task-6',
    name: 'Project 2 Task 2',
    startDate: new Date('2024-02-05'),
    endDate: new Date('2024-02-20'),
    color: '#ec4899',
    position: 1,
    projectId: 'project-2',
    progress: 25,
  },
]

// Mock Versions
export const mockVersions: ProjectVersion[] = [
  {
    id: 'version-1',
    versionNumber: 1,
    projectId: 'project-1',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    createdBy: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
    snapshot: {
      projectName: 'Test Project 1',
      tasks: [
        {
          id: 'task-1',
          name: 'Design Phase',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-15'),
          color: '#3b82f6',
          position: 0,
          projectId: 'project-1',
          progress: 0,
        },
      ],
      metadata: {
        totalTasks: 1,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-15'),
        },
      },
    },
    changeDescription: 'Initial version',
    isAutomatic: false,
  },
  {
    id: 'version-2',
    versionNumber: 2,
    projectId: 'project-1',
    createdAt: new Date('2024-01-10T15:30:00Z'),
    createdBy: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
    snapshot: {
      projectName: 'Test Project 1',
      tasks: [
        {
          id: 'task-1',
          name: 'Design Phase',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-15'),
          color: '#3b82f6',
          position: 0,
          projectId: 'project-1',
          progress: 50,
        },
        {
          id: 'task-2',
          name: 'Development',
          startDate: new Date('2024-01-10'),
          endDate: new Date('2024-02-28'),
          color: '#10b981',
          position: 1,
          projectId: 'project-1',
          progress: 0,
        },
      ],
      metadata: {
        totalTasks: 2,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-02-28'),
        },
      },
    },
    changeDescription: 'Auto-save: 1 task added, 1 task modified',
    isAutomatic: true,
  },
  {
    id: 'version-3',
    versionNumber: 3,
    projectId: 'project-1',
    createdAt: new Date('2024-01-15T09:00:00Z'),
    createdBy: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
    snapshot: {
      projectName: 'Test Project 1',
      tasks: mockTasks.filter((t) => t.projectId === 'project-1'),
      metadata: {
        totalTasks: 4,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-03-16'),
        },
      },
    },
    changeDescription: 'Added testing and launch milestone',
    isAutomatic: false,
  },
]

// Mock User
export const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  token: 'mock-jwt-token',
}

// Helper to create mock task
export function createMockTask(overrides?: Partial<Task>): Task {
  return {
    id: `task-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Mock Task',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-07'),
    color: '#3b82f6',
    position: 0,
    projectId: 'project-1',
    progress: 0,
    ...overrides,
  }
}

// Helper to create mock version
export function createMockVersion(overrides?: Partial<ProjectVersion>): ProjectVersion {
  return {
    id: `version-${Math.random().toString(36).substr(2, 9)}`,
    versionNumber: 1,
    projectId: 'project-1',
    createdAt: new Date(),
    createdBy: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
    snapshot: {
      projectName: 'Test Project',
      tasks: [],
      metadata: {
        totalTasks: 0,
        dateRange: {
          start: new Date(),
          end: new Date(),
        },
      },
    },
    isAutomatic: false,
    ...overrides,
  }
}
