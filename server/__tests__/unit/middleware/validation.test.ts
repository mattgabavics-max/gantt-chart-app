import { describe, it, expect, jest } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { handleValidationErrors } from '../../../src/middleware/validation.js'

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}))

const mockRequest = (body: any = {}) => {
  return { body } as Request
}

const mockResponse = () => {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res) as any
  res.json = jest.fn().mockReturnValue(res) as any
  return res
}

const mockNext = () => jest.fn() as unknown as NextFunction

describe('handleValidationErrors middleware', () => {
  it('should call next if no validation errors', () => {
    const req = mockRequest()
    const res = mockResponse()
    const next = mockNext()

    // Mock validationResult to return no errors
    ;(validationResult as jest.Mock).mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    })

    handleValidationErrors(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  it('should return 400 with errors if validation fails', () => {
    const req = mockRequest()
    const res = mockResponse()
    const next = mockNext()

    const mockErrors = [
      {
        type: 'field',
        path: 'email',
        msg: 'Email is required',
      },
      {
        type: 'field',
        path: 'password',
        msg: 'Password must be at least 8 characters',
      },
    ]

    // Mock validationResult to return errors
    ;(validationResult as jest.Mock).mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors,
    })

    handleValidationErrors(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Validation failed',
      message: 'Please check your input',
      errors: [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password must be at least 8 characters' },
      ],
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should handle non-field validation errors', () => {
    const req = mockRequest()
    const res = mockResponse()
    const next = mockNext()

    const mockErrors = [
      {
        type: 'alternative',
        msg: 'Alternative error',
      },
    ]

    ;(validationResult as jest.Mock).mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors,
    })

    handleValidationErrors(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Validation failed',
      message: 'Please check your input',
      errors: [{ field: undefined, message: 'Alternative error' }],
    })
  })
})
