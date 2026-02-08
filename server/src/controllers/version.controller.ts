import { Request, Response } from 'express'
import prisma from '../config/database.js'
import { NotFoundError, ForbiddenError, BadRequestError } from '../middleware/errorHandler.js'

/**
 * Get all versions for a project
 * GET /api/projects/:id/versions
 */
export async function getProjectVersions(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id },
  })

  if (!project) {
    throw new NotFoundError('Project')
  }

  // Check if user has access (owner or public project)
  const hasAccess =
    project.isPublic ||
    (req.user && project.ownerId === req.user.id)

  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this project')
  }

  // Get all versions for the project
  const versions = await prisma.projectVersion.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  res.status(200).json({
    success: true,
    data: { versions },
  })
}

/**
 * Create a new project version (snapshot)
 * POST /api/projects/:id/versions
 */
export async function createProjectVersion(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required')
  }

  const { id } = req.params
  const { versionNumber, snapshotData } = req.body

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

  // Check if version number already exists for this project
  const existingVersion = await prisma.projectVersion.findUnique({
    where: {
      projectId_versionNumber: {
        projectId: id,
        versionNumber,
      },
    },
  })

  if (existingVersion) {
    throw new BadRequestError(`Version ${versionNumber} already exists for this project`)
  }

  // Create new version
  const version = await prisma.projectVersion.create({
    data: {
      versionNumber,
      snapshotData,
      projectId: id,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  res.status(201).json({
    success: true,
    message: 'Project version created successfully',
    data: { version },
  })
}

/**
 * Get a specific version
 * GET /api/projects/:id/versions/:versionNumber
 */
export async function getProjectVersion(req: Request, res: Response): Promise<void> {
  const { id, versionNumber } = req.params
  const versionNum = parseInt(versionNumber)

  if (isNaN(versionNum)) {
    throw new BadRequestError('Version number must be a valid integer')
  }

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id },
  })

  if (!project) {
    throw new NotFoundError('Project')
  }

  // Check if user has access (owner or public project)
  const hasAccess =
    project.isPublic ||
    (req.user && project.ownerId === req.user.id)

  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this project')
  }

  // Get the specific version
  const version = await prisma.projectVersion.findUnique({
    where: {
      projectId_versionNumber: {
        projectId: id,
        versionNumber: versionNum,
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!version) {
    throw new NotFoundError('Project version')
  }

  res.status(200).json({
    success: true,
    data: { version },
  })
}

/**
 * Delete a specific version
 * DELETE /api/projects/:id/versions/:versionNumber
 */
export async function deleteProjectVersion(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required')
  }

  const { id, versionNumber } = req.params
  const versionNum = parseInt(versionNumber)

  if (isNaN(versionNum)) {
    throw new BadRequestError('Version number must be a valid integer')
  }

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

  // Check if version exists
  const version = await prisma.projectVersion.findUnique({
    where: {
      projectId_versionNumber: {
        projectId: id,
        versionNumber: versionNum,
      },
    },
  })

  if (!version) {
    throw new NotFoundError('Project version')
  }

  // Delete version
  await prisma.projectVersion.delete({
    where: {
      projectId_versionNumber: {
        projectId: id,
        versionNumber: versionNum,
      },
    },
  })

  res.status(200).json({
    success: true,
    message: 'Project version deleted successfully',
  })
}
