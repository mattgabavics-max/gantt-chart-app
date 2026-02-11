# Gantt Chart Application - Technical Design Document

**Version:** 1.0
**Last Updated:** February 10, 2026
**Audience:** Developers, Software Architects, Technical Leads
**Status:** Production

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [API Design](#api-design)
6. [Authentication & Authorization](#authentication--authorization)
7. [Security Architecture](#security-architecture)
8. [Frontend Architecture](#frontend-architecture)
9. [State Management](#state-management)
10. [Performance Optimization](#performance-optimization)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Architecture](#deployment-architecture)
13. [Monitoring & Observability](#monitoring--observability)
14. [Development Guidelines](#development-guidelines)
15. [Future Enhancements](#future-enhancements)

---

## Executive Summary

### Project Overview

The Gantt Chart Application is a full-stack web application for project management and timeline visualization. It provides an interactive Gantt chart interface with drag-and-drop functionality, real-time collaboration features, and comprehensive project tracking capabilities.

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture** | Monorepo with separated client/server | Code sharing, simplified deployment, unified tooling |
| **Frontend Framework** | React 18 with TypeScript | Component reusability, type safety, large ecosystem |
| **Backend Framework** | Express.js with TypeScript | Lightweight, flexible, Node.js ecosystem |
| **Database** | PostgreSQL with Prisma ORM | ACID compliance, relational data, type-safe queries |
| **Authentication** | JWT with HttpOnly cookies | Stateless auth, XSS protection, scalable |
| **State Management** | React Context + React Query | Server state separation, caching, optimistic updates |
| **Build Tool** | Vite | Fast development, optimized production builds |
| **Testing** | Jest + Cypress + Jest-axe | Unit, integration, E2E, accessibility coverage |

### Performance Targets

- **Page Load**: < 2 seconds
- **API Response**: < 200ms (p95)
- **Chart Render**: < 500ms for 100 tasks
- **Auto-save**: 5-second debounce
- **Database Queries**: < 100ms (p95)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Browser    │  │    React     │  │   Context    │ │
│  │   (Vite)     │──│  Components  │──│   Providers  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                           │                             │
└───────────────────────────┼─────────────────────────────┘
                            │
                    HTTPS / REST API
                            │
┌───────────────────────────┼─────────────────────────────┐
│                      Server Layer                        │
│                           │                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Express    │  │ Controllers  │  │  Middleware  │ │
│  │  HTTP Server │──│   Business   │──│  (Auth/Val)  │ │
│  └──────────────┘  │    Logic     │  └──────────────┘ │
│                    └──────────────┘                    │
│                           │                             │
└───────────────────────────┼─────────────────────────────┘
                            │
                      Prisma ORM
                            │
┌───────────────────────────┼─────────────────────────────┐
│                     Data Layer                           │
│                           │                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                  │  │
│  │  (Users, Projects, Tasks, Versions, ShareLinks)  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Component Diagram

```
Frontend (React)
├── components/
│   ├── GanttChart/              # Core chart components
│   │   ├── GanttChart.tsx       # Main orchestrator
│   │   ├── TaskBar.tsx          # Individual task
│   │   ├── TimelineHeader.tsx   # Date headers
│   │   └── __tests__/           # Unit tests
│   ├── ProjectManagement/       # Project CRUD
│   │   ├── ProjectList.tsx
│   │   ├── ProjectHeader.tsx
│   │   └── TaskCreationForm.tsx
│   ├── Sharing/                 # Collaboration
│   │   ├── ShareModal.tsx
│   │   └── SharedProjectView.tsx
│   └── VersionHistory/          # Time travel
│       ├── VersionHistory.tsx
│       └── VersionDiffViewer.tsx
├── contexts/                    # State management
│   ├── AuthContext.tsx          # Authentication
│   ├── ProjectContext.tsx       # Project/tasks
│   └── VersionContext.tsx       # Versions
├── hooks/                       # Custom hooks
│   ├── useAutoSave.ts
│   ├── useOptimisticUpdate.ts
│   └── useKeyboardShortcuts.ts
└── services/
    └── api.ts                   # Axios client

Backend (Express)
├── controllers/                 # Request handlers
│   ├── auth.controller.ts
│   ├── project.controller.ts
│   ├── task.controller.ts
│   └── version.controller.ts
├── routes/                      # API endpoints
│   ├── auth.routes.ts
│   ├── project.routes.ts
│   ├── task.routes.ts
│   └── version.routes.ts
├── middleware/                  # Express middleware
│   ├── auth.ts                  # JWT verification
│   ├── csrf.ts                  # CSRF protection
│   ├── errorHandler.ts          # Error handling
│   └── validation.ts            # Input validation
├── services/                    # Business logic
│   └── tokenBlacklist.ts        # Token revocation
└── utils/
    ├── jwt.ts                   # Token management
    ├── cookies.ts               # Cookie handling
    └── password.ts              # Password hashing
```

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI library |
| **TypeScript** | 5.3.3 | Type safety |
| **Vite** | 5.0.11 | Build tool & dev server |
| **Tailwind CSS** | 3.4.1 | Utility-first styling |
| **React Router** | 7.13.0 | Client-side routing |
| **React Query** | 5.90.20 | Server state management |
| **Axios** | 1.6.5 | HTTP client |
| **Jest** | 29.7.0 | Unit testing |
| **Cypress** | 13.6.3 | E2E testing |
| **Jest-axe** | 8.0.0 | Accessibility testing |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express** | 4.18.2 | Web framework |
| **TypeScript** | 5.3.3 | Type safety |
| **Prisma** | 5.8.1 | ORM & migrations |
| **PostgreSQL** | 14+ | Database |
| **JWT** | 9.0.2 | Authentication tokens |
| **Bcrypt** | 5.1.1 | Password hashing |
| **Helmet** | 8.1.0 | Security headers |
| **Express Rate Limit** | 7.1.5 | Rate limiting |
| **Express Validator** | 7.0.1 | Input validation |
| **Pino** | 8.17.2 | Logging |

### Development Tools

| Tool | Purpose |
|------|---------|
| **npm workspaces** | Monorepo management |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Husky** | Git hooks |
| **ts-node** | TypeScript execution |
| **Concurrently** | Run multiple commands |

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
├─────────────┤
│ id (PK)     │
│ email       │◄────────┐
│ passwordHash│         │
│ createdAt   │         │ ownerId
└─────────────┘         │
      │                 │
      │ ownerId         │
      │                 │
      ▼                 │
┌─────────────┐         │
│   Project   │─────────┘
├─────────────┤
│ id (PK)     │
│ name        │
│ isPublic    │
│ ownerId(FK) │
│ createdAt   │
│ updatedAt   │
└─────────────┘
      │
      │ projectId
      ├─────────────────┬──────────────┬──────────────┐
      ▼                 ▼              ▼              ▼
┌─────────────┐  ┌────────────┐ ┌──────────┐  ┌──────────┐
│    Task     │  │   Version  │ │ShareLink │  │  ...     │
├─────────────┤  ├────────────┤ ├──────────┤  └──────────┘
│ id (PK)     │  │ id (PK)    │ │id (PK)   │
│ projectId   │  │ projectId  │ │projectId │
│ name        │  │ versionNum │ │token     │
│ startDate   │  │ snapshot   │ │accessType│
│ endDate     │  │ createdAt  │ │expiresAt │
│ color       │  │ createdBy  │ │createdAt │
│ position    │  └────────────┘ └──────────┘
│ createdAt   │
└─────────────┘
```

### Schema Definition (Prisma)

**User Model**:
```prisma
model User {
  id            String           @id @default(uuid())
  email         String           @unique
  passwordHash  String
  createdAt     DateTime         @default(now())

  // Relations
  ownedProjects Project[]        @relation("ProjectOwner")
  projectVersions ProjectVersion[] @relation("VersionCreator")

  @@index([email])
  @@index([createdAt])
  @@map("User")
}
```

**Project Model**:
```prisma
model Project {
  id        String   @id @default(uuid())
  name      String
  isPublic  Boolean  @default(false)
  ownerId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  owner      User             @relation("ProjectOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  tasks      Task[]
  versions   ProjectVersion[]
  shareLinks ShareLink[]

  @@index([ownerId])
  @@index([isPublic])
  @@index([createdAt])
  @@map("Project")
}
```

**Task Model**:
```prisma
model Task {
  id        String   @id @default(uuid())
  projectId String
  name      String
  startDate DateTime
  endDate   DateTime
  color     String   @default("#3B82F6")
  position  Int      @default(0)
  createdAt DateTime @default(now())

  // Relations
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([startDate])
  @@index([endDate])
  @@index([position])
  @@map("Task")
}
```

**ProjectVersion Model**:
```prisma
model ProjectVersion {
  id            String   @id @default(uuid())
  projectId     String
  versionNumber Int
  snapshotData  Json
  createdAt     DateTime @default(now())
  createdBy     String

  // Relations
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  creator User    @relation("VersionCreator", fields: [createdBy], references: [id], onDelete: Cascade)

  @@unique([projectId, versionNumber])
  @@index([projectId])
  @@index([createdAt])
  @@map("ProjectVersion")
}
```

**ShareLink Model**:
```prisma
model ShareLink {
  id         String      @id @default(uuid())
  projectId  String
  token      String      @unique
  accessType AccessType
  createdAt  DateTime    @default(now())
  expiresAt  DateTime?

  // Relations
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([token])
  @@index([expiresAt])
  @@map("ShareLink")
}

enum AccessType {
  READONLY
  EDITABLE
}
```

### Indexing Strategy

**Primary Indexes (Automatic)**:
- All primary keys (`id` fields)
- Unique constraints (`email`, `token`, `[projectId, versionNumber]`)

**Secondary Indexes** (Performance optimization):
- User lookups: `User.email`, `User.createdAt`
- Project queries: `Project.ownerId`, `Project.isPublic`, `Project.createdAt`
- Task queries: `Task.projectId`, `Task.startDate`, `Task.endDate`, `Task.position`
- Version queries: `ProjectVersion.projectId`, `ProjectVersion.createdAt`
- Share link queries: `ShareLink.projectId`, `ShareLink.token`, `ShareLink.expiresAt`

### Database Constraints

**Foreign Key Cascades**:
- Delete User → Cascade delete all Projects
- Delete Project → Cascade delete Tasks, Versions, ShareLinks
- Delete User → Cascade delete ProjectVersions (created by that user)

**Data Integrity**:
- `User.email` UNIQUE
- `ShareLink.token` UNIQUE
- `[ProjectVersion.projectId, ProjectVersion.versionNumber]` UNIQUE
- All dates use ISO 8601 timestamps with timezone

---

## API Design

### REST API Principles

**Design Principles**:
1. **Resource-oriented**: URLs represent resources, not actions
2. **HTTP methods**: GET (read), POST (create), PUT/PATCH (update), DELETE (delete)
3. **Stateless**: Each request contains all necessary information
4. **JSON**: All requests/responses use JSON format
5. **Versioned**: API version in URL (`/api/v1/...`) - currently implicit v1

### API Structure

**Base URL**: `https://your-domain.com/api`

**Request Format**:
```json
{
  "header": {
    "Content-Type": "application/json",
    "Authorization": "Bearer <jwt-token>",
    "X-CSRF-Token": "<csrf-token>"
  },
  "body": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

**Response Format** (Success):
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "resource": { /* resource data */ }
  }
}
```

**Response Format** (Error):
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* additional error context */ }
  },
  "statusCode": 400
}
```

### Endpoint Patterns

**Collection Endpoints**:
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project

**Resource Endpoints**:
- `GET /api/projects/:id` - Get specific project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

**Nested Resources**:
- `GET /api/projects/:projectId/tasks` - Get tasks for project
- `POST /api/projects/:projectId/tasks` - Create task in project

**Actions** (when REST doesn't fit):
- `POST /api/projects/:id/versions/:versionId/restore` - Restore version
- `POST /api/share/:token/validate` - Validate share token

### Pagination

**Query Parameters**:
```
GET /api/projects?page=1&limit=10
```

**Response**:
```json
{
  "success": true,
  "data": {
    "projects": [ /* array of projects */ ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasMore": true
    }
  }
}
```

### Filtering and Sorting

**Filtering**:
```
GET /api/projects?isPublic=true&search=marketing
```

**Sorting**:
```
GET /api/projects?sortBy=createdAt&order=desc
```

### Error Handling

**HTTP Status Codes**:
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Resource conflict (duplicate)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Temporary unavailability

**Error Response Structure**:
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable code
    message: string;        // Human-readable message
    details?: any;          // Additional context
    field?: string;         // Field causing error (validation)
  };
  statusCode: number;
}
```

---

## Authentication & Authorization

### Authentication Flow

**Registration**:
```
1. Client: POST /api/auth/register {email, password}
2. Server:
   - Validate email format
   - Validate password strength
   - Hash password (bcrypt, 10 rounds)
   - Create user in database
   - Generate JWT token
   - Set HttpOnly cookie
3. Response: {success: true, data: {user}}
4. Client: Store user in AuthContext
```

**Login**:
```
1. Client: POST /api/auth/login {email, password}
2. Server:
   - Find user by email
   - Compare password (bcrypt)
   - Generate JWT token
   - Set HttpOnly cookie
3. Response: {success: true, data: {user}}
4. Client: Store user in AuthContext
```

**Token Verification**:
```
1. Client: GET /api/projects (with token in cookie)
2. Server authenticate middleware:
   - Extract token from cookie or Authorization header
   - Check token blacklist
   - Verify JWT signature
   - Verify token not expired
   - Verify user exists in database
   - Inject user into request
3. Continue to route handler
```

**Logout**:
```
1. Client: POST /api/auth/logout
2. Server:
   - Add token to blacklist
   - Clear HttpOnly cookies
3. Response: {success: true}
4. Client: Clear AuthContext, redirect to login
```

### JWT Token Structure

**Payload**:
```typescript
interface JwtPayload {
  userId: string;     // User UUID
  email: string;      // User email
  iat: number;        // Issued at (timestamp)
  exp: number;        // Expiration (timestamp)
}
```

**Configuration**:
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret**: Environment variable `JWT_SECRET` (64+ characters recommended)
- **Expiration**: 7 days (configurable via `JWT_EXPIRES_IN`)
- **Storage**: HttpOnly cookie (secure, sameSite: strict)

### Authorization Model

**Access Control Rules**:

| Resource | Owner | Authenticated User | Anonymous |
|----------|-------|-------------------|-----------|
| **Project (Private)** | Full access | No access | No access |
| **Project (Public)** | Full access | Read-only | Read-only |
| **Project (Shared Read)** | Full access | Read via link | Read via link |
| **Project (Shared Edit)** | Full access | Edit via link | Edit via link |
| **Task** | Follows project | Follows project | Follows project |
| **Version** | Full access | No access | No access |
| **Share Link** | Full access | No access | No access |

**Middleware Chain**:
```typescript
// Example: Update project endpoint
router.put(
  '/:id',
  verifyCsrfToken,      // 1. CSRF protection
  authenticate,         // 2. JWT verification
  updateProjectValidation, // 3. Input validation
  validate,             // 4. Validation error handler
  asyncHandler(updateProject) // 5. Business logic
);
```

### Token Blacklist

**Implementation**:
```typescript
// In-memory Map: token → expiration timestamp
const blacklistedTokens = new Map<string, number>();

// On logout
blacklistToken(token, tokenExpiryTimestamp);

// On request
if (isTokenBlacklisted(token)) {
  return res.status(401).json({ error: 'Token revoked' });
}

// Auto-cleanup (every hour)
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of blacklistedTokens.entries()) {
    if (expiry < now) {
      blacklistedTokens.delete(token);
    }
  }
}, 60 * 60 * 1000);
```

**Limitations**:
- In-memory only (lost on server restart)
- Single-server only (doesn't scale horizontally)
- **Production Recommendation**: Use Redis for distributed blacklist

---

## Security Architecture

### Defense in Depth

**Layer 1: Network Security**:
- HTTPS only (TLS 1.2+)
- CORS configured for specific origins
- Rate limiting on all endpoints

**Layer 2: Application Security**:
- Input validation (express-validator)
- Output encoding (automatic with JSON)
- CSRF protection (double-submit cookie)
- Security headers (Helmet.js)

**Layer 3: Authentication Security**:
- Bcrypt password hashing (10 rounds)
- JWT with secure configuration
- HttpOnly cookies (XSS protection)
- Token blacklist (logout support)

**Layer 4: Authorization Security**:
- Ownership verification
- Share link token validation
- Expiration checking

**Layer 5: Data Security**:
- Parameterized queries (Prisma ORM)
- No sensitive data in logs
- Secure password storage

### OWASP Top 10 Mitigations

| Vulnerability | Mitigation |
|--------------|------------|
| **A01 - Broken Access Control** | Ownership checks, share link validation, middleware authorization |
| **A02 - Cryptographic Failures** | Bcrypt for passwords, HTTPS only, HttpOnly cookies |
| **A03 - Injection** | Prisma ORM (parameterized queries), input validation |
| **A04 - Insecure Design** | Defense in depth, principle of least privilege |
| **A05 - Security Misconfiguration** | Helmet security headers, secure defaults, environment variables |
| **A06 - Vulnerable Components** | Regular `npm audit`, dependency updates, version pinning |
| **A07 - Authentication Failures** | Rate limiting, strong password policy, bcrypt hashing |
| **A08 - Software/Data Integrity** | CSRF protection, SRI (if using CDN), signed JWTs |
| **A09 - Logging Failures** | Pino logging, error tracking, audit trails (partial) |
| **A10 - SSRF** | Input validation, URL allowlisting (if applicable) |

### Security Headers (Helmet.js)

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind requires inline
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // For development
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
}));
```

**Headers Set**:
- `Content-Security-Policy`: Restricts resource loading
- `X-Frame-Options: DENY`: Prevents clickjacking
- `X-Content-Type-Options: nosniff`: Prevents MIME sniffing
- `Strict-Transport-Security`: Enforces HTTPS
- `X-XSS-Protection: 1; mode=block`: Browser XSS filter

### CSRF Protection

**Double-Submit Cookie Pattern**:

1. **Server generates CSRF token**:
   ```typescript
   const token = crypto.randomBytes(32).toString('hex');
   res.cookie('gantt_csrf_token', token, {
     httpOnly: false,  // Must be readable by JavaScript
     secure: true,     // HTTPS only
     sameSite: 'strict'
   });
   ```

2. **Client reads token from cookie**:
   ```typescript
   const csrfToken = document.cookie
     .split('; ')
     .find(row => row.startsWith('gantt_csrf_token='))
     ?.split('=')[1];
   ```

3. **Client sends token in header**:
   ```typescript
   axios.post('/api/projects', data, {
     headers: {
       'X-CSRF-Token': csrfToken
     }
   });
   ```

4. **Server verifies cookie matches header**:
   ```typescript
   const cookieToken = req.cookies.gantt_csrf_token;
   const headerToken = req.headers['x-csrf-token'];

   if (crypto.timingSafeEqual(
     Buffer.from(cookieToken),
     Buffer.from(headerToken)
   )) {
     // Valid!
   }
   ```

**Why This Works**:
- Attacker cannot read cookies from other domains (same-origin policy)
- Attacker cannot guess random token
- Requires both cookie AND header to match

### Input Validation

**Validation Strategy**:

1. **Schema Validation** (express-validator):
   ```typescript
   export const createProjectValidation = [
     body('name')
       .trim()
       .notEmpty().withMessage('Name is required')
       .isLength({ max: 200 }).withMessage('Name too long'),
     body('isPublic')
       .optional()
       .isBoolean().withMessage('Must be boolean'),
   ];
   ```

2. **Business Logic Validation** (in controller):
   ```typescript
   if (endDate <= startDate) {
     throw new BadRequestError('End date must be after start date');
   }
   ```

3. **Database Constraints** (Prisma schema):
   ```prisma
   model User {
     email String @unique  // Enforces uniqueness
   }
   ```

**Validation Coverage**:
- All user inputs validated before processing
- Type checking (TypeScript + runtime validation)
- Range checking (dates, lengths, numbers)
- Format checking (email, UUID, color codes)
- Business rule enforcement

---

## Frontend Architecture

### Component Architecture

**Component Types**:

1. **Presentational Components**:
   - Pure functions of props
   - No state or side effects
   - Examples: Button, Input, Card

2. **Container Components**:
   - Manage state and side effects
   - Connect to Context/React Query
   - Examples: ProjectList, GanttChart

3. **Layout Components**:
   - Page structure and layout
   - Examples: Header, Sidebar, Layout

4. **Page Components**:
   - Route-level components
   - Examples: HomePage, ProjectPage

**Component Structure**:
```typescript
// Example: TaskBar.tsx
interface TaskBarProps {
  task: Task;
  timeScale: TimeScale;
  onUpdate: (task: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  readOnly?: boolean;
}

export const TaskBar: React.FC<TaskBarProps> = ({
  task,
  timeScale,
  onUpdate,
  onDelete,
  readOnly = false
}) => {
  // Component logic
  return (
    // JSX
  );
};
```

### Styling Strategy

**Tailwind CSS Approach**:
```typescript
// Utility classes for rapid development
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-lg font-semibold text-gray-900">
    {project.name}
  </h2>
</div>
```

**Custom Components**:
```typescript
// When needed, create reusable styled components
const Button = styled.button`
  /* Custom styles */
`;
```

**Responsive Design**:
```typescript
// Tailwind breakpoint classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

### Routing

**React Router v7**:
```typescript
// routes/index.tsx
import { Routes, Route } from 'react-router-dom';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects" element={
        <ProtectedRoute>
          <ProjectListPage />
        </ProtectedRoute>
      } />
      <Route path="/projects/:id" element={
        <ProtectedRoute>
          <ProjectPage />
        </ProtectedRoute>
      } />
      <Route path="/share/:token" element={<SharedProjectPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
```

**Protected Routes**:
```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, requireAuth, navigate]);

  if (isLoading) return <LoadingSpinner />;
  if (requireAuth && !isAuthenticated) return null;

  return <>{children}</>;
};
```

---

## State Management

### State Architecture

**State Layers**:

1. **Server State** (React Query):
   - API data (projects, tasks, versions)
   - Cached with automatic invalidation
   - Optimistic updates

2. **Global UI State** (Context):
   - Authentication state (AuthContext)
   - Project/task editing (ProjectContext)
   - Version history (VersionContext)

3. **Local Component State** (useState):
   - Form inputs
   - UI toggles
   - Transient state

4. **URL State** (React Router):
   - Current route
   - Query parameters
   - Route parameters

### React Query Setup

**Configuration**:
```typescript
// providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      cacheTime: 30 * 60 * 1000,     // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Custom Hooks**:
```typescript
// hooks/useProjects.ts
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => api.getProject(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => api.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

### Context Providers

**AuthContext**:
```typescript
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Implementation...

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

**ProjectContext** (with Auto-Save):
```typescript
interface ProjectContextValue {
  project: Project | null;
  tasks: Task[];
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  addTask: (task: Partial<Task>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  save: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
```

### Optimistic Updates

**Pattern**:
```typescript
export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskId: string; updates: Partial<Task> }) =>
      api.updateTask(projectId, data.taskId, data.updates),

    // Optimistic update
    onMutate: async ({ taskId, updates }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['projects', projectId] });

      // Snapshot current value
      const previous = queryClient.getQueryData(['projects', projectId]);

      // Optimistically update
      queryClient.setQueryData(['projects', projectId], (old: any) => ({
        ...old,
        tasks: old.tasks.map((t: Task) =>
          t.id === taskId ? { ...t, ...updates } : t
        ),
      }));

      return { previous };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['projects', projectId], context.previous);
      }
    },

    // Refetch on success/error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}
```

---

## Performance Optimization

### Frontend Optimization

**Code Splitting**:
```typescript
// Lazy load routes
const ProjectPage = lazy(() => import('./pages/ProjectPage'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <ProjectPage />
</Suspense>
```

**Memoization**:
```typescript
// Expensive calculations
const sortedTasks = useMemo(() => {
  return tasks.sort((a, b) => a.position - b.position);
}, [tasks]);

// Callbacks
const handleTaskUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
  updateTask(taskId, updates);
}, [updateTask]);

// Components
const TaskBar = React.memo(({ task, onUpdate }: TaskBarProps) => {
  // Only re-render if task or onUpdate changes
});
```

**Virtualization** (for large lists):
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={tasks.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <TaskRow task={tasks[index]} />
    </div>
  )}
</FixedSizeList>
```

**Debouncing**:
```typescript
// Auto-save debounce
const debouncedSave = useMemo(
  () => debounce((data) => api.saveProject(data), 5000),
  []
);

// Usage
useEffect(() => {
  if (isDirty) {
    debouncedSave(projectData);
  }
}, [projectData, isDirty, debouncedSave]);
```

### Backend Optimization

**Database Query Optimization**:
```typescript
// Eager loading (avoid N+1)
const projects = await prisma.project.findMany({
  include: {
    owner: {
      select: { id: true, email: true } // Select only needed fields
    },
    tasks: {
      orderBy: { position: 'asc' }
    },
    _count: {
      select: {
        tasks: true,
        versions: true
      }
    }
  }
});
```

**Pagination**:
```typescript
// Cursor-based pagination (preferred for real-time data)
const tasks = await prisma.task.findMany({
  take: limit,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: 'desc' }
});

// Offset-based pagination (simpler)
const tasks = await prisma.task.findMany({
  take: limit,
  skip: (page - 1) * limit
});
```

**Caching**:
```typescript
// In-memory caching (for frequently accessed data)
const cache = new Map<string, { data: any; expiry: number }>();

function getCached<T>(key: string, fetchFn: () => Promise<T>, ttl: number): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return Promise.resolve(cached.data);
  }

  return fetchFn().then(data => {
    cache.set(key, { data, expiry: Date.now() + ttl });
    return data;
  });
}
```

### Bundle Optimization

**Vite Configuration**:
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'gantt': ['./src/components/GanttChart'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios']
  }
});
```

---

## Testing Strategy

### Test Pyramid

```
          ┌─────────────┐
          │     E2E     │ (10%)
          │   Cypress   │
          └─────────────┘
         ┌───────────────┐
         │  Integration  │ (30%)
         │  Jest + RTL   │
         └───────────────┘
       ┌───────────────────┐
       │    Unit Tests     │ (60%)
       │       Jest        │
       └───────────────────┘
```

### Unit Testing (Jest)

**Component Tests**:
```typescript
// TaskBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskBar } from './TaskBar';

describe('TaskBar', () => {
  const mockTask: Task = {
    id: '1',
    name: 'Test Task',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-10'),
    color: '#3B82F6',
    position: 0,
  };

  it('renders task name', () => {
    render(<TaskBar task={mockTask} timeScale="day" onUpdate={jest.fn()} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('calls onUpdate when dragged', () => {
    const onUpdate = jest.fn();
    render(<TaskBar task={mockTask} timeScale="day" onUpdate={onUpdate} />);

    const taskBar = screen.getByRole('button');
    fireEvent.dragStart(taskBar);
    fireEvent.dragEnd(taskBar);

    expect(onUpdate).toHaveBeenCalled();
  });
});
```

**Hook Tests**:
```typescript
// useAutoSave.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';

describe('useAutoSave', () => {
  it('debounces save calls', async () => {
    const saveFn = jest.fn();
    const { result } = renderHook(() => useAutoSave(saveFn, 1000));

    act(() => {
      result.current('data1');
      result.current('data2');
      result.current('data3');
    });

    // Should only call once after debounce
    await waitFor(() => expect(saveFn).toHaveBeenCalledTimes(1));
    expect(saveFn).toHaveBeenCalledWith('data3');
  });
});
```

### Integration Testing

**API Integration**:
```typescript
// project.controller.test.ts
import request from 'supertest';
import app from '../app';
import { createTestUser, getAuthToken } from '../test-utils';

describe('Project API', () => {
  let token: string;

  beforeAll(async () => {
    const user = await createTestUser();
    token = await getAuthToken(user);
  });

  it('POST /api/projects creates project', async () => {
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

### E2E Testing (Cypress)

**User Flow Tests**:
```typescript
// task-operations.cy.ts
describe('Task Operations', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'Password123!');
    cy.createProject({ name: 'Test Project' }).then((project) => {
      cy.visit(`/projects/${project.id}`);
    });
  });

  it('creates, edits, and deletes a task', () => {
    // Create task
    cy.get('[data-testid="add-task-button"]').click();
    cy.get('[data-testid="task-name-input"]').type('New Task');
    cy.get('[data-testid="start-date-input"]').type('2026-02-01');
    cy.get('[data-testid="end-date-input"]').type('2026-02-10');
    cy.get('[data-testid="create-task-submit"]').click();

    // Verify created
    cy.contains('New Task').should('be.visible');

    // Edit task
    cy.contains('New Task').click();
    cy.get('[data-testid="edit-task-button"]').click();
    cy.get('[data-testid="task-name-input"]').clear().type('Updated Task');
    cy.get('[data-testid="save-task-button"]').click();

    // Verify updated
    cy.contains('Updated Task').should('be.visible');

    // Delete task
    cy.contains('Updated Task').click();
    cy.get('[data-testid="delete-task-button"]').click();
    cy.get('[data-testid="confirm-delete"]').click();

    // Verify deleted
    cy.contains('Updated Task').should('not.exist');
  });
});
```

### Accessibility Testing (Jest-axe)

```typescript
// EmptyStates.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { NoProjects } from './EmptyStates';

expect.extend(toHaveNoViolations);

describe('EmptyStates Accessibility', () => {
  it('NoProjects has no a11y violations', async () => {
    const { container } = render(<NoProjects />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Test Coverage Goals

**Coverage Targets**:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

**Critical Paths** (100% coverage required):
- Authentication flows
- Authorization checks
- Data validation
- Payment/financial logic (if applicable)
- Security-critical code

---

## Deployment Architecture

### Environment Configuration

**Environments**:

1. **Development**:
   - Local machine
   - Hot reload enabled
   - Debug logging
   - Mock services

2. **Staging**:
   - Cloud-hosted
   - Production-like configuration
   - Test data
   - Integration testing

3. **Production**:
   - Cloud-hosted
   - Optimized builds
   - Error tracking
   - Real data

### Deployment Options

**Option 1: Vercel (Frontend) + Railway (Backend)**

Frontend (Vercel):
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

Backend (Railway):
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/api/health"
  }
}
```

**Option 2: Render (Full Stack)**

```yaml
# render.yaml
services:
  - type: web
    name: gantt-backend
    env: node
    buildCommand: cd server && npm install && npm run build
    startCommand: cd server && npm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true

  - type: web
    name: gantt-frontend
    env: static
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/dist

databases:
  - name: gantt-db
    databaseName: gantt_chart_db
    plan: starter
```

**Option 3: Docker + Kubernetes**

```dockerfile
# Dockerfile (Multi-stage build)
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 5000
CMD ["npm", "start"]
```

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gantt-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gantt-backend
  template:
    metadata:
      labels:
        app: gantt-backend
    spec:
      containers:
      - name: backend
        image: gantt-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: url
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### CI/CD Pipeline

**GitHub Actions**:
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Check test coverage
        run: npm run test:coverage

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          # Deployment commands

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deployment commands
```

---

## Monitoring & Observability

### Application Logging

**Pino Logger**:
```typescript
// config/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});

export default logger;
```

**Usage**:
```typescript
import logger from './config/logger';

// Info logging
logger.info({ userId, action: 'login' }, 'User logged in');

// Error logging
logger.error({ err, userId }, 'Failed to save project');

// Request logging
app.use(pinoHttp({ logger }));
```

### Error Tracking

**Sentry Integration** (optional):
```typescript
// config/sentry.ts
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}

export default Sentry;
```

### Health Checks

**Endpoints**:
```typescript
// routes/health.routes.ts

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe (includes DB check)
app.get('/api/health/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, database: 'connected' });
  } catch (error) {
    res.status(503).json({ success: false, database: 'disconnected' });
  }
});

// Liveness probe
app.get('/api/health/live', (req, res) => {
  res.json({ success: true });
});
```

### Performance Monitoring

**Metrics to Track**:
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate
- Database query time
- Cache hit rate
- Active connections

**Tools**:
- New Relic / DataDog (APM)
- Prometheus + Grafana (metrics)
- PostgreSQL `pg_stat_statements` (query analysis)

---

## Development Guidelines

### Code Style

**TypeScript**:
```typescript
// Use explicit types
function calculateDuration(startDate: Date, endDate: Date): number {
  return endDate.getTime() - startDate.getTime();
}

// Use interfaces for object shapes
interface Task {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

// Use enums for fixed sets
enum TimeScale {
  Day = 'day',
  Week = 'week',
  Month = 'month'
}
```

**Naming Conventions**:
- **Files**: kebab-case (`task-bar.tsx`, `use-auto-save.ts`)
- **Components**: PascalCase (`TaskBar`, `ProjectList`)
- **Functions**: camelCase (`calculateDuration`, `handleClick`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_TASKS`)
- **Interfaces**: PascalCase with 'I' prefix optional (`Task`, `ITaskProps`)

**File Organization**:
```
component/
├── ComponentName.tsx        # Component
├── ComponentName.test.tsx   # Tests
├── ComponentName.types.ts   # TypeScript types
├── ComponentName.styles.ts  # Styles (if using styled-components)
├── hooks/                   # Component-specific hooks
│   └── useComponentHook.ts
└── utils/                   # Component-specific utilities
    └── helpers.ts
```

### Git Workflow

**Branch Naming**:
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Production hotfixes
- `chore/task-description` - Maintenance tasks
- `docs/documentation-update` - Documentation

**Commit Messages**:
```
type(scope): subject

body

footer
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance

**Example**:
```
feat(gantt): add task color picker

Added color picker component to task creation form.
Users can now choose from 8 preset colors or use a custom color.

Closes #123
```

### Code Review Checklist

**Functionality**:
- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] Input validation present

**Code Quality**:
- [ ] Follows style guide
- [ ] No code duplication
- [ ] Functions are single-purpose
- [ ] Naming is clear and consistent

**Testing**:
- [ ] Unit tests added/updated
- [ ] Tests pass locally
- [ ] Edge cases tested
- [ ] Test coverage acceptable

**Security**:
- [ ] No sensitive data exposed
- [ ] Input sanitized
- [ ] Authorization checks present
- [ ] SQL injection prevented

**Performance**:
- [ ] No unnecessary re-renders
- [ ] Efficient database queries
- [ ] Proper caching used
- [ ] No memory leaks

---

## Future Enhancements

### Planned Features

**Phase 1** (Q2 2026):
1. **Task Dependencies**: Visual dependency links between tasks
2. **Task Assignment**: Assign tasks to team members
3. **Real-time Collaboration**: WebSocket-based live updates
4. **Email Notifications**: Notify on task changes, approaching deadlines

**Phase 2** (Q3 2026):
1. **Recurring Tasks**: Templates for repeating tasks
2. **Gantt Export**: Export to PDF, PNG, Excel
3. **Mobile App**: Native iOS/Android apps
4. **Advanced Permissions**: Role-based access control (RBAC)

**Phase 3** (Q4 2026):
1. **Resource Management**: Track resource allocation
2. **Budget Tracking**: Cost estimation and tracking
3. **Advanced Analytics**: Project insights and reports
4. **Integrations**: Jira, Trello, Slack, Microsoft Teams

### Technical Debt

**Current Limitations**:
1. **Token Blacklist**: In-memory only, need Redis for production
2. **Version Cleanup**: Manual cleanup process, should be automated
3. **Search**: Basic text search, consider Elasticsearch
4. **File Uploads**: Not implemented, needed for attachments
5. **Audit Logging**: Partial implementation, needs completion

**Refactoring Opportunities**:
1. **API Versioning**: Implement explicit `/api/v1/` prefix
2. **GraphQL**: Consider GraphQL for complex queries
3. **Microservices**: Split into services if scale requires
4. **Event Sourcing**: For better audit trails and time travel

---

## Appendix

### Glossary

- **JWT**: JSON Web Token, stateless authentication token
- **CSRF**: Cross-Site Request Forgery attack
- **XSS**: Cross-Site Scripting attack
- **CORS**: Cross-Origin Resource Sharing
- **ORM**: Object-Relational Mapping
- **SSR**: Server-Side Rendering
- **SPA**: Single-Page Application
- **RBAC**: Role-Based Access Control
- **ACID**: Atomicity, Consistency, Isolation, Durability

### References

**Documentation**:
- [React Documentation](https://react.dev)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

**Security**:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

**Standards**:
- [REST API Design](https://restfulapi.net/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## Document Metadata

**Version**: 1.0
**Last Updated**: February 10, 2026
**Authors**: Development Team, Architecture Team
**Review Date**: May 10, 2026
**Status**: Approved

**Change Log**:
- v1.0 (2026-02-10): Initial release

---

**End of Technical Design Document**
