# Code Review Issues - Action Items

This document contains GitHub issues to be created based on the comprehensive code review.
Repository: https://github.com/mattgabavics-max/gantt-chart-app

---

## 🔴 CRITICAL PRIORITY

### Issue 1: [CRITICAL] Hardcoded JWT Secret Fallback

**Labels:** `security`, `critical`, `bug`
**Priority:** P0
**Assignee:** Backend Team

#### Description
The JWT secret has a hardcoded fallback value that poses a critical security risk if the `JWT_SECRET` environment variable is not set in production.

#### Location
`server/src/utils/jwt.ts:3`

#### Current Code
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
```

#### Risk
- If `JWT_SECRET` is not set, the default secret is used
- Attackers can forge valid JWT tokens
- All user accounts vulnerable to takeover
- **CVSS Score: 9.1 (Critical)**

#### Recommended Fix
```typescript
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable must be set')
}
const JWT_SECRET = process.env.JWT_SECRET
```

Also add to `server/.env.example`:
```bash
# REQUIRED: Generate with: openssl rand -base64 64
JWT_SECRET=
```

#### Acceptance Criteria
- [ ] Remove fallback value from jwt.ts
- [ ] Add validation that throws error on startup if missing
- [ ] Update .env.example with generation instructions
- [ ] Update deployment docs with setup instructions
- [ ] Verify all environments have JWT_SECRET set

#### Estimated Effort
1-2 hours

---

## 🟠 HIGH PRIORITY

### Issue 2: [HIGH] Password Validation Not Enforced

**Labels:** `security`, `high`, `bug`
**Priority:** P1
**Assignee:** Backend Team

#### Description
Password strength validation function exists but is never called in the authentication controller, allowing users to register with weak passwords.

#### Location
- Validation function: `server/src/utils/password.ts:27-53`
- Controller: `server/src/controllers/auth.controller.ts:11-53`

#### Current Behavior
Users can register with passwords like:
- `123456`
- `password`
- `abc`

#### Impact
- Weak passwords increase account compromise risk
- Brute force attacks more successful
- Violates security best practices

#### Recommended Fix

In `auth.controller.ts`, add validation before hashing:

```typescript
import { hashPassword, validatePasswordStrength } from '../utils/password'

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name } = req.body

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password)
  if (!passwordValidation.isValid) {
    throw new BadRequestError(
      `Password validation failed: ${passwordValidation.errors.join(', ')}`
    )
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new ConflictError('User already exists')
  }

  // Hash password and create user
  const hashedPassword = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  })

  // ... rest of the code
}
```

#### Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

#### Acceptance Criteria
- [ ] Call `validatePasswordStrength()` in register controller
- [ ] Return clear error messages for invalid passwords
- [ ] Add tests for weak password rejection
- [ ] Document password requirements in API docs
- [ ] Update frontend to show password requirements

#### Estimated Effort
3-4 hours

---

### Issue 3: [HIGH] Missing Service/Repository Layer

**Labels:** `architecture`, `high`, `refactoring`, `technical-debt`
**Priority:** P1
**Assignee:** Backend Team

#### Description
Controllers directly interact with Prisma ORM, mixing request handling with business logic and data access. This violates separation of concerns and makes testing difficult.

#### Current Architecture
```
Routes → Controllers → Prisma (Database)
```

#### Recommended Architecture
```
Routes → Controllers → Services → Repositories → Prisma (Database)
```

#### Impact
- **Testability:** Hard to unit test controllers (require database)
- **Maintainability:** Business logic scattered across controllers
- **Flexibility:** Difficult to switch ORMs or add caching
- **Code Reuse:** Logic duplication across controllers

#### Example Current Code
`server/src/controllers/project.controller.ts:91-120`
```typescript
export async function createProject(req: Request, res: Response) {
  const project = await prisma.project.create({
    data: {
      ...req.body,
      ownerId: req.user.id,
    },
  })
  res.json({ success: true, data: project })
}
```

#### Recommended Implementation

**1. Create Repository Layer**
```typescript
// server/src/repositories/ProjectRepository.ts
export class ProjectRepository {
  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
      include: { tasks: true, versions: true },
    })
  }

  async findByOwner(userId: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: CreateProjectInput): Promise<Project> {
    return prisma.project.create({ data })
  }

  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    return prisma.project.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await prisma.project.delete({ where: { id } })
  }
}
```

**2. Create Service Layer**
```typescript
// server/src/services/ProjectService.ts
export class ProjectService {
  constructor(
    private projectRepo: ProjectRepository,
    private versionService: VersionService
  ) {}

  async createProject(
    userId: string,
    data: CreateProjectInput
  ): Promise<Project> {
    // Business logic
    const project = await this.projectRepo.create({
      ...data,
      ownerId: userId,
    })

    // Create initial version
    await this.versionService.createVersion(project.id, {
      name: 'Initial version',
      description: 'Project created',
    })

    return project
  }

  async getProjectById(
    projectId: string,
    userId: string
  ): Promise<Project> {
    const project = await this.projectRepo.findById(projectId)

    if (!project) {
      throw new NotFoundError('Project not found')
    }

    // Authorization check
    if (project.ownerId !== userId && !project.isPublic) {
      throw new UnauthorizedError('Access denied')
    }

    return project
  }
}
```

**3. Simplify Controllers**
```typescript
// server/src/controllers/project.controller.ts
const projectService = new ProjectService(
  new ProjectRepository(),
  new VersionService()
)

export async function createProject(req: Request, res: Response) {
  const project = await projectService.createProject(
    req.user.id,
    req.body
  )
  res.status(201).json({ success: true, data: project })
}
```

#### Implementation Plan
1. **Phase 1:** Create repository classes for all models
   - ProjectRepository
   - TaskRepository
   - UserRepository
   - VersionRepository
   - ShareLinkRepository

2. **Phase 2:** Create service classes with business logic
   - ProjectService
   - TaskService
   - AuthService
   - VersionService
   - ShareService

3. **Phase 3:** Refactor controllers to use services
   - Update all controller methods
   - Remove direct Prisma calls
   - Add dependency injection

4. **Phase 4:** Add tests
   - Unit tests for services (mock repositories)
   - Integration tests for repositories (test database)
   - Update controller tests

#### Acceptance Criteria
- [ ] Repository classes created for all models
- [ ] Service classes implement all business logic
- [ ] Controllers only handle HTTP concerns
- [ ] No direct Prisma calls in controllers
- [ ] Unit tests for services (80%+ coverage)
- [ ] Integration tests for repositories
- [ ] Documentation updated

#### Estimated Effort
16-24 hours (spread over 2-3 sprints)

#### References
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)

---

### Issue 4: [HIGH] Add type-check Scripts to package.json

**Labels:** `build`, `high`, `bug`
**Priority:** P1
**Assignee:** DevOps

#### Description
CI/CD pipeline calls `npm run type-check` but this script doesn't exist in package.json files, causing builds to fail silently or skip type checking.

#### Location
- CI/CD: `.github/workflows/ci-cd.yml:40, 97`
- Missing in: `client/package.json` and `server/package.json`

#### Impact
- Type safety not enforced in CI
- TypeScript errors may reach production
- False sense of security from CI passing

#### Recommended Fix

**client/package.json:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**server/package.json:**
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Root package.json:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev -w client\" \"npm run dev -w server\"",
    "build": "npm run build -w client && npm run build -w server",
    "type-check": "npm run type-check -w client && npm run type-check -w server",
    "test": "npm run test -w client && npm run test -w server",
    "test:coverage": "npm run test:coverage -w client && npm run test:coverage -w server"
  }
}
```

#### Acceptance Criteria
- [ ] Add type-check script to client/package.json
- [ ] Add type-check script to server/package.json
- [ ] Add type-check script to root package.json
- [ ] Verify CI runs type-check successfully
- [ ] Fix any type errors discovered
- [ ] Add to pre-commit hook (optional)

#### Estimated Effort
1-2 hours

---

## 🟡 MEDIUM PRIORITY

### Issue 5: [MEDIUM] Type Safety Gaps in Controllers

**Labels:** `typescript`, `medium`, `code-quality`
**Priority:** P2
**Assignee:** Backend Team

#### Description
Controllers use `any` type in several places, bypassing TypeScript's type safety and increasing risk of runtime errors.

#### Locations
1. `server/src/controllers/project.controller.ts:24`
   ```typescript
   const where: any = {
     OR: [
       { name: { contains: search, mode: 'insensitive' } },
       { description: { contains: search, mode: 'insensitive' } },
     ],
   }
   ```

2. Similar patterns in task and version controllers

#### Impact
- No type checking for query objects
- Runtime errors possible from malformed queries
- IntelliSense doesn't work
- Refactoring becomes risky

#### Recommended Fix

Use Prisma's generated types:

```typescript
import { Prisma } from '@prisma/client'

export async function getProjects(req: Request, res: Response) {
  const { search, isPublic, page = 1, limit = 10 } = req.query

  const where: Prisma.ProjectWhereInput = {
    ownerId: req.user.id,
    ...(search && {
      OR: [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ],
    }),
    ...(isPublic !== undefined && {
      isPublic: isPublic === 'true',
    }),
  }

  const projects = await prisma.project.findMany({
    where,
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
  })

  res.json({ success: true, data: { projects } })
}
```

#### Acceptance Criteria
- [ ] Replace all `any` types with proper Prisma types
- [ ] Use `Prisma.ModelWhereInput` for query objects
- [ ] Use `Prisma.ModelInclude` for include objects
- [ ] Use `Prisma.ModelSelect` for select objects
- [ ] Verify no type errors
- [ ] Update tests to use typed objects

#### Estimated Effort
4-6 hours

---

### Issue 6: [MEDIUM] Inconsistent Error Response Format

**Labels:** `api`, `medium`, `bug`
**Priority:** P2
**Assignee:** Backend Team

#### Description
API error responses contain both `error` and `message` fields with similar content, creating confusion for API consumers.

#### Current Format
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Validation failed"
}
```

#### Location
`server/src/middleware/errorHandler.ts:64-68, 77-82`

#### Impact
- Inconsistent API contract
- Frontend code unsure which field to use
- Extra bandwidth for duplicate data
- Confusing for API consumers

#### Recommended Fix

**Standardized Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2026-02-08T12:34:56Z",
  "path": "/api/auth/register",
  "requestId": "abc-123-def-456"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

#### Implementation

**Update ErrorHandler:**
```typescript
// server/src/middleware/errorHandler.ts
interface ApiError {
  code: string
  message: string
  details?: any[]
}

interface ErrorResponse {
  success: false
  error: ApiError
  timestamp: string
  path: string
  requestId?: string
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: getErrorCode(err),
      message: err.message,
      details: getErrorDetails(err),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    requestId: req.id, // Requires request ID middleware
  }

  // Log error
  logger.error({
    error: err,
    requestId: req.id,
    path: req.path,
  })

  res.status(statusCode).json(errorResponse)
}

function getErrorCode(err: Error): string {
  if (err instanceof ValidationError) return 'VALIDATION_ERROR'
  if (err instanceof NotFoundError) return 'NOT_FOUND'
  if (err instanceof UnauthorizedError) return 'UNAUTHORIZED'
  if (err instanceof ConflictError) return 'CONFLICT'
  return 'INTERNAL_ERROR'
}
```

**Update Frontend:**
```typescript
// client/src/services/api.ts
interface ApiError {
  code: string
  message: string
  details?: any[]
}

function transformError(error: any): ApiError {
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  return {
    code: 'NETWORK_ERROR',
    message: error.message || 'An error occurred',
  }
}
```

#### Acceptance Criteria
- [ ] Standardize error response format across all endpoints
- [ ] Add error codes for all error types
- [ ] Add timestamp to error responses
- [ ] Add request path to error responses
- [ ] Update frontend to handle new format
- [ ] Update API documentation
- [ ] Add tests for error responses

#### Estimated Effort
6-8 hours

---

### Issue 7: [MEDIUM] React Query DevTools Exposed in Production

**Labels:** `security`, `medium`, `frontend`
**Priority:** P2
**Assignee:** Frontend Team

#### Description
React Query DevTools are conditionally rendered based on `import.meta.env.DEV`, but this could be manipulated or may be true in production builds if misconfigured.

#### Location
`client/src/providers/QueryProvider.tsx:118-128`

#### Current Code
```typescript
{import.meta.env.DEV && (
  <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
)}
```

#### Risk
- DevTools expose query data, cache contents, mutations
- Could reveal sensitive user data, API structure
- Performance impact in production

#### Recommended Fix

Use explicit environment variable:

**.env.production:**
```bash
VITE_ENABLE_DEVTOOLS=false
```

**.env.development:**
```bash
VITE_ENABLE_DEVTOOLS=true
```

**QueryProvider.tsx:**
```typescript
const ENABLE_DEVTOOLS =
  import.meta.env.VITE_ENABLE_DEVTOOLS === 'true' &&
  import.meta.env.DEV

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {ENABLE_DEVTOOLS && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}
```

#### Acceptance Criteria
- [ ] Add VITE_ENABLE_DEVTOOLS to .env files
- [ ] Update QueryProvider to check explicit flag
- [ ] Verify DevTools don't load in production build
- [ ] Update documentation

#### Estimated Effort
1-2 hours

---

### Issue 8: [MEDIUM] Add Global Rate Limiting

**Labels:** `security`, `medium`, `backend`
**Priority:** P2
**Assignee:** Backend Team

#### Description
Rate limiting is only applied to authentication endpoints. All other endpoints are unprotected against abuse, DoS attacks, or resource exhaustion.

#### Current Coverage
- ✅ `/api/auth/register` - 5 requests per 15 min
- ✅ `/api/auth/login` - 10 requests per 15 min
- ❌ All other endpoints - No rate limiting

#### Locations
- Auth rate limiting: `server/src/routes/auth.routes.ts:15-37`
- Missing: All other route files

#### Risk
- API abuse and resource exhaustion
- DoS attacks
- Excessive database queries
- Increased infrastructure costs

#### Recommended Implementation

**1. Create Global Rate Limiter**
```typescript
// server/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { redis } from '../lib/redis' // If using Redis

// Global rate limiter (more permissive)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Use Redis for distributed rate limiting (optional)
  // store: new RedisStore({ client: redis }),
})

// Stricter limiter for sensitive endpoints
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests, please try again later',
})

// Per-user rate limiter (after authentication)
export const perUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => !req.user, // Skip for unauthenticated
})
```

**2. Apply Globally**
```typescript
// server/src/index.ts
import { globalLimiter, perUserLimiter } from './middleware/rateLimiter'

// Apply global rate limiter early in middleware chain
app.use('/api', globalLimiter)

// Apply per-user limiter after authentication
app.use('/api', authenticate, perUserLimiter)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
```

**3. Endpoint-Specific Overrides**
```typescript
// server/src/routes/project.routes.ts
import { strictLimiter } from '../middleware/rateLimiter'

// Apply stricter rate limit to expensive operations
router.post('/', strictLimiter, asyncHandler(createProject))
router.delete('/:id', strictLimiter, asyncHandler(deleteProject))
```

#### Configuration Recommendations

| Endpoint Type | Window | Max Requests | Use Case |
|--------------|--------|--------------|----------|
| Global | 15 min | 100 | Default for all endpoints |
| Auth (register/login) | 15 min | 5-10 | Prevent brute force |
| Read operations | 15 min | 200 | Higher limit for GET |
| Write operations | 15 min | 50 | Lower limit for POST/PUT/DELETE |
| Per-user (authenticated) | 15 min | 1000 | Higher limit for logged-in users |
| File uploads | 1 hour | 10 | Prevent abuse |
| Public share links | 1 hour | 100 | Prevent scraping |

#### Acceptance Criteria
- [ ] Install express-rate-limit
- [ ] Create rate limiter middleware
- [ ] Apply global rate limiter to /api
- [ ] Apply per-user rate limiter after auth
- [ ] Add stricter limits to sensitive endpoints
- [ ] Configure Redis store (optional, for scaling)
- [ ] Add rate limit headers to responses
- [ ] Update API documentation
- [ ] Add tests for rate limiting
- [ ] Monitor rate limit violations

#### Estimated Effort
4-6 hours

---

### Issue 9: [MEDIUM] Add Request Logging with Correlation IDs

**Labels:** `observability`, `medium`, `backend`
**Priority:** P2
**Assignee:** Backend Team

#### Description
No request logging or correlation ID tracking makes debugging production issues difficult. Cannot trace a request through the system or correlate frontend errors with backend logs.

#### Impact
- Difficult to debug production issues
- Cannot trace requests across services
- No visibility into request/response cycle
- Hard to correlate frontend errors with backend

#### Recommended Implementation

**1. Install Dependencies**
```bash
cd server
npm install pino pino-http uuid @types/uuid
npm install -D pino-pretty
```

**2. Create Logger**
```typescript
// server/src/lib/logger.ts
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
})
```

**3. Create Request Logging Middleware**
```typescript
// server/src/middleware/requestLogger.ts
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import pinoHttp from 'pino-http'
import { logger } from '../lib/logger'

// Add requestId to Express Request type
declare global {
  namespace Express {
    interface Request {
      id: string
    }
  }
}

// Request ID middleware
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Use existing request ID or generate new one
  req.id = (req.headers['x-request-id'] as string) || uuidv4()
  res.setHeader('X-Request-Id', req.id)
  next()
}

// HTTP request logger
export const requestLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`
  },
  customProps: (req, res) => ({
    requestId: req.id,
    userId: (req as any).user?.id,
    userAgent: req.headers['user-agent'],
  }),
})
```

**4. Update Error Handler**
```typescript
// server/src/middleware/errorHandler.ts
import { logger } from '../lib/logger'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500

  // Log error with context
  logger.error({
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    requestId: req.id,
    userId: req.user?.id,
    path: req.path,
    method: req.method,
    statusCode,
  }, 'Request error')

  const errorResponse = {
    success: false,
    error: {
      code: getErrorCode(err),
      message: err.message,
    },
    requestId: req.id,
    timestamp: new Date().toISOString(),
  }

  res.status(statusCode).json(errorResponse)
}
```

**5. Apply Middleware**
```typescript
// server/src/index.ts
import { requestIdMiddleware, requestLogger } from './middleware/requestLogger'
import { logger } from './lib/logger'

// Early in middleware chain
app.use(requestIdMiddleware)
app.use(requestLogger)

// ... other middleware

// Startup logging
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started')
})

// Error logging on uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception')
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection')
  process.exit(1)
})
```

**6. Usage in Controllers**
```typescript
// server/src/controllers/project.controller.ts
import { logger } from '../lib/logger'

export async function createProject(req: Request, res: Response) {
  logger.info({
    requestId: req.id,
    userId: req.user.id
  }, 'Creating project')

  const project = await projectService.createProject(req.user.id, req.body)

  logger.info({
    requestId: req.id,
    projectId: project.id
  }, 'Project created')

  res.status(201).json({ success: true, data: project })
}
```

**7. Frontend Integration**
```typescript
// client/src/services/api.ts
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
        console.error('[API Error]', {
          requestId,
          status: error.response?.status,
          message: error.response?.data?.error?.message,
        })
        return Promise.reject(error)
      }
    )
  }
}
```

#### Log Output Examples

**Development (Pretty):**
```
[12:34:56.789] INFO: POST /api/projects - 201
    requestId: "abc-123-def-456"
    userId: "user-123"
    responseTime: 45ms
```

**Production (JSON):**
```json
{
  "level": "info",
  "time": "2026-02-08T12:34:56.789Z",
  "msg": "POST /api/projects - 201",
  "requestId": "abc-123-def-456",
  "userId": "user-123",
  "method": "POST",
  "url": "/api/projects",
  "statusCode": 201,
  "responseTime": 45
}
```

#### Acceptance Criteria
- [ ] Install pino and pino-http
- [ ] Create logger configuration
- [ ] Add request ID middleware
- [ ] Add HTTP request logging
- [ ] Update error handler to log with context
- [ ] Add request ID to error responses
- [ ] Frontend sends/receives request IDs
- [ ] Remove console.log statements
- [ ] Add structured logging to key operations
- [ ] Document logging conventions

#### Estimated Effort
6-8 hours

---

## 📋 Quick Reference

### Issue Summary
| # | Priority | Title | Estimated Effort |
|---|----------|-------|------------------|
| 1 | Critical | Hardcoded JWT Secret Fallback | 1-2h |
| 2 | High | Password Validation Not Enforced | 3-4h |
| 3 | High | Missing Service/Repository Layer | 16-24h |
| 4 | High | Add type-check Scripts | 1-2h |
| 5 | Medium | Type Safety Gaps in Controllers | 4-6h |
| 6 | Medium | Inconsistent Error Response Format | 6-8h |
| 7 | Medium | React Query DevTools in Production | 1-2h |
| 8 | Medium | Add Global Rate Limiting | 4-6h |
| 9 | Medium | Add Request Logging with Correlation IDs | 6-8h |

### Total Estimated Effort
- **Critical + High:** 21-32 hours
- **All Issues:** 43-62 hours

### Recommended Sprint Planning
- **Sprint 1 (Week 1):** Issues #1, #2, #4 (Critical + Quick wins)
- **Sprint 2 (Week 2):** Issues #5, #6, #7 (Type safety + Error handling)
- **Sprint 3 (Weeks 3-4):** Issue #3 (Service layer - larger refactor)
- **Sprint 4 (Week 5):** Issues #8, #9 (Rate limiting + Logging)

---

## 🔗 Resources

- **Repository:** https://github.com/mattgabavics-max/gantt-chart-app
- **Code Review Report:** `REVIEW_ISSUES.md`
- **Refactoring Guide:** `docs/REFACTORING_GUIDE.md` (to be created)

---

**Generated:** 2026-02-08
**Review By:** Claude Code Architecture Review Agent
