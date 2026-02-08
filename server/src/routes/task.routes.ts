import { Router } from 'express'
import {
  createTask,
  updateTask,
  deleteTask,
  updateTaskPosition,
  bulkUpdateTasks,
  getProjectTasks,
} from '../controllers/task.controller.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import {
  createTaskValidation,
  updateTaskValidation,
  deleteTaskValidation,
  updateTaskPositionValidation,
  bulkUpdateTasksValidation,
  getProjectTasksValidation,
} from '../validators/task.validator.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

/**
 * GET /api/projects/:projectId/tasks
 * Get all tasks for a project
 * Accessible to owner or if project is public
 */
router.get(
  '/projects/:projectId/tasks',
  optionalAuthenticate,
  getProjectTasksValidation,
  validate,
  asyncHandler(getProjectTasks)
)

/**
 * POST /api/projects/:projectId/tasks
 * Create a new task
 * Body: { name: string, startDate: Date, endDate: Date, color?: string, position?: number, createSnapshot?: boolean }
 * Requires ownership
 */
router.post(
  '/projects/:projectId/tasks',
  authenticate,
  createTaskValidation,
  validate,
  asyncHandler(createTask)
)

/**
 * PATCH /api/projects/:projectId/tasks/bulk
 * Bulk update multiple tasks at once
 * Body: { tasks: Array<{ id: string, name?: string, startDate?: Date, endDate?: Date, color?: string, position?: number }>, createSnapshot?: boolean }
 * Requires ownership
 */
router.patch(
  '/projects/:projectId/tasks/bulk',
  authenticate,
  bulkUpdateTasksValidation,
  validate,
  asyncHandler(bulkUpdateTasks)
)

/**
 * PUT /api/tasks/:id
 * Update a task (resize, move)
 * Body: { name?: string, startDate?: Date, endDate?: Date, color?: string, position?: number, createSnapshot?: boolean }
 * Requires ownership
 */
router.put(
  '/tasks/:id',
  authenticate,
  updateTaskValidation,
  validate,
  asyncHandler(updateTask)
)

/**
 * PATCH /api/tasks/:id/position
 * Update task position/order
 * Body: { position: number, createSnapshot?: boolean }
 * Requires ownership
 */
router.patch(
  '/tasks/:id/position',
  authenticate,
  updateTaskPositionValidation,
  validate,
  asyncHandler(updateTaskPosition)
)

/**
 * DELETE /api/tasks/:id
 * Delete a task
 * Body: { createSnapshot?: boolean }
 * Requires ownership
 */
router.delete(
  '/tasks/:id',
  authenticate,
  deleteTaskValidation,
  validate,
  asyncHandler(deleteTask)
)

export default router
