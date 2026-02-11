/**
 * Authentication Controller
 *
 * Handles user registration, login, logout, and token management.
 * Implements secure authentication using JWT tokens stored in HttpOnly cookies.
 *
 * @module controllers/auth
 */

import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js'
import { generateToken, extractTokenFromHeader } from '../utils/jwt.js'
import { ConflictError, UnauthorizedError, BadRequestError } from '../middleware/errorHandler.js'
import { blacklistToken } from '../services/tokenBlacklist.js'
import { setAuthCookie, clearAuthCookies } from '../utils/cookies.js'

/**
 * Register a new user account
 *
 * Creates a new user account with the provided email and password.
 * Password must meet security requirements (8+ characters, uppercase, lowercase, number).
 * Automatically logs in the user by setting an authentication cookie.
 *
 * @route POST /api/auth/register
 * @access Public
 *
 * @param {Request} req - Express request object
 * @param {string} req.body.email - User's email address (must be unique)
 * @param {string} req.body.password - User's password (must meet security requirements)
 * @param {Response} res - Express response object
 *
 * @returns {Promise<void>} Returns 201 with user data and sets auth cookie
 *
 * @throws {BadRequestError} If password doesn't meet security requirements
 * @throws {ConflictError} If email already exists
 *
 * @example
 * // Request
 * POST /api/auth/register
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePassword123!"
 * }
 *
 * // Response (201 Created)
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "data": {
 *     "user": {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "email": "user@example.com",
 *       "createdAt": "2026-02-10T10:00:00.000Z"
 *     }
 *   }
 * }
 */
export async function register(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password)
  if (!passwordValidation.isValid) {
    throw new BadRequestError(
      `Password does not meet security requirements: ${passwordValidation.errors.join(', ')}`
    )
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new ConflictError('A user with this email already exists')
  }

  // Hash password
  const passwordHash = await hashPassword(password)

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  })

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
  })

  // Set HttpOnly cookie
  setAuthCookie(res, token)

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
    },
  })
}

/**
 * Authenticate user and create session
 *
 * Validates user credentials and creates a new authenticated session.
 * Sets an HttpOnly cookie containing a JWT token for subsequent requests.
 *
 * @route POST /api/auth/login
 * @access Public
 * @rateLimit 5 requests per 15 minutes
 *
 * @param {Request} req - Express request object
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {Response} res - Express response object
 *
 * @returns {Promise<void>} Returns 200 with user data and sets auth cookie
 *
 * @throws {UnauthorizedError} If email or password is invalid
 *
 * @example
 * // Request
 * POST /api/auth/login
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePassword123!"
 * }
 *
 * // Response (200 OK)
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "user": {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "email": "user@example.com",
 *       "createdAt": "2026-02-10T10:00:00.000Z"
 *     }
 *   }
 * }
 *
 * @security
 * - Password compared using bcrypt (constant-time comparison)
 * - Generic error message prevents user enumeration
 * - Rate limited to prevent brute force attacks
 * - JWT token stored in HttpOnly cookie (XSS protection)
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new UnauthorizedError('Invalid email or password')
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash)

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password')
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
  })

  // Set HttpOnly cookie
  setAuthCookie(res, token)

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    },
  })
}

/**
 * Get current authenticated user information
 *
 * Returns the profile information for the currently authenticated user.
 * Requires valid authentication token (automatically verified by middleware).
 *
 * @route GET /api/auth/me
 * @access Private
 *
 * @param {Request} req - Express request object (user injected by auth middleware)
 * @param {Object} req.user - Authenticated user object (from middleware)
 * @param {string} req.user.id - User's UUID
 * @param {string} req.user.email - User's email
 * @param {Response} res - Express response object
 *
 * @returns {Promise<void>} Returns 200 with user data
 *
 * @throws {UnauthorizedError} If user is not authenticated or user doesn't exist
 *
 * @example
 * // Request
 * GET /api/auth/me
 * Cookie: gantt_auth_token=<jwt-token>
 *
 * // Response (200 OK)
 * {
 *   "success": true,
 *   "data": {
 *     "user": {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "email": "user@example.com",
 *       "createdAt": "2026-02-10T10:00:00.000Z"
 *     }
 *   }
 * }
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Not authenticated')
  }

  // Fetch full user details
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  })

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  res.status(200).json({
    success: true,
    data: { user },
  })
}

/**
 * Verify JWT token validity
 *
 * Verifies that the provided JWT token is valid and not expired.
 * Useful for client-side authentication state management.
 * The authenticate middleware performs the actual verification before this handler is reached.
 *
 * @route GET /api/auth/verify
 * @access Private
 *
 * @param {Request} req - Express request object
 * @param {Object} req.user - User object (injected by authenticate middleware)
 * @param {Response} res - Express response object
 *
 * @returns {Promise<void>} Returns 200 if token is valid
 *
 * @throws {UnauthorizedError} If token is invalid, expired, or blacklisted (thrown by middleware)
 *
 * @example
 * // Request
 * GET /api/auth/verify
 * Cookie: gantt_auth_token=<jwt-token>
 *
 * // Response (200 OK)
 * {
 *   "success": true,
 *   "message": "Token is valid",
 *   "data": {
 *     "user": {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "email": "user@example.com"
 *     }
 *   }
 * }
 *
 * @note
 * This endpoint is idempotent and can be called multiple times.
 * It's commonly used by frontend apps to verify auth status on page load.
 */
export async function verifyToken(req: Request, res: Response): Promise<void> {
  // If we reach here, the authenticate middleware has already verified the token
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user,
    },
  })
}

/**
 * Logout user and revoke authentication token
 *
 * Invalidates the current JWT token by adding it to the blacklist.
 * Clears all authentication cookies. Token cannot be used for future requests.
 *
 * @route POST /api/auth/logout
 * @access Private
 *
 * @param {Request} req - Express request object
 * @param {string} [req.headers.authorization] - Optional Bearer token (backwards compatibility)
 * @param {Object} [req.cookies] - Request cookies
 * @param {string} [req.cookies.gantt_auth_token] - Auth token from cookie
 * @param {Response} res - Express response object
 *
 * @returns {Promise<void>} Returns 200 on successful logout
 *
 * @example
 * // Request
 * POST /api/auth/logout
 * Cookie: gantt_auth_token=<jwt-token>
 * X-CSRF-Token: <csrf-token>
 *
 * // Response (200 OK)
 * {
 *   "success": true,
 *   "message": "Logout successful"
 * }
 *
 * @implementation
 * 1. Extracts token from Authorization header OR cookie
 * 2. Decodes token to get expiration time
 * 3. Adds token to blacklist (in-memory Map)
 * 4. Clears authentication cookies
 * 5. Returns success response
 *
 * @security
 * - Token blacklist prevents reuse of revoked tokens
 * - HttpOnly cookies are cleared on server side
 * - Blacklist is automatically cleaned up when tokens expire
 *
 * @note
 * - Blacklist is currently in-memory (lost on server restart)
 * - For production with multiple servers, use Redis for distributed blacklist
 * - If token extraction fails, still clears cookies (graceful degradation)
 */
export async function logout(req: Request, res: Response): Promise<void> {
  // Try to get token from Authorization header (for backwards compatibility)
  // or from cookies (new method)
  const headerToken = extractTokenFromHeader(req.headers.authorization)
  const cookieToken = req.cookies?.gantt_auth_token

  const token = headerToken || cookieToken

  if (token) {
    try {
      // Decode token to get expiry time
      const decoded = jwt.decode(token) as jwt.JwtPayload

      if (decoded && decoded.exp) {
        // Add token to blacklist until it naturally expires
        const expiresAt = decoded.exp * 1000 // Convert to milliseconds
        blacklistToken(token, expiresAt)
      }
    } catch (error) {
      // Ignore errors, still clear cookies
      console.error('Error blacklisting token:', error)
    }
  }

  // Clear auth cookies
  clearAuthCookies(res)

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  })
}
