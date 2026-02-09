/**
 * Authentication E2E Tests
 *
 * Tests user authentication flows:
 * - Login
 * - Register
 * - Logout
 * - Error handling
 */

describe('Authentication', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'TestPass123!',
  }

  beforeEach(() => {
    cy.visit('/')
  })

  describe('Login', () => {
    it('should login with valid credentials', () => {
      cy.visit('/login')

      cy.get('input[type="email"]').type(testUser.email)
      cy.get('input[type="password"]').type(testUser.password)
      cy.get('button[type="submit"]').click()

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')

      // Should show user info
      cy.contains(testUser.email).should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/login')

      cy.get('input[type="email"]').type('wrong@example.com')
      cy.get('input[type="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()

      // Should stay on login page
      cy.url().should('include', '/login')

      // Should show error message
      cy.contains(/invalid email or password/i).should('be.visible')
    })

    it('should show validation errors for empty fields', () => {
      cy.visit('/login')

      cy.get('button[type="submit"]').click()

      // Should show validation errors
      cy.contains(/email is required/i).should('be.visible')
      cy.contains(/password is required/i).should('be.visible')
    })

    it('should remember user session', () => {
      cy.login(testUser.email, testUser.password)

      // Reload page
      cy.reload()

      // Should still be logged in
      cy.url().should('include', '/dashboard')
      cy.contains(testUser.email).should('be.visible')
    })
  })

  describe('Register', () => {
    it('should register new user', () => {
      const newUser = {
        email: `new-${Date.now()}@example.com`,
        password: 'NewPass123!',
      }

      cy.visit('/register')

      cy.get('input[type="email"]').type(newUser.email)
      cy.get('input[type="password"]').type(newUser.password)
      cy.get('button[type="submit"]').click()

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')

      // Should show welcome message
      cy.contains(/welcome/i).should('be.visible')
    })

    it('should show error for existing email', () => {
      cy.visit('/register')

      cy.get('input[type="email"]').type(testUser.email)
      cy.get('input[type="password"]').type(testUser.password)
      cy.get('button[type="submit"]').click()

      // Should show error
      cy.contains(/already exists/i).should('be.visible')
    })

    it('should enforce password requirements', () => {
      cy.visit('/register')

      cy.get('input[type="email"]').type('newuser@example.com')

      // Weak password
      cy.get('input[type="password"]').type('weak')
      cy.get('button[type="submit"]').click()

      // Should show password requirements error
      cy.contains(/password/i).should('be.visible')
    })
  })

  describe('Logout', () => {
    beforeEach(() => {
      cy.apiLogin(testUser.email, testUser.password)
      cy.visit('/dashboard')
    })

    it('should logout user', () => {
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()

      // Should redirect to login
      cy.url().should('include', '/login')

      // Should clear session
      cy.window().its('localStorage.token').should('not.exist')
    })

    it('should not allow access to protected routes after logout', () => {
      // Logout
      cy.logout()

      // Try to access dashboard
      cy.visit('/dashboard')

      // Should redirect to login
      cy.url().should('include', '/login')
    })
  })

  describe('Session Management', () => {
    it('should handle expired token', () => {
      cy.apiLogin(testUser.email, testUser.password)

      // Set expired token
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'expired.invalid.token')
      })

      cy.visit('/dashboard')

      // Should redirect to login
      cy.url().should('include', '/login')

      // Should show session expired message
      cy.contains(/session expired/i).should('be.visible')
    })
  })
})
