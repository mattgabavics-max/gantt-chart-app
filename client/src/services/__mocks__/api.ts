/**
 * Mock for api.ts service
 * Used in Jest tests to avoid import.meta.env issues
 */

export const tokenManager = {
  getToken: jest.fn(),
  setToken: jest.fn(),
  removeToken: jest.fn(),
  clearAll: jest.fn(),
}

export const api = {
  // Auth endpoints
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),

  // Project endpoints
  getProjects: jest.fn(),
  getProject: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),

  // Task endpoints
  getTasks: jest.fn(),
  getTask: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),

  // Version endpoints
  getVersions: jest.fn(),
  getVersion: jest.fn(),
  createVersion: jest.fn(),
  restoreVersion: jest.fn(),
  deleteVersion: jest.fn(),

  // Share endpoints
  getShareLinks: jest.fn(),
  createShareLink: jest.fn(),
  deleteShareLink: jest.fn(),
}

export default api
