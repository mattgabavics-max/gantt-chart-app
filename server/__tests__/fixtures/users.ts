import { hashPassword } from '../../src/utils/password.js'

export const testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'TestPass123',
  },
  anotherUser: {
    email: 'another@example.com',
    password: 'AnotherPass123',
  },
  weakPassword: {
    email: 'weak@example.com',
    password: 'weak',
  },
  invalidEmail: {
    email: 'invalid-email',
    password: 'TestPass123',
  },
}

export async function createTestUser(prisma: any, userData: any = testUsers.validUser) {
  const passwordHash = await hashPassword(userData.password)
  return prisma.user.create({
    data: {
      email: userData.email,
      passwordHash,
    },
  })
}

export async function createMultipleTestUsers(prisma: any, count: number = 3) {
  const users = []
  for (let i = 0; i < count; i++) {
    const passwordHash = await hashPassword('TestPass123')
    const user = await prisma.user.create({
      data: {
        email: `user${i}@example.com`,
        passwordHash,
      },
    })
    users.push(user)
  }
  return users
}
