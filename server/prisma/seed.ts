import { PrismaClient, AccessType } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.shareLink.deleteMany({})
  await prisma.task.deleteMany({})
  await prisma.projectVersion.deleteMany({})
  await prisma.project.deleteMany({})
  await prisma.user.deleteMany({})

  // Create users
  console.log('👤 Creating users...')
  const passwordHash = await bcrypt.hash('password123', 10)

  const user1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      passwordHash,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      passwordHash,
    },
  })

  const user3 = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      passwordHash,
    },
  })

  console.log(`✅ Created ${3} users`)

  // Create projects
  console.log('📁 Creating projects...')

  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      isPublic: true,
      ownerId: user1.id,
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      isPublic: false,
      ownerId: user1.id,
    },
  })

  const project3 = await prisma.project.create({
    data: {
      name: 'Marketing Campaign Q1 2024',
      isPublic: true,
      ownerId: user2.id,
    },
  })

  const project4 = await prisma.project.create({
    data: {
      name: 'Infrastructure Migration',
      isPublic: false,
      ownerId: user3.id,
    },
  })

  console.log(`✅ Created ${4} projects`)

  // Create tasks for Project 1 (Website Redesign)
  console.log('📋 Creating tasks...')

  const today = new Date()
  const addDays = (date: Date, days: number) => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  // Website Redesign Tasks
  await prisma.task.createMany({
    data: [
      {
        projectId: project1.id,
        name: 'Project Planning',
        startDate: addDays(today, 0),
        endDate: addDays(today, 7),
        color: '#3B82F6',
        position: 0,
      },
      {
        projectId: project1.id,
        name: 'UI/UX Design',
        startDate: addDays(today, 7),
        endDate: addDays(today, 21),
        color: '#8B5CF6',
        position: 1,
      },
      {
        projectId: project1.id,
        name: 'Frontend Development',
        startDate: addDays(today, 21),
        endDate: addDays(today, 49),
        color: '#10B981',
        position: 2,
      },
      {
        projectId: project1.id,
        name: 'Backend Integration',
        startDate: addDays(today, 35),
        endDate: addDays(today, 56),
        color: '#F59E0B',
        position: 3,
      },
      {
        projectId: project1.id,
        name: 'Testing & QA',
        startDate: addDays(today, 56),
        endDate: addDays(today, 70),
        color: '#EF4444',
        position: 4,
      },
      {
        projectId: project1.id,
        name: 'Deployment',
        startDate: addDays(today, 70),
        endDate: addDays(today, 77),
        color: '#06B6D4',
        position: 5,
      },
    ],
  })

  // Mobile App Development Tasks
  await prisma.task.createMany({
    data: [
      {
        projectId: project2.id,
        name: 'Requirements Gathering',
        startDate: addDays(today, 0),
        endDate: addDays(today, 14),
        color: '#3B82F6',
        position: 0,
      },
      {
        projectId: project2.id,
        name: 'Wireframing',
        startDate: addDays(today, 14),
        endDate: addDays(today, 28),
        color: '#8B5CF6',
        position: 1,
      },
      {
        projectId: project2.id,
        name: 'iOS Development',
        startDate: addDays(today, 28),
        endDate: addDays(today, 70),
        color: '#10B981',
        position: 2,
      },
      {
        projectId: project2.id,
        name: 'Android Development',
        startDate: addDays(today, 28),
        endDate: addDays(today, 70),
        color: '#10B981',
        position: 3,
      },
      {
        projectId: project2.id,
        name: 'API Development',
        startDate: addDays(today, 21),
        endDate: addDays(today, 56),
        color: '#F59E0B',
        position: 4,
      },
    ],
  })

  // Marketing Campaign Tasks
  await prisma.task.createMany({
    data: [
      {
        projectId: project3.id,
        name: 'Market Research',
        startDate: addDays(today, 0),
        endDate: addDays(today, 14),
        color: '#3B82F6',
        position: 0,
      },
      {
        projectId: project3.id,
        name: 'Content Creation',
        startDate: addDays(today, 14),
        endDate: addDays(today, 42),
        color: '#8B5CF6',
        position: 1,
      },
      {
        projectId: project3.id,
        name: 'Social Media Campaign',
        startDate: addDays(today, 28),
        endDate: addDays(today, 84),
        color: '#EC4899',
        position: 2,
      },
      {
        projectId: project3.id,
        name: 'Email Marketing',
        startDate: addDays(today, 35),
        endDate: addDays(today, 91),
        color: '#F59E0B',
        position: 3,
      },
    ],
  })

  // Infrastructure Migration Tasks
  await prisma.task.createMany({
    data: [
      {
        projectId: project4.id,
        name: 'Infrastructure Audit',
        startDate: addDays(today, 0),
        endDate: addDays(today, 7),
        color: '#3B82F6',
        position: 0,
      },
      {
        projectId: project4.id,
        name: 'Cloud Setup',
        startDate: addDays(today, 7),
        endDate: addDays(today, 21),
        color: '#10B981',
        position: 1,
      },
      {
        projectId: project4.id,
        name: 'Data Migration',
        startDate: addDays(today, 21),
        endDate: addDays(today, 35),
        color: '#EF4444',
        position: 2,
      },
      {
        projectId: project4.id,
        name: 'Testing & Validation',
        startDate: addDays(today, 35),
        endDate: addDays(today, 42),
        color: '#F59E0B',
        position: 3,
      },
      {
        projectId: project4.id,
        name: 'Cutover',
        startDate: addDays(today, 42),
        endDate: addDays(today, 49),
        color: '#06B6D4',
        position: 4,
      },
    ],
  })

  console.log(`✅ Created tasks for all projects`)

  // Create project versions
  console.log('📦 Creating project versions...')

  await prisma.projectVersion.create({
    data: {
      projectId: project1.id,
      versionNumber: 1,
      snapshotData: {
        projectName: 'Website Redesign',
        tasks: 6,
        timestamp: new Date().toISOString(),
        changes: 'Initial project setup',
      },
      createdBy: user1.id,
    },
  })

  await prisma.projectVersion.create({
    data: {
      projectId: project1.id,
      versionNumber: 2,
      snapshotData: {
        projectName: 'Website Redesign',
        tasks: 6,
        timestamp: new Date().toISOString(),
        changes: 'Updated task timelines',
      },
      createdBy: user1.id,
    },
  })

  await prisma.projectVersion.create({
    data: {
      projectId: project2.id,
      versionNumber: 1,
      snapshotData: {
        projectName: 'Mobile App Development',
        tasks: 5,
        timestamp: new Date().toISOString(),
        changes: 'Initial version',
      },
      createdBy: user1.id,
    },
  })

  console.log(`✅ Created project versions`)

  // Create share links
  console.log('🔗 Creating share links...')

  await prisma.shareLink.create({
    data: {
      projectId: project1.id,
      accessType: AccessType.READONLY,
      expiresAt: addDays(today, 30),
    },
  })

  await prisma.shareLink.create({
    data: {
      projectId: project1.id,
      accessType: AccessType.EDITABLE,
      expiresAt: addDays(today, 7),
    },
  })

  await prisma.shareLink.create({
    data: {
      projectId: project3.id,
      accessType: AccessType.READONLY,
      expiresAt: null, // Never expires
    },
  })

  console.log(`✅ Created share links`)

  console.log('✨ Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log('  - Users: 3')
  console.log('  - Projects: 4')
  console.log('  - Tasks: 20')
  console.log('  - Project Versions: 3')
  console.log('  - Share Links: 3')
  console.log('\n🔑 Test Credentials:')
  console.log('  Email: john.doe@example.com')
  console.log('  Email: jane.smith@example.com')
  console.log('  Email: demo@example.com')
  console.log('  Password: password123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
