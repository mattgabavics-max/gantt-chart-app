/**
 * API Client Service
 * Centralized API client with axios, interceptors, and error handling
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'
import type {
  ApiResponse,
  ApiError,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectListResponse,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  BatchUpdateTasksRequest,
  TaskListResponse,
  Version,
  CreateVersionRequest,
  VersionListResponse,
  RestoreVersionRequest,
  PaginationParams,
  ShareLink,
  CreateShareLinkRequest,
  ShareLinkListResponse,
  SharedProjectResponse,
  RevokeShareLinkRequest,
} from '../types/api'

// ==================== Constants ====================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
const TOKEN_KEY = 'gantt_auth_token'
const REFRESH_TOKEN_KEY = 'gantt_refresh_token'
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // milliseconds

// ==================== Token Management ====================

export const tokenManager = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },

  removeRefreshToken(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  clearAll(): void {
    this.removeToken()
    this.removeRefreshToken()
  },
}

// ==================== Axios Instance ====================

class ApiClient {
  private client: AxiosInstance
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (token: string) => void
    reject: (error: Error) => void
  }> = []

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Send cookies with requests
    })

    this.setupInterceptors()
  }

  // ==================== Interceptors ====================

  private setupInterceptors(): void {
    // Request interceptor - Add auth token and CSRF token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add auth token from localStorage (backwards compatibility)
        const token = tokenManager.getToken()
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add CSRF token for state-changing requests
        const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
        if (config.method && unsafeMethods.includes(config.method.toUpperCase())) {
          const csrfToken = this.getCsrfTokenFromCookie()
          if (csrfToken && config.headers) {
            config.headers['x-csrf-token'] = csrfToken
          }
        }

        return config
      },
      (error: AxiosError) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor - Handle errors and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean
          _retryCount?: number
        }

        // Handle 401 Unauthorized - Token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue the request while refreshing
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`
                }
                return this.client(originalRequest)
              })
              .catch((err) => Promise.reject(err))
          }

          originalRequest._retry = true
          this.isRefreshing = true

          const refreshToken = tokenManager.getRefreshToken()

          if (!refreshToken) {
            // No refresh token, logout
            this.clearAuthAndRedirect()
            return Promise.reject(error)
          }

          try {
            const response = await this.refreshToken({ refreshToken })
            const { token, refreshToken: newRefreshToken } = response.data

            tokenManager.setToken(token)
            tokenManager.setRefreshToken(newRefreshToken)

            // Retry all queued requests
            this.failedQueue.forEach((promise) => promise.resolve(token))
            this.failedQueue = []

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return this.client(originalRequest)
          } catch (refreshError) {
            // Refresh failed, logout
            this.failedQueue.forEach((promise) =>
              promise.reject(refreshError as Error)
            )
            this.failedQueue = []
            this.clearAuthAndRedirect()
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        // Handle network errors with retry logic
        if (this.shouldRetry(error, originalRequest)) {
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1

          await this.delay(RETRY_DELAY * originalRequest._retryCount)
          return this.client(originalRequest)
        }

        // Transform error to ApiError format
        return Promise.reject(this.transformError(error))
      }
    )
  }

  // ==================== Helper Methods ====================

  private shouldRetry(
    error: AxiosError,
    config: InternalAxiosRequestConfig & { _retryCount?: number }
  ): boolean {
    const retryCount = config._retryCount || 0

    // Don't retry if max retries reached
    if (retryCount >= MAX_RETRIES) {
      return false
    }

    // Retry on network errors or 5xx server errors
    if (!error.response) {
      return true // Network error
    }

    const status = error.response.status
    return status >= 500 && status < 600
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private transformError(error: AxiosError<ApiError>): ApiError {
    if (error.response?.data) {
      return error.response.data
    }

    // Network error or unknown error
    return {
      success: false,
      error: {
        code: error.code || 'NETWORK_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: error,
      },
      statusCode: error.response?.status || 0,
    }
  }

  private clearAuthAndRedirect(): void {
    tokenManager.clearAll()
    // Emit custom event for auth context to handle
    window.dispatchEvent(new CustomEvent('auth:logout'))
  }

  /**
   * Get CSRF token from cookie
   */
  private getCsrfTokenFromCookie(): string | null {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'gantt_csrf_token') {
        return decodeURIComponent(value)
      }
    }
    return null
  }

  // ==================== Auth Endpoints ====================

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.client.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      data
    )
    return response.data
  }

  async register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.client.post<ApiResponse<LoginResponse>>(
      '/auth/register',
      data
    )
    return response.data
  }

  async refreshToken(
    data: RefreshTokenRequest
  ): Promise<ApiResponse<RefreshTokenResponse>> {
    const response = await this.client.post<
      ApiResponse<RefreshTokenResponse>
    >('/auth/refresh', data)
    return response.data
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.client.post<ApiResponse<void>>('/auth/logout')
    tokenManager.clearAll()
    return response.data
  }

  async getCurrentUser(): Promise<ApiResponse<LoginResponse['user']>> {
    const response = await this.client.get<
      ApiResponse<LoginResponse['user']>
    >('/auth/me')
    return response.data
  }

  // ==================== Project Endpoints ====================

  async getProjects(
    params?: PaginationParams
  ): Promise<ApiResponse<ProjectListResponse>> {
    const response = await this.client.get<
      ApiResponse<ProjectListResponse>
    >('/projects', { params })
    return response.data
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    const response = await this.client.get<ApiResponse<Project>>(
      `/projects/${id}`
    )
    return response.data
  }

  async createProject(
    data: CreateProjectRequest
  ): Promise<ApiResponse<Project>> {
    const response = await this.client.post<ApiResponse<Project>>(
      '/projects',
      data
    )
    return response.data
  }

  async updateProject(
    id: string,
    data: UpdateProjectRequest
  ): Promise<ApiResponse<Project>> {
    const response = await this.client.patch<ApiResponse<Project>>(
      `/projects/${id}`,
      data
    )
    return response.data
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete<ApiResponse<void>>(
      `/projects/${id}`
    )
    return response.data
  }

  // ==================== Task Endpoints ====================

  async getTasks(
    projectId: string,
    params?: PaginationParams
  ): Promise<ApiResponse<TaskListResponse>> {
    const response = await this.client.get<ApiResponse<TaskListResponse>>(
      `/projects/${projectId}/tasks`,
      { params }
    )
    return response.data
  }

  async getTask(projectId: string, taskId: string): Promise<ApiResponse<Task>> {
    const response = await this.client.get<ApiResponse<Task>>(
      `/projects/${projectId}/tasks/${taskId}`
    )
    return response.data
  }

  async createTask(data: CreateTaskRequest): Promise<ApiResponse<Task>> {
    const response = await this.client.post<ApiResponse<Task>>(
      `/projects/${data.projectId}/tasks`,
      data
    )
    return response.data
  }

  async updateTask(
    projectId: string,
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<ApiResponse<Task>> {
    const response = await this.client.patch<ApiResponse<Task>>(
      `/projects/${projectId}/tasks/${taskId}`,
      data
    )
    return response.data
  }

  async batchUpdateTasks(
    projectId: string,
    data: BatchUpdateTasksRequest
  ): Promise<ApiResponse<Task[]>> {
    const response = await this.client.patch<ApiResponse<Task[]>>(
      `/projects/${projectId}/tasks/batch`,
      data
    )
    return response.data
  }

  async deleteTask(projectId: string, taskId: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete<ApiResponse<void>>(
      `/projects/${projectId}/tasks/${taskId}`
    )
    return response.data
  }

  // ==================== Version Endpoints ====================

  async getVersions(
    projectId: string,
    params?: PaginationParams
  ): Promise<ApiResponse<VersionListResponse>> {
    const response = await this.client.get<ApiResponse<VersionListResponse>>(
      `/projects/${projectId}/versions`,
      { params }
    )
    return response.data
  }

  async getVersion(
    projectId: string,
    versionId: string
  ): Promise<ApiResponse<Version>> {
    const response = await this.client.get<ApiResponse<Version>>(
      `/projects/${projectId}/versions/${versionId}`
    )
    return response.data
  }

  async createVersion(
    data: CreateVersionRequest
  ): Promise<ApiResponse<Version>> {
    const response = await this.client.post<ApiResponse<Version>>(
      `/projects/${data.projectId}/versions`,
      data
    )
    return response.data
  }

  async restoreVersion(
    projectId: string,
    data: RestoreVersionRequest
  ): Promise<ApiResponse<void>> {
    const response = await this.client.post<ApiResponse<void>>(
      `/projects/${projectId}/versions/${data.versionId}/restore`
    )
    return response.data
  }

  async deleteVersion(
    projectId: string,
    versionId: string
  ): Promise<ApiResponse<void>> {
    const response = await this.client.delete<ApiResponse<void>>(
      `/projects/${projectId}/versions/${versionId}`
    )
    return response.data
  }

  // ==================== Share Link Endpoints ====================

  async getShareLinks(
    projectId: string,
    params?: PaginationParams
  ): Promise<ApiResponse<ShareLinkListResponse>> {
    const response = await this.client.get<ApiResponse<ShareLinkListResponse>>(
      `/projects/${projectId}/share-links`,
      { params }
    )
    return response.data
  }

  async createShareLink(
    data: CreateShareLinkRequest
  ): Promise<ApiResponse<ShareLink>> {
    const response = await this.client.post<ApiResponse<ShareLink>>(
      `/projects/${data.projectId}/share-links`,
      data
    )
    return response.data
  }

  async revokeShareLink(
    projectId: string,
    shareLinkId: string
  ): Promise<ApiResponse<void>> {
    const response = await this.client.delete<ApiResponse<void>>(
      `/projects/${projectId}/share-links/${shareLinkId}`
    )
    return response.data
  }

  async getSharedProject(token: string): Promise<ApiResponse<SharedProjectResponse>> {
    // This endpoint doesn't require authentication
    const response = await this.client.get<ApiResponse<SharedProjectResponse>>(
      `/share/${token}`
    )
    return response.data
  }

  async updateSharedProjectTask(
    token: string,
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<ApiResponse<Task>> {
    // For editable shared projects
    const response = await this.client.patch<ApiResponse<Task>>(
      `/share/${token}/tasks/${taskId}`,
      data
    )
    return response.data
  }

  // ==================== Generic Request Method ====================

  async request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config)
    return response.data
  }
}

// ==================== Export Singleton Instance ====================

export const api = new ApiClient()
export default api
