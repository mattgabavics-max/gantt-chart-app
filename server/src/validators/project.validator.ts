import { body, param, query } from 'express-validator'

/**
 * Validation rules for creating a new project
 * POST /api/projects
 */
export const createProjectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Project name must be between 1 and 200 characters'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value'),
]

/**
 * Validation rules for updating a project
 * PUT /api/projects/:id
 */
export const updateProjectValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required')
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Project name cannot be empty')
    .isLength({ min: 1, max: 200 })
    .withMessage('Project name must be between 1 and 200 characters'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value'),
]

/**
 * Validation rules for getting a single project
 * GET /api/projects/:id
 */
export const getProjectValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required')
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),
]

/**
 * Validation rules for deleting a project
 * DELETE /api/projects/:id
 */
export const deleteProjectValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required')
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),
]

/**
 * Validation rules for listing projects with pagination
 * GET /api/projects
 */
export const listProjectsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('isPublic')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isPublic must be "true" or "false"'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query must be less than 200 characters'),
]
