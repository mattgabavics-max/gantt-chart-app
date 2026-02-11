import { Request, Response, NextFunction } from 'express'
import { extractTokenFromHeader, verifyToken, JwtPayload } from '../utils/jwt.js'
import prisma from '../config/database.js'
import { isTokenBlacklisted } from '../services/tokenBlacklist.js'
import { getAuthCookieToken } from '../utils/cookies.js'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
      }
    }
  }
}

/**
 * Authentication middleware - requires valid JWT token
 * Injects user information into request.user
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header or cookies
    const headerToken = extractTokenFromHeader(req.headers.authorization)
    const cookieToken = getAuthCookieToken(req)
    const token = headerToken || cookieToken

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No token provided',
      })
      return
    }

    // Check if token is blacklisted (revoked)
    if (isTokenBlacklisted(token)) {
      res.status(401).json({
        success: false,
        error: 'Token revoked',
        message: 'This token has been revoked. Please login again.',
      })
      return
    }

    // Verify token
    let payload: JwtPayload
    try {
      payload = verifyToken(token)
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: error instanceof Error ? error.message : 'Token verification failed',
      })
      return
    }

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    })

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'The user associated with this token no longer exists',
      })
      return
    }

    // Inject user into request
    req.user = user

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Authentication failed',
    })
  }
}

/**
 * Optional authentication middleware - allows both authenticated and anonymous access
 * If token is provided and valid, injects user information into request.user
 * If token is not provided or invalid, continues without user context
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header or cookies
    const headerToken = extractTokenFromHeader(req.headers.authorization)
    const cookieToken = getAuthCookieToken(req)
    const token = headerToken || cookieToken

    // If no token, continue without authentication
    if (!token) {
      next()
      return
    }

    // Check if token is blacklisted (revoked)
    if (isTokenBlacklisted(token)) {
      next()
      return
    }

    // Try to verify token
    let payload: JwtPayload
    try {
      payload = verifyToken(token)
    } catch (error) {
      // Invalid token - continue without authentication
      next()
      return
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    })

    if (user) {
      // Inject user into request
      req.user = user
    }

    next()
  } catch (error) {
    console.error('Optional authentication error:', error)
    // On error, continue without authentication
    next()
  }
}

/**
 * Check if user is authenticated
 * Use this after optionalAuthenticate to require authentication
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'You must be logged in to access this resource',
    })
    return
  }
  next()
}

/**
 * Check if the authenticated user owns the resource
 * Usage: requireOwnership('ownerId') checks if req.user.id matches req.body.ownerId or req.params.ownerId
 */
export function requireOwnership(ownerField: string = 'ownerId') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource',
      })
      return
    }

    // Check params first, then body
    const ownerId = req.params[ownerField] || req.body[ownerField]

    if (!ownerId) {
      res.status(400).json({
        success: false,
        error: 'Bad request',
        message: `Missing ${ownerField} field`,
      })
      return
    }

    if (req.user.id !== ownerId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      })
      return
    }

    next()
  }
}
