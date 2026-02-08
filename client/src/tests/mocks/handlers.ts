/**
 * MSW Request Handlers
 * Defines mock API responses
 */

import { http, HttpResponse } from 'msw'
import { mockProjects, mockTasks, mockVersions } from './mockData'

export const handlers = [
  // Projects
  http.get('/api/projects', () => {
    return HttpResponse.json({ projects: mockProjects })
  }),

  http.get('/api/projects/:id', ({ params }) => {
    const project = mockProjects.find((p) => p.id === params.id)
    if (!project) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json({ project })
  }),

  http.post('/api/projects', async ({ request }) => {
    const body = await request.json()
    const newProject = {
      id: `project-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json({ project: newProject }, { status: 201 })
  }),

  http.patch('/api/projects/:id', async ({ params, request }) => {
    const body = await request.json()
    const project = mockProjects.find((p) => p.id === params.id)
    if (!project) {
      return new HttpResponse(null, { status: 404 })
    }
    const updated = { ...project, ...body, updatedAt: new Date().toISOString() }
    return HttpResponse.json({ project: updated })
  }),

  http.delete('/api/projects/:id', ({ params }) => {
    const project = mockProjects.find((p) => p.id === params.id)
    if (!project) {
      return new HttpResponse(null, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // Tasks
  http.get('/api/projects/:projectId/tasks', ({ params }) => {
    const tasks = mockTasks.filter((t) => t.projectId === params.projectId)
    return HttpResponse.json({ tasks })
  }),

  http.post('/api/projects/:projectId/tasks', async ({ params, request }) => {
    const body = await request.json()
    const newTask = {
      id: `task-${Date.now()}`,
      projectId: params.projectId,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json({ task: newTask }, { status: 201 })
  }),

  http.patch('/api/tasks/:id', async ({ params, request }) => {
    const body = await request.json()
    const task = mockTasks.find((t) => t.id === params.id)
    if (!task) {
      return new HttpResponse(null, { status: 404 })
    }
    const updated = { ...task, ...body, updatedAt: new Date().toISOString() }
    return HttpResponse.json({ task: updated })
  }),

  http.delete('/api/tasks/:id', ({ params }) => {
    const task = mockTasks.find((t) => t.id === params.id)
    if (!task) {
      return new HttpResponse(null, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // Versions
  http.get('/api/projects/:projectId/versions', ({ params }) => {
    const versions = mockVersions.filter((v) => v.projectId === params.projectId)
    return HttpResponse.json({ versions })
  }),

  http.post('/api/projects/:projectId/versions', async ({ params, request }) => {
    const body = await request.json()
    const newVersion = {
      id: `version-${Date.now()}`,
      projectId: params.projectId,
      versionNumber: mockVersions.length + 1,
      createdAt: new Date().toISOString(),
      createdBy: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      },
      snapshot: {
        projectName: 'Test Project',
        tasks: mockTasks.filter((t) => t.projectId === params.projectId),
        metadata: {
          totalTasks: 3,
          dateRange: {
            start: new Date().toISOString(),
            end: new Date().toISOString(),
          },
        },
      },
      ...body,
    }
    return HttpResponse.json({ version: newVersion }, { status: 201 })
  }),

  http.post('/api/projects/:projectId/versions/:versionId/restore', ({ params }) => {
    const version = mockVersions.find((v) => v.id === params.versionId)
    if (!version) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json({ success: true })
  }),

  http.delete('/api/projects/:projectId/versions/:versionId', ({ params }) => {
    const version = mockVersions.find((v) => v.id === params.versionId)
    if (!version) {
      return new HttpResponse(null, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
