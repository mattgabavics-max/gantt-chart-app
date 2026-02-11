/**
 * Cookie Utilities
 * Helper functions for setting secure HttpOnly cookies
 */

import { Response } from 'express'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined
const TOKEN_COOKIE_NAME = 'gantt_auth_token'
const REFRESH_TOKEN_COOKIE_NAME = 'gantt_refresh_token'

// Cookie options
const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents JavaScript access (XSS protection)
  secure: IS_PRODUCTION, // Requires HTTPS in production
  sameSite: 'strict' as const, // CSRF protection
  domain: COOKIE_DOMAIN,
  path: '/',
}

/**
 * Set auth token cookie
 * @param res - Express response object
 * @param token - JWT token
 * @param maxAge - Cookie max age in milliseconds (default: 7 days)
 */
export function setAuthCookie(
  res: Response,
  token: string,
  maxAge: number = 7 * 24 * 60 * 60 * 1000 // 7 days
): void {
  res.cookie(TOKEN_COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge,
  })
}

/**
 * Set refresh token cookie
 * @param res - Express response object
 * @param token - Refresh token
 * @param maxAge - Cookie max age in milliseconds (default: 30 days)
 */
export function setRefreshCookie(
  res: Response,
  token: string,
  maxAge: number = 30 * 24 * 60 * 60 * 1000 // 30 days
): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge,
  })
}

/**
 * Clear auth cookies
 * @param res - Express response object
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    ...COOKIE_OPTIONS,
    maxAge: undefined,
  })
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    ...COOKIE_OPTIONS,
    maxAge: undefined,
  })
}

/**
 * Get auth token from cookies
 * @param req - Express request object with cookies
 * @returns Token or null
 */
export function getAuthCookieToken(req: any): string | null {
  return req.cookies?.[TOKEN_COOKIE_NAME] || null
}

/**
 * Get refresh token from cookies
 * @param req - Express request object with cookies
 * @returns Refresh token or null
 */
export function getRefreshCookieToken(req: any): string | null {
  return req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] || null
}

export const COOKIE_NAMES = {
  AUTH_TOKEN: TOKEN_COOKIE_NAME,
  REFRESH_TOKEN: REFRESH_TOKEN_COOKIE_NAME,
}
