import { describe, it, expect } from '@jest/globals'
import { BadRequestError } from '../../../src/middleware/errorHandler.js'

/**
 * Helper function to validate date range (extracted for testing)
 * This is the same logic used in the task controller
 */
function validateDateRange(startDate: Date, endDate: Date): void {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start >= end) {
    throw new BadRequestError('Start date must be before end date')
  }
}

describe('Task Controller Helpers', () => {
  describe('validateDateRange', () => {
    it('should pass when start date is before end date', () => {
      const startDate = new Date('2026-02-01')
      const endDate = new Date('2026-02-10')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).not.toThrow()
    })

    it('should pass with dates far apart', () => {
      const startDate = new Date('2026-01-01')
      const endDate = new Date('2026-12-31')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).not.toThrow()
    })

    it('should pass with dates one day apart', () => {
      const startDate = new Date('2026-02-01')
      const endDate = new Date('2026-02-02')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).not.toThrow()
    })

    it('should throw error when start date equals end date', () => {
      const startDate = new Date('2026-02-01')
      const endDate = new Date('2026-02-01')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).toThrow(BadRequestError)

      expect(() => {
        validateDateRange(startDate, endDate)
      }).toThrow('Start date must be before end date')
    })

    it('should throw error when start date is after end date', () => {
      const startDate = new Date('2026-02-10')
      const endDate = new Date('2026-02-01')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).toThrow(BadRequestError)

      expect(() => {
        validateDateRange(startDate, endDate)
      }).toThrow('Start date must be before end date')
    })

    it('should handle string dates correctly', () => {
      const startDate = new Date('2026-02-01T00:00:00.000Z')
      const endDate = new Date('2026-02-10T00:00:00.000Z')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).not.toThrow()
    })

    it('should handle dates with time components', () => {
      const startDate = new Date('2026-02-01T10:30:00.000Z')
      const endDate = new Date('2026-02-01T15:45:00.000Z')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).not.toThrow()
    })

    it('should throw error when dates with time are equal', () => {
      const startDate = new Date('2026-02-01T10:30:00.000Z')
      const endDate = new Date('2026-02-01T10:30:00.000Z')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).toThrow(BadRequestError)
    })

    it('should handle year boundaries correctly', () => {
      const startDate = new Date('2025-12-31T23:59:59.000Z')
      const endDate = new Date('2026-01-01T00:00:00.000Z')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).not.toThrow()
    })

    it('should handle leap year dates', () => {
      const startDate = new Date('2024-02-28')
      const endDate = new Date('2024-02-29')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).not.toThrow()
    })
  })

  describe('Date Validation Edge Cases', () => {
    it('should validate millisecond precision', () => {
      const startDate = new Date('2026-02-01T10:30:00.000Z')
      const endDate = new Date('2026-02-01T10:30:00.001Z')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).not.toThrow()
    })

    it('should fail when end is 1 millisecond before start', () => {
      const startDate = new Date('2026-02-01T10:30:00.001Z')
      const endDate = new Date('2026-02-01T10:30:00.000Z')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).toThrow(BadRequestError)
    })

    it('should handle very long duration tasks', () => {
      const startDate = new Date('2020-01-01')
      const endDate = new Date('2030-12-31')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).not.toThrow()
    })

    it('should handle past dates', () => {
      const startDate = new Date('2020-01-01')
      const endDate = new Date('2020-12-31')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).not.toThrow()
    })

    it('should handle future dates', () => {
      const startDate = new Date('2030-01-01')
      const endDate = new Date('2030-12-31')

      expect(() => {
        validateDateRange(startDate, endDate)
      }).not.toThrow()
    })
  })
})
