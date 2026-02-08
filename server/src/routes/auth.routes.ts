import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { register, login, getCurrentUser, verifyToken } from '../controllers/auth.controller.js'
import { registerValidation, loginValidation } from '../validators/auth.validator.js'
import { handleValidationErrors } from '../middleware/validation.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

/**
 * Rate limiting for authentication endpoints
 * Prevents brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

const generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // More lenient for general auth endpoints
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  registerValidation,
  handleValidationErrors,
  asyncHandler(register)
)

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  loginValidation,
  handleValidationErrors,
  asyncHandler(login)
)

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get(
  '/me',
  generalAuthLimiter,
  authenticate,
  asyncHandler(getCurrentUser)
)

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity
 * @access  Private
 */
router.get(
  '/verify',
  generalAuthLimiter,
  authenticate,
  asyncHandler(verifyToken)
)

export default router
