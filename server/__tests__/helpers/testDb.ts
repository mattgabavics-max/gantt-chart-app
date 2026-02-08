import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

/**
 * Reset the test database
 */
export async function resetTestDatabase() {
  await prisma.shareLink.deleteMany({})
  await prisma.task.deleteMany({})
  await prisma.projectVersion.deleteMany({})
  await prisma.project.deleteMany({})
  await prisma.user.deleteMany({})
}

/**
 * Run migrations on test database
 */
export function runMigrations() {
  execSync('npx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  })
}

/**
 * Seed test database with minimal data
 */
export async function seedTestDatabase() {
  // This can be customized based on test needs
  // For now, we'll create data in individual tests
}

/**
 * Clean up and close database connection
 */
export async function closeDatabase() {
  await prisma.$disconnect()
}

export { prisma }
