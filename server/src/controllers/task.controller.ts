import { Request, Response } from 'express'
import prisma from '../config/database.js'
import { NotFoundError, ForbiddenError, BadRequestError } from '../middleware/errorHandler.js'

/**
 * Helper function to create a version snapshot if requested
 */
async function createVersionSnapshot(projectId: string, snapshotData: any): Promise<void> {
  // Get the highest version number for this project
  const lastVersion = await prisma.projectVersion.findFirst({
    where: { projectId },
    orderBy: { versionNumber: 'desc' },
  })

  const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1

  await prisma.projectVersion.create({
    data: {
      projectId,
      versionNumber: nextVersionNumber,
      snapshotData,
    },
  })
}

/**
 * Helper function to validate date range
 */
function validateDateRange(startDate: Date, endDate: Date): void {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start >= end) {
    throw new BadRequestError('Start date must be before end date')
  }
}

/**
 * Create a new task for a project
 * POST /api/projects/:projectId/tasks
 */
export async function createTask(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required')
  }

  const { projectId } = req.params
  const { name, startDate, endDate, color, position } = req.body

  // Check if project exists and user is owner
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    throw new NotFoundError('Project')
  }

  if (project.ownerId !== req.user.id) {
    throw new ForbiddenError('You do not own this project')
  }

  // Validate date range
  validateDateRange(startDate, endDate)

  // Get the next position if not provided
  let taskPosition = position
  if (taskPosition === undefined) {
    const lastTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { position: 'desc' },
    })
    taskPosition = (lastTask?.position || 0) + 1
  }

  // Create task
  const task = await prisma.task.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      color: color || '#3b82f6', // Default blue color
      position: taskPosition,
      projectId,
    },
  })

  // Update project's updatedAt timestamp
  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  })

  // Create version snapshot if requested
  if (req.body.createSnapshot) {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    })
    await createVersionSnapshot(projectId, {
      tasks,
      createdReason: 'Task created',
      timestamp: new Date().toISOString(),
    })
  }

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task },
  })
}

/**
 * Update a task (resize, move)
 * PUT /api/tasks/:id
 */
export async function updateTask(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required')
  }

  const { id } = req.params
  const { name, startDate, endDate, color, position } = req.body

  // Check if task exists
  const existingTask = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  })

  if (!existingTask) {
    throw new NotFoundError('Task')
  }

  // Check if user owns the project
  if (existingTask.project.ownerId !== req.user.id) {
    throw new ForbiddenError('You do not own this project')
  }

  // Validate date range if both dates are provided
  const newStartDate = startDate ? new Date(startDate) : existingTask.startDate
  const newEndDate = endDate ? new Date(endDate) : existingTask.endDate
  validateDateRange(newStartDate, newEndDate)

  // Update task
  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(color !== undefined && { color }),
      ...(position !== undefined && { position }),
    },
  })

  // Update project's updatedAt timestamp
  await prisma.project.update({
    where: { id: existingTask.projectId },
    data: { updatedAt: new Date() },
  })

  // Create version snapshot if requested
  if (req.body.createSnapshot) {
    const tasks = await prisma.task.findMany({
      where: { projectId: existingTask.projectId },
      orderBy: { position: 'asc' },
    })
    await createVersionSnapshot(existingTask.projectId, {
      tasks,
      createdReason: 'Task updated',
      timestamp: new Date().toISOString(),
    })
  }

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: { task },
  })
}

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
export async function deleteTask(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required')
  }

  const { id } = req.params

  // Check if task exists
  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  })

  if (!task) {
    throw new NotFoundError('Task')
  }

  // Check if user owns the project
  if (task.project.ownerId !== req.user.id) {
    throw new ForbiddenError('You do not own this project')
  }

  // Delete task
  await prisma.task.delete({
    where: { id },
  })

  // Update project's updatedAt timestamp
  await prisma.project.update({
    where: { id: task.projectId },
    data: { updatedAt: new Date() },
  })

  // Create version snapshot if requested
  if (req.body.createSnapshot) {
    const tasks = await prisma.task.findMany({
      where: { projectId: task.projectId },
      orderBy: { position: 'asc' },
    })
    await createVersionSnapshot(task.projectId, {
      tasks,
      createdReason: 'Task deleted',
      timestamp: new Date().toISOString(),
    })
  }

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
  })
}

/**
 * Update task position/order
 * PATCH /api/tasks/:id/position
 */
export async function updateTaskPosition(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required')
  }

  const { id } = req.params
  const { position } = req.body

  // Check if task exists
  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  })

  if (!task) {
    throw new NotFoundError('Task')
  }

  // Check if user owns the project
  if (task.project.ownerId !== req.user.id) {
    throw new ForbiddenError('You do not own this project')
  }

  // Update task position
  const updatedTask = await prisma.task.update({
    where: { id },
    data: { position },
  })

  // Update project's updatedAt timestamp
  await prisma.project.update({
    where: { id: task.projectId },
    data: { updatedAt: new Date() },
  })

  // Create version snapshot if requested
  if (req.body.createSnapshot) {
    const tasks = await prisma.task.findMany({
      where: { projectId: task.projectId },
      orderBy: { position: 'asc' },
    })
    await createVersionSnapshot(task.projectId, {
      tasks,
      createdReason: 'Task position updated',
      timestamp: new Date().toISOString(),
    })
  }

  res.status(200).json({
    success: true,
    message: 'Task position updated successfully',
    data: { task: updatedTask },
  })
}

/**
 * Bulk update multiple tasks at once
 * PATCH /api/projects/:projectId/tasks/bulk
 */
export async function bulkUpdateTasks(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required')
  }

  const { projectId } = req.params
  const { tasks } = req.body

  // Check if project exists and user is owner
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    throw new NotFoundError('Project')
  }

  if (project.ownerId !== req.user.id) {
    throw new ForbiddenError('You do not own this project')
  }

  // Validate that all tasks belong to this project
  const taskIds = tasks.map((t: any) => t.id)
  const existingTasks = await prisma.task.findMany({
    where: {
      id: { in: taskIds },
      projectId,
    },
  })

  if (existingTasks.length !== taskIds.length) {
    throw new BadRequestError('One or more tasks do not belong to this project')
  }

  // Validate date ranges for all tasks
  for (const taskUpdate of tasks) {
    if (taskUpdate.startDate && taskUpdate.endDate) {
      validateDateRange(taskUpdate.startDate, taskUpdate.endDate)
    } else if (taskUpdate.startDate || taskUpdate.endDate) {
      // If only one date is provided, need to check against existing
      const existing = existingTasks.find(t => t.id === taskUpdate.id)
      if (existing) {
        const newStart = taskUpdate.startDate ? new Date(taskUpdate.startDate) : existing.startDate
        const newEnd = taskUpdate.endDate ? new Date(taskUpdate.endDate) : existing.endDate
        validateDateRange(newStart, newEnd)
      }
    }
  }

  // Update all tasks in a transaction
  const updatedTasks = await prisma.$transaction(
    tasks.map((taskUpdate: any) => {
      const updateData: any = {}
      if (taskUpdate.name !== undefined) updateData.name = taskUpdate.name
      if (taskUpdate.startDate !== undefined) updateData.startDate = new Date(taskUpdate.startDate)
      if (taskUpdate.endDate !== undefined) updateData.endDate = new Date(taskUpdate.endDate)
      if (taskUpdate.color !== undefined) updateData.color = taskUpdate.color
      if (taskUpdate.position !== undefined) updateData.position = taskUpdate.position

      return prisma.task.update({
        where: { id: taskUpdate.id },
        data: updateData,
      })
    })
  )

  // Update project's updatedAt timestamp
  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  })

  // Create version snapshot if requested
  if (req.body.createSnapshot) {
    const allTasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    })
    await createVersionSnapshot(projectId, {
      tasks: allTasks,
      createdReason: 'Bulk task update',
      timestamp: new Date().toISOString(),
    })
  }

  res.status(200).json({
    success: true,
    message: `${updatedTasks.length} tasks updated successfully`,
    data: { tasks: updatedTasks },
  })
}

/**
 * Get all tasks for a project
 * GET /api/projects/:projectId/tasks
 */
export async function getProjectTasks(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
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

  // Get all tasks for the project
  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { position: 'asc' },
  })

  res.status(200).json({
    success: true,
    data: { tasks },
  })
}
