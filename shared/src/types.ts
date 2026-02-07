// Shared types between client and server

export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface Project {
  id: string
  name: string
  description?: string
  startDate: Date
  endDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  name: string
  description?: string
  startDate: Date
  endDate: Date
  progress: number
  status: TaskStatus
  priority: Priority
  projectId: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectDto {
  name: string
  description?: string
  startDate: Date
  endDate: Date
}

export interface UpdateProjectDto {
  name?: string
  description?: string
  startDate?: Date
  endDate?: Date
}

export interface CreateTaskDto {
  name: string
  description?: string
  startDate: Date
  endDate: Date
  projectId: string
  parentId?: string
  priority?: Priority
}

export interface UpdateTaskDto {
  name?: string
  description?: string
  startDate?: Date
  endDate?: Date
  progress?: number
  status?: TaskStatus
  priority?: Priority
  parentId?: string
}
