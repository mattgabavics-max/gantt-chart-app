/**
 * Mock data generators for tests
 */

export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
}

export const mockProject = {
  id: '223e4567-e89b-12d3-a456-426614174000',
  name: 'Test Project',
  isPublic: false,
  ownerId: mockUser.id,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
}

export const mockTask = {
  id: '323e4567-e89b-12d3-a456-426614174000',
  projectId: mockProject.id,
  name: 'Test Task',
  startDate: new Date('2024-01-01T00:00:00.000Z'),
  endDate: new Date('2024-01-07T00:00:00.000Z'),
  color: '#3B82F6',
  position: 0,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
}

export const mockShareLink = {
  id: '423e4567-e89b-12d3-a456-426614174000',
  projectId: mockProject.id,
  token: '523e4567-e89b-12d3-a456-426614174000',
  accessType: 'READONLY' as const,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  expiresAt: new Date('2024-02-01T00:00:00.000Z'),
}

export const mockProjectVersion = {
  id: '623e4567-e89b-12d3-a456-426614174000',
  projectId: mockProject.id,
  versionNumber: 1,
  snapshotData: {
    projectName: 'Test Project',
    tasks: [],
    timestamp: '2024-01-01T00:00:00.000Z',
  },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  createdBy: mockUser.id,
}

/**
 * Generate a mock user with custom properties
 */
export function generateMockUser(overrides?: Partial<typeof mockUser>) {
  return {
    ...mockUser,
    ...overrides,
  }
}

/**
 * Generate multiple mock users
 */
export function generateMockUsers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i}-${Date.now()}`,
    email: `user${i}@example.com`,
    createdAt: new Date(),
  }))
}

/**
 * Generate a mock project with custom properties
 */
export function generateMockProject(overrides?: Partial<typeof mockProject>) {
  return {
    ...mockProject,
    ...overrides,
  }
}

/**
 * Generate a mock task with custom properties
 */
export function generateMockTask(overrides?: Partial<typeof mockTask>) {
  return {
    ...mockTask,
    ...overrides,
  }
}
