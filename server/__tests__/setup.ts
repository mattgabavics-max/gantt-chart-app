import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

// Set test environment
process.env.NODE_ENV = 'test'

// Initialize Prisma Client for tests
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://localhost:5432/gantt_chart_test',
    },
  },
})

// Global setup
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect()
})

// Global teardown
afterAll(async () => {
  // Disconnect from test database
  await prisma.$disconnect()
})

// Clean database between tests
afterEach(async () => {
  // Delete all data in reverse order of dependencies
  await prisma.shareLink.deleteMany({})
  await prisma.task.deleteMany({})
  await prisma.projectVersion.deleteMany({})
  await prisma.project.deleteMany({})
  await prisma.user.deleteMany({})
})
