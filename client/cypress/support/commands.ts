/**
 * Cypress Custom Commands
 *
 * Add custom commands for common test operations
 */

/// <reference types="cypress" />

/**
 * Login via UI
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
})

/**
 * Login via API (faster for setup)
 */
Cypress.Commands.add('apiLogin', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password },
  }).then((response) => {
    expect(response.status).to.eq(200)
    window.localStorage.setItem('token', response.body.data.token)
    window.localStorage.setItem('user', JSON.stringify(response.body.data.user))
  })
})

/**
 * Logout
 */
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('token')
  window.localStorage.removeItem('user')
  cy.visit('/login')
})

/**
 * Create project via API
 */
Cypress.Commands.add('createProject', (projectData) => {
  const token = window.localStorage.getItem('token')

  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/projects`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      name: projectData.name,
      description: projectData.description || '',
      startDate: projectData.startDate || '2024-01-01',
      endDate: projectData.endDate || '2024-12-31',
      isPublic: projectData.isPublic || false,
    },
  }).then((response) => {
    expect(response.status).to.be.oneOf([200, 201])
    return response.body.data.project
  })
})

/**
 * Create task via API
 */
Cypress.Commands.add('createTask', (projectId, taskData) => {
  const token = window.localStorage.getItem('token')

  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/projects/${projectId}/tasks`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      name: taskData.name,
      description: taskData.description || '',
      startDate: taskData.startDate || '2024-01-01',
      endDate: taskData.endDate || '2024-01-31',
      status: taskData.status || 'pending',
    },
  }).then((response) => {
    expect(response.status).to.be.oneOf([200, 201])
    return response.body.data.task
  })
})

/**
 * Clean up test data
 */
Cypress.Commands.add('cleanupTestData', () => {
  const token = window.localStorage.getItem('token')

  // Delete all projects (which cascades to tasks)
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/projects`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200 && response.body.data?.projects) {
      response.body.data.projects.forEach((project: any) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.env('apiUrl')}/projects/${project.id}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          failOnStatusCode: false,
        })
      })
    }
  })
})

// Type definitions for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login via UI
       * @param email - User email
       * @param password - User password
       */
      login(email: string, password: string): Chainable<void>

      /**
       * Login via API (faster)
       * @param email - User email
       * @param password - User password
       */
      apiLogin(email: string, password: string): Chainable<void>

      /**
       * Logout current user
       */
      logout(): Chainable<void>

      /**
       * Create project via API
       * @param projectData - Project data
       */
      createProject(projectData: {
        name: string
        description?: string
        startDate?: string
        endDate?: string
        isPublic?: boolean
      }): Chainable<any>

      /**
       * Create task via API
       * @param projectId - Project ID
       * @param taskData - Task data
       */
      createTask(
        projectId: string,
        taskData: {
          name: string
          description?: string
          startDate?: string
          endDate?: string
          status?: string
        }
      ): Chainable<any>

      /**
       * Clean up all test data
       */
      cleanupTestData(): Chainable<void>
    }
  }
}

export {}
