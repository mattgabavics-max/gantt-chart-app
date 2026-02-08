import { describe, it, expect, beforeEach } from '@jest/globals'
import { generateToken, verifyToken, decodeToken, extractTokenFromHeader } from '../../../src/utils/jwt.js'

describe('JWT Utilities', () => {
  const mockPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
  }

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken(mockPayload)
      const token2 = generateToken({
        userId: 'different-id',
        email: 'different@example.com',
      })

      expect(token1).not.toBe(token2)
    })

    it('should include payload data in token', () => {
      const token = generateToken(mockPayload)
      const decoded = decodeToken(token)

      expect(decoded).toBeDefined()
      expect(decoded?.userId).toBe(mockPayload.userId)
      expect(decoded?.email).toBe(mockPayload.email)
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockPayload)
      const decoded = verifyToken(token)

      expect(decoded).toBeDefined()
      expect(decoded.userId).toBe(mockPayload.userId)
      expect(decoded.email).toBe(mockPayload.email)
    })

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyToken('invalid.token.here')
      }).toThrow('Invalid token')
    })

    it('should throw error for malformed token', () => {
      expect(() => {
        verifyToken('not-a-jwt-token')
      }).toThrow()
    })

    it('should throw error for empty token', () => {
      expect(() => {
        verifyToken('')
      }).toThrow()
    })
  })

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const token = generateToken(mockPayload)
      const decoded = decodeToken(token)

      expect(decoded).toBeDefined()
      expect(decoded?.userId).toBe(mockPayload.userId)
      expect(decoded?.email).toBe(mockPayload.email)
    })

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid.token.here')
      expect(decoded).toBeNull()
    })

    it('should return null for empty token', () => {
      const decoded = decodeToken('')
      expect(decoded).toBeNull()
    })
  })

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token'
      const header = `Bearer ${token}`

      const extracted = extractTokenFromHeader(header)
      expect(extracted).toBe(token)
    })

    it('should return null for missing header', () => {
      const extracted = extractTokenFromHeader(undefined)
      expect(extracted).toBeNull()
    })

    it('should return null for empty header', () => {
      const extracted = extractTokenFromHeader('')
      expect(extracted).toBeNull()
    })

    it('should return null for header without Bearer prefix', () => {
      const extracted = extractTokenFromHeader('token-without-bearer')
      expect(extracted).toBeNull()
    })

    it('should return null for malformed Bearer header', () => {
      const extracted = extractTokenFromHeader('Bearer')
      expect(extracted).toBeNull()
    })

    it('should handle headers with extra spaces', () => {
      const token = 'test.token.here'
      const header = `Bearer  ${token}` // Extra space

      // This should return null as format is invalid
      const extracted = extractTokenFromHeader(header)
      expect(extracted).toBeNull()
    })
  })
})
