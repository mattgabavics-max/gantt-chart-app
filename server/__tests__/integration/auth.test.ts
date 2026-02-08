import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import express from 'express'
import dotenv from 'dotenv'
import corsMiddleware from '../../src/middleware/cors.js'
import authRoutes from '../../src/routes/auth.routes.js'
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler.js'
import { hashPassword } from '../../src/utils/password.js'
import { generateToken } from '../../src/utils/jwt.js'

// Load test environment
dotenv.config({ path: '.env.test' })

const prisma = new PrismaClient()

// Create test app
const app = express()
app.use(corsMiddleware)
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({})
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
        })
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            email: 'test@example.com',
          },
          token: expect.any(String),
        },
      })

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      })
      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
    })

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPass123',
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
      })
    })

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
      })
      expect(response.body.errors).toBeDefined()
      expect(response.body.errors.length).toBeGreaterThan(0)
    })

    it('should reject registration with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'TestPass123',
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
      })
    })

    it('should reject registration with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
      })
    })

    it('should reject duplicate email registration', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
        })
        .expect(201)

      // Try to register again with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'DifferentPass123',
        })
        .expect(409)

      expect(response.body).toMatchObject({
        success: false,
        error: 'A user with this email already exists',
      })
    })

    it('should not expose password hash in response', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
        })
        .expect(201)

      expect(response.body.data.user.passwordHash).toBeUndefined()
      expect(response.body.data.user.password).toBeUndefined()
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const passwordHash = await hashPassword('TestPass123')
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash,
        },
      })
    })

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            email: 'test@example.com',
          },
          token: expect.any(String),
        },
      })
    })

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123',
        })
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid email or password',
      })
    })

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPass123',
        })
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid email or password',
      })
    })

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'TestPass123',
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
      })
    })

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
      })
    })

    it('should not expose password hash in response', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
        })
        .expect(200)

      expect(response.body.data.user.passwordHash).toBeUndefined()
      expect(response.body.data.user.password).toBeUndefined()
    })
  })

  describe('GET /api/auth/me', () => {
    let token: string
    let userId: string

    beforeEach(async () => {
      // Create a test user
      const passwordHash = await hashPassword('TestPass123')
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash,
        },
      })
      userId = user.id

      // Generate token
      token = generateToken({ userId: user.id, email: user.email })
    })

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: userId,
            email: 'test@example.com',
          },
        },
      })
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Authentication required',
      })
    })

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid token',
      })
    })

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Authentication required',
      })
    })

    it('should not expose password hash in response', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.data.user.passwordHash).toBeUndefined()
      expect(response.body.data.user.password).toBeUndefined()
    })
  })

  describe('GET /api/auth/verify', () => {
    let token: string

    beforeEach(async () => {
      // Create a test user
      const passwordHash = await hashPassword('TestPass123')
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash,
        },
      })

      // Generate token
      token = generateToken({ userId: user.id, email: user.email })
    })

    it('should verify a valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token is valid',
        data: {
          user: {
            email: 'test@example.com',
          },
        },
      })
    })

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid token',
      })
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Authentication required',
      })
    })
  })

  describe('Rate Limiting', () => {
    it('should rate limit registration attempts', async () => {
      // Make 6 requests (limit is 5)
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: `test${i}@example.com`,
            password: 'TestPass123',
          })

        if (i < 5) {
          expect(response.status).toBe(201)
        } else {
          expect(response.status).toBe(429)
          expect(response.body).toMatchObject({
            success: false,
            error: 'Too many requests',
          })
        }
      }
    }, 30000) // Increased timeout for rate limiting test
  })
})
