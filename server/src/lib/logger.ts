/**
 * Structured Logger using Pino
 *
 * Provides high-performance structured logging with:
 * - Request/response logging
 * - Error tracking
 * - Performance monitoring
 * - Correlation IDs
 */

import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Use pino-pretty for human-readable logs in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: (req: any) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers?.host,
        'user-agent': req.headers?.['user-agent'],
      },
    }),
    res: (res: any) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
})

// Helper functions for common log patterns
export const log = {
  info: (message: string, data?: object) => logger.info(data, message),
  warn: (message: string, data?: object) => logger.warn(data, message),
  error: (message: string, error?: Error, data?: object) => {
    logger.error({ ...data, error }, message)
  },
  debug: (message: string, data?: object) => logger.debug(data, message),
}
