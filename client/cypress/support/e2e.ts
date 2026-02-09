/**
 * Cypress E2E Support File
 *
 * Loads before every test file
 */

// Import commands
import './commands'

// Prevent Cypress from failing tests on uncaught exceptions from app
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test
  // Only do this for known safe errors
  if (err.message.includes('ResizeObserver loop')) {
    return false
  }
  return true
})

// Clear localStorage and sessionStorage before each test
beforeEach(() => {
  cy.clearLocalStorage()
  cy.clearCookies()
})

// Add custom Cypress configuration
Cypress.config('defaultCommandTimeout', 10000)
Cypress.config('requestTimeout', 10000)
