/**
 * Project Management E2E Tests
 *
 * Tests project CRUD operations:
 * - Create project
 * - View project
 * - Update project
 * - Delete project
 * - Project sharing
 */

describe('Project Management', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'TestPass123!',
  }

  beforeEach(() => {
    // Login before each test
    cy.apiLogin(testUser.email, testUser.password)
    cy.visit('/dashboard')
  })

  afterEach(() => {
    // Clean up test data
    cy.cleanupTestData()
  })

  describe('Create Project', () => {
    it('should create new project', () => {
      cy.get('[data-testid="new-project-button"]').click()

      // Fill form
      cy.get('input[name="name"]').type('Test Project')
      cy.get('textarea[name="description"]').type('This is a test project')
      cy.get('input[name="startDate"]').type('2024-01-01')
      cy.get('input[name="endDate"]').type('2024-12-31')

      // Submit
      cy.get('button[type="submit"]').click()

      // Should show success message
      cy.contains(/project created/i).should('be.visible')

      // Should show in project list
      cy.contains('Test Project').should('be.visible')
    })

    it('should validate required fields', () => {
      cy.get('[data-testid="new-project-button"]').click()

      // Try to submit without filling fields
      cy.get('button[type="submit"]').click()

      // Should show validation errors
      cy.contains(/name is required/i).should('be.visible')
      cy.contains(/start date is required/i).should('be.visible')
      cy.contains(/end date is required/i).should('be.visible')
    })

    it('should validate date range', () => {
      cy.get('[data-testid="new-project-button"]').click()

      cy.get('input[name="name"]').type('Invalid Dates Project')
      cy.get('input[name="startDate"]').type('2024-12-31')
      cy.get('input[name="endDate"]').type('2024-01-01')

      cy.get('button[type="submit"]').click()

      // Should show date validation error
      cy.contains(/start date must be before end date/i).should('be.visible')
    })
  })

  describe('View Project', () => {
    beforeEach(() => {
      // Create test project
      cy.createProject({
        name: 'View Test Project',
        description: 'Test project for viewing',
      })
    })

    it('should view project details', () => {
      cy.contains('View Test Project').click()

      // Should show project details
      cy.contains('View Test Project').should('be.visible')
      cy.contains('Test project for viewing').should('be.visible')

      // Should show Gantt chart
      cy.get('[data-testid="gantt-chart"]').should('be.visible')
    })

    it('should navigate back to dashboard', () => {
      cy.contains('View Test Project').click()

      cy.get('[data-testid="back-button"]').click()

      // Should be back on dashboard
      cy.url().should('include', '/dashboard')
    })
  })

  describe('Update Project', () => {
    let projectId: string

    beforeEach(() => {
      cy.createProject({
        name: 'Update Test Project',
        description: 'Original description',
      }).then((project) => {
        projectId = project.id
        cy.visit(`/projects/${projectId}`)
      })
    })

    it('should update project name', () => {
      cy.get('[data-testid="edit-project-button"]').click()

      cy.get('input[name="name"]').clear().type('Updated Project Name')
      cy.get('button[type="submit"]').click()

      // Should show success message
      cy.contains(/project updated/i).should('be.visible')

      // Should show updated name
      cy.contains('Updated Project Name').should('be.visible')
    })

    it('should update project description', () => {
      cy.get('[data-testid="edit-project-button"]').click()

      cy.get('textarea[name="description"]').clear().type('Updated description')
      cy.get('button[type="submit"]').click()

      cy.contains('Updated description').should('be.visible')
    })

    it('should toggle project visibility', () => {
      cy.get('[data-testid="project-settings-button"]').click()
      cy.get('[data-testid="toggle-visibility-button"]').click()

      // Should show confirmation
      cy.contains(/project is now public/i).should('be.visible')

      // Toggle back
      cy.get('[data-testid="toggle-visibility-button"]').click()
      cy.contains(/project is now private/i).should('be.visible')
    })
  })

  describe('Delete Project', () => {
    let projectId: string

    beforeEach(() => {
      cy.createProject({
        name: 'Delete Test Project',
      }).then((project) => {
        projectId = project.id
        cy.visit(`/projects/${projectId}`)
      })
    })

    it('should delete project with confirmation', () => {
      cy.get('[data-testid="delete-project-button"]').click()

      // Should show confirmation dialog
      cy.get('[data-testid="confirm-delete-dialog"]').should('be.visible')
      cy.contains(/are you sure/i).should('be.visible')

      // Cancel first
      cy.get('[data-testid="cancel-delete-button"]').click()
      cy.contains('Delete Test Project').should('be.visible')

      // Delete for real
      cy.get('[data-testid="delete-project-button"]').click()
      cy.get('[data-testid="confirm-delete-button"]').click()

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')

      // Should show success message
      cy.contains(/project deleted/i).should('be.visible')

      // Should not show deleted project
      cy.contains('Delete Test Project').should('not.exist')
    })
  })

  describe('Project List', () => {
    beforeEach(() => {
      // Create multiple projects
      cy.createProject({ name: 'Project Alpha' })
      cy.createProject({ name: 'Project Beta' })
      cy.createProject({ name: 'Project Gamma' })
      cy.visit('/dashboard')
    })

    it('should list all projects', () => {
      cy.contains('Project Alpha').should('be.visible')
      cy.contains('Project Beta').should('be.visible')
      cy.contains('Project Gamma').should('be.visible')
    })

    it('should search projects', () => {
      cy.get('[data-testid="project-search-input"]').type('Beta')

      // Should show only matching project
      cy.contains('Project Beta').should('be.visible')
      cy.contains('Project Alpha').should('not.exist')
      cy.contains('Project Gamma').should('not.exist')
    })

    it('should filter by visibility', () => {
      // Create public project
      cy.createProject({
        name: 'Public Project',
        isPublic: true,
      })

      cy.visit('/dashboard')

      // Filter by public
      cy.get('[data-testid="visibility-filter"]').select('public')
      cy.contains('Public Project').should('be.visible')
      cy.contains('Project Alpha').should('not.exist')

      // Filter by private
      cy.get('[data-testid="visibility-filter"]').select('private')
      cy.contains('Project Alpha').should('be.visible')
      cy.contains('Public Project').should('not.exist')
    })
  })

  describe('Project Sharing', () => {
    let projectId: string

    beforeEach(() => {
      cy.createProject({
        name: 'Share Test Project',
        isPublic: true,
      }).then((project) => {
        projectId = project.id
        cy.visit(`/projects/${projectId}`)
      })
    })

    it('should generate share link', () => {
      cy.get('[data-testid="share-project-button"]').click()

      // Should show share dialog
      cy.get('[data-testid="share-dialog"]').should('be.visible')

      // Should show share link
      cy.get('[data-testid="share-link"]').should('be.visible')

      // Should copy to clipboard
      cy.get('[data-testid="copy-link-button"]').click()
      cy.contains(/copied to clipboard/i).should('be.visible')
    })

    it('should revoke share link', () => {
      cy.get('[data-testid="share-project-button"]').click()

      // Revoke link
      cy.get('[data-testid="revoke-link-button"]').click()
      cy.get('[data-testid="confirm-revoke-button"]').click()

      // Should show success message
      cy.contains(/share link revoked/i).should('be.visible')
    })
  })
})
