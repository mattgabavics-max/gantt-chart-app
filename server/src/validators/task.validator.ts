import { body, param } from 'express-validator'

/**
 * Validation rules for creating a new task
 * POST /api/projects/:projectId/tasks
 */
export const createTaskValidation = [
  param('projectId')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required')
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Task name is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Task name must be between 1 and 200 characters'),

  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .toDate(),

  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .toDate(),

  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code (e.g., #3b82f6)'),

  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer')
    .toInt(),

  body('createSnapshot')
    .optional()
    .isBoolean()
    .withMessage('createSnapshot must be a boolean value'),
]

/**
 * Validation rules for updating a task
 * PUT /api/tasks/:id
 */
export const updateTaskValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Task ID is required')
    .isUUID()
    .withMessage('Task ID must be a valid UUID'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task name cannot be empty')
    .isLength({ min: 1, max: 200 })
    .withMessage('Task name must be between 1 and 200 characters'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .toDate(),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .toDate(),

  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code (e.g., #3b82f6)'),

  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer')
    .toInt(),

  body('createSnapshot')
    .optional()
    .isBoolean()
    .withMessage('createSnapshot must be a boolean value'),
]

/**
 * Validation rules for deleting a task
 * DELETE /api/tasks/:id
 */
export const deleteTaskValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Task ID is required')
    .isUUID()
    .withMessage('Task ID must be a valid UUID'),

  body('createSnapshot')
    .optional()
    .isBoolean()
    .withMessage('createSnapshot must be a boolean value'),
]

/**
 * Validation rules for updating task position
 * PATCH /api/tasks/:id/position
 */
export const updateTaskPositionValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Task ID is required')
    .isUUID()
    .withMessage('Task ID must be a valid UUID'),

  body('position')
    .notEmpty()
    .withMessage('Position is required')
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer')
    .toInt(),

  body('createSnapshot')
    .optional()
    .isBoolean()
    .withMessage('createSnapshot must be a boolean value'),
]

/**
 * Validation rules for bulk updating tasks
 * PATCH /api/projects/:projectId/tasks/bulk
 */
export const bulkUpdateTasksValidation = [
  param('projectId')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required')
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),

  body('tasks')
    .isArray({ min: 1 })
    .withMessage('tasks must be a non-empty array'),

  body('tasks.*.id')
    .trim()
    .notEmpty()
    .withMessage('Each task must have an ID')
    .isUUID()
    .withMessage('Each task ID must be a valid UUID'),

  body('tasks.*.name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task name cannot be empty')
    .isLength({ min: 1, max: 200 })
    .withMessage('Task name must be between 1 and 200 characters'),

  body('tasks.*.startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .toDate(),

  body('tasks.*.endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .toDate(),

  body('tasks.*.color')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code (e.g., #3b82f6)'),

  body('tasks.*.position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer')
    .toInt(),

  body('createSnapshot')
    .optional()
    .isBoolean()
    .withMessage('createSnapshot must be a boolean value'),
]

/**
 * Validation rules for getting project tasks
 * GET /api/projects/:projectId/tasks
 */
export const getProjectTasksValidation = [
  param('projectId')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required')
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),
]
