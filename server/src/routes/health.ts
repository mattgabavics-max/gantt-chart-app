/**
 * Health Check Endpoints
 * For monitoring and load balancer health checks
 */

import { Router, Request, Response } from 'express'
import { pool } from '../db'

const router = Router()

// ==================== Simple Health Check ====================

/**
 * GET /health
 * Basic health check - returns 200 if server is running
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// ==================== Readiness Check ====================

/**
 * GET /health/ready
 * Readiness check - returns 200 if server is ready to accept traffic
 * Checks database connection
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    await pool.query('SELECT 1')

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
      },
    })
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'disconnected',
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// ==================== Liveness Check ====================

/**
 * GET /health/live
 * Liveness check - returns 200 if server process is alive
 */
router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    memory: {
      usage: process.memoryUsage(),
      heap: process.memoryUsage().heapUsed,
    },
  })
})

// ==================== Detailed Status ====================

/**
 * GET /health/status
 * Detailed status including version, environment, and metrics
 */
router.get('/health/status', async (_req: Request, res: Response) => {
  try {
    // Check database
    const dbStart = Date.now()
    await pool.query('SELECT 1')
    const dbLatency = Date.now() - dbStart

    // Get database stats
    const poolStats = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    }

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`,
          pool: poolStats,
        },
      },
    })
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
