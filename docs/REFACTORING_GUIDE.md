# Refactoring Guide

This guide provides detailed step-by-step instructions for implementing the architectural improvements identified in the code review.

---

## Table of Contents

1. [Service/Repository Layer Implementation](#1-servicerepository-layer-implementation)
2. [Splitting ProjectContext](#2-splitting-projectcontext)
3. [Type Safety Improvements](#3-type-safety-improvements)
4. [API Versioning Strategy](#4-api-versioning-strategy)
5. [Performance Optimizations](#5-performance-optimizations)
6. [Testing Strategy](#6-testing-strategy)

---

## 1. Service/Repository Layer Implementation

### Overview

Move from direct Prisma usage in controllers to a layered architecture:
```
Routes → Controllers → Services → Repositories → Database
```

### Benefits
- **Testability:** Mock repositories in service tests, mock services in controller tests
- **Maintainability:** Business logic centralized in services
- **Flexibility:** Easy to switch ORMs or add caching
- **Reusability:** Share business logic across multiple endpoints

### Step-by-Step Implementation

#### Phase 1: Create Repository Layer (Week 1)

**1.1 Create Base Repository Interface**

Create `server/src/repositories/BaseRepository.ts`:
```typescript
export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>
  findMany(where?: any): Promise<T[]>
  create(data: any): Promise<T>
  update(id: string, data: any): Promise<T>
  delete(id: string): Promise<void>
}
```

**1.2 Create Project Repository**

Create `server/src/repositories/ProjectRepository.ts`:
```typescript
import { Prisma, Project } from '@prisma/client'
import prisma from '../config/database'
import { IBaseRepository } from './BaseRepository'

export interface ProjectWithRelations extends Project {
  tasks?: Task[]
  versions?: ProjectVersion[]
  shareLinks?: ShareLink[]
}

export class ProjectRepository implements IBaseRepository<Project> {
  /**
   * Find project by ID with optional relations
   */
  async findById(
    id: string,
    include?: Prisma.ProjectInclude
  ): Promise<ProjectWithRelations | null> {
    return prisma.project.findUnique({
      where: { id },
      include: include || {
        tasks: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
  }

  /**
   * Find projects by owner with pagination
   */
  async findByOwner(
    ownerId: string,
    options?: {
      skip?: number
      take?: number
      where?: Prisma.ProjectWhereInput
    }
  ): Promise<Project[]> {
    return prisma.project.findMany({
      where: {
        ownerId,
        ...options?.where,
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Find public projects
   */
  async findPublic(options?: {
    skip?: number
    take?: number
    search?: string
  }): Promise<Project[]> {
    const where: Prisma.ProjectWhereInput = {
      isPublic: true,
      ...(options?.search && {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    }

    return prisma.project.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Count projects by owner
   */
  async countByOwner(
    ownerId: string,
    where?: Prisma.ProjectWhereInput
  ): Promise<number> {
    return prisma.project.count({
      where: {
        ownerId,
        ...where,
      },
    })
  }

  /**
   * Create a new project
   */
  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return prisma.project.create({
      data,
    })
  }

  /**
   * Update a project
   */
  async update(
    id: string,
    data: Prisma.ProjectUpdateInput
  ): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete a project (cascades to tasks, versions, etc.)
   */
  async delete(id: string): Promise<void> {
    await prisma.project.delete({
      where: { id },
    })
  }

  /**
   * Check if user owns project
   */
  async isOwner(projectId: string, userId: string): Promise<boolean> {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      },
    })
    return !!project
  }

  /**
   * Find many projects with complex query
   */
  async findMany(where?: Prisma.ProjectWhereInput): Promise<Project[]> {
    return prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
  }
}

// Export singleton instance
export const projectRepository = new ProjectRepository()
```

**1.3 Create Task Repository**

Create `server/src/repositories/TaskRepository.ts`:
```typescript
import { Prisma, Task } from '@prisma/client'
import prisma from '../config/database'
import { IBaseRepository } from './BaseRepository'

export class TaskRepository implements IBaseRepository<Task> {
  async findById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({
      where: { id },
    })
  }

  async findByProject(projectId: string): Promise<Task[]> {
    return prisma.task.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    })
  }

  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    return prisma.task.create({
      data,
    })
  }

  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    return prisma.task.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.task.delete({
      where: { id },
    })
  }

  async updateMany(
    where: Prisma.TaskWhereInput,
    data: Prisma.TaskUpdateInput
  ): Promise<number> {
    const result = await prisma.task.updateMany({
      where,
      data,
    })
    return result.count
  }

  async findMany(where?: Prisma.TaskWhereInput): Promise<Task[]> {
    return prisma.task.findMany({
      where,
      orderBy: { position: 'asc' },
    })
  }
}

export const taskRepository = new TaskRepository()
```

**1.4 Create User Repository**

Create `server/src/repositories/UserRepository.ts`:
```typescript
import { Prisma, User } from '@prisma/client'
import prisma from '../config/database'

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    })
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
    })
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    })
  }
}

export const userRepository = new UserRepository()
```

**1.5 Create Version Repository**

Create `server/src/repositories/VersionRepository.ts`:
```typescript
import { Prisma, ProjectVersion } from '@prisma/client'
import prisma from '../config/database'

export class VersionRepository {
  async findById(id: string): Promise<ProjectVersion | null> {
    return prisma.projectVersion.findUnique({
      where: { id },
    })
  }

  async findByProject(projectId: string): Promise<ProjectVersion[]> {
    return prisma.projectVersion.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: Prisma.ProjectVersionCreateInput): Promise<ProjectVersion> {
    return prisma.projectVersion.create({
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.projectVersion.delete({
      where: { id },
    })
  }
}

export const versionRepository = new VersionRepository()
```

#### Phase 2: Create Service Layer (Week 2-3)

**2.1 Create Project Service**

Create `server/src/services/ProjectService.ts`:
```typescript
import { Project, Prisma } from '@prisma/client'
import {
  ProjectRepository,
  projectRepository,
} from '../repositories/ProjectRepository'
import { VersionService, versionService } from './VersionService'
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler'

export class ProjectService {
  constructor(
    private projectRepo: ProjectRepository,
    private versionService: VersionService
  ) {}

  /**
   * Get project by ID with authorization check
   */
  async getProjectById(
    projectId: string,
    userId: string,
    options?: { include?: Prisma.ProjectInclude }
  ): Promise<Project> {
    const project = await this.projectRepo.findById(projectId, options?.include)

    if (!project) {
      throw new NotFoundError('Project')
    }

    // Authorization check
    if (project.ownerId !== userId && !project.isPublic) {
      throw new ForbiddenError('You do not have access to this project')
    }

    return project
  }

  /**
   * Get projects for user with pagination and filters
   */
  async getProjectsForUser(
    userId: string,
    options?: {
      page?: number
      limit?: number
      search?: string
      isPublic?: boolean
    }
  ): Promise<{ projects: Project[]; total: number; page: number; pages: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 10
    const skip = (page - 1) * limit

    const where: Prisma.ProjectWhereInput = {
      ownerId: userId,
      ...(options?.search && {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
      ...(options?.isPublic !== undefined && {
        isPublic: options.isPublic,
      }),
    }

    const [projects, total] = await Promise.all([
      this.projectRepo.findByOwner(userId, { skip, take: limit, where }),
      this.projectRepo.countByOwner(userId, where),
    ])

    return {
      projects,
      total,
      page,
      pages: Math.ceil(total / limit),
    }
  }

  /**
   * Create a new project
   */
  async createProject(
    userId: string,
    data: {
      name: string
      description?: string
      startDate: Date
      endDate: Date
      isPublic?: boolean
    }
  ): Promise<Project> {
    // Validate date range
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      throw new BadRequestError('Start date must be before end date')
    }

    // Create project
    const project = await this.projectRepo.create({
      name: data.name,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isPublic: data.isPublic || false,
      owner: {
        connect: { id: userId },
      },
    })

    // Create initial version
    await this.versionService.createVersion(project.id, {
      name: 'Initial version',
      description: 'Project created',
      snapshotData: { tasks: [] },
    })

    return project
  }

  /**
   * Update a project
   */
  async updateProject(
    projectId: string,
    userId: string,
    data: Prisma.ProjectUpdateInput
  ): Promise<Project> {
    // Check ownership
    const isOwner = await this.projectRepo.isOwner(projectId, userId)
    if (!isOwner) {
      throw new ForbiddenError('You do not have permission to update this project')
    }

    // Validate date range if both dates provided
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate as string)
      const endDate = new Date(data.endDate as string)
      if (startDate >= endDate) {
        throw new BadRequestError('Start date must be before end date')
      }
    }

    return this.projectRepo.update(projectId, data)
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    // Check ownership
    const isOwner = await this.projectRepo.isOwner(projectId, userId)
    if (!isOwner) {
      throw new ForbiddenError('You do not have permission to delete this project')
    }

    await this.projectRepo.delete(projectId)
  }

  /**
   * Toggle project visibility
   */
  async toggleVisibility(projectId: string, userId: string): Promise<Project> {
    const project = await this.getProjectById(projectId, userId)

    return this.projectRepo.update(projectId, {
      isPublic: !project.isPublic,
    })
  }
}

// Export singleton instance
export const projectService = new ProjectService(
  projectRepository,
  versionService
)
```

**2.2 Create Task Service**

Create `server/src/services/TaskService.ts`:
```typescript
import { Task, Prisma } from '@prisma/client'
import { TaskRepository, taskRepository } from '../repositories/TaskRepository'
import { ProjectService, projectService } from './ProjectService'
import { NotFoundError, BadRequestError } from '../middleware/errorHandler'

export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private projectService: ProjectService
  ) {}

  /**
   * Get task by ID with authorization
   */
  async getTaskById(taskId: string, userId: string): Promise<Task> {
    const task = await this.taskRepo.findById(taskId)

    if (!task) {
      throw new NotFoundError('Task')
    }

    // Check project access
    await this.projectService.getProjectById(task.projectId, userId)

    return task
  }

  /**
   * Get tasks for a project
   */
  async getTasksForProject(projectId: string, userId: string): Promise<Task[]> {
    // Check project access
    await this.projectService.getProjectById(projectId, userId)

    return this.taskRepo.findByProject(projectId)
  }

  /**
   * Create a task
   */
  async createTask(
    projectId: string,
    userId: string,
    data: {
      name: string
      description?: string
      startDate: Date
      endDate: Date
      status?: string
      assignedTo?: string
    }
  ): Promise<Task> {
    // Check project access and ownership
    const project = await this.projectService.getProjectById(projectId, userId)
    if (project.ownerId !== userId) {
      throw new ForbiddenError('Only the project owner can create tasks')
    }

    // Validate date range
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    if (startDate >= endDate) {
      throw new BadRequestError('Start date must be before end date')
    }

    // Get next position
    const existingTasks = await this.taskRepo.findByProject(projectId)
    const maxPosition = existingTasks.reduce(
      (max, task) => Math.max(max, task.position),
      0
    )

    return this.taskRepo.create({
      name: data.name,
      description: data.description,
      startDate,
      endDate,
      status: data.status || 'pending',
      position: maxPosition + 1,
      project: {
        connect: { id: projectId },
      },
      ...(data.assignedTo && {
        assignedTo: {
          connect: { id: data.assignedTo },
        },
      }),
    })
  }

  /**
   * Update a task
   */
  async updateTask(
    taskId: string,
    userId: string,
    data: Prisma.TaskUpdateInput
  ): Promise<Task> {
    const task = await this.getTaskById(taskId, userId)

    // Check project ownership
    const project = await this.projectService.getProjectById(task.projectId, userId)
    if (project.ownerId !== userId) {
      throw new ForbiddenError('Only the project owner can update tasks')
    }

    // Validate date range if both dates provided
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate as string)
      const endDate = new Date(data.endDate as string)
      if (startDate >= endDate) {
        throw new BadRequestError('Start date must be before end date')
      }
    }

    return this.taskRepo.update(taskId, data)
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.getTaskById(taskId, userId)

    // Check project ownership
    const project = await this.projectService.getProjectById(task.projectId, userId)
    if (project.ownerId !== userId) {
      throw new ForbiddenError('Only the project owner can delete tasks')
    }

    await this.taskRepo.delete(taskId)
  }

  /**
   * Reorder tasks
   */
  async reorderTasks(
    projectId: string,
    userId: string,
    taskIds: string[]
  ): Promise<void> {
    // Check project ownership
    const project = await this.projectService.getProjectById(projectId, userId)
    if (project.ownerId !== userId) {
      throw new ForbiddenError('Only the project owner can reorder tasks')
    }

    // Update positions
    const updates = taskIds.map((taskId, index) =>
      this.taskRepo.update(taskId, { position: index })
    )

    await Promise.all(updates)
  }
}

// Export singleton instance
export const taskService = new TaskService(taskRepository, projectService)
```

**2.3 Create Version Service**

Create `server/src/services/VersionService.ts`:
```typescript
import { ProjectVersion, Prisma } from '@prisma/client'
import {
  VersionRepository,
  versionRepository,
} from '../repositories/VersionRepository'
import { NotFoundError } from '../middleware/errorHandler'

export class VersionService {
  constructor(private versionRepo: VersionRepository) {}

  async createVersion(
    projectId: string,
    data: {
      name: string
      description?: string
      snapshotData: any
    }
  ): Promise<ProjectVersion> {
    return this.versionRepo.create({
      name: data.name,
      description: data.description,
      snapshotData: data.snapshotData,
      project: {
        connect: { id: projectId },
      },
    })
  }

  async getVersionsForProject(projectId: string): Promise<ProjectVersion[]> {
    return this.versionRepo.findByProject(projectId)
  }

  async getVersionById(versionId: string): Promise<ProjectVersion> {
    const version = await this.versionRepo.findById(versionId)
    if (!version) {
      throw new NotFoundError('Version')
    }
    return version
  }

  async deleteVersion(versionId: string): Promise<void> {
    await this.versionRepo.delete(versionId)
  }
}

export const versionService = new VersionService(versionRepository)
```

#### Phase 3: Refactor Controllers (Week 3-4)

**3.1 Update Project Controller**

Update `server/src/controllers/project.controller.ts`:
```typescript
import { Request, Response } from 'express'
import { projectService } from '../services/ProjectService'
import { asyncHandler } from '../middleware/errorHandler'

/**
 * Get all projects for authenticated user
 * GET /api/projects
 */
export const getProjects = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { search, isPublic, page, limit } = req.query

    const result = await projectService.getProjectsForUser(req.user!.id, {
      search: search as string,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    })

    res.json({
      success: true,
      data: result,
    })
  }
)

/**
 * Get single project by ID
 * GET /api/projects/:id
 */
export const getProject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const project = await projectService.getProjectById(
      req.params.id,
      req.user!.id,
      {
        include: {
          tasks: true,
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      }
    )

    res.json({
      success: true,
      data: { project },
    })
  }
)

/**
 * Create new project
 * POST /api/projects
 */
export const createProject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const project = await projectService.createProject(req.user!.id, req.body)

    res.status(201).json({
      success: true,
      data: { project },
      message: 'Project created successfully',
    })
  }
)

/**
 * Update project
 * PUT /api/projects/:id
 */
export const updateProject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const project = await projectService.updateProject(
      req.params.id,
      req.user!.id,
      req.body
    )

    res.json({
      success: true,
      data: { project },
      message: 'Project updated successfully',
    })
  }
)

/**
 * Delete project
 * DELETE /api/projects/:id
 */
export const deleteProject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await projectService.deleteProject(req.params.id, req.user!.id)

    res.json({
      success: true,
      message: 'Project deleted successfully',
    })
  }
)

/**
 * Toggle project visibility
 * PATCH /api/projects/:id/visibility
 */
export const toggleVisibility = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const project = await projectService.toggleVisibility(
      req.params.id,
      req.user!.id
    )

    res.json({
      success: true,
      data: { project },
      message: `Project is now ${project.isPublic ? 'public' : 'private'}`,
    })
  }
)
```

**Key Changes:**
- Controllers are now thin wrappers around service methods
- No direct Prisma calls
- No business logic
- Only handle HTTP concerns (request/response)

#### Phase 4: Add Tests (Week 4)

**4.1 Repository Tests**

Create `server/__tests__/repositories/ProjectRepository.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { ProjectRepository } from '../../src/repositories/ProjectRepository'
import prisma from '../../src/config/database'

describe('ProjectRepository', () => {
  let repository: ProjectRepository
  let testUserId: string

  beforeEach(async () => {
    repository = new ProjectRepository()

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashed',
      },
    })
    testUserId = user.id
  })

  afterEach(async () => {
    // Cleanup
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('create', () => {
    it('should create a project', async () => {
      const project = await repository.create({
        name: 'Test Project',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        owner: {
          connect: { id: testUserId },
        },
      })

      expect(project.id).toBeDefined()
      expect(project.name).toBe('Test Project')
      expect(project.ownerId).toBe(testUserId)
    })
  })

  describe('findById', () => {
    it('should find project by id', async () => {
      const created = await repository.create({
        name: 'Test Project',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        owner: {
          connect: { id: testUserId },
        },
      })

      const found = await repository.findById(created.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.name).toBe('Test Project')
    })

    it('should return null for non-existent project', async () => {
      const found = await repository.findById('non-existent-id')
      expect(found).toBeNull()
    })
  })

  describe('isOwner', () => {
    it('should return true for project owner', async () => {
      const project = await repository.create({
        name: 'Test Project',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        owner: {
          connect: { id: testUserId },
        },
      })

      const isOwner = await repository.isOwner(project.id, testUserId)
      expect(isOwner).toBe(true)
    })

    it('should return false for non-owner', async () => {
      const project = await repository.create({
        name: 'Test Project',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        owner: {
          connect: { id: testUserId },
        },
      })

      const isOwner = await repository.isOwner(project.id, 'other-user-id')
      expect(isOwner).toBe(false)
    })
  })
})
```

**4.2 Service Tests (with Mocked Repositories)**

Create `server/__tests__/services/ProjectService.test.ts`:
```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { ProjectService } from '../../src/services/ProjectService'
import { ProjectRepository } from '../../src/repositories/ProjectRepository'
import { VersionService } from '../../src/services/VersionService'
import { NotFoundError, ForbiddenError, BadRequestError } from '../../src/middleware/errorHandler'

// Mock repositories
jest.mock('../../src/repositories/ProjectRepository')
jest.mock('../../src/services/VersionService')

describe('ProjectService', () => {
  let service: ProjectService
  let mockProjectRepo: jest.Mocked<ProjectRepository>
  let mockVersionService: jest.Mocked<VersionService>

  beforeEach(() => {
    mockProjectRepo = new ProjectRepository() as jest.Mocked<ProjectRepository>
    mockVersionService = new VersionService(null as any) as jest.Mocked<VersionService>
    service = new ProjectService(mockProjectRepo, mockVersionService)
  })

  describe('getProjectById', () => {
    it('should return project for owner', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        ownerId: 'user-1',
        isPublic: false,
      }

      mockProjectRepo.findById.mockResolvedValue(mockProject as any)

      const result = await service.getProjectById('project-1', 'user-1')

      expect(result).toEqual(mockProject)
      expect(mockProjectRepo.findById).toHaveBeenCalledWith('project-1', undefined)
    })

    it('should return public project for non-owner', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Public Project',
        ownerId: 'user-1',
        isPublic: true,
      }

      mockProjectRepo.findById.mockResolvedValue(mockProject as any)

      const result = await service.getProjectById('project-1', 'user-2')

      expect(result).toEqual(mockProject)
    })

    it('should throw NotFoundError for non-existent project', async () => {
      mockProjectRepo.findById.mockResolvedValue(null)

      await expect(
        service.getProjectById('non-existent', 'user-1')
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError for private project accessed by non-owner', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Private Project',
        ownerId: 'user-1',
        isPublic: false,
      }

      mockProjectRepo.findById.mockResolvedValue(mockProject as any)

      await expect(
        service.getProjectById('project-1', 'user-2')
      ).rejects.toThrow(ForbiddenError)
    })
  })

  describe('createProject', () => {
    it('should create project and initial version', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'New Project',
        ownerId: 'user-1',
      }

      mockProjectRepo.create.mockResolvedValue(mockProject as any)
      mockVersionService.createVersion.mockResolvedValue({} as any)

      const result = await service.createProject('user-1', {
        name: 'New Project',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      })

      expect(result).toEqual(mockProject)
      expect(mockProjectRepo.create).toHaveBeenCalled()
      expect(mockVersionService.createVersion).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({
          name: 'Initial version',
        })
      )
    })

    it('should throw BadRequestError for invalid date range', async () => {
      await expect(
        service.createProject('user-1', {
          name: 'New Project',
          startDate: new Date('2024-12-31'),
          endDate: new Date('2024-01-01'),
        })
      ).rejects.toThrow(BadRequestError)
    })
  })
})
```

---

## 2. Splitting ProjectContext

### Problem

`ProjectContext.tsx` is 443 lines and handles multiple responsibilities:
- Project state management
- Task CRUD operations
- Auto-save functionality
- Undo/redo management
- Dirty state tracking

### Solution

Split into multiple focused contexts and hooks.

### Step-by-Step Implementation

#### Step 1: Create Focused Contexts

**2.1 Create ProjectStateContext**

Create `client/src/contexts/ProjectStateContext.tsx`:
```typescript
import React, { createContext, useContext, useState, useCallback } from 'react'
import { Project, Task } from '../types/api'

interface ProjectState {
  currentProject: Project | null
  tasks: Task[]
  loading: boolean
  error: string | null
}

interface ProjectStateContextValue extends ProjectState {
  setCurrentProject: (project: Project | null) => void
  setTasks: (tasks: Task[]) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  addTask: (task: Task) => void
  removeTask: (taskId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const ProjectStateContext = createContext<ProjectStateContextValue | undefined>(
  undefined
)

export function ProjectStateProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    )
  }, [])

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task])
  }, [])

  const removeTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }, [])

  return (
    <ProjectStateContext.Provider
      value={{
        currentProject,
        tasks,
        loading,
        error,
        setCurrentProject,
        setTasks,
        updateTask,
        addTask,
        removeTask,
        setLoading,
        setError,
      }}
    >
      {children}
    </ProjectStateContext.Provider>
  )
}

export function useProjectState() {
  const context = useContext(ProjectStateContext)
  if (!context) {
    throw new Error('useProjectState must be used within ProjectStateProvider')
  }
  return context
}
```

**2.2 Create Auto-Save Hook**

Create `client/src/hooks/useAutoSaveState.tsx`:
```typescript
import { useEffect, useRef, useCallback } from 'react'
import { useProjectState } from '../contexts/ProjectStateContext'
import { apiClient } from '../services/api'

interface UseAutoSaveOptions {
  enabled?: boolean
  debounceMs?: number
  onSave?: () => void
  onError?: (error: Error) => void
}

export function useAutoSaveState(options: UseAutoSaveOptions = {}) {
  const {
    enabled = true,
    debounceMs = 2000,
    onSave,
    onError,
  } = options

  const { currentProject, tasks } = useProjectState()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedRef = useRef<string>('')

  const save = useCallback(async () => {
    if (!currentProject) return

    try {
      // Save project
      await apiClient.updateProject(currentProject.id, {
        name: currentProject.name,
        description: currentProject.description,
      })

      // Save tasks (batch update)
      const updates = tasks.map((task) =>
        apiClient.updateTask(task.id, task)
      )
      await Promise.all(updates)

      lastSavedRef.current = JSON.stringify({ currentProject, tasks })
      onSave?.()
    } catch (error) {
      onError?.(error as Error)
    }
  }, [currentProject, tasks, onSave, onError])

  useEffect(() => {
    if (!enabled) return

    const currentState = JSON.stringify({ currentProject, tasks })

    // Only save if state actually changed
    if (currentState === lastSavedRef.current) return

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save()
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [currentProject, tasks, enabled, debounceMs, save])

  return { save }
}
```

**2.3 Create Undo/Redo Hook**

Create `client/src/hooks/useUndoRedoState.tsx`:
```typescript
import { useState, useCallback } from 'react'
import { Task } from '../types/api'

interface HistoryState {
  tasks: Task[]
}

interface UseUndoRedoResult {
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  pushState: (state: HistoryState) => void
  clearHistory: () => void
}

export function useUndoRedoState(
  maxHistory: number = 50
): UseUndoRedoResult {
  const [history, setHistory] = useState<HistoryState[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  const pushState = useCallback(
    (state: HistoryState) => {
      setHistory((prev) => {
        // Remove any redo history
        const newHistory = prev.slice(0, currentIndex + 1)

        // Add new state
        newHistory.push(state)

        // Limit history size
        if (newHistory.length > maxHistory) {
          newHistory.shift()
          return newHistory
        }

        return newHistory
      })

      setCurrentIndex((prev) => Math.min(prev + 1, maxHistory - 1))
    },
    [currentIndex, maxHistory]
  )

  const undo = useCallback(() => {
    if (!canUndo) return
    setCurrentIndex((prev) => prev - 1)
  }, [canUndo])

  const redo = useCallback(() => {
    if (!canRedo) return
    setCurrentIndex((prev) => prev + 1)
  }, [canRedo])

  const clearHistory = useCallback(() => {
    setHistory([])
    setCurrentIndex(-1)
  }, [])

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    clearHistory,
  }
}
```

**2.4 Create Combined Project Provider**

Create `client/src/providers/ProjectProvider.tsx`:
```typescript
import React from 'react'
import { ProjectStateProvider } from '../contexts/ProjectStateContext'

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  return (
    <ProjectStateProvider>
      {children}
    </ProjectStateProvider>
  )
}
```

#### Step 2: Migrate Existing Code

**2.5 Update App.tsx**

```typescript
import { ProjectProvider } from './providers/ProjectProvider'

function App() {
  return (
    <ProjectProvider>
      <AuthProvider>
        <QueryProvider>
          {/* App content */}
        </QueryProvider>
      </AuthProvider>
    </ProjectProvider>
  )
}
```

**2.6 Update Components to Use New Hooks**

```typescript
import { useProjectState } from '../contexts/ProjectStateContext'
import { useAutoSaveState } from '../hooks/useAutoSaveState'
import { useUndoRedoState } from '../hooks/useUndoRedoState'

function ProjectEditor() {
  const { currentProject, tasks, updateTask } = useProjectState()
  const { save } = useAutoSaveState({ enabled: true })
  const { undo, redo, canUndo, canRedo, pushState } = useUndoRedoState()

  // Component logic
}
```

---

## 3. Type Safety Improvements

### Problem

Controllers use `any` types, bypassing TypeScript's type checking.

### Solution

Use Prisma's generated types throughout.

### Implementation

**3.1 Update Controller Types**

```typescript
import { Prisma } from '@prisma/client'

export async function getProjects(req: Request, res: Response) {
  const { search, isPublic } = req.query

  // Use Prisma.ProjectWhereInput instead of any
  const where: Prisma.ProjectWhereInput = {
    ownerId: req.user!.id,
    ...(search && {
      OR: [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ],
    }),
    ...(isPublic !== undefined && {
      isPublic: isPublic === 'true',
    }),
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  res.json({ success: true, data: { projects } })
}
```

**3.2 Create API Contract Types**

Create `shared/types/api-contracts.ts`:
```typescript
/**
 * API Request/Response type definitions
 * These types represent the API contract between frontend and backend
 */

// Project Types
export interface CreateProjectRequest {
  name: string
  description?: string
  startDate: string // ISO date string
  endDate: string
  isPublic?: boolean
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  startDate?: string
  endDate?: string
  isPublic?: boolean
}

export interface ProjectResponse {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  isPublic: boolean
  ownerId: string
  createdAt: string
  updatedAt: string
}

// Task Types
export interface CreateTaskRequest {
  name: string
  description?: string
  startDate: string
  endDate: string
  status?: string
  assignedTo?: string
}

export interface UpdateTaskRequest {
  name?: string
  description?: string
  startDate?: string
  endDate?: string
  status?: string
  position?: number
}

export interface TaskResponse {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  status: string
  position: number
  projectId: string
  assignedTo: string | null
  createdAt: string
  updatedAt: string
}

// Standard API Response Wrappers
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any[]
  }
  timestamp: string
  path: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
```

**3.3 Use Contract Types in Controllers**

```typescript
import { CreateProjectRequest, ProjectResponse } from '@shared/types/api-contracts'

export const createProject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body: CreateProjectRequest = req.body

    const project = await projectService.createProject(req.user!.id, {
      name: body.name,
      description: body.description,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      isPublic: body.isPublic,
    })

    const response: ProjectResponse = {
      id: project.id,
      name: project.name,
      description: project.description,
      startDate: project.startDate.toISOString(),
      endDate: project.endDate.toISOString(),
      isPublic: project.isPublic,
      ownerId: project.ownerId,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }

    res.status(201).json({
      success: true,
      data: { project: response },
    })
  }
)
```

---

## 4. API Versioning Strategy

### Problem

No API versioning makes breaking changes difficult.

### Solution

Implement URL-based versioning.

### Implementation

**4.1 Create Versioned Route Structure**

```
server/src/
├── routes/
│   ├── v1/
│   │   ├── index.ts
│   │   ├── project.routes.ts
│   │   ├── task.routes.ts
│   │   └── auth.routes.ts
│   └── index.ts
```

**4.2 Update index.ts**

```typescript
// server/src/routes/index.ts
import { Router } from 'express'
import v1Routes from './v1'

const router = Router()

// Mount v1 routes
router.use('/v1', v1Routes)

// Redirect /api to /api/v1 for backward compatibility
router.use('/', v1Routes)

export default router
```

**4.3 Create v1/index.ts**

```typescript
// server/src/routes/v1/index.ts
import { Router } from 'express'
import authRoutes from './auth.routes'
import projectRoutes from './project.routes'
import taskRoutes from './task.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/projects', projectRoutes)
router.use('/tasks', taskRoutes)

export default router
```

**4.4 Update Server Entry Point**

```typescript
// server/src/index.ts
import routes from './routes'

app.use('/api', routes)
```

Now your API supports:
- `/api/v1/projects` - Explicit v1
- `/api/projects` - Implicit v1 (backward compatible)

**4.5 Frontend API Client**

```typescript
// client/src/services/api.ts
const API_VERSION = 'v1'
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${BASE_URL}/api/${API_VERSION}`,
    })
  }

  // Methods...
}
```

---

## 5. Performance Optimizations

### 5.1 Database Query Optimization

**Add indexes:**
```prisma
model Task {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  status    String   @default("pending")
  position  Int      @default(0)

  @@index([projectId, position]) // Composite index for ordering
  @@index([status]) // Index for filtering
  @@map("tasks")
}
```

**Use select to fetch only needed fields:**
```typescript
const projects = await prisma.project.findMany({
  select: {
    id: true,
    name: true,
    startDate: true,
    endDate: true,
    // Don't fetch tasks unless needed
  },
})
```

### 5.2 Frontend Bundle Optimization

**Add route-based code splitting:**
```typescript
// App.tsx
import { lazy, Suspense } from 'react'

const ProjectPage = lazy(() => import('./pages/ProjectPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
      </Routes>
    </Suspense>
  )
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

- **Repositories:** Test CRUD operations with test database
- **Services:** Test business logic with mocked repositories
- **Utilities:** Test pure functions

### 6.2 Integration Tests

- **API Endpoints:** Test full request/response cycle with test database
- **Use Supertest for HTTP assertions**

### 6.3 E2E Tests

- **User Flows:** Test complete user journeys
- **Use Cypress or Playwright**

---

## Summary Checklist

### Backend Refactoring
- [ ] Create repository classes for all models
- [ ] Create service classes with business logic
- [ ] Refactor controllers to use services
- [ ] Add unit tests for services
- [ ] Add integration tests for repositories
- [ ] Update API to use Prisma types
- [ ] Implement API versioning

### Frontend Refactoring
- [ ] Split ProjectContext into focused contexts
- [ ] Create separate auto-save hook
- [ ] Create separate undo/redo hook
- [ ] Update components to use new hooks
- [ ] Add route-based code splitting
- [ ] Optimize bundle size

### Type Safety
- [ ] Replace `any` types with Prisma types
- [ ] Create API contract types
- [ ] Sync types between frontend and backend

### Documentation
- [ ] Document new architecture
- [ ] Update API documentation
- [ ] Add inline code documentation

---

**Estimated Total Effort:** 80-120 hours over 4-6 weeks

**Recommended Approach:**
1. Start with repository layer (foundational)
2. Add service layer with tests
3. Refactor controllers
4. Split frontend contexts
5. Add type safety
6. Implement versioning
7. Optimize performance

Each phase can be done incrementally without breaking existing functionality.
