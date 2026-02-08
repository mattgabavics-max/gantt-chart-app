import { Request, Response, NextFunction } from 'express'
import { jest } from '@jest/globals'

/**
 * Create a mock Express Request
 */
export function mockRequest(options: {
  body?: any
  params?: any
  query?: any
  headers?: any
  user?: any
  method?: string
  path?: string
} = {}): Request {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    user: options.user,
    method: options.method || 'GET',
    path: options.path || '/',
  } as Request
}

/**
 * Create a mock Express Response
 */
export function mockResponse(): Response {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res) as any
  res.json = jest.fn().mockReturnValue(res) as any
  res.send = jest.fn().mockReturnValue(res) as any
  res.sendStatus = jest.fn().mockReturnValue(res) as any
  return res
}

/**
 * Create a mock Express NextFunction
 */
export function mockNext(): NextFunction {
  return jest.fn() as unknown as NextFunction
}

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generate a random email
 */
export function randomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
}

/**
 * Generate a random string
 */
export function randomString(length: number = 10): string {
  return Math.random().toString(36).substr(2, length)
}

/**
 * Assert that an object matches a partial structure
 */
export function assertMatchesObject(actual: any, expected: any): void {
  expect(actual).toMatchObject(expected)
}

/**
 * Extract error message from response body
 */
export function getErrorMessage(responseBody: any): string {
  return responseBody.message || responseBody.error || 'Unknown error'
}
