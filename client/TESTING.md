# Testing Documentation

Comprehensive testing guide for the Gantt Chart application.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [Testing Utilities](#testing-utilities)
- [Mocking](#mocking)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The testing suite uses:
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking
- **ts-jest**: TypeScript support for Jest
- **@testing-library/user-event**: User interaction simulation

### Test Coverage

Current test files:
- ✅ Utility function tests (ganttUtils, versionUtils)
- ✅ Component tests (GanttChart, TaskBar, ProjectList, VersionHistory)
- ✅ Integration tests (Full application)
- ✅ Context tests (VersionContext)

## Test Structure

```
client/
├── src/
│   ├── components/
│   │   ├── GanttChart/
│   │   │   ├── GanttChart.test.tsx
│   │   │   └── TaskBar.test.tsx
│   │   ├── ProjectManagement/
│   │   │   └── ProjectList.test.tsx
│   │   └── VersionHistory/
│   │       └── VersionHistory.test.tsx
│   ├── utils/
│   │   ├── ganttUtils.test.ts
│   │   └── versionUtils.test.ts
│   └── tests/
│       ├── setup.ts
│       ├── mocks/
│       │   ├── server.ts
│       │   ├── handlers.ts
│       │   └── mockData.ts
│       ├── utils/
│       │   └── testUtils.tsx
│       ├── integration/
│       │   └── FullApplication.test.tsx
│       └── __mocks__/
│           └── fileMock.js
├── jest.config.js
└── package.json
```

## Running Tests

### Install Dependencies

```bash
cd client
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

Automatically re-runs tests when files change. Great for development.

### Run Unit Tests Only

```bash
npm run test:unit
```

Runs only unit tests, excluding integration tests.

### Run Integration Tests Only

```bash
npm run test:integration
```

Runs only integration tests.

### Run Tests with Coverage

```bash
npm run test:coverage
```

Generates coverage report in:
- Terminal output
- `coverage/lcov-report/index.html` (HTML report)
- `coverage/lcov.info` (LCOV format)

### Run Tests in CI Mode

```bash
npm run test:ci
```

Optimized for continuous integration:
- Runs with coverage
- Uses limited workers
- No watch mode

### Debug Tests

```bash
npm run test:debug
```

Runs tests with Node debugger. Use Chrome DevTools:
1. Run the command
2. Open `chrome://inspect` in Chrome
3. Click "inspect" on the remote target

### Run Specific Test File

```bash
npm test -- GanttChart.test.tsx
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="should render"
```

### Run Tests for Changed Files Only

```bash
npm test -- --onlyChanged
```

## Test Coverage

### Coverage Thresholds

Configured in `jest.config.js`:

```javascript
coverageThresholds: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

### View Coverage Report

After running `npm run test:coverage`:

```bash
# Open HTML report (Windows)
start coverage/lcov-report/index.html

# Open HTML report (Mac/Linux)
open coverage/lcov-report/index.html
```

### Coverage by Category

Current coverage:

| Category | Files | Coverage |
|----------|-------|----------|
| Utils | ganttUtils.ts, versionUtils.ts | ~85% |
| Components | GanttChart, TaskBar, etc. | ~75% |
| Context | VersionContext.tsx | ~70% |
| Integration | Full application | ~80% |

## Writing Tests

### Basic Component Test

```typescript
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('should render without crashing', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle click', () => {
    const mockOnClick = jest.fn()
    render(<MyComponent onClick={mockOnClick} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })
})
```

### Component with Context

```typescript
import { renderWithVersionProvider } from '../../tests/utils/testUtils'
import { MyComponent } from './MyComponent'

describe('MyComponent with Context', () => {
  it('should access version context', async () => {
    renderWithVersionProvider(<MyComponent />)

    await waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument()
    })
  })
})
```

### Testing Async Operations

```typescript
it('should load data asynchronously', async () => {
  render(<MyComponent />)

  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  // Check data is displayed
  expect(screen.getByText('Data loaded')).toBeInTheDocument()
})
```

### Testing User Interactions

```typescript
import userEvent from '@testing-library/user-event'

it('should handle user input', async () => {
  render(<MyForm />)

  const input = screen.getByPlaceholderText('Enter name')
  await userEvent.type(input, 'John Doe')

  expect(input).toHaveValue('John Doe')
})

it('should handle keyboard shortcuts', async () => {
  render(<MyComponent />)

  await userEvent.keyboard('{Enter}')

  expect(mockOnSubmit).toHaveBeenCalled()
})
```

### Testing Drag and Drop

```typescript
import { simulateDrag } from '../../tests/utils/testUtils'

it('should handle drag', () => {
  const { container } = render(<TaskBar task={mockTask} />)

  const element = container.firstChild as HTMLElement
  simulateDrag(element, 100, 200)

  expect(mockOnTaskUpdate).toHaveBeenCalled()
})
```

### Utility Function Tests

```typescript
describe('myUtilFunction', () => {
  it('should return correct value', () => {
    const result = myUtilFunction(input)
    expect(result).toBe(expectedOutput)
  })

  it('should handle edge cases', () => {
    expect(myUtilFunction(null)).toBe(null)
    expect(myUtilFunction(undefined)).toBe(undefined)
  })

  it('should throw error for invalid input', () => {
    expect(() => myUtilFunction(invalidInput)).toThrow()
  })
})
```

## Testing Utilities

### Custom Render Functions

Located in `src/tests/utils/testUtils.tsx`:

#### renderWithVersionProvider

Renders component with VersionContext provider:

```typescript
import { renderWithVersionProvider } from '../../tests/utils/testUtils'

const { getByText } = renderWithVersionProvider(<MyComponent />)
```

#### simulateDrag

Simulates drag and drop operation:

```typescript
import { simulateDrag } from '../../tests/utils/testUtils'

simulateDrag(element, startX, endX)
```

#### createMouseEvent

Creates mouse events for testing:

```typescript
import { createMouseEvent } from '../../tests/utils/testUtils'

const event = createMouseEvent('mousedown', { clientX: 100 })
element.dispatchEvent(event)
```

### Assertion Helpers

#### expectToHaveClass

```typescript
expectToHaveClass(element, 'active')
```

#### expectNotToHaveClass

```typescript
expectNotToHaveClass(element, 'disabled')
```

## Mocking

### Mock Data

Pre-defined mock data in `src/tests/mocks/mockData.ts`:

```typescript
import { mockProjects, mockTasks, mockVersions } from '../../tests/mocks/mockData'

// Use in tests
const project = mockProjects[0]
```

### Helper Functions

```typescript
import { createMockTask, createMockVersion } from '../../tests/mocks/mockData'

// Create custom mock task
const task = createMockTask({
  name: 'Custom Task',
  startDate: new Date('2024-01-01'),
})

// Create custom mock version
const version = createMockVersion({
  versionNumber: 5,
  isAutomatic: true,
})
```

### API Mocking with MSW

Handlers defined in `src/tests/mocks/handlers.ts`:

```typescript
import { server } from './mocks/server'
import { http, HttpResponse } from 'msw'

// Override handler for specific test
test('should handle error', async () => {
  server.use(
    http.get('/api/projects', () => {
      return new HttpResponse(null, { status: 500 })
    })
  )

  // Test error handling
})
```

### Mock Functions

```typescript
// Mock function
const mockFn = jest.fn()

// With return value
const mockFn = jest.fn(() => 'return value')

// With implementation
const mockFn = jest.fn((arg) => arg * 2)

// Check calls
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith(expectedArg)
expect(mockFn).toHaveBeenCalledTimes(3)

// Get call arguments
const firstCall = mockFn.mock.calls[0]
const firstArg = mockFn.mock.calls[0][0]
```

### Mock Modules

```typescript
// Mock entire module
jest.mock('./myModule', () => ({
  myFunction: jest.fn(),
}))

// Mock with factory
jest.mock('./myModule', () => ({
  default: jest.fn(() => 'mocked value'),
}))

// Partial mock
jest.mock('./myModule', () => ({
  ...jest.requireActual('./myModule'),
  specificFunction: jest.fn(),
}))
```

### Mock Browser APIs

Already set up in `src/tests/setup.ts`:

- `window.matchMedia`
- `IntersectionObserver`
- `ResizeObserver`
- `localStorage`

Custom mocks:

```typescript
// Mock window.confirm
global.confirm = jest.fn(() => true)

// Mock window.prompt
global.prompt = jest.fn(() => 'user input')

// Mock window.alert
global.alert = jest.fn()

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'mocked' }),
  })
)
```

## Best Practices

### 1. Test Organization

```typescript
describe('ComponentName', () => {
  // Group related tests
  describe('Rendering', () => {
    it('should render without crashing', () => {})
    it('should render with props', () => {})
  })

  describe('Interactions', () => {
    it('should handle click', () => {})
    it('should handle keyboard input', () => {})
  })

  describe('Edge Cases', () => {
    it('should handle empty data', () => {})
    it('should handle errors', () => {})
  })
})
```

### 2. Test Naming

Good test names:
- ✅ `should render task bar with correct color`
- ✅ `should call onTaskUpdate when task is dragged`
- ✅ `should display error message when API fails`

Bad test names:
- ❌ `test1`
- ❌ `works correctly`
- ❌ `renders`

### 3. Arrange-Act-Assert Pattern

```typescript
it('should update task name', () => {
  // Arrange
  const mockTask = createMockTask()
  const mockOnUpdate = jest.fn()

  // Act
  render(<TaskBar task={mockTask} onUpdate={mockOnUpdate} />)
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: 'New Name' } })

  // Assert
  expect(mockOnUpdate).toHaveBeenCalledWith('New Name')
})
```

### 4. Avoid Testing Implementation Details

Bad (testing implementation):
```typescript
// Don't test internal state or class names
expect(component.state.isOpen).toBe(true)
expect(element).toHaveClass('menu-open')
```

Good (testing behavior):
```typescript
// Test user-visible behavior
expect(screen.getByText('Menu Item')).toBeVisible()
```

### 5. Clean Up After Tests

```typescript
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks()
})

afterEach(() => {
  // Clean up DOM
  cleanup()
})
```

### 6. Use Semantic Queries

Prefer (in order):
1. `getByRole`: `getByRole('button', { name: 'Submit' })`
2. `getByLabelText`: `getByLabelText('Email')`
3. `getByPlaceholderText`: `getByPlaceholderText('Enter email')`
4. `getByText`: `getByText('Welcome')`
5. `getByTestId`: `getByTestId('submit-button')` (last resort)

### 7. Test Accessibility

```typescript
it('should be accessible', () => {
  const { container } = render(<MyComponent />)

  // Check for proper labels
  expect(screen.getByLabelText('Task name')).toBeInTheDocument()

  // Check for ARIA attributes
  expect(screen.getByRole('button')).toHaveAttribute('aria-label')
})
```

### 8. Async Testing

Always use `waitFor` for async operations:

```typescript
// Good
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})

// Bad
setTimeout(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
}, 1000)
```

## Troubleshooting

### Common Issues

#### "Cannot find module" errors

Solution:
```bash
npm install
```

#### "ReferenceError: document is not defined"

Check `testEnvironment` in `jest.config.js`:
```javascript
testEnvironment: 'jsdom'
```

#### Tests timing out

Increase timeout:
```typescript
it('slow test', async () => {
  // Test code
}, 10000) // 10 second timeout
```

#### Mock not working

Ensure mock is hoisted:
```typescript
jest.mock('./module')  // Must be at top level
```

#### "act() warning"

Wrap state updates in `act()`:
```typescript
import { act } from '@testing-library/react'

await act(async () => {
  fireEvent.click(button)
})
```

#### MSW handlers not matching

Check handler order in `handlers.ts`. More specific handlers should come first.

### Debug Tips

1. **Use `screen.debug()`**:
   ```typescript
   screen.debug() // Prints entire DOM
   screen.debug(element) // Prints specific element
   ```

2. **Use `screen.logTestingPlaygroundURL()`**:
   ```typescript
   screen.logTestingPlaygroundURL()
   // Opens testing playground in browser
   ```

3. **Pause execution**:
   ```typescript
   import { pause } from '@testing-library/react'

   await pause() // Pauses test
   ```

4. **View queries**:
   ```typescript
   const { debug, container } = render(<MyComponent />)
   console.log(container.innerHTML)
   ```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install
        working-directory: ./client

      - name: Run tests
        run: npm run test:ci
        working-directory: ./client

      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          files: ./client/coverage/lcov.info
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain coverage above 70%
4. Update this documentation if needed

---

**Last Updated**: 2024-01-15
**Test Framework Version**: Jest 29.7.0
**Coverage**: ~75% overall
