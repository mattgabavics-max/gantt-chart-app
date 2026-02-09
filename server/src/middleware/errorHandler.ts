import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true
  ) {
    super(message)
    this.code = code
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

/**
 * Error types for common scenarios
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN')
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(400, message, 'BAD_REQUEST')
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(409, message, 'CONFLICT')
  }
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error)

  // Handle known AppError instances
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    })
    return
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[])?.join(', ') || 'field'
      res.status(409).json({
        success: false,
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: `A record with this ${field} already exists`,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      })
      return
    }

    // Record not found
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      })
      return
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REFERENCE',
          message: 'Invalid reference to related resource',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      })
      return
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data provided',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    })
    return
  }

  // Handle JWT errors (if not caught earlier)
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authentication token is invalid',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    })
    return
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    })
    return
  }

  // Default to 500 server error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? error.message
        : 'Something went wrong',
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  })
}

/**
 * 404 Not Found handler for undefined routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  })
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
