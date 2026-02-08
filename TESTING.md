# Testing Guide

This document provides comprehensive information about testing in the Gantt Chart application.

## Table of Contents

- [Overview](#overview)
- [Frontend Testing](#frontend-testing)
- [Backend Testing](#backend-testing)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)

## Overview

The project uses **Jest** as the primary testing framework for both frontend and backend:

- **Frontend**: Jest with React Testing Library and jsdom
- **Backend**: Jest with Supertest for API testing
- **Coverage Target**: 70% for all metrics (branches, functions, lines, statements)

## Frontend Testing

### Test Structure

```
client/
├── src/
│   ├── components/
│   │   ├── Loading/
│   │   │   ├── LoadingStates.tsx
│   │   │   └── LoadingStates.test.tsx
│   │   └── EmptyStates/
│   │       ├── EmptyStates.tsx
│   │       └── EmptyStates.test.tsx
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useKeyboardShortcuts.test.ts
│   │   ├── useAccessibility.ts
│   │   ├── useAccessibility.test.ts
│   │   ├── useResponsive.ts
│   │   └── useResponsive.test.ts
│   ├── setupTests.ts           # Jest setup file
│   ├── test-utils.tsx          # Custom test utilities
│   └── __mocks__/
│       └── fileMock.js         # Mock for static assets
├── jest.config.cjs             # Jest configuration
└── package.json
```

### Test Utilities

The `test-utils.tsx` file provides helpful utilities:

```typescript
import { render, screen } from './test-utils'

// Custom render with all providers
render(<MyComponent />)

// Mock data factories
const project = createMockProject({ name: 'Test Project' })
const task = createMockTask({ status: 'completed' })
const user = createMockUser({ email: 'test@example.com' })
const version = createMockVersion({ name: 'v1.0.0' })

// Event helpers
const keyEvent = createKeyboardEvent('s', { meta: true })
const touchEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }])

// Query client helpers
const queryClient = createTestQueryClient()
```

### Running Frontend Tests

```bash
cd client

# Run all tests
npm test

# Watch mode (re-runs tests on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in CI mode
npm run test:ci

# Debug tests with Node inspector
npm run test:debug
```

### Test Examples

#### Component Testing

```typescript
import { render, screen } from '../test-utils'
import { Spinner } from './LoadingStates'

describe('Spinner', () => {
  it('should render with default props', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading')
  })

  it('should render with custom size', () => {
    render(<Spinner size="lg" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('w-8', 'h-8')
  })
})
```

#### Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  it('should trigger shortcut on correct key combination', () => {
    const handler = jest.fn()

    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{
          key: 's',
          modifiers: ['meta'],
          handler,
          description: 'Save',
        }],
      })
    )

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(event)
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
```

## Backend Testing

### Test Structure

```
server/
├── __tests__/
│   ├── setup.ts                # Test setup file
│   ├── unit/
│   │   ├── controllers/
│   │   │   └── task.test.ts
│   │   ├── middleware/
│   │   │   ├── errorHandler.test.ts
│   │   │   └── validation.test.ts
│   │   └── utils/
│   │       ├── jwt.test.ts
│   │       └── password.test.ts
│   └── integration/
│       ├── auth.test.ts
│       └── task.test.ts
├── jest.config.js
└── package.json
```

### Running Backend Tests

```bash
cd server

# Run all tests
npm test

# Watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Test Examples

#### Unit Test (Controller)

```typescript
import { TaskController } from '../../src/controllers/TaskController'
import { mockRequest, mockResponse } from '../helpers'

describe('TaskController', () => {
  describe('createTask', () => {
    it('should create a new task', async () => {
      const req = mockRequest({
        body: {
          name: 'New Task',
          startDate: '2024-01-01',
          endDate: '2024-01-05',
          projectId: 'project-1',
        },
        user: { id: 'user-1' },
      })
      const res = mockResponse()

      await TaskController.createTask(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Task',
        })
      )
    })
  })
})
```

#### Integration Test (API)

```typescript
import request from 'supertest'
import { app } from '../../src/app'
import { prisma } from '../../src/lib/prisma'

describe('POST /api/tasks', () => {
  let authToken: string

  beforeAll(async () => {
    // Setup test user and get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' })

    authToken = response.body.token
  })

  afterAll(async () => {
    // Cleanup
    await prisma.task.deleteMany()
    await prisma.user.deleteMany()
  })

  it('should create a new task', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Task',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        projectId: 'project-1',
      })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('id')
    expect(response.body.name).toBe('Test Task')
  })

  it('should return 401 without authentication', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        name: 'Test Task',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        projectId: 'project-1',
      })

    expect(response.status).toBe(401)
  })
})
```

## Running Tests

### Run All Tests (Frontend + Backend)

From the project root:

```bash
# Install dependencies for both
npm install

# Run frontend tests
cd client && npm test

# Run backend tests
cd ../server && npm test

# Generate coverage for both
cd client && npm run test:coverage
cd ../server && npm run test:coverage
```

### Watch Mode for Development

```bash
# Frontend watch mode
cd client && npm run test:watch

# Backend watch mode
cd server && npm run test:watch
```

### Quick Test Commands

```bash
# Test specific file
npm test -- LoadingStates.test.tsx

# Test with pattern
npm test -- --testPathPattern=hooks

# Update snapshots
npm test -- -u

# Run tests with specific timeout
npm test -- --testTimeout=10000
```

## Writing Tests

### Best Practices

1. **Follow AAA Pattern**: Arrange, Act, Assert

```typescript
it('should update task status', async () => {
  // Arrange
  const task = createMockTask({ status: 'pending' })

  // Act
  const result = await updateTaskStatus(task.id, 'completed')

  // Assert
  expect(result.status).toBe('completed')
})
```

2. **Use Descriptive Test Names**

```typescript
// Good
it('should display error message when save fails')
it('should disable submit button while form is invalid')

// Bad
it('should work')
it('test form')
```

3. **Test User Behavior, Not Implementation**

```typescript
// Good - tests what the user sees
expect(screen.getByText('Loading...')).toBeInTheDocument()

// Bad - tests implementation details
expect(component.state.isLoading).toBe(true)
```

4. **Mock External Dependencies**

```typescript
// Mock API calls
jest.mock('../api/tasks', () => ({
  getTasks: jest.fn().mockResolvedValue([]),
  createTask: jest.fn(),
}))
```

5. **Clean Up After Tests**

```typescript
afterEach(() => {
  jest.clearAllMocks()
  cleanup()
})

afterAll(async () => {
  await prisma.$disconnect()
})
```

### Accessibility Testing

Always include accessibility checks:

```typescript
it('should be accessible', () => {
  render(<Button>Click me</Button>)

  const button = screen.getByRole('button', { name: 'Click me' })
  expect(button).toHaveAccessibleName('Click me')
  expect(button).toBeInTheDocument()
})
```

### Testing Keyboard Shortcuts

```typescript
it('should trigger save on Cmd+S', () => {
  const onSave = jest.fn()
  render(<Editor onSave={onSave} />)

  fireEvent.keyDown(document, {
    key: 's',
    metaKey: true,
  })

  expect(onSave).toHaveBeenCalled()
})
```

### Testing Responsive Behavior

```typescript
it('should show mobile layout on small screens', () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  })

  render(<ResponsiveComponent />)

  expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
})
```

## Test Coverage

### Viewing Coverage Reports

After running `npm run test:coverage`:

1. **Terminal Output**: See summary in the terminal
2. **HTML Report**: Open `coverage/lcov-report/index.html` in a browser
3. **LCOV File**: `coverage/lcov.info` for CI tools

### Coverage Thresholds

Both frontend and backend require **70% coverage** for:
- **Branches**: Conditional logic paths
- **Functions**: All functions defined
- **Lines**: Executable lines of code
- **Statements**: All statements

### Excluding Files from Coverage

Files excluded from coverage:
- `*.test.ts(x)` - Test files
- `*.d.ts` - Type declarations
- `*.stories.tsx` - Storybook stories
- `index.tsx` - Entry points
- `setupTests.ts` - Test setup

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

See `.github/workflows/ci-cd.yml` for the full pipeline.

### Local CI Simulation

Run tests like CI does:

```bash
# Frontend
cd client && npm run test:ci

# Backend
cd server && npm run test:coverage
```

### Pre-commit Hooks

Consider adding pre-commit hooks to run tests:

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test",
      "pre-push": "npm run test:coverage"
    }
  }
}
```

## Troubleshooting

### Common Issues

**Tests timing out:**
```bash
# Increase timeout
npm test -- --testTimeout=10000
```

**Memory issues with large test suites:**
```bash
# Run tests sequentially
npm test -- --runInBand

# Limit workers
npm test -- --maxWorkers=2
```

**Module import errors:**
```javascript
// Update moduleNameMapper in jest.config
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

**Async test not completing:**
```typescript
// Use async/await
it('should fetch data', async () => {
  const data = await fetchData()
  expect(data).toBeDefined()
})

// Or return promise
it('should fetch data', () => {
  return fetchData().then(data => {
    expect(data).toBeDefined()
  })
})
```

### Debug Mode

Run tests with debugging:

```bash
# Frontend
npm run test:debug

# Then open chrome://inspect in Chrome and click "inspect"
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Accessibility](https://www.w3.org/WAI/test-evaluate/)

## Contributing

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure all tests pass: `npm test`
3. Check coverage: `npm run test:coverage`
4. Maintain or improve coverage thresholds
5. Follow existing test patterns and conventions
