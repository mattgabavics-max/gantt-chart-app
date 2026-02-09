# Testing & Monitoring Setup Guide

This guide provides step-by-step instructions for setting up comprehensive testing and monitoring for the Gantt Chart application.

---

## Table of Contents

1. [Accessibility Testing Setup](#1-accessibility-testing-setup)
2. [Sentry Error Tracking](#2-sentry-error-tracking)
3. [Request Logging with Correlation IDs](#3-request-logging-with-correlation-ids)
4. [E2E Testing with Cypress](#4-e2e-testing-with-cypress)
5. [Performance Monitoring](#5-performance-monitoring)

---

## 1. Accessibility Testing Setup

### Install Dependencies

```bash
cd client
npm install --save-dev jest-axe @axe-core/react
```

### Setup jest-axe

**Update `client/src/setupTests.ts`:**
```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import 'jest-axe/extend-expect'  // Add this line

afterEach(() => {
  cleanup()
})

// ... rest of setup
```

### Create Accessibility Test Utilities

**Create `client/src/tests/utils/a11y.tsx`:**
```typescript
import { render, RenderResult } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

/**
 * Test component for accessibility violations
 */
export async function testA11y(
  ui: React.ReactElement,
  options?: Parameters<typeof render>[1]
): Promise<void> {
  const { container } = render(ui, options)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
}

/**
 * Test specific element for accessibility violations
 */
export async function testElementA11y(element: HTMLElement): Promise<void> {
  const results = await axe(element)
  expect(results).toHaveNoViolations()
}
```

### Example Accessibility Tests

**Create `client/src/components/Button/Button.a11y.test.tsx`:**
```typescript
import React from 'react'
import { testA11y } from '../../tests/utils/a11y'
import { Button } from './Button'

describe('Button Accessibility', () => {
  it('should not have accessibility violations', async () => {
    await testA11y(<Button>Click me</Button>)
  })

  it('should have accessible name', async () => {
    await testA11y(<Button aria-label="Submit form">Submit</Button>)
  })

  it('should be keyboard accessible', async () => {
    await testA11y(
      <Button onClick={() => {}}>
        Keyboard accessible button
      </Button>
    )
  })

  it('should support disabled state accessibly', async () => {
    await testA11y(<Button disabled>Disabled button</Button>)
  })
})
```

### Setup Runtime Accessibility Monitoring (Development)

**Update `client/src/main.tsx`:**
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Enable accessibility monitoring in development
if (process.env.NODE_ENV === 'development') {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### Add to CI Pipeline

**Update `.github/workflows/ci-cd.yml`:**
```yaml
- name: Run accessibility tests
  run: |
    cd client
    npm run test -- --testPathPattern=a11y.test
```

---

## 2. Sentry Error Tracking

### Install Dependencies

```bash
# Backend
cd server
npm install @sentry/node @sentry/profiling-node

# Frontend
cd client
npm install @sentry/react @sentry/browser
```

### Backend Setup

**Create `server/src/lib/sentry.ts`:**
```typescript
import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.')
    return
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      nodeProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: true }),
    ],
    beforeSend(event, hint) {
      // Filter out errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error(hint.originalException || hint.syntheticException)
        return null
      }
      return event
    },
  })

  console.log('✅ Sentry error tracking initialized')
}

export { Sentry }
```

**Update `server/src/index.ts`:**
```typescript
import express from 'express'
import { initSentry, Sentry } from './lib/sentry'

const app = express()

// Initialize Sentry FIRST
initSentry()

// Sentry request handler (must be first middleware)
app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.tracingHandler())

// ... other middleware

// Routes
app.use('/api', routes)

// Sentry error handler (must be before other error handlers)
app.use(Sentry.Handlers.errorHandler())

// Your error handler
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

**Update `server/src/middleware/errorHandler.ts`:**
```typescript
import { Sentry } from '../lib/sentry'

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error)

  // Report to Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
      tags: {
        path: req.path,
        method: req.method,
      },
      extra: {
        body: req.body,
        query: req.query,
      },
    })
  }

  // ... rest of error handling
}
```

### Frontend Setup

**Create `client/src/lib/sentry.ts`:**
```typescript
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/browser'

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.')
    return
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // Filter out errors in development
      if (import.meta.env.DEV) {
        console.error(hint.originalException || hint.syntheticException)
        return null
      }
      return event
    },
  })

  console.log('✅ Sentry error tracking initialized')
}

export { Sentry }
```

**Update `client/src/main.tsx`:**
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { initSentry, Sentry } from './lib/sentry'
import App from './App'

// Initialize Sentry
initSentry()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={<ErrorFallback />}
      showDialog
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
)

// Error Fallback Component
function ErrorFallback() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Oops! Something went wrong</h1>
      <p>We've been notified and are working on a fix.</p>
      <button onClick={() => window.location.reload()}>
        Reload Page
      </button>
    </div>
  )
}
```

**Create Error Boundary Component:**
```typescript
// client/src/components/ErrorBoundary/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react'
import { Sentry } from '../../lib/sentry'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)

    // Report to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div>
            <h1>Something went wrong</h1>
            <p>{this.state.error?.message}</p>
          </div>
        )
      )
    }

    return this.props.children
  }
}
```

### Environment Variables

**Update `.env.example`:**
```bash
# Sentry Error Tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

---

## 3. Request Logging with Correlation IDs

### Install Dependencies

```bash
cd server
npm install pino pino-http uuid @types/uuid
npm install -D pino-pretty
```

### Create Logger

**Create `server/src/lib/logger.ts`:**
```typescript
import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
})
```

### Create Request Logger Middleware

**Create `server/src/middleware/requestLogger.ts`:**
```typescript
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import pinoHttp from 'pino-http'
import { logger } from '../lib/logger'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id: string
      startTime: number
    }
  }
}

/**
 * Request ID middleware
 * Adds a unique ID to each request for tracing
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Use existing request ID from header or generate new one
  req.id = (req.headers['x-request-id'] as string) || uuidv4()
  req.startTime = Date.now()

  // Add to response headers
  res.setHeader('X-Request-Id', req.id)

  next()
}

/**
 * HTTP request logger using Pino
 */
export const requestLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error'
    if (res.statusCode >= 400) return 'warn'
    if (res.statusCode >= 300) return 'silent'
    return 'info'
  },
  customSuccessMessage: (req, res) => {
    const duration = Date.now() - (req as any).startTime
    return `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`
  },
  customErrorMessage: (req, res, err) => {
    const duration = Date.now() - (req as any).startTime
    return `${req.method} ${req.url} ${res.statusCode} - ${duration}ms - ${err.message}`
  },
  customProps: (req, res) => ({
    requestId: (req as any).id,
    userId: (req as any).user?.id,
    userAgent: req.headers['user-agent'],
    duration: Date.now() - (req as any).startTime,
  }),
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration',
  },
})

/**
 * Log slow requests
 */
export function slowRequestLogger(threshold: number = 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()

    res.on('finish', () => {
      const duration = Date.now() - start

      if (duration > threshold) {
        logger.warn({
          requestId: req.id,
          method: req.method,
          url: req.url,
          duration,
          statusCode: res.statusCode,
        }, 'Slow request detected')
      }
    })

    next()
  }
}
```

### Update Error Handler

**Update `server/src/middleware/errorHandler.ts`:**
```typescript
import { logger } from '../lib/logger'

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error with context
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    requestId: req.id,
    userId: req.user?.id,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
  }, 'Request error')

  // ... rest of error handling

  const errorResponse = {
    success: false,
    error: {
      code: getErrorCode(error),
      message: error.message,
    },
    requestId: req.id, // Include in response
    timestamp: new Date().toISOString(),
    path: req.path,
  }

  res.status(statusCode).json(errorResponse)
}
```

### Apply Middleware

**Update `server/src/index.ts`:**
```typescript
import { requestIdMiddleware, requestLogger, slowRequestLogger } from './middleware/requestLogger'
import { logger } from './lib/logger'

const app = express()

// Apply request ID and logging middleware early
app.use(requestIdMiddleware)
app.use(requestLogger)
app.use(slowRequestLogger(1000)) // Log requests > 1s

// ... other middleware and routes

// Startup logging
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Server started')
})

// Process error handlers
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception')
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection')
  process.exit(1)
})
```

### Frontend Integration

**Update `client/src/services/api.ts`:**
```typescript
import { v4 as uuidv4 } from 'uuid'

class ApiClient {
  private client: AxiosInstance

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL })

    // Add request ID to all requests
    this.client.interceptors.request.use((config) => {
      config.headers['X-Request-Id'] = uuidv4()
      return config
    })

    // Log request ID from errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const requestId = error.response?.headers['x-request-id']
        const errorData = error.response?.data

        console.error('[API Error]', {
          requestId,
          status: error.response?.status,
          code: errorData?.error?.code,
          message: errorData?.error?.message,
        })

        // Show request ID to user for support
        if (error.response?.status >= 500) {
          console.error(
            `Error reference ID: ${requestId}. Please provide this ID when contacting support.`
          )
        }

        return Promise.reject(error)
      }
    )
  }
}
```

---

## 4. E2E Testing with Cypress

### Install Cypress

```bash
cd client
npm install --save-dev cypress @testing-library/cypress
```

### Initialize Cypress

```bash
npx cypress open
```

### Configure Cypress

**Create `client/cypress.config.ts`:**
```typescript
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: true,
})
```

### Setup Cypress Commands

**Create `client/cypress/support/commands.ts`:**
```typescript
import '@testing-library/cypress/add-commands'

// Custom command for login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.findByLabelText(/email/i).type(email)
  cy.findByLabelText(/password/i).type(password)
  cy.findByRole('button', { name: /log in/i }).click()
  cy.url().should('not.include', '/login')
})

// Custom command for API requests
Cypress.Commands.add('apiLogin', (email: string, password: string) => {
  cy.request('POST', 'http://localhost:5000/api/auth/login', {
    email,
    password,
  }).then((response) => {
    window.localStorage.setItem('token', response.body.data.token)
  })
})

// Type definitions
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      apiLogin(email: string, password: string): Chainable<void>
    }
  }
}
```

### Example E2E Tests

**Create `client/cypress/e2e/auth.cy.ts`:**
```typescript
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should register new user', () => {
    cy.findByRole('link', { name: /sign up/i }).click()

    cy.findByLabelText(/email/i).type('newuser@example.com')
    cy.findByLabelText(/password/i).type('SecurePass123!')
    cy.findByRole('button', { name: /sign up/i }).click()

    cy.url().should('include', '/dashboard')
    cy.findByText(/welcome/i).should('exist')
  })

  it('should login existing user', () => {
    cy.login('test@example.com', 'password123')
    cy.url().should('include', '/dashboard')
  })

  it('should show error for invalid credentials', () => {
    cy.visit('/login')
    cy.findByLabelText(/email/i).type('wrong@example.com')
    cy.findByLabelText(/password/i).type('wrongpass')
    cy.findByRole('button', { name: /log in/i }).click()

    cy.findByText(/invalid email or password/i).should('exist')
  })

  it('should logout user', () => {
    cy.login('test@example.com', 'password123')
    cy.findByRole('button', { name: /logout/i }).click()
    cy.url().should('include', '/login')
  })
})
```

**Create `client/cypress/e2e/project-management.cy.ts`:**
```typescript
describe('Project Management', () => {
  beforeEach(() => {
    cy.apiLogin('test@example.com', 'password123')
    cy.visit('/dashboard')
  })

  it('should create new project', () => {
    cy.findByRole('button', { name: /new project/i }).click()

    cy.findByLabelText(/project name/i).type('Test Project')
    cy.findByLabelText(/description/i).type('This is a test project')
    cy.findByLabelText(/start date/i).type('2024-01-01')
    cy.findByLabelText(/end date/i).type('2024-12-31')

    cy.findByRole('button', { name: /create/i }).click()

    cy.findByText('Test Project').should('exist')
  })

  it('should edit project', () => {
    // Create project first
    cy.findByRole('button', { name: /new project/i }).click()
    cy.findByLabelText(/project name/i).type('Edit Test')
    cy.findByRole('button', { name: /create/i }).click()

    // Edit project
    cy.findByText('Edit Test').click()
    cy.findByRole('button', { name: /edit/i }).click()
    cy.findByLabelText(/project name/i).clear().type('Edited Project')
    cy.findByRole('button', { name: /save/i }).click()

    cy.findByText('Edited Project').should('exist')
  })

  it('should delete project', () => {
    // Create project
    cy.findByRole('button', { name: /new project/i }).click()
    cy.findByLabelText(/project name/i).type('Delete Test')
    cy.findByRole('button', { name: /create/i }).click()

    // Delete project
    cy.findByText('Delete Test').click()
    cy.findByRole('button', { name: /delete/i }).click()
    cy.findByRole('button', { name: /confirm/i }).click()

    cy.findByText('Delete Test').should('not.exist')
  })
})
```

**Create `client/cypress/e2e/task-management.cy.ts`:**
```typescript
describe('Task Management', () => {
  beforeEach(() => {
    cy.apiLogin('test@example.com', 'password123')

    // Create project for testing
    cy.request('POST', 'http://localhost:5000/api/projects', {
      name: 'Task Test Project',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    }).then((response) => {
      cy.visit(`/projects/${response.body.data.project.id}`)
    })
  })

  it('should create task', () => {
    cy.findByRole('button', { name: /add task/i }).click()

    cy.findByLabelText(/task name/i).type('Test Task')
    cy.findByLabelText(/description/i).type('Task description')
    cy.findByLabelText(/start date/i).type('2024-02-01')
    cy.findByLabelText(/end date/i).type('2024-02-28')

    cy.findByRole('button', { name: /create/i }).click()

    cy.findByText('Test Task').should('exist')
  })

  it('should drag and drop task to reorder', () => {
    // Create multiple tasks
    const tasks = ['Task 1', 'Task 2', 'Task 3']
    tasks.forEach((name) => {
      cy.findByRole('button', { name: /add task/i }).click()
      cy.findByLabelText(/task name/i).type(name)
      cy.findByRole('button', { name: /create/i }).click()
    })

    // Drag Task 3 to first position
    cy.findByText('Task 3')
      .trigger('mousedown', { which: 1 })
      .trigger('mousemove', { clientY: 0 })
      .trigger('mouseup')

    // Verify order changed
    cy.get('[data-testid="task-item"]')
      .first()
      .should('contain', 'Task 3')
  })
})
```

### Add Cypress Scripts

**Update `client/package.json`:**
```json
{
  "scripts": {
    "cypress:open": "cypress open",
    "cypress:run": "cypress run",
    "cypress:ci": "start-server-and-test 'npm run dev' http://localhost:3000 'cypress run'",
    "test:e2e": "cypress run"
  }
}
```

---

## 5. Performance Monitoring

### Web Vitals

**Install:**
```bash
cd client
npm install web-vitals
```

**Create `client/src/lib/vitals.ts`:**
```typescript
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals'

function sendToAnalytics(metric: any) {
  // Send to analytics service (e.g., Google Analytics, Sentry)
  console.log(metric)

  // Example: Send to your backend
  if (import.meta.env.PROD) {
    fetch('/api/analytics/vitals', {
      method: 'POST',
      body: JSON.stringify(metric),
      headers: { 'Content-Type': 'application/json' },
    }).catch(console.error)
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics)
  onFID(sendToAnalytics)
  onFCP(sendToAnalytics)
  onLCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
}
```

**Update `client/src/main.tsx`:**
```typescript
import { reportWebVitals } from './lib/vitals'

// ... app setup

// Report web vitals
reportWebVitals()
```

### Database Query Monitoring

**Add to Prisma client:**
```typescript
// server/src/config/database.ts
import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger'

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
  ],
})

// Log slow queries
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    logger.warn({
      query: e.query,
      duration: e.duration,
      params: e.params,
    }, 'Slow query detected')
  }
})

// Log query errors
prisma.$on('error', (e) => {
  logger.error({
    target: e.target,
    message: e.message,
  }, 'Database error')
})

export default prisma
```

---

## Summary Checklist

### Accessibility Testing
- [ ] Install jest-axe and @axe-core/react
- [ ] Create accessibility test utilities
- [ ] Write accessibility tests for components
- [ ] Setup runtime monitoring in development
- [ ] Add to CI pipeline

### Error Tracking
- [ ] Install Sentry packages (frontend + backend)
- [ ] Configure Sentry initialization
- [ ] Add error boundaries
- [ ] Test error reporting
- [ ] Configure environment variables

### Request Logging
- [ ] Install pino and dependencies
- [ ] Create logger configuration
- [ ] Add request ID middleware
- [ ] Add HTTP request logging
- [ ] Update error handler
- [ ] Test log output

### E2E Testing
- [ ] Install Cypress
- [ ] Configure Cypress
- [ ] Create custom commands
- [ ] Write E2E tests for key flows
- [ ] Add to CI pipeline
- [ ] Setup test data fixtures

### Performance Monitoring
- [ ] Setup web vitals reporting
- [ ] Add database query monitoring
- [ ] Monitor slow requests
- [ ] Setup performance budget

---

**Estimated Effort:** 24-32 hours

**Priority:**
1. Request logging (foundational for debugging)
2. Error tracking (catch production issues)
3. E2E tests (ensure key flows work)
4. Accessibility testing (compliance + UX)
5. Performance monitoring (optimization)
