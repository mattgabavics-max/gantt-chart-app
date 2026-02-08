/**
 * API Types
 * TypeScript interfaces for all API requests and responses
 */

// ==================== Auth Types ====================

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: User
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface RegisterResponse {
  token: string
  refreshToken: string
  user: User
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'member' | 'viewer'
  createdAt: Date
}

// ==================== Project Types ====================

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  members: ProjectMember[]
  settings: ProjectSettings
}

export interface ProjectMember {
  userId: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  addedAt: Date
}

export interface ProjectSettings {
  defaultView: 'day' | 'week' | 'sprint' | 'month' | 'quarter'
  showWeekends: boolean
  autoSave: boolean
  autoSaveInterval: number // milliseconds
  enableVersioning: boolean
  versioningConfig?: {
    autoVersion: boolean
    threshold: number
    onTaskAdd: boolean
    onTaskDelete: boolean
  }
}

export interface CreateProjectRequest {
  name: string
  description?: string
  color?: string
  settings?: Partial<ProjectSettings>
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  color?: string
  settings?: Partial<ProjectSettings>
}

export interface ProjectListResponse {
  projects: Project[]
  total: number
}

// ==================== Task Types ====================

export interface Task {
  id: string
  projectId: string
  name: string
  startDate: Date
  endDate: Date
  progress: number
  color: string
  dependencies: string[]
  assignees: TaskAssignee[]
  isMilestone: boolean
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked'
  tags: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface TaskAssignee {
  userId: string
  name: string
  email: string
  avatar?: string
}

export interface CreateTaskRequest {
  projectId: string
  name: string
  startDate: Date
  endDate: Date
  progress?: number
  color?: string
  dependencies?: string[]
  assignees?: string[] // user IDs
  isMilestone?: boolean
  description?: string
  priority?: Task['priority']
  status?: Task['status']
  tags?: string[]
}

export interface UpdateTaskRequest {
  name?: string
  startDate?: Date
  endDate?: Date
  progress?: number
  color?: string
  dependencies?: string[]
  assignees?: string[]
  isMilestone?: boolean
  description?: string
  priority?: Task['priority']
  status?: Task['status']
  tags?: string[]
}

export interface BatchUpdateTasksRequest {
  updates: Array<{
    id: string
    changes: UpdateTaskRequest
  }>
}

export interface TaskListResponse {
  tasks: Task[]
  total: number
}

// ==================== Version Types ====================

export interface Version {
  id: string
  projectId: string
  versionNumber: number
  createdAt: Date
  createdBy: {
    id: string
    name: string
    email: string
  }
  snapshot: {
    tasks: Task[]
    projectSettings: ProjectSettings
  }
  changeDescription?: string
  isAutomatic: boolean
}

export interface CreateVersionRequest {
  projectId: string
  changeDescription?: string
}

export interface VersionListResponse {
  versions: Version[]
  total: number
}

export interface RestoreVersionRequest {
  versionId: string
}

// ==================== API Response Wrappers ====================

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
  statusCode: number
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ==================== Share Link Types ====================

export interface ShareLink {
  id: string
  projectId: string
  token: string
  accessType: 'readonly' | 'editable'
  expiresAt: Date | null
  createdAt: Date
  createdBy: {
    id: string
    name: string
    email: string
  }
  accessCount: number
  lastAccessedAt: Date | null
}

export interface CreateShareLinkRequest {
  projectId: string
  accessType: 'readonly' | 'editable'
  expirationDays?: number // null or undefined for never expires
}

export interface ShareLinkListResponse {
  shareLinks: ShareLink[]
  total: number
}

export interface SharedProjectResponse {
  project: Project
  tasks: Task[]
  accessType: 'readonly' | 'editable'
  shareLink: {
    id: string
    expiresAt: Date | null
  }
}

export interface RevokeShareLinkRequest {
  shareLinkId: string
}

// ==================== Utility Types ====================

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestConfig {
  method: ApiMethod
  url: string
  data?: unknown
  params?: Record<string, unknown>
  headers?: Record<string, string>
}
