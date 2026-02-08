# Testing Guide

## Overview

This project uses **Jest** as the testing framework with **Supertest** for API integration testing. The test suite includes both unit tests and integration tests with comprehensive coverage.

## Test Structure

```
server/
├── __tests__/
│   ├── setup.ts                    # Global test setup
│   ├── helpers/
│   │   ├── testDb.ts              # Database test utilities
│   │   ├── testHelpers.ts         # Mock request/response helpers
│   │   └── mockData.ts            # Mock data generators
│   ├── fixtures/
│   │   ├── users.ts               # User test fixtures
│   │   └── projects.ts            # Project test fixtures
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── jwt.test.ts        # JWT utility tests
│   │   │   └── password.test.ts   # Password utility tests
│   │   └── middleware/
│   │       ├── errorHandler.test.ts
│   │       └── validation.test.ts
│   └── integration/
│       └── auth.test.ts           # Auth endpoint tests
├── jest.config.js                 # Jest configuration
└── .env.test                      # Test environment variables
```

---

## Quick Start

### 1. Set Up Test Database

Create a separate test database:

```bash
createdb gantt_chart_test
```

Or using psql:
```sql
CREATE DATABASE gantt_chart_test;
```

### 2. Configure Test Environment

Create `server/.env.test`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/gantt_chart_test"
JWT_SECRET=test-secret-key-for-testing-only
JWT_EXPIRES_IN=1d
NODE_ENV=test
PORT=5001
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Migrations on Test Database

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/gantt_chart_test" npx prisma migrate deploy
```

### 5. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

---

## Test Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm test` | Run all tests | Runs the complete test suite |
| `npm run test:watch` | Watch mode | Runs tests on file changes |
| `npm run test:coverage` | Coverage report | Generates coverage reports |
| `npm run test:unit` | Unit tests only | Runs tests matching `unit` |
| `npm run test:integration` | Integration tests | Runs tests matching `integration` |

---

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions or modules in isolation.

**Example: Testing a utility function**

```typescript
import { describe, it, expect } from '@jest/globals'
import { hashPassword, comparePassword } from '../../../src/utils/password.js'

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
    })
  })

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)

      const isMatch = await comparePassword(password, hash)
      expect(isMatch).toBe(true)
    })
  })
})
```

### Integration Tests

Integration tests test complete request/response cycles with database interactions.

**Example: Testing an API endpoint**

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import app from '../../../src/index.js'

const prisma = new PrismaClient()

describe('Auth API', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.user.deleteMany({})
    await prisma.$disconnect()
  })

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPass123',
      })
      .expect(201)

    expect(response.body).toMatchObject({
      success: true,
      data: {
        user: {
          email: 'test@example.com',
        },
      },
    })
  })
})
```

### Using Test Helpers

**Mock Request/Response:**

```typescript
import { mockRequest, mockResponse, mockNext } from '../helpers/testHelpers.js'

it('should call next on success', () => {
  const req = mockRequest({ body: { test: 'data' } })
  const res = mockResponse()
  const next = mockNext()

  myMiddleware(req, res, next)

  expect(next).toHaveBeenCalled()
})
```

**Mock Data:**

```typescript
import { mockUser, generateMockProject } from '../helpers/mockData.js'

it('should use mock data', () => {
  const project = generateMockProject({
    name: 'Custom Project',
    ownerId: mockUser.id,
  })

  expect(project.name).toBe('Custom Project')
})
```

**Test Fixtures:**

```typescript
import { createTestUser, createTestProject } from '../fixtures/users.js'

it('should create test data', async () => {
  const user = await createTestUser(prisma)
  const project = await createTestProject(prisma, user.id)

  expect(project.ownerId).toBe(user.id)
})
```

---

## Test Coverage

### Coverage Thresholds

The project maintains minimum coverage thresholds:

- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

### Viewing Coverage Reports

After running `npm run test:coverage`, open:

```
server/coverage/lcov-report/index.html
```

### Coverage Reports

- **HTML:** `coverage/lcov-report/index.html`
- **LCOV:** `coverage/lcov.info`
- **JSON:** `coverage/coverage-final.json`
- **Text:** Displayed in terminal

---

## Best Practices

### 1. Test Naming

Use descriptive test names:

```typescript
// ❌ Bad
it('works', () => { ... })

// ✅ Good
it('should return 401 for invalid credentials', () => { ... })
```

### 2. Test Organization

Group related tests with `describe` blocks:

```typescript
describe('Authentication', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', () => { ... })
    it('should reject invalid credentials', () => { ... })
  })
})
```

### 3. Setup and Teardown

Use lifecycle hooks for test setup:

```typescript
describe('User Tests', () => {
  let user: any

  beforeEach(async () => {
    user = await createTestUser(prisma)
  })

  afterEach(async () => {
    await prisma.user.deleteMany({})
  })

  it('should use the created user', () => {
    expect(user.email).toBeDefined()
  })
})
```

### 4. Async Tests

Always handle async operations properly:

```typescript
// ✅ Using async/await
it('should create user', async () => {
  const user = await createUser()
  expect(user).toBeDefined()
})

// ✅ Using done callback
it('should call callback', (done) => {
  someAsyncFunction(() => {
    expect(true).toBe(true)
    done()
  })
})
```

### 5. Assertions

Make specific, meaningful assertions:

```typescript
// ❌ Too vague
expect(response.body).toBeDefined()

// ✅ Specific
expect(response.body).toMatchObject({
  success: true,
  data: { user: { email: 'test@example.com' } },
})
```

### 6. Test Independence

Each test should be independent:

```typescript
// ❌ Tests depend on execution order
it('should create user', () => { ... })
it('should find the user created in previous test', () => { ... })

// ✅ Tests are independent
it('should create user', async () => {
  const user = await createUser()
  expect(user).toBeDefined()
})

it('should find existing user', async () => {
  const user = await createUser()
  const found = await findUser(user.id)
  expect(found).toBeDefined()
})
```

---

## Debugging Tests

### Run Single Test File

```bash
npm test -- auth.test.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="should register"
```

### Debug in VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Debug",
      "program": "${workspaceFolder}/server/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Verbose Output

```bash
npm test -- --verbose
```

---

## Common Issues

### 1. Database Connection Errors

**Problem:** Tests fail with "Can't reach database"

**Solution:**
- Ensure PostgreSQL is running
- Check `.env.test` DATABASE_URL
- Verify test database exists

### 2. Port Already in Use

**Problem:** Tests fail with "Port 5001 in use"

**Solution:**
- Change PORT in `.env.test`
- Kill process using the port: `lsof -ti:5001 | xargs kill`

### 3. Tests Hanging

**Problem:** Tests don't complete

**Solution:**
- Check for missing `await` on async operations
- Ensure database connections are closed in `afterAll`
- Use `forceExit: true` in jest.config.js

### 4. Flaky Tests

**Problem:** Tests pass/fail inconsistently

**Solution:**
- Add proper cleanup in `afterEach`
- Don't rely on execution order
- Increase timeout for slow tests

---

## Continuous Integration

### GitHub Actions Example

`.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run tests
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## What's Tested

### ✅ Unit Tests

- **JWT Utilities** (token generation, verification, extraction)
- **Password Utilities** (hashing, comparison, validation)
- **Error Handler** (error classes, middleware)
- **Validation Middleware** (error formatting)

### ✅ Integration Tests

- **User Registration** (valid/invalid data, duplicates)
- **User Login** (valid/invalid credentials)
- **Get Current User** (authenticated/unauthenticated)
- **Token Verification** (valid/invalid tokens)
- **Rate Limiting** (request throttling)

### 🔄 Future Tests

- Project CRUD operations
- Task CRUD operations
- Share link creation/validation
- Project version management
- Authorization checks

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Test Coverage Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Summary

- ✅ Jest configured with TypeScript support
- ✅ Unit tests for utilities and middleware
- ✅ Integration tests for auth endpoints
- ✅ Test helpers and fixtures
- ✅ Coverage reporting (70% threshold)
- ✅ Separate test database
- ✅ CI/CD ready

Run `npm test` to execute the full test suite!
