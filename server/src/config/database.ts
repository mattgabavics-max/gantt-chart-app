import { PrismaClient } from '@prisma/client'

// Initialize Prisma Client with logging configuration
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Test database connection
export async function connectDatabase() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Failed to connect to database:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔌 Disconnecting from database...')
  await prisma.$disconnect()
  console.log('👋 Database disconnected')
}

process.on('beforeExit', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

export default prisma
