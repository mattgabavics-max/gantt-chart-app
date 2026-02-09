/**
 * Project Controller Unit Tests
 * Tests business logic and error handling without hitting the database
 */

import { Request, Response } from 'express'
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} from '../project.controller'
import prisma from '../../config/database'
import {
  NotFoundError,
  ForbiddenError,
} from '../../middleware/errorHandler'

// Mock Prisma
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    project: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

// Mock Request and Response
const mockRequest = (overrides?: Partial<Request>): Request =>
  ({
    params: {},
    query: {},
    body: {},
    user: { id: 'user-1', email: 'test@example.com' },
    ...overrides,
  } as Request)

const mockResponse = (): Response => {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

// Test data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  createdAt: new Date('2024-01-01'),
}

const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  description: 'Test Description',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  isPublic: false,
  ownerId: 'user-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  owner: mockUser,
  tasks: [],
  _count: {
    tasks: 0,
    versions: 0,
    shareLinks: 0,
  },
}

describe('Project Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getProjects', () => {
    it('should return paginated projects for authenticated user', async () => {
      const req = mockRequest({
        query: { page: '1', limit: '10' },
      })
      const res = mockResponse()

      mockPrisma.project.count.mockResolvedValue(1)
      mockPrisma.project.findMany.mockResolvedValue([mockProject])

      await getProjects(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          projects: [mockProject],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasMore: false,
          },
        },
      })

      expect(mockPrisma.project.count).toHaveBeenCalled()
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        })
      )
    })

    it('should throw ForbiddenError when user is not authenticated', async () => {
      const req = mockRequest({ user: undefined })
      const res = mockResponse()

      await expect(getProjects(req, res)).rejects.toThrow(ForbiddenError)
      await expect(getProjects(req, res)).rejects.toThrow(
        'Authentication required'
      )
    })

    it('should filter by isPublic parameter', async () => {
      const req = mockRequest({
        query: { isPublic: 'true' },
      })
      const res = mockResponse()

      mockPrisma.project.count.mockResolvedValue(1)
      mockPrisma.project.findMany.mockResolvedValue([
        { ...mockProject, isPublic: true },
      ])

      await getProjects(req, res)

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublic: true,
          }),
        })
      )
    })

    it('should filter by search parameter', async () => {
      const req = mockRequest({
        query: { search: 'Test' },
      })
      const res = mockResponse()

      mockPrisma.project.count.mockResolvedValue(1)
      mockPrisma.project.findMany.mockResolvedValue([mockProject])

      await getProjects(req, res)

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: {
              contains: 'Test',
              mode: 'insensitive',
            },
          }),
        })
      )
    })

    it('should handle pagination correctly', async () => {
      const req = mockRequest({
        query: { page: '2', limit: '5' },
      })
      const res = mockResponse()

      mockPrisma.project.count.mockResolvedValue(12)
      mockPrisma.project.findMany.mockResolvedValue([mockProject])

      await getProjects(req, res)

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page 2 - 1) * 5
          take: 5,
        })
      )

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pagination: {
              page: 2,
              limit: 5,
              total: 12,
              totalPages: 3,
              hasMore: true,
            },
          }),
        })
      )
    })

    it('should use default pagination when not provided', async () => {
      const req = mockRequest({
        query: {},
      })
      const res = mockResponse()

      mockPrisma.project.count.mockResolvedValue(0)
      mockPrisma.project.findMany.mockResolvedValue([])

      await getProjects(req, res)

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10, // default limit
        })
      )
    })

    it('should include both user projects and public projects in query', async () => {
      const req = mockRequest()
      const res = mockResponse()

      mockPrisma.project.count.mockResolvedValue(0)
      mockPrisma.project.findMany.mockResolvedValue([])

      await getProjects(req, res)

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { ownerId: 'user-1' },
              { isPublic: true },
            ],
          }),
        })
      )
    })
  })

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const req = mockRequest({
        body: {
          name: 'New Project',
          isPublic: true,
        },
      })
      const res = mockResponse()

      mockPrisma.project.create.mockResolvedValue(mockProject)

      await createProject(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project created successfully',
        data: { project: mockProject },
      })

      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'New Project',
          isPublic: true,
          ownerId: 'user-1',
        },
        include: expect.any(Object),
      })
    })

    it('should throw ForbiddenError when user is not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
        body: { name: 'New Project' },
      })
      const res = mockResponse()

      await expect(createProject(req, res)).rejects.toThrow(ForbiddenError)
    })

    it('should default isPublic to false when not provided', async () => {
      const req = mockRequest({
        body: { name: 'New Project' },
      })
      const res = mockResponse()

      mockPrisma.project.create.mockResolvedValue(mockProject)

      await createProject(req, res)

      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPublic: false,
          }),
        })
      )
    })
  })

  describe('getProject', () => {
    it('should return project for owner', async () => {
      const req = mockRequest({
        params: { id: 'project-1' },
      })
      const res = mockResponse()

      mockPrisma.project.findUnique.mockResolvedValue(mockProject)

      await getProject(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { project: mockProject },
      })

      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        include: expect.any(Object),
      })
    })

    it('should return public project for non-owner', async () => {
      const publicProject = { ...mockProject, isPublic: true, ownerId: 'other-user' }
      const req = mockRequest({
        params: { id: 'project-1' },
        user: { id: 'user-2', email: 'other@example.com' },
      })
      const res = mockResponse()

      mockPrisma.project.findUnique.mockResolvedValue(publicProject)

      await getProject(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { project: publicProject },
      })
    })

    it('should allow unauthenticated access to public projects', async () => {
      const publicProject = { ...mockProject, isPublic: true }
      const req = mockRequest({
        params: { id: 'project-1' },
        user: undefined,
      })
      const res = mockResponse()

      mockPrisma.project.findUnique.mockResolvedValue(publicProject)

      await getProject(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should throw NotFoundError when project does not exist', async () => {
      const req = mockRequest({
        params: { id: 'non-existent' },
      })
      const res = mockResponse()

      mockPrisma.project.findUnique.mockResolvedValue(null)

      await expect(getProject(req, res)).rejects.toThrow(NotFoundError)
      await expect(getProject(req, res)).rejects.toThrow('Project')
    })

    it('should throw ForbiddenError when non-owner tries to access private project', async () => {
      const privateProject = { ...mockProject, isPublic: false, ownerId: 'other-user' }
      const req = mockRequest({
        params: { id: 'project-1' },
        user: { id: 'user-2', email: 'other@example.com' },
      })
      const res = mockResponse()

      mockPrisma.project.findUnique.mockResolvedValue(privateProject)

      await expect(getProject(req, res)).rejects.toThrow(ForbiddenError)
      await expect(getProject(req, res)).rejects.toThrow(
        'You do not have access to this project'
      )
    })

    it('should throw ForbiddenError when unauthenticated user tries to access private project', async () => {
      const privateProject = { ...mockProject, isPublic: false }
      const req = mockRequest({
        params: { id: 'project-1' },
        user: undefined,
      })
      const res = mockResponse()

      mockPrisma.project.findUnique.mockResolvedValue(privateProject)

      await expect(getProject(req, res)).rejects.toThrow(ForbiddenError)
    })
  })

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const req = mockRequest({
        params: { id: 'project-1' },
        body: {
          name: 'Updated Name',
          isPublic: true,
        },
      })
      const res = mockResponse()

      const updatedProject = { ...mockProject, name: 'Updated Name', isPublic: true }
      mockPrisma.project.findUnique.mockResolvedValue(mockProject)
      mockPrisma.project.update.mockResolvedValue(updatedProject)

      await updateProject(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project updated successfully',
        data: { project: updatedProject },
      })

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: {
          name: 'Updated Name',
          isPublic: true,
        },
        include: expect.any(Object),
      })
    })

    it('should throw ForbiddenError when user is not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
        params: { id: 'project-1' },
        body: { name: 'Updated' },
      })
      const res = mockResponse()

      await expect(updateProject(req, res)).rejects.toThrow(ForbiddenError)
    })

    it('should throw NotFoundError when project does not exist', async () => {
      const req = mockRequest({
        params: { id: 'non-existent' },
        body: { name: 'Updated' },
      })
      const res = mockResponse()

      mockPrisma.project.findUnique.mockResolvedValue(null)

      await expect(updateProject(req, res)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError when user is not the owner', async () => {
      const otherUserProject = { ...mockProject, ownerId: 'other-user' }
      const req = mockRequest({
        params: { id: 'project-1' },
        body: { name: 'Updated' },
      })
      const res = mockResponse()

      mockPrisma.project.findUnique.mockResolvedValue(otherUserProject)

      await expect(updateProject(req, res)).rejects.toThrow(ForbiddenError)
      await expect(updateProject(req, res)).rejects.toThrow(
        'You do not own this project'
      )
    })

    it('should update only provided fields', async () => {
      const req = mockRequest({
        params: { id: 'project-1' },
        body: { name: 'Only Name Updated' },
      })
      const res = mockResponse()

      mockPrisma.project.findUnique.mockResolvedValue(mockProject)
      mockPrisma.project.update.mockResolvedValue({
        ...mockProject,
        name: 'Only Name Updated',
      })

      await updateProject(req, res)

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: {
          name: 'Only Name Updated',
        },
        include: expect.any(Object),
      })
    })

    it('should allow isPublic to be set to false', async () => {
      const req = mockRequest({
        params: { id: 'project-1' },
        body: { isPublic: false },
      })
      const res = mockResponse()

      mockPrisma.project.findUnique.mockResolvedValue(mockProject)
      mockPrisma.project.update.mockResolvedValue({
        ...mockProject,
        isPublic: false,
      })

      await updateProject(req, res)

      expect(mockPrisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            isPublic: false,
          },
        })
      )
    })
  })

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      const req = mockRequest({
        params: { id: 'project-1' },
      })
      const res = mockResponse()

      mockPrisma.project.findUnique.mockResolvedValue(mockProject)
      mockPrisma.project.delete.mockResolvedValue(mockProject)

      await deleteProject(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project deleted successfully',
      })

      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'project-1' },
      })
    })

    it('should throw ForbiddenError when user is not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
        params: { id: 'project-1' },
      })
      const res = mockResponse()

      await expect(deleteProject(req, res)).rejects.toThrow(ForbiddenError)
    })

    it('should throw NotFoundError when project does not exist', async () => {
      const req = mockRequest({
        params: { id: 'non-existent' },
      })
      const res = mockResponse()

      mockPrisma.project.findUnique.mockResolvedValue(null)

      await expect(deleteProject(req, res)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError when user is not the owner', async () => {
      const otherUserProject = { ...mockProject, ownerId: 'other-user' }
      const req = mockRequest({
        params: { id: 'project-1' },
      })
      const res = mockResponse()

      mockPrisma.project.findUnique.mockResolvedValue(otherUserProject)

      await expect(deleteProject(req, res)).rejects.toThrow(ForbiddenError)
      await expect(deleteProject(req, res)).rejects.toThrow(
        'You do not own this project'
      )
    })
  })
})
