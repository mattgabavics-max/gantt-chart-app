import { Request, Response } from 'express'
import prisma from '../config/database.js'
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js'

/**
 * Get all projects for authenticated user with pagination
 * GET /api/projects
 */
export async function getProjects(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required')
  }

  // Parse pagination parameters
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit

  // Parse filter parameters
  const isPublic = req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined
  const search = req.query.search as string

  // Build where clause
  const where: any = {
    OR: [
      { ownerId: req.user.id }, // User's own projects
      { isPublic: true }, // Public projects
    ],
  }

  // Add filters
  if (isPublic !== undefined) {
    where.isPublic = isPublic
  }

  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive',
    }
  }

  // Get total count for pagination
  const total = await prisma.project.count({ where })

  // Get projects with pagination
  const projects = await prisma.project.findMany({
    where,
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      },
      tasks: {
        orderBy: { position: 'asc' },
      },
      _count: {
        select: {
          tasks: true,
          versions: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  res.status(200).json({
    success: true,
    data: {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + projects.length < total,
      },
    },
  })
}

/**
 * Create new project
 * POST /api/projects
 */
export async function createProject(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required')
  }

  const { name, isPublic } = req.body

  const project = await prisma.project.create({
    data: {
      name,
      isPublic: isPublic || false,
      ownerId: req.user.id,
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      },
    },
  })

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: { project },
  })
}

/**
 * Get single project with tasks
 * GET /api/projects/:id
 */
export async function getProject(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      },
      tasks: {
        orderBy: { position: 'asc' },
      },
      _count: {
        select: {
          versions: true,
          shareLinks: true,
        },
      },
    },
  })

  if (!project) {
    throw new NotFoundError('Project')
  }

  // Check if user has access (owner or public project or via share link)
  const hasAccess =
    project.isPublic ||
    (req.user && project.ownerId === req.user.id)

  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this project')
  }

  res.status(200).json({
    success: true,
    data: { project },
  })
}

/**
 * Update project metadata
 * PUT /api/projects/:id
 */
export async function updateProject(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required')
  }

  const { id } = req.params
  const { name, isPublic } = req.body

  // Check if project exists and user is owner
  const existingProject = await prisma.project.findUnique({
    where: { id },
  })

  if (!existingProject) {
    throw new NotFoundError('Project')
  }

  if (existingProject.ownerId !== req.user.id) {
    throw new ForbiddenError('You do not own this project')
  }

  // Update project
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(isPublic !== undefined && { isPublic }),
    },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      },
      tasks: {
        orderBy: { position: 'asc' },
      },
    },
  })

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: { project },
  })
}

/**
 * Delete project (hard delete)
 * DELETE /api/projects/:id
 */
export async function deleteProject(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required')
  }

  const { id } = req.params

  // Check if project exists and user is owner
  const project = await prisma.project.findUnique({
    where: { id },
  })

  if (!project) {
    throw new NotFoundError('Project')
  }

  if (project.ownerId !== req.user.id) {
    throw new ForbiddenError('You do not own this project')
  }

  // Delete project (cascade will delete related tasks, versions, shareLinks)
  await prisma.project.delete({
    where: { id },
  })

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
  })
}
