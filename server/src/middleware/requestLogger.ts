/**
 * Request Logger Middleware
 *
 * Adds request tracking with:
 * - Unique request IDs for correlation
 * - HTTP request/response logging
 * - Slow request detection
 * - User context tracking
 */

import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import pinoHttp from 'pino-http'
import { logger } from '../lib/logger.js'

// Extend Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      id: string
      startTime: number
    }
  }
}

/**
 * Request ID middleware
 * Generates or uses existing request ID for request tracing
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Use existing request ID from header (for distributed tracing) or generate new one
  req.id = (req.headers['x-request-id'] as string) || uuidv4()
  req.startTime = Date.now()

  // Add request ID to response headers for client-side tracking
  res.setHeader('X-Request-Id', req.id)

  next()
}

/**
 * HTTP request logger using Pino
 * Logs all HTTP requests with context
 */
export const requestLogger = pinoHttp({
  logger,
  // Customize log level based on status code
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error'
    if (res.statusCode >= 400) return 'warn'
    if (res.statusCode >= 300) return 'silent' // Don't log redirects
    return 'info'
  },
  // Custom success message format
  customSuccessMessage: (req, res) => {
    const duration = Date.now() - (req as any).startTime
    return `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`
  },
  // Custom error message format
  customErrorMessage: (req, res, err) => {
    const duration = Date.now() - (req as any).startTime
    return `${req.method} ${req.url} ${res.statusCode} - ${duration}ms - ${err.message}`
  },
  // Add custom properties to logs
  customProps: (req, res) => ({
    requestId: (req as any).id,
    userId: (req as any).user?.id,
    userEmail: (req as any).user?.email,
    userAgent: req.headers['user-agent'],
    duration: Date.now() - (req as any).startTime,
    ip: req.ip || req.socket.remoteAddress,
  }),
  // Rename keys for consistency
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration',
  },
  // Don't log health check endpoints
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/api/health',
  },
})

/**
 * Slow request detection middleware
 * Logs warning when requests exceed threshold
 *
 * @param threshold - Time in milliseconds (default: 1000ms)
 */
export function slowRequestLogger(threshold: number = 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()

    // Listen for response finish event
    res.on('finish', () => {
      const duration = Date.now() - start

      if (duration > threshold) {
        logger.warn(
          {
            requestId: req.id,
            method: req.method,
            url: req.url,
            duration,
            statusCode: res.statusCode,
            userId: (req as any).user?.id,
          },
          '⚠️  Slow request detected'
        )
      }
    })

    next()
  }
}

/**
 * Request size logging middleware
 * Logs warning for large request bodies
 *
 * @param maxSize - Maximum size in bytes (default: 1MB)
 */
export function requestSizeLogger(maxSize: number = 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10)

    if (contentLength > maxSize) {
      logger.warn(
        {
          requestId: req.id,
          method: req.method,
          url: req.url,
          contentLength,
          maxSize,
        },
        '⚠️  Large request body detected'
      )
    }

    next()
  }
}
