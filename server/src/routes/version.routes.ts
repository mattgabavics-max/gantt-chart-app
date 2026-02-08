import { Router } from 'express'
import {
  getProjectVersions,
  createProjectVersion,
  getProjectVersion,
  deleteProjectVersion,
} from '../controllers/version.controller.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import {
  createVersionValidation,
  getVersionsValidation,
  getVersionValidation,
  deleteVersionValidation,
} from '../validators/version.validator.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router({ mergeParams: true }) // mergeParams to access :id from parent router

/**
 * GET /api/projects/:id/versions
 * List all versions for a project
 * Accessible to owner or if project is public
 */
router.get(
  '/',
  optionalAuthenticate,
  getVersionsValidation,
  validate,
  asyncHandler(getProjectVersions)
)

/**
 * POST /api/projects/:id/versions
 * Create a new project version (snapshot)
 * Body: { versionNumber: number, snapshotData: object }
 * Requires ownership
 */
router.post(
  '/',
  authenticate,
  createVersionValidation,
  validate,
  asyncHandler(createProjectVersion)
)

/**
 * GET /api/projects/:id/versions/:versionNumber
 * Get a specific version by version number
 * Accessible to owner or if project is public
 */
router.get(
  '/:versionNumber',
  optionalAuthenticate,
  getVersionValidation,
  validate,
  asyncHandler(getProjectVersion)
)

/**
 * DELETE /api/projects/:id/versions/:versionNumber
 * Delete a specific version
 * Requires ownership
 */
router.delete(
  '/:versionNumber',
  authenticate,
  deleteVersionValidation,
  validate,
  asyncHandler(deleteProjectVersion)
)

export default router
