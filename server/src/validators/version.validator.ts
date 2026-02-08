import { body, param } from 'express-validator'

/**
 * Validation rules for creating a new project version
 * POST /api/projects/:id/versions
 */
export const createVersionValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required')
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),

  body('versionNumber')
    .notEmpty()
    .withMessage('Version number is required')
    .isInt({ min: 1 })
    .withMessage('Version number must be a positive integer'),

  body('snapshotData')
    .notEmpty()
    .withMessage('Snapshot data is required')
    .isObject()
    .withMessage('Snapshot data must be a JSON object'),
]

/**
 * Validation rules for getting project versions
 * GET /api/projects/:id/versions
 */
export const getVersionsValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required')
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),
]

/**
 * Validation rules for getting a specific version
 * GET /api/projects/:id/versions/:versionNumber
 */
export const getVersionValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required')
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),

  param('versionNumber')
    .trim()
    .notEmpty()
    .withMessage('Version number is required')
    .isInt({ min: 1 })
    .withMessage('Version number must be a positive integer')
    .toInt(),
]

/**
 * Validation rules for deleting a specific version
 * DELETE /api/projects/:id/versions/:versionNumber
 */
export const deleteVersionValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required')
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),

  param('versionNumber')
    .trim()
    .notEmpty()
    .withMessage('Version number is required')
    .isInt({ min: 1 })
    .withMessage('Version number must be a positive integer')
    .toInt(),
]
