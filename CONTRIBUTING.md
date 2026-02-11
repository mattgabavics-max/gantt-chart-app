# Contributing to Gantt Chart Application

Thank you for your interest in contributing to the Gantt Chart Application! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Documentation](#documentation)
9. [Issue Guidelines](#issue-guidelines)
10. [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and considerate of others.

### Expected Behavior

- **Be respectful**: Treat all community members with respect
- **Be constructive**: Provide helpful feedback
- **Be collaborative**: Work together towards common goals
- **Be inclusive**: Welcome newcomers and diverse perspectives

### Unacceptable Behavior

- Harassment or discrimination of any kind
- Trolling, insulting comments, or personal attacks
- Public or private harassment
- Publishing others' private information
- Other unethical or unprofessional conduct

### Reporting

Report unacceptable behavior to: conduct@your-domain.com

---

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ installed
- **PostgreSQL** 14+ installed
- **Git** installed
- **Code editor** (VS Code recommended)
- Basic knowledge of:
  - TypeScript
  - React
  - Express.js
  - PostgreSQL

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/gantt-chart-app.git
   cd gantt-chart-app
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/gantt-chart-app.git
   ```

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### Setup Environment

1. **Copy environment files**:
   ```bash
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   ```

2. **Configure environment variables**:
   - Update database connection string
   - Set JWT secret
   - Configure other settings

3. **Setup database**:
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma db seed
   ```

### Run Development Server

```bash
# From project root
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Verify Setup

1. Open http://localhost:3000
2. Register a new account
3. Create a test project
4. Add a test task
5. Everything should work!

---

## Development Workflow

### Branch Strategy

We use Git Flow:

```
main (production)
  └─ develop (latest development)
      ├─ feature/feature-name
      ├─ bugfix/bug-description
      ├─ hotfix/critical-fix
      └─ chore/maintenance-task
```

### Creating a Feature Branch

```bash
# Update develop branch
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add my feature"

# Push to your fork
git push origin feature/my-feature
```

### Branch Naming Conventions

- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Urgent production fixes
- `chore/task-description` - Maintenance, refactoring
- `docs/documentation-update` - Documentation changes

### Keeping Your Branch Updated

```bash
# Fetch upstream changes
git fetch upstream

# Rebase your branch
git rebase upstream/develop

# If conflicts, resolve them, then:
git rebase --continue

# Force push (if already pushed)
git push --force-with-lease origin feature/my-feature
```

---

## Coding Standards

### TypeScript

**Use Explicit Types**:
```typescript
// Good
function calculateDuration(startDate: Date, endDate: Date): number {
  return endDate.getTime() - startDate.getTime();
}

// Avoid
function calculateDuration(startDate, endDate) {
  return endDate.getTime() - startDate.getTime();
}
```

**Use Interfaces**:
```typescript
// Good
interface Task {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

// Avoid using 'any'
const task: any = { /* ... */ };
```

**Use Enums for Constants**:
```typescript
enum TimeScale {
  Day = 'day',
  Week = 'week',
  Month = 'month'
}
```

### React Components

**Functional Components with TypeScript**:
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  disabled = false,
  variant = 'primary'
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
};
```

**Use React Hooks Properly**:
```typescript
// Dependencies array matters!
useEffect(() => {
  fetchData();
}, [fetchData]); // Include all dependencies

// Cleanup functions
useEffect(() => {
  const timer = setTimeout(() => {
    // Do something
  }, 1000);

  return () => clearTimeout(timer); // Cleanup
}, []);
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `task-bar.tsx`, `use-auto-save.ts` |
| Components | PascalCase | `TaskBar`, `ProjectList` |
| Functions | camelCase | `calculateDuration`, `handleClick` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_TASKS` |
| Interfaces | PascalCase | `Task`, `ProjectProps` |
| Types | PascalCase | `TimeScale`, `TaskStatus` |

### File Structure

**Component Organization**:
```
ComponentName/
├── ComponentName.tsx        # Component implementation
├── ComponentName.test.tsx   # Unit tests
├── ComponentName.types.ts   # TypeScript types
├── hooks/                   # Component-specific hooks
│   └── useComponentHook.ts
└── utils/                   # Component-specific utilities
    └── helpers.ts
```

**Import Order**:
```typescript
// 1. External dependencies
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// 2. Internal dependencies
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

// 3. Types
import type { Task, Project } from '@/types';

// 4. Styles
import './ComponentName.css';
```

### Code Comments

**JSDoc for Functions**:
```typescript
/**
 * Calculate the duration between two dates in milliseconds
 *
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Duration in milliseconds
 * @throws {Error} If endDate is before startDate
 *
 * @example
 * ```typescript
 * const duration = calculateDuration(
 *   new Date('2026-01-01'),
 *   new Date('2026-01-31')
 * );
 * console.log(duration); // 2592000000
 * ```
 */
function calculateDuration(startDate: Date, endDate: Date): number {
  if (endDate < startDate) {
    throw new Error('End date must be after start date');
  }
  return endDate.getTime() - startDate.getTime();
}
```

**Inline Comments**:
```typescript
// Good: Explain why, not what
// Using setTimeout to debounce the save operation
// This prevents excessive API calls during rapid edits
const debouncedSave = debounce(save, 5000);

// Bad: Redundant
// Set x to 5
const x = 5;
```

### Error Handling

**Always Handle Errors**:
```typescript
// Good
async function fetchProjects() {
  try {
    const response = await api.getProjects();
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Handle unauthorized
      logout();
    } else {
      // Handle other errors
      console.error('Failed to fetch projects:', error);
      throw error;
    }
  }
}

// Avoid swallowing errors
async function fetchProjects() {
  try {
    const response = await api.getProjects();
    return response.data;
  } catch (error) {
    // Don't do this!
  }
}
```

---

## Testing Guidelines

### Test Coverage

**Minimum Requirements**:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Unit Testing

**Component Tests**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={jest.fn()} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button label="Click me" onClick={onClick} />);

    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button label="Click me" onClick={jest.fn()} disabled />);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

**Hook Tests**:
```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('increments counter', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### Integration Testing

**API Tests**:
```typescript
import request from 'supertest';
import app from '../app';

describe('POST /api/projects', () => {
  it('creates a project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Project',
        isPublic: false
      });

    expect(response.status).toBe(201);
    expect(response.body.data.project.name).toBe('Test Project');
  });
});
```

### E2E Testing

**Cypress Tests**:
```typescript
describe('Project Management', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'Password123!');
    cy.visit('/projects');
  });

  it('creates, edits, and deletes a project', () => {
    // Create
    cy.get('[data-testid="create-project"]').click();
    cy.get('[data-testid="project-name"]').type('New Project');
    cy.get('[data-testid="submit"]').click();

    // Verify
    cy.contains('New Project').should('be.visible');

    // Edit
    cy.contains('New Project').click();
    cy.get('[data-testid="edit"]').click();
    cy.get('[data-testid="project-name"]').clear().type('Updated Project');
    cy.get('[data-testid="save"]').click();

    // Verify
    cy.contains('Updated Project').should('be.visible');

    // Delete
    cy.contains('Updated Project').click();
    cy.get('[data-testid="delete"]').click();
    cy.get('[data-testid="confirm"]').click();

    // Verify
    cy.contains('Updated Project').should('not.exist');
  });
});
```

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Specific test file
npm test -- TaskBar.test.tsx
```

---

## Commit Guidelines

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, missing semicolons)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Revert a previous commit

### Scope

Optional, indicates which part of the codebase:
- `gantt`: Gantt chart component
- `auth`: Authentication
- `api`: Backend API
- `ui`: User interface
- `db`: Database

### Examples

**Good Commit Messages**:
```
feat(gantt): add color picker for tasks

Added a color picker component to the task creation form.
Users can now choose from 8 preset colors or use a custom color.

Closes #123

---

fix(auth): prevent token expiration race condition

Fixed issue where users were logged out during active sessions
due to token refresh race condition.

Fixes #456

---

docs: update API documentation for share links

Added examples and improved descriptions for all share link
endpoints in the API reference.
```

**Bad Commit Messages**:
```
update stuff
fixed bug
changes
WIP
asdf
```

### Commit Best Practices

**Make Atomic Commits**:
- One logical change per commit
- Don't mix refactoring with feature changes
- Easy to review and revert if needed

**Write Descriptive Messages**:
- Subject line: Max 70 characters
- Body: Explain what and why, not how
- Reference related issues

**Commit Often**:
- Small, incremental commits
- Easier to track changes
- Easier to identify bugs

---

## Pull Request Process

### Before Creating a PR

**Checklist**:
- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No linter errors
- [ ] Commits follow commit guidelines
- [ ] Branch is up to date with develop

```bash
# Run checks
npm run lint
npm test
npm run test:e2e
npm run build
```

### Creating a Pull Request

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/my-feature
   ```

2. **Open a Pull Request** on GitHub:
   - Base: `develop`
   - Compare: `feature/my-feature`

3. **Fill out the PR template**:

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
Describe testing done.

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Tests pass
- [ ] Linter passes
- [ ] Documentation updated
- [ ] Code reviewed by myself
```

### PR Review Process

1. **Automated Checks**: CI/CD pipeline runs tests
2. **Code Review**: At least one approval required
3. **Address Feedback**: Make requested changes
4. **Approval**: PR is approved
5. **Merge**: Maintainer merges to develop

### After Your PR is Merged

1. **Delete your branch**:
   ```bash
   git branch -d feature/my-feature
   git push origin --delete feature/my-feature
   ```

2. **Update your local develop**:
   ```bash
   git checkout develop
   git pull upstream develop
   ```

3. **Celebrate!** 🎉

---

## Documentation

### Code Documentation

**JSDoc for All Public APIs**:
```typescript
/**
 * Component description
 *
 * @param props - Component props
 * @param props.value - Current value
 * @param props.onChange - Change handler
 * @returns React component
 */
export const Input: React.FC<InputProps> = ({ value, onChange }) => {
  // Implementation
};
```

### README Updates

If your changes affect:
- Installation process
- Configuration
- Usage examples
- API

**Update the README.md** accordingly.

### API Documentation

For API changes:
- Update `API_REFERENCE.md`
- Add examples
- Document new parameters
- Update error codes

### User Documentation

For user-facing features:
- Update `USER_MANUAL.md`
- Add screenshots
- Provide step-by-step instructions
- Include troubleshooting tips

---

## Issue Guidelines

### Before Creating an Issue

**Search Existing Issues**:
- Check if issue already exists
- Check closed issues (may be fixed)
- Check discussions

### Creating a Bug Report

Use the bug report template:

```markdown
## Bug Description
Clear description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- Browser: Chrome 120
- OS: Windows 11
- App Version: 1.0.0

## Screenshots
Add screenshots if applicable.

## Additional Context
Any other relevant information.
```

### Creating a Feature Request

Use the feature request template:

```markdown
## Feature Description
Clear description of the feature.

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this work?

## Alternatives Considered
Other approaches you've thought of.

## Additional Context
Mockups, examples, etc.
```

### Issue Labels

We use these labels:
- `bug`: Something isn't working
- `feature`: New feature request
- `enhancement`: Improve existing feature
- `documentation`: Documentation improvements
- `good first issue`: Good for newcomers
- `help wanted`: Need community help
- `question`: Further information requested
- `wontfix`: Will not be implemented

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, show & tell
- **Discord**: Real-time chat (if available)
- **Email**: contact@your-domain.com

### Getting Help

**Stuck? Here's how to get help**:

1. **Check documentation**:
   - README.md
   - USER_MANUAL.md
   - TECHNICAL_DESIGN_DOCUMENT.md

2. **Search issues**: Someone may have had the same problem

3. **Ask in Discussions**: For questions and help

4. **Create an issue**: For bugs or feature requests

### Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- GitHub contributors page

We appreciate all contributions, big and small!

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

## Questions?

If you have questions about contributing, please:
- Open a GitHub Discussion
- Email: contribute@your-domain.com
- Join our Discord (if available)

**Thank you for contributing!** 🙏

---

**Last Updated**: February 10, 2026
**Maintainers**: Development Team
