/**
 * CSRF Protection Middleware
 * Implements double-submit cookie pattern for CSRF protection
 *
 * How it works:
 * 1. Server sends a random CSRF token in a cookie (readable by JavaScript)
 * 2. Client reads the cookie and sends the token in X-CSRF-Token header
 * 3. Server verifies that cookie value matches header value
 * 4. Since attackers can't read cookies from other domains (same-origin policy),
 *    they can't get the token to include in forged requests
 */

import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

const CSRF_COOKIE_NAME = 'gantt_csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * Generate a random CSRF token
 */
function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Middleware to set CSRF token cookie
 * Should be applied to all routes
 */
export function setCsrfToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check if CSRF token cookie already exists
  const existingToken = req.cookies?.[CSRF_COOKIE_NAME]

  if (!existingToken) {
    // Generate new token and set as cookie
    const token = generateCsrfToken()
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: IS_PRODUCTION, // HTTPS only in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })
  }

  next()
}

/**
 * Middleware to verify CSRF token
 * Should be applied to state-changing routes (POST, PUT, PATCH, DELETE)
 */
export function verifyCsrfToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip CSRF check for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(req.method)) {
    next()
    return
  }

  // Get token from cookie and header
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME]
  const headerToken = req.headers[CSRF_HEADER_NAME] as string

  // Check if both tokens exist
  if (!cookieToken || !headerToken) {
    res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      message: 'CSRF token is required for this request',
    })
    return
  }

  // Verify tokens match (constant-time comparison to prevent timing attacks)
  const isValid = crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  )

  if (!isValid) {
    res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      message: 'CSRF token validation failed',
    })
    return
  }

  next()
}

/**
 * Get CSRF token from request
 * Useful for including in responses
 */
export function getCsrfToken(req: Request): string | null {
  return req.cookies?.[CSRF_COOKIE_NAME] || null
}
