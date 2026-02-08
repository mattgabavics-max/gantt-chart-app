import { PrismaClient } from '@prisma/client'

export const testProjects = {
  publicProject: {
    name: 'Public Test Project',
    isPublic: true,
  },
  privateProject: {
    name: 'Private Test Project',
    isPublic: false,
  },
}

/**
 * Create a test project
 */
export async function createTestProject(
  prisma: PrismaClient,
  ownerId: string,
  projectData: any = testProjects.publicProject
) {
  return prisma.project.create({
    data: {
      name: projectData.name,
      isPublic: projectData.isPublic,
      ownerId,
    },
  })
}

/**
 * Create multiple test projects
 */
export async function createTestProjects(
  prisma: PrismaClient,
  ownerId: string,
  count: number = 3
) {
  const projects = []
  for (let i = 0; i < count; i++) {
    const project = await prisma.project.create({
      data: {
        name: `Test Project ${i + 1}`,
        isPublic: i % 2 === 0, // Alternate public/private
        ownerId,
      },
    })
    projects.push(project)
  }
  return projects
}

/**
 * Create a test task
 */
export async function createTestTask(
  prisma: PrismaClient,
  projectId: string,
  taskData?: any
) {
  return prisma.task.create({
    data: {
      projectId,
      name: taskData?.name || 'Test Task',
      startDate: taskData?.startDate || new Date(),
      endDate: taskData?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      color: taskData?.color || '#3B82F6',
      position: taskData?.position || 0,
    },
  })
}
