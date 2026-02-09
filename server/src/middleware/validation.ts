import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationError } from 'express-validator'

/**
 * Middleware to handle validation errors from express-validator
 */
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: ValidationError) => ({
      field: error.type === 'field' ? error.path : undefined,
      message: error.msg,
    }))

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please check your input',
      errors: formattedErrors,
    })
    return
  }

  next()
}

// Alias for backward compatibility
export const validate = handleValidationErrors
