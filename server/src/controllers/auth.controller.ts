import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js'
import { generateToken, extractTokenFromHeader } from '../utils/jwt.js'
import { ConflictError, UnauthorizedError, BadRequestError } from '../middleware/errorHandler.js'
import { blacklistToken } from '../services/tokenBlacklist.js'
import { setAuthCookie, clearAuthCookies } from '../utils/cookies.js'

/**
 * Register a new user
 * POST /api/auth/register
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
 * Login user
 * POST /api/auth/login
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
 * Get current authenticated user
 * GET /api/auth/me
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
 * Verify token validity
 * GET /api/auth/verify
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
 * Logout user (revoke current JWT token)
 * POST /api/auth/logout
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
