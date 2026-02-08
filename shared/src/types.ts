// Shared types between client and server

// ============================================
// Enums
// ============================================

export enum AccessType {
  READONLY = 'READONLY',
  EDITABLE = 'EDITABLE'
}

// ============================================
// Database Models
// ============================================

export interface User {
  id: string
  email: string
  createdAt: Date
  // passwordHash is intentionally excluded for security
}

export interface Project {
  id: string
  name: string
  isPublic: boolean
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface ProjectWithOwner extends Project {
  owner: User
}

export interface ProjectWithTasks extends Project {
  tasks: Task[]
}

export interface ProjectVersion {
  id: string
  projectId: string
  versionNumber: number
  snapshotData: any // JSON data
  createdAt: Date
  createdBy: string
}

export interface ProjectVersionWithCreator extends ProjectVersion {
  creator: User
}

export interface Task {
  id: string
  projectId: string
  name: string
  startDate: Date
  endDate: Date
  color: string
  position: number
  createdAt: Date
}

export interface ShareLink {
  id: string
  projectId: string
  token: string
  accessType: AccessType
  createdAt: Date
  expiresAt: Date | null
}

export interface ShareLinkWithProject extends ShareLink {
  project: Project
}

// ============================================
// DTOs (Data Transfer Objects)
// ============================================

// User DTOs
export interface RegisterUserDto {
  email: string
  password: string
}

export interface LoginUserDto {
  email: string
  password: string
}

export interface AuthResponseDto {
  user: User
  token: string
}

// Project DTOs
export interface CreateProjectDto {
  name: string
  isPublic?: boolean
}

export interface UpdateProjectDto {
  name?: string
  isPublic?: boolean
}

export interface ProjectResponseDto extends Project {
  owner: User
  tasks: Task[]
  versions?: ProjectVersion[]
  shareLinks?: ShareLink[]
}

// Task DTOs
export interface CreateTaskDto {
  projectId: string
  name: string
  startDate: Date | string
  endDate: Date | string
  color?: string
  position?: number
}

export interface UpdateTaskDto {
  name?: string
  startDate?: Date | string
  endDate?: Date | string
  color?: string
  position?: number
}

export interface BulkUpdateTasksDto {
  tasks: Array<{
    id: string
    position?: number
    startDate?: Date | string
    endDate?: Date | string
  }>
}

// Project Version DTOs
export interface CreateProjectVersionDto {
  versionNumber: number
  snapshotData: any
}

export interface ProjectVersionResponseDto extends ProjectVersion {
  project: {
    id: string
    name: string
  }
}

// Share Link DTOs
export interface CreateShareLinkDto {
  projectId: string
  accessType: AccessType
  expiresAt?: Date | string | null
}

export interface UpdateShareLinkDto {
  accessType?: AccessType
  expiresAt?: Date | string | null
}

export interface ValidateShareLinkDto {
  token: string
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export interface ProjectsListResponse {
  projects: Array<Project & {
    owner: User
    tasks: Task[]
    _count: {
      tasks: number
      versions: number
    }
  }>
  pagination: PaginationMeta
}

// ============================================
// Query Parameters
// ============================================

export interface ProjectQueryParams {
  page?: number
  pageSize?: number
  isPublic?: boolean
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'name'
  sortOrder?: 'asc' | 'desc'
}

export interface TaskQueryParams {
  projectId?: string
  startDate?: Date | string
  endDate?: Date | string
  sortBy?: 'position' | 'startDate' | 'endDate'
  sortOrder?: 'asc' | 'desc'
}

// ============================================
// Frontend-specific Types
// ============================================

export interface GanttChartData {
  project: Project
  tasks: Task[]
  startDate: Date
  endDate: Date
  timeScale: 'day' | 'week' | 'month'
}

export interface TaskDragEvent {
  taskId: string
  newStartDate: Date
  newEndDate: Date
  newPosition?: number
}

export interface TaskResizeEvent {
  taskId: string
  newStartDate: Date
  newEndDate: Date
}
