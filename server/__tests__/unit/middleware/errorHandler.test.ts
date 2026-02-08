import { describe, it, expect, jest } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
} from '../../../src/middleware/errorHandler.js'

// Mock Express types
const mockRequest = () => {
  return {
    method: 'GET',
    path: '/test',
  } as Request
}

const mockResponse = () => {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res) as any
  res.json = jest.fn().mockReturnValue(res) as any
  return res
}

const mockNext = () => jest.fn() as unknown as NextFunction

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError(400, 'Test error')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Test error')
      expect(error.isOperational).toBe(true)
    })
  })

  describe('NotFoundError', () => {
    it('should create a 404 error', () => {
      const error = new NotFoundError('User')

      expect(error.statusCode).toBe(404)
      expect(error.message).toBe('User not found')
    })

    it('should use default message', () => {
      const error = new NotFoundError()

      expect(error.message).toBe('Resource not found')
    })
  })

  describe('UnauthorizedError', () => {
    it('should create a 401 error', () => {
      const error = new UnauthorizedError('Invalid credentials')

      expect(error.statusCode).toBe(401)
      expect(error.message).toBe('Invalid credentials')
    })
  })

  describe('ForbiddenError', () => {
    it('should create a 403 error', () => {
      const error = new ForbiddenError('Access denied')

      expect(error.statusCode).toBe(403)
      expect(error.message).toBe('Access denied')
    })
  })

  describe('BadRequestError', () => {
    it('should create a 400 error', () => {
      const error = new BadRequestError('Invalid input')

      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Invalid input')
    })
  })

  describe('ConflictError', () => {
    it('should create a 409 error', () => {
      const error = new ConflictError('Email already exists')

      expect(error.statusCode).toBe(409)
      expect(error.message).toBe('Email already exists')
    })
  })
})

describe('errorHandler middleware', () => {
  it('should handle AppError instances', () => {
    const req = mockRequest()
    const res = mockResponse()
    const next = mockNext()
    const error = new AppError(400, 'Test error')

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error',
      message: 'Test error',
    })
  })

  it('should handle generic errors with 500 status', () => {
    const req = mockRequest()
    const res = mockResponse()
    const next = mockNext()
    const error = new Error('Generic error')

    // Set NODE_ENV to test to avoid exposing error message
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
      message: 'Something went wrong',
    })

    process.env.NODE_ENV = originalEnv
  })

  it('should expose error message in development', () => {
    const req = mockRequest()
    const res = mockResponse()
    const next = mockNext()
    const error = new Error('Development error')

    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    errorHandler(error, req, res, next)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Development error',
      })
    )

    process.env.NODE_ENV = originalEnv
  })
})

describe('notFoundHandler middleware', () => {
  it('should return 404 error for undefined routes', () => {
    const req = mockRequest()
    const res = mockResponse()
    const next = mockNext()

    notFoundHandler(req, res, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Not found',
      message: 'Cannot GET /test',
    })
  })
})

describe('asyncHandler', () => {
  it('should call next with error if async function throws', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const next = mockNext()
    const error = new Error('Async error')

    const asyncFn = async () => {
      throw error
    }

    const handler = asyncHandler(asyncFn)
    await handler(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })

  it('should not call next if async function succeeds', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const next = mockNext()

    const asyncFn = async () => {
      res.json({ success: true })
    }

    const handler = asyncHandler(asyncFn)
    await handler(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })
})
