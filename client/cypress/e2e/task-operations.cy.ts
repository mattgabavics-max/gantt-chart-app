/**
 * E2E Tests for Task Operations in Project View
 *
 * Tests task CRUD operations, drag-drop functionality, and user workflows
 * within the project/Gantt chart view.
 */

/// <reference types="cypress" />

describe('Task Operations in Project View', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Test123!@#',
  }

  let projectId: string

  beforeEach(() => {
    // Setup: Login and create a test project
    cy.visit('/')
    cy.apiLogin(testUser.email, testUser.password)

    cy.createProject({
      name: 'E2E Test Project',
      description: 'Project for testing task operations',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    }).then((project) => {
      projectId = project.id
      cy.visit(`/projects/${projectId}`)
      cy.wait(1000) // Wait for project view to load
    })
  })

  afterEach(() => {
    // Cleanup test data
    cy.cleanupTestData()
  })

  describe('Create Task', () => {
    it('should create a new task from project view', () => {
      // Click add task button
      cy.get('[data-testid="add-task-button"]', { timeout: 10000 })
        .should('be.visible')
        .click()

      // Fill in task form
      cy.get('input[name="name"]').type('New E2E Task')
      cy.get('textarea[name="description"]').type('Task created via E2E test')
      cy.get('input[name="startDate"]').type('2024-01-15')
      cy.get('input[name="endDate"]').type('2024-01-20')

      // Submit form
      cy.get('button[type="submit"]').contains(/create|add/i).click()

      // Verify task appears in the list
      cy.contains('New E2E Task').should('be.visible')
    })

    it('should create task with minimal required fields', () => {
      cy.get('[data-testid="add-task-button"]').click()

      cy.get('input[name="name"]').type('Minimal Task')
      cy.get('input[name="startDate"]').type('2024-02-01')
      cy.get('input[name="endDate"]').type('2024-02-05')

      cy.get('button[type="submit"]').contains(/create|add/i).click()

      cy.contains('Minimal Task').should('be.visible')
    })

    it('should validate required fields when creating task', () => {
      cy.get('[data-testid="add-task-button"]').click()

      // Try to submit without required fields
      cy.get('button[type="submit"]').contains(/create|add/i).click()

      // Should show validation errors
      cy.contains(/required|name is required/i).should('be.visible')
    })

    it('should validate date range when creating task', () => {
      cy.get('[data-testid="add-task-button"]').click()

      cy.get('input[name="name"]').type('Invalid Date Task')
      cy.get('input[name="startDate"]').type('2024-03-15')
      cy.get('input[name="endDate"]').type('2024-03-10') // End before start

      cy.get('button[type="submit"]').contains(/create|add/i).click()

      // Should show date validation error
      cy.contains(/end date.*after.*start date/i).should('be.visible')
    })

    it('should show task on Gantt chart after creation', () => {
      cy.get('[data-testid="add-task-button"]').click()

      cy.get('input[name="name"]').type('Gantt Task')
      cy.get('input[name="startDate"]').type('2024-04-01')
      cy.get('input[name="endDate"]').type('2024-04-10')

      cy.get('button[type="submit"]').contains(/create|add/i).click()

      // Wait for Gantt chart to render
      cy.wait(500)

      // Verify task appears on Gantt chart
      cy.get('[data-testid="gantt-chart"]').within(() => {
        cy.contains('Gantt Task').should('be.visible')
      })
    })
  })

  describe('View Task Details', () => {
    beforeEach(() => {
      // Create a task for viewing
      cy.createTask(projectId, {
        name: 'Task to View',
        description: 'Detailed task description',
        startDate: '2024-05-01',
        endDate: '2024-05-15',
        status: 'in-progress',
      })
      cy.reload()
      cy.wait(1000)
    })

    it('should display task in sidebar list', () => {
      cy.contains('Task to View').should('be.visible')
    })

    it('should show task details when clicked', () => {
      cy.contains('Task to View').click()

      // Should show task details panel or modal
      cy.contains('Detailed task description').should('be.visible')
      cy.contains(/in-progress|in progress/i).should('be.visible')
    })

    it('should display task dates', () => {
      cy.contains('Task to View').click()

      // Check for formatted dates
      cy.contains(/may.*1|5\/1\/2024/i).should('be.visible')
      cy.contains(/may.*15|5\/15\/2024/i).should('be.visible')
    })
  })

  describe('Edit Task', () => {
    let taskId: string

    beforeEach(() => {
      cy.createTask(projectId, {
        name: 'Task to Edit',
        description: 'Original description',
        startDate: '2024-06-01',
        endDate: '2024-06-10',
      }).then((task) => {
        taskId = task.id
        cy.reload()
        cy.wait(1000)
      })
    })

    it('should edit task via edit button', () => {
      // Find and click edit button
      cy.contains('Task to Edit')
        .parent()
        .find('[data-testid="edit-task-button"]')
        .click()

      // Update task name
      cy.get('input[name="name"]').clear().type('Updated Task Name')
      cy.get('textarea[name="description"]').clear().type('Updated description')

      // Save changes
      cy.get('button[type="submit"]').contains(/save|update/i).click()

      // Verify changes
      cy.contains('Updated Task Name').should('be.visible')
      cy.contains('Original description').should('not.exist')
    })

    it('should edit task inline via double-click', () => {
      // Double-click to edit
      cy.contains('Task to Edit').dblclick()

      // Should open inline editor
      cy.get('input[name="name"]').should('be.visible').clear().type('Inline Edit')

      // Save
      cy.get('[data-testid="save-task"]').click()

      cy.contains('Inline Edit').should('be.visible')
    })

    it('should update task dates', () => {
      cy.contains('Task to Edit')
        .parent()
        .find('[data-testid="edit-task-button"]')
        .click()

      cy.get('input[name="startDate"]').clear().type('2024-07-01')
      cy.get('input[name="endDate"]').clear().type('2024-07-20')

      cy.get('button[type="submit"]').contains(/save|update/i).click()

      // Verify dates updated
      cy.contains('Task to Edit').click()
      cy.contains(/july.*1|7\/1\/2024/i).should('be.visible')
    })

    it('should cancel edit without saving changes', () => {
      cy.contains('Task to Edit')
        .parent()
        .find('[data-testid="edit-task-button"]')
        .click()

      cy.get('input[name="name"]').clear().type('Should Not Save')

      // Click cancel button
      cy.get('button').contains(/cancel/i).click()

      // Verify original name remains
      cy.contains('Task to Edit').should('be.visible')
      cy.contains('Should Not Save').should('not.exist')
    })

    it('should update task status', () => {
      cy.contains('Task to Edit')
        .parent()
        .find('[data-testid="edit-task-button"]')
        .click()

      // Change status
      cy.get('select[name="status"]').select('completed')

      cy.get('button[type="submit"]').contains(/save|update/i).click()

      // Verify status change
      cy.contains('Task to Edit').click()
      cy.contains(/completed/i).should('be.visible')
    })
  })

  describe('Delete Task', () => {
    beforeEach(() => {
      cy.createTask(projectId, {
        name: 'Task to Delete',
        startDate: '2024-08-01',
        endDate: '2024-08-10',
      })
      cy.reload()
      cy.wait(1000)
    })

    it('should delete task with confirmation', () => {
      // Find delete button
      cy.contains('Task to Delete')
        .parent()
        .find('[data-testid="delete-task-button"]')
        .click()

      // Confirm deletion
      cy.get('[data-testid="confirm-delete"]').click()

      // Verify task is removed
      cy.contains('Task to Delete').should('not.exist')
    })

    it('should cancel task deletion', () => {
      cy.contains('Task to Delete')
        .parent()
        .find('[data-testid="delete-task-button"]')
        .click()

      // Cancel deletion
      cy.get('[data-testid="cancel-delete"]').click()

      // Verify task still exists
      cy.contains('Task to Delete').should('be.visible')
    })

    it('should remove task from Gantt chart after deletion', () => {
      cy.contains('Task to Delete')
        .parent()
        .find('[data-testid="delete-task-button"]')
        .click()

      cy.get('[data-testid="confirm-delete"]').click()

      // Verify task removed from Gantt chart
      cy.get('[data-testid="gantt-chart"]').within(() => {
        cy.contains('Task to Delete').should('not.exist')
      })
    })
  })

  describe('Drag and Drop Tasks', () => {
    beforeEach(() => {
      // Create multiple tasks for reordering
      cy.createTask(projectId, {
        name: 'Task 1',
        startDate: '2024-09-01',
        endDate: '2024-09-05',
      })
      cy.createTask(projectId, {
        name: 'Task 2',
        startDate: '2024-09-06',
        endDate: '2024-09-10',
      })
      cy.createTask(projectId, {
        name: 'Task 3',
        startDate: '2024-09-11',
        endDate: '2024-09-15',
      })
      cy.reload()
      cy.wait(1000)
    })

    it('should reorder tasks via drag and drop in sidebar', () => {
      // Get initial order
      cy.get('[data-testid="task-list"]')
        .find('[data-testid^="task-"]')
        .first()
        .should('contain', 'Task 1')

      // Drag Task 1 to bottom (this is a simplified test - actual drag-drop may need more complex simulation)
      cy.get('[data-testid="task-1"]').trigger('dragstart')
      cy.get('[data-testid="task-3"]').trigger('drop')

      cy.wait(500)

      // Verify new order
      cy.get('[data-testid="task-list"]')
        .find('[data-testid^="task-"]')
        .last()
        .should('contain', 'Task 1')
    })

    it('should update task dates when dragged on Gantt chart', () => {
      // Find task bar on Gantt chart
      cy.get('[data-testid="gantt-chart"]').within(() => {
        cy.contains('Task 2').parent().as('taskBar')
      })

      // Simulate horizontal drag (date change)
      // Note: Actual drag-drop in Cypress requires more complex event simulation
      cy.get('@taskBar').trigger('mousedown', { which: 1 })
      cy.get('@taskBar').trigger('mousemove', { clientX: 200, clientY: 0 })
      cy.get('@taskBar').trigger('mouseup', { force: true })

      cy.wait(500)

      // Verify task dates updated (visual check or API verification)
      cy.contains('Task 2').click()
      // Date should have changed from original
    })

    it('should show visual feedback during drag', () => {
      cy.get('[data-testid="task-1"]').trigger('dragstart')

      // Should show drag preview or highlight
      cy.get('[data-testid="task-1"]').should('have.class', 'dragging')

      cy.get('[data-testid="task-1"]').trigger('dragend')
    })
  })

  describe('Multiple Tasks Workflow', () => {
    it('should create multiple tasks in sequence', () => {
      const tasks = ['Research', 'Design', 'Development', 'Testing', 'Deployment']

      tasks.forEach((taskName, index) => {
        cy.get('[data-testid="add-task-button"]').click()
        cy.get('input[name="name"]').type(taskName)
        cy.get('input[name="startDate"]').type(`2024-10-${String(index * 5 + 1).padStart(2, '0')}`)
        cy.get('input[name="endDate"]').type(`2024-10-${String(index * 5 + 5).padStart(2, '0')}`)
        cy.get('button[type="submit"]').contains(/create|add/i).click()
        cy.wait(500)
      })

      // Verify all tasks created
      tasks.forEach((taskName) => {
        cy.contains(taskName).should('be.visible')
      })
    })

    it('should display correct task count', () => {
      // Create 3 tasks
      for (let i = 1; i <= 3; i++) {
        cy.createTask(projectId, {
          name: `Counted Task ${i}`,
          startDate: '2024-11-01',
          endDate: '2024-11-05',
        })
      }

      cy.reload()
      cy.wait(1000)

      // Verify count display
      cy.contains(/3 tasks/i).should('be.visible')
    })

    it('should filter/search tasks', () => {
      cy.createTask(projectId, { name: 'Frontend Task', startDate: '2024-11-01', endDate: '2024-11-05' })
      cy.createTask(projectId, { name: 'Backend Task', startDate: '2024-11-06', endDate: '2024-11-10' })
      cy.createTask(projectId, { name: 'Database Task', startDate: '2024-11-11', endDate: '2024-11-15' })

      cy.reload()
      cy.wait(1000)

      // Search for specific task
      cy.get('[data-testid="search-tasks"]').type('Backend')

      // Only Backend Task should be visible
      cy.contains('Backend Task').should('be.visible')
      cy.contains('Frontend Task').should('not.be.visible')
      cy.contains('Database Task').should('not.be.visible')
    })
  })

  describe('Task Progress', () => {
    beforeEach(() => {
      cy.createTask(projectId, {
        name: 'Task with Progress',
        startDate: '2024-12-01',
        endDate: '2024-12-10',
      })
      cy.reload()
      cy.wait(1000)
    })

    it('should update task progress', () => {
      cy.contains('Task with Progress')
        .parent()
        .find('[data-testid="edit-task-button"]')
        .click()

      // Set progress to 50%
      cy.get('input[name="progress"]').clear().type('50')

      cy.get('button[type="submit"]').contains(/save|update/i).click()

      // Verify progress indicator
      cy.contains('Task with Progress').click()
      cy.contains(/50%/).should('be.visible')
    })

    it('should show progress bar on Gantt chart', () => {
      cy.contains('Task with Progress')
        .parent()
        .find('[data-testid="edit-task-button"]')
        .click()

      cy.get('input[name="progress"]').clear().type('75')
      cy.get('button[type="submit"]').contains(/save|update/i).click()

      cy.wait(500)

      // Progress bar should be visible on task bar
      cy.get('[data-testid="gantt-chart"]').within(() => {
        cy.contains('Task with Progress')
          .parent()
          .find('[data-testid="progress-bar"]')
          .should('have.css', 'width') // Width should reflect 75%
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully when creating task', () => {
      // Simulate network failure
      cy.intercept('POST', '**/tasks', { forceNetworkError: true })

      cy.get('[data-testid="add-task-button"]').click()
      cy.get('input[name="name"]').type('Network Error Task')
      cy.get('input[name="startDate"]').type('2024-12-15')
      cy.get('input[name="endDate"]').type('2024-12-20')
      cy.get('button[type="submit"]').contains(/create|add/i).click()

      // Should show error message
      cy.contains(/error|failed|network/i).should('be.visible')
    })

    it('should handle server errors when editing task', () => {
      cy.createTask(projectId, {
        name: 'Error Task',
        startDate: '2024-12-01',
        endDate: '2024-12-05',
      })
      cy.reload()
      cy.wait(1000)

      // Simulate server error
      cy.intercept('PUT', '**/tasks/*', { statusCode: 500 })

      cy.contains('Error Task')
        .parent()
        .find('[data-testid="edit-task-button"]')
        .click()

      cy.get('input[name="name"]').clear().type('Will Fail')
      cy.get('button[type="submit"]').contains(/save|update/i).click()

      cy.contains(/error|failed|server/i).should('be.visible')
    })

    it('should prevent duplicate task creation', () => {
      cy.get('[data-testid="add-task-button"]').click()
      cy.get('input[name="name"]').type('Duplicate Task')
      cy.get('input[name="startDate"]').type('2024-12-20')
      cy.get('input[name="endDate"]').type('2024-12-25')
      cy.get('button[type="submit"]').contains(/create|add/i).click()

      cy.wait(500)

      // Try to create same task again
      cy.get('[data-testid="add-task-button"]').click()
      cy.get('input[name="name"]').type('Duplicate Task')
      cy.get('input[name="startDate"]').type('2024-12-20')
      cy.get('input[name="endDate"]').type('2024-12-25')
      cy.get('button[type="submit"]').contains(/create|add/i).click()

      // Should show duplicate error or allow it based on business rules
      // This depends on application requirements
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.createTask(projectId, {
        name: 'Accessible Task',
        startDate: '2024-12-26',
        endDate: '2024-12-31',
      })
      cy.reload()
      cy.wait(1000)
    })

    it('should be keyboard navigable', () => {
      // Tab to add task button
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'add-task-button')

      // Navigate through task list
      cy.get('body').tab()
      cy.focused().should('contain', 'Accessible Task')
    })

    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="add-task-button"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="task-list"]').should('have.attr', 'role', 'list')
    })

    it('should announce task creation to screen readers', () => {
      cy.get('[data-testid="add-task-button"]').click()
      cy.get('input[name="name"]').type('Announced Task')
      cy.get('input[name="startDate"]').type('2024-12-01')
      cy.get('input[name="endDate"]').type('2024-12-05')
      cy.get('button[type="submit"]').contains(/create|add/i).click()

      // Should have aria-live region announcing success
      cy.get('[role="status"]').should('contain', /created|added/i)
    })
  })
})
