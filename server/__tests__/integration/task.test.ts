import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import express from 'express'
import dotenv from 'dotenv'
import corsMiddleware from '../../src/middleware/cors.js'
import authRoutes from '../../src/routes/auth.routes.js'
import projectRoutes from '../../src/routes/project.routes.js'
import taskRoutes from '../../src/routes/task.routes.js'
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler.js'
import { hashPassword } from '../../src/utils/password.js'

// Load test environment
dotenv.config({ path: '.env.test' })

const prisma = new PrismaClient()

// Create test app
const app = express()
app.use(corsMiddleware)
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api', taskRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

describe('Task Integration Tests', () => {
  let user1Token: string
  let user1Id: string
  let user2Token: string
  let user2Id: string
  let projectId: string
  let publicProjectId: string

  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  afterEach(async () => {
    // Clean up test data in correct order (respecting foreign keys)
    await prisma.task.deleteMany({})
    await prisma.projectVersion.deleteMany({})
    await prisma.shareLink.deleteMany({})
    await prisma.project.deleteMany({})
    await prisma.user.deleteMany({})
  })

  beforeEach(async () => {
    // Create test users
    const hashedPassword = await hashPassword('TestPass123')

    const user1 = await prisma.user.create({
      data: {
        email: 'user1@example.com',
        passwordHash: hashedPassword,
      },
    })
    user1Id = user1.id

    const user2 = await prisma.user.create({
      data: {
        email: 'user2@example.com',
        passwordHash: hashedPassword,
      },
    })
    user2Id = user2.id

    // Login users to get tokens
    const login1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user1@example.com', password: 'TestPass123' })
    user1Token = login1.body.data.token

    const login2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user2@example.com', password: 'TestPass123' })
    user2Token = login2.body.data.token

    // Create test projects
    const project = await prisma.project.create({
      data: {
        name: 'Private Project',
        isPublic: false,
        ownerId: user1Id,
      },
    })
    projectId = project.id

    const publicProject = await prisma.project.create({
      data: {
        name: 'Public Project',
        isPublic: true,
        ownerId: user1Id,
      },
    })
    publicProjectId = publicProject.id
  })

  describe('GET /api/projects/:projectId/tasks', () => {
    it('should get all tasks for a project (owner)', async () => {
      // Create test tasks
      await prisma.task.createMany({
        data: [
          {
            name: 'Task 1',
            startDate: new Date('2026-02-01'),
            endDate: new Date('2026-02-10'),
            color: '#3b82f6',
            position: 0,
            projectId,
          },
          {
            name: 'Task 2',
            startDate: new Date('2026-02-11'),
            endDate: new Date('2026-02-20'),
            color: '#10b981',
            position: 1,
            projectId,
          },
        ],
      })

      const response = await request(app)
        .get(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          tasks: expect.arrayContaining([
            expect.objectContaining({
              name: 'Task 1',
              position: 0,
            }),
            expect.objectContaining({
              name: 'Task 2',
              position: 1,
            }),
          ]),
        },
      })
      expect(response.body.data.tasks).toHaveLength(2)
    })

    it('should get tasks for public project without auth', async () => {
      await prisma.task.create({
        data: {
          name: 'Public Task',
          startDate: new Date('2026-02-01'),
          endDate: new Date('2026-02-10'),
          color: '#3b82f6',
          position: 0,
          projectId: publicProjectId,
        },
      })

      const response = await request(app)
        .get(`/api/projects/${publicProjectId}/tasks`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          tasks: expect.arrayContaining([
            expect.objectContaining({
              name: 'Public Task',
            }),
          ]),
        },
      })
    })

    it('should deny access to private project for non-owner', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403)

      expect(response.body).toMatchObject({
        success: false,
        error: 'You do not have access to this project',
      })
    })

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/00000000-0000-0000-0000-000000000000/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Project not found',
      })
    })

    it('should return tasks ordered by position', async () => {
      await prisma.task.createMany({
        data: [
          { name: 'Task C', startDate: new Date('2026-02-01'), endDate: new Date('2026-02-10'), color: '#3b82f6', position: 2, projectId },
          { name: 'Task A', startDate: new Date('2026-02-01'), endDate: new Date('2026-02-10'), color: '#3b82f6', position: 0, projectId },
          { name: 'Task B', startDate: new Date('2026-02-01'), endDate: new Date('2026-02-10'), color: '#3b82f6', position: 1, projectId },
        ],
      })

      const response = await request(app)
        .get(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200)

      expect(response.body.data.tasks[0].name).toBe('Task A')
      expect(response.body.data.tasks[1].name).toBe('Task B')
      expect(response.body.data.tasks[2].name).toBe('Task C')
    })
  })

  describe('POST /api/projects/:projectId/tasks', () => {
    it('should create a new task with valid data', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'New Task',
          startDate: '2026-02-01T00:00:00.000Z',
          endDate: '2026-02-10T00:00:00.000Z',
          color: '#3b82f6',
        })
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Task created successfully',
        data: {
          task: {
            name: 'New Task',
            color: '#3b82f6',
            position: expect.any(Number),
          },
        },
      })

      // Verify task in database
      const task = await prisma.task.findFirst({
        where: { projectId, name: 'New Task' },
      })
      expect(task).toBeDefined()
    })

    it('should create task with auto-incremented position', async () => {
      // Create first task
      await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Task 1',
          startDate: '2026-02-01',
          endDate: '2026-02-10',
        })
        .expect(201)

      // Create second task
      const response = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Task 2',
          startDate: '2026-02-11',
          endDate: '2026-02-20',
        })
        .expect(201)

      expect(response.body.data.task.position).toBeGreaterThan(0)
    })

    it('should use default color when not provided', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Task Without Color',
          startDate: '2026-02-01',
          endDate: '2026-02-10',
        })
        .expect(201)

      expect(response.body.data.task.color).toBe('#3b82f6')
    })

    it('should reject when start date is after end date', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Invalid Task',
          startDate: '2026-02-10',
          endDate: '2026-02-01',
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Start date must be before end date',
      })
    })

    it('should reject when start date equals end date', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Invalid Task',
          startDate: '2026-02-01',
          endDate: '2026-02-01',
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Start date must be before end date',
      })
    })

    it('should reject with invalid color format', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Task',
          startDate: '2026-02-01',
          endDate: '2026-02-10',
          color: 'blue',
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
      })
    })

    it('should deny access for non-owner', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Task',
          startDate: '2026-02-01',
          endDate: '2026-02-10',
        })
        .expect(403)

      expect(response.body).toMatchObject({
        success: false,
        error: 'You do not own this project',
      })
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .send({
          name: 'Task',
          startDate: '2026-02-01',
          endDate: '2026-02-10',
        })
        .expect(403)

      expect(response.body).toMatchObject({
        success: false,
      })
    })

    it('should create version snapshot when requested', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Task',
          startDate: '2026-02-01',
          endDate: '2026-02-10',
          createSnapshot: true,
        })
        .expect(201)

      // Check that a version was created
      const versions = await prisma.projectVersion.findMany({
        where: { projectId },
      })
      expect(versions).toHaveLength(1)
      expect(versions[0].versionNumber).toBe(1)
    })
  })

  describe('PUT /api/tasks/:id', () => {
    let taskId: string

    beforeEach(async () => {
      const task = await prisma.task.create({
        data: {
          name: 'Original Task',
          startDate: new Date('2026-02-01'),
          endDate: new Date('2026-02-10'),
          color: '#3b82f6',
          position: 0,
          projectId,
        },
      })
      taskId = task.id
    })

    it('should update task name', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Updated Task Name',
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Task updated successfully',
        data: {
          task: {
            name: 'Updated Task Name',
          },
        },
      })
    })

    it('should update task dates (resize)', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          startDate: '2026-02-05',
          endDate: '2026-02-15',
        })
        .expect(200)

      expect(response.body.data.task).toMatchObject({
        name: 'Original Task',
      })
      expect(new Date(response.body.data.task.startDate)).toEqual(new Date('2026-02-05'))
      expect(new Date(response.body.data.task.endDate)).toEqual(new Date('2026-02-15'))
    })

    it('should update task color', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          color: '#ef4444',
        })
        .expect(200)

      expect(response.body.data.task.color).toBe('#ef4444')
    })

    it('should update task position', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          position: 5,
        })
        .expect(200)

      expect(response.body.data.task.position).toBe(5)
    })

    it('should update multiple fields at once', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Completely Updated',
          startDate: '2026-03-01',
          endDate: '2026-03-31',
          color: '#f59e0b',
          position: 10,
        })
        .expect(200)

      expect(response.body.data.task).toMatchObject({
        name: 'Completely Updated',
        color: '#f59e0b',
        position: 10,
      })
    })

    it('should reject invalid date range', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          startDate: '2026-02-20',
          endDate: '2026-02-10',
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Start date must be before end date',
      })
    })

    it('should validate partial date updates', async () => {
      // Update only end date to be before existing start date
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          endDate: '2026-01-15',
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Start date must be before end date',
      })
    })

    it('should deny access for non-owner', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Updated',
        })
        .expect(403)

      expect(response.body).toMatchObject({
        success: false,
        error: 'You do not own this project',
      })
    })

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Updated',
        })
        .expect(404)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Task not found',
      })
    })
  })

  describe('PATCH /api/tasks/:id/position', () => {
    let taskId: string

    beforeEach(async () => {
      const task = await prisma.task.create({
        data: {
          name: 'Task',
          startDate: new Date('2026-02-01'),
          endDate: new Date('2026-02-10'),
          color: '#3b82f6',
          position: 0,
          projectId,
        },
      })
      taskId = task.id
    })

    it('should update task position', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/position`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          position: 5,
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Task position updated successfully',
        data: {
          task: {
            position: 5,
          },
        },
      })
    })

    it('should require position field', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/position`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({})
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
      })
    })

    it('should reject negative position', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/position`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          position: -1,
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
      })
    })

    it('should deny access for non-owner', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/position`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          position: 5,
        })
        .expect(403)

      expect(response.body).toMatchObject({
        success: false,
        error: 'You do not own this project',
      })
    })
  })

  describe('DELETE /api/tasks/:id', () => {
    let taskId: string

    beforeEach(async () => {
      const task = await prisma.task.create({
        data: {
          name: 'Task to Delete',
          startDate: new Date('2026-02-01'),
          endDate: new Date('2026-02-10'),
          color: '#3b82f6',
          position: 0,
          projectId,
        },
      })
      taskId = task.id
    })

    it('should delete a task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Task deleted successfully',
      })

      // Verify task is deleted
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      })
      expect(task).toBeNull()
    })

    it('should create snapshot when requested', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          createSnapshot: true,
        })
        .expect(200)

      // Check version was created
      const versions = await prisma.projectVersion.findMany({
        where: { projectId },
      })
      expect(versions).toHaveLength(1)
    })

    it('should deny access for non-owner', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403)

      expect(response.body).toMatchObject({
        success: false,
        error: 'You do not own this project',
      })
    })

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Task not found',
      })
    })
  })

  describe('PATCH /api/projects/:projectId/tasks/bulk', () => {
    let task1Id: string
    let task2Id: string
    let task3Id: string

    beforeEach(async () => {
      const tasks = await prisma.task.createMany({
        data: [
          {
            name: 'Task 1',
            startDate: new Date('2026-02-01'),
            endDate: new Date('2026-02-10'),
            color: '#3b82f6',
            position: 0,
            projectId,
          },
          {
            name: 'Task 2',
            startDate: new Date('2026-02-11'),
            endDate: new Date('2026-02-20'),
            color: '#10b981',
            position: 1,
            projectId,
          },
          {
            name: 'Task 3',
            startDate: new Date('2026-02-21'),
            endDate: new Date('2026-02-28'),
            color: '#f59e0b',
            position: 2,
            projectId,
          },
        ],
      })

      const allTasks = await prisma.task.findMany({
        where: { projectId },
        orderBy: { position: 'asc' },
      })
      task1Id = allTasks[0].id
      task2Id = allTasks[1].id
      task3Id = allTasks[2].id
    })

    it('should update multiple tasks at once', async () => {
      const response = await request(app)
        .patch(`/api/projects/${projectId}/tasks/bulk`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          tasks: [
            { id: task1Id, position: 2 },
            { id: task2Id, position: 0 },
            { id: task3Id, position: 1 },
          ],
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: '3 tasks updated successfully',
      })
      expect(response.body.data.tasks).toHaveLength(3)
    })

    it('should update various fields in bulk', async () => {
      const response = await request(app)
        .patch(`/api/projects/${projectId}/tasks/bulk`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          tasks: [
            {
              id: task1Id,
              name: 'Updated Task 1',
              color: '#ef4444',
            },
            {
              id: task2Id,
              startDate: '2026-03-01',
              endDate: '2026-03-10',
            },
            {
              id: task3Id,
              position: 0,
            },
          ],
        })
        .expect(200)

      expect(response.body.data.tasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: task1Id, name: 'Updated Task 1', color: '#ef4444' }),
          expect.objectContaining({ id: task2Id }),
          expect.objectContaining({ id: task3Id, position: 0 }),
        ])
      )
    })

    it('should create snapshot when requested', async () => {
      const response = await request(app)
        .patch(`/api/projects/${projectId}/tasks/bulk`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          tasks: [
            { id: task1Id, position: 1 },
            { id: task2Id, position: 0 },
          ],
          createSnapshot: true,
        })
        .expect(200)

      const versions = await prisma.projectVersion.findMany({
        where: { projectId },
      })
      expect(versions).toHaveLength(1)
    })

    it('should reject if tasks array is empty', async () => {
      const response = await request(app)
        .patch(`/api/projects/${projectId}/tasks/bulk`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          tasks: [],
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
      })
    })

    it('should reject if task does not belong to project', async () => {
      // Create task in different project
      const otherProject = await prisma.project.create({
        data: {
          name: 'Other Project',
          isPublic: false,
          ownerId: user1Id,
        },
      })

      const otherTask = await prisma.task.create({
        data: {
          name: 'Other Task',
          startDate: new Date('2026-02-01'),
          endDate: new Date('2026-02-10'),
          color: '#3b82f6',
          position: 0,
          projectId: otherProject.id,
        },
      })

      const response = await request(app)
        .patch(`/api/projects/${projectId}/tasks/bulk`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          tasks: [
            { id: task1Id, position: 1 },
            { id: otherTask.id, position: 2 },
          ],
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'One or more tasks do not belong to this project',
      })
    })

    it('should reject invalid date ranges in bulk update', async () => {
      const response = await request(app)
        .patch(`/api/projects/${projectId}/tasks/bulk`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          tasks: [
            {
              id: task1Id,
              startDate: '2026-02-20',
              endDate: '2026-02-10',
            },
          ],
        })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Start date must be before end date',
      })
    })

    it('should deny access for non-owner', async () => {
      const response = await request(app)
        .patch(`/api/projects/${projectId}/tasks/bulk`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          tasks: [
            { id: task1Id, position: 1 },
          ],
        })
        .expect(403)

      expect(response.body).toMatchObject({
        success: false,
        error: 'You do not own this project',
      })
    })

    it('should handle large bulk updates efficiently', async () => {
      // Create many tasks
      const manyTasks = []
      for (let i = 0; i < 20; i++) {
        const task = await prisma.task.create({
          data: {
            name: `Bulk Task ${i}`,
            startDate: new Date('2026-02-01'),
            endDate: new Date('2026-02-10'),
            color: '#3b82f6',
            position: i + 3,
            projectId,
          },
        })
        manyTasks.push({ id: task.id, position: i })
      }

      const response = await request(app)
        .patch(`/api/projects/${projectId}/tasks/bulk`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          tasks: manyTasks,
        })
        .expect(200)

      expect(response.body.message).toBe('20 tasks updated successfully')
      expect(response.body.data.tasks).toHaveLength(20)
    })
  })
})
