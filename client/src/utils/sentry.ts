/**
 * Sentry Error Tracking Configuration
 * Monitors errors and performance in production
 */

import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'development'
const RELEASE = import.meta.env.VITE_RELEASE || 'unknown'

/**
 * Initialize Sentry error tracking
 */
export function initSentry() {
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
      new BrowserTracing({
        // Set sampling rate for performance monitoring
        tracingOrigins: ['localhost', /^\//],
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          // @ts-ignore - React Router v6 typing
          window.React.useEffect,
          window.React.useLocation,
          window.React.useNavigationType,
          window.React.createRoutesFromChildren,
          window.React.matchRoutes
        ),
      }),
    ],

    // Set sample rates
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Filter out known errors
    beforeSend(event, hint) {
      const error = hint.originalException

      // Filter out network errors
      if (error && error instanceof Error) {
        if (error.message.includes('Network Error')) {
          return null
        }
        if (error.message.includes('Failed to fetch')) {
          return null
        }
      }

      // Filter out specific errors
      if (event.exception) {
        const exceptionValue = event.exception.values?.[0]?.value
        if (exceptionValue?.includes('ResizeObserver loop')) {
          return null // Ignore ResizeObserver errors
        }
      }

      return event
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',

      // Random network errors
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      'Load failed',

      // Third-party scripts
      'Script error',
      '__show__deepen',
    ],

    // Don't send personally identifiable information
    beforeBreadcrumb(breadcrumb) {
      // Redact sensitive data from breadcrumbs
      if (breadcrumb.category === 'console') {
        return null
      }
      return breadcrumb
    },
  })

  console.log('Sentry initialized:', { environment: ENVIRONMENT, release: RELEASE })
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
export function setUserContext(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
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

// Export Sentry for direct use
export { Sentry }
