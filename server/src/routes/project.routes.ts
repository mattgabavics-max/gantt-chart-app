import { Router } from 'express'
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} from '../controllers/project.controller.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import {
  createProjectValidation,
  updateProjectValidation,
  getProjectValidation,
  deleteProjectValidation,
  listProjectsValidation,
} from '../validators/project.validator.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

/**
 * GET /api/projects
 * List all projects for authenticated user with pagination
 * Query params: page, limit, isPublic, search
 */
router.get(
  '/',
  authenticate,
  listProjectsValidation,
  validate,
  asyncHandler(getProjects)
)

/**
 * POST /api/projects
 * Create a new project
 * Body: { name: string, isPublic?: boolean }
 */
router.post(
  '/',
  authenticate,
  createProjectValidation,
  validate,
  asyncHandler(createProject)
)

/**
 * GET /api/projects/:id
 * Get a single project by ID
 * Accessible to owner or if project is public
 */
router.get(
  '/:id',
  optionalAuthenticate,
  getProjectValidation,
  validate,
  asyncHandler(getProject)
)

/**
 * PUT /api/projects/:id
 * Update project metadata
 * Body: { name?: string, isPublic?: boolean }
 * Requires ownership
 */
router.put(
  '/:id',
  authenticate,
  updateProjectValidation,
  validate,
  asyncHandler(updateProject)
)

/**
 * DELETE /api/projects/:id
 * Delete a project (hard delete with cascade)
 * Requires ownership
 */
router.delete(
  '/:id',
  authenticate,
  deleteProjectValidation,
  validate,
  asyncHandler(deleteProject)
)

export default router
