/**
 * Sentry Error Tracking Configuration (Backend)
 * Monitors errors and performance in production
 */

import * as Sentry from '@sentry/node'
import { ProfilingIntegration } from '@sentry/profiling-node'
import { Express, Request, Response, NextFunction } from 'express'

const SENTRY_DSN = process.env.SENTRY_DSN
const ENVIRONMENT = process.env.NODE_ENV || 'development'
const RELEASE = process.env.npm_package_version || 'unknown'

/**
 * Initialize Sentry error tracking
 */
export function initSentry(app: Express) {
  // Only initialize in production or staging
  if (!SENTRY_DSN || ENVIRONMENT === 'development') {
    console.log('Sentry disabled in development')
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,

    // Performance Monitoring
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),

      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),

      // Enable profiling
      new ProfilingIntegration(),
    ],

    // Set sample rates
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    profilesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Filter out known errors
    beforeSend(event, hint) {
      const error = hint.originalException

      // Filter out database connection errors during startup
      if (error && error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          return null
        }
      }

      return event
    },

    // Ignore certain errors
    ignoreErrors: [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
    ],
  })

  // Request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler())

  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler())

  console.log('Sentry initialized:', { environment: ENVIRONMENT, release: RELEASE })
}

/**
 * Error handler middleware (must be added AFTER all routes)
 */
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status >= 500
      return true
    },
  })
}

/**
 * Capture an exception with Sentry
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (ENVIRONMENT === 'development') {
    console.error('Error:', error, context)
    return
  }

  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Capture a message with Sentry
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (ENVIRONMENT === 'development') {
    console.log(`[${level}]`, message)
    return
  }

  Sentry.captureMessage(message, level)
}

/**
 * Set user context for Sentry
 */
export function setUserContext(user: { id: string; email?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  })
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null)
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  })
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  })
}

/**
 * Measure performance of an async function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = startTransaction(name, 'function')

  try {
    const result = await fn()
    transaction.setStatus('ok')
    return result
  } catch (error) {
    transaction.setStatus('internal_error')
    throw error
  } finally {
    transaction.finish()
  }
}

/**
 * Middleware to add request context to Sentry
 */
export function sentryContextMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    Sentry.configureScope((scope) => {
      scope.setContext('request', {
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.get('user-agent'),
        },
      })
    })
    next()
  }
}

// Export Sentry for direct use
export { Sentry }
