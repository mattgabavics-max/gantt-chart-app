import { Request, Response } from 'express'
import prisma from '../config/database.js'
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js'
import { generateToken } from '../utils/jwt.js'
import { ConflictError, UnauthorizedError, BadRequestError } from '../middleware/errorHandler.js'

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

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token,
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

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
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
