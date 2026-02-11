# API Reference Documentation

**Version:** 1.0.0
**Base URL:** `https://your-domain.com/api`
**Last Updated:** February 10, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Endpoints](#endpoints)
   - [Health Check](#health-check-endpoints)
   - [Authentication](#authentication-endpoints)
   - [Projects](#project-endpoints)
   - [Tasks](#task-endpoints)
   - [Versions](#version-endpoints)
   - [Share Links](#share-link-endpoints)
6. [WebSocket API](#websocket-api)
7. [Changelog](#changelog)

---

## Overview

The Gantt Chart Application provides a RESTful API for managing projects, tasks, versions, and collaboration. All endpoints return JSON responses and follow standard HTTP conventions.

### API Characteristics

- **Protocol**: HTTPS only
- **Format**: JSON
- **Authentication**: JWT (JSON Web Tokens)
- **CSRF Protection**: Required for state-changing operations
- **Rate Limiting**: Yes (see Rate Limiting section)
- **Versioning**: Implicit v1 (future: `/api/v1/`)

### Base Response Format

**Success Response**:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* response data */
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* additional context */ }
  },
  "statusCode": 400
}
```

---

## Authentication

### Overview

The API uses JWT (JSON Web Tokens) for authentication. Tokens are stored in HttpOnly cookies for security.

### Authentication Flow

1. **Register or Login**: Obtain JWT token
2. **Token Storage**: Automatically stored in HttpOnly cookie
3. **API Requests**: Token sent automatically with each request
4. **Token Refresh**: Handled automatically (if refresh token implemented)
5. **Logout**: Revoke token and clear cookie

### Authentication Headers

**Primary Method** (Automatic):
```http
Cookie: gantt_auth_token=<jwt-token>
```

**Alternative Method** (Manual):
```http
Authorization: Bearer <jwt-token>
```

### CSRF Protection

For state-changing operations (POST, PUT, PATCH, DELETE), include CSRF token:

```http
X-CSRF-Token: <csrf-token>
Cookie: gantt_csrf_token=<csrf-token>
```

**Obtaining CSRF Token**:
```javascript
// Client-side
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('gantt_csrf_token='))
  ?.split('=')[1];
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH request |
| 201 | Created | Successful POST request (resource created) |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Invalid input/validation error |
| 401 | Unauthorized | Authentication required or token invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (e.g., duplicate email) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Codes

**Authentication** (`AUTH_*`):
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Token revoked
- `AUTH_004`: Password too weak

**Authorization** (`AUTHZ_*`):
- `AUTHZ_001`: Not project owner
- `AUTHZ_002`: Share link expired
- `AUTHZ_003`: Insufficient permissions

**Validation** (`VAL_*`):
- `VAL_001`: Required field missing
- `VAL_002`: Invalid format
- `VAL_003`: Value out of range

**Business Logic** (`BIZ_*`):
- `BIZ_001`: Operation not allowed
- `BIZ_002`: Resource conflict

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "End date must be after start date",
    "field": "endDate",
    "details": {
      "startDate": "2026-02-10",
      "endDate": "2026-02-05"
    }
  },
  "statusCode": 400
}
```

---

## Rate Limiting

### Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| General API | 100 requests | 15 minutes |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1644422400
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 600
  },
  "statusCode": 429
}
```

---

## Endpoints

### Health Check Endpoints

#### Get Basic Health Status

```http
GET /api/health
```

**Description**: Check if the server is running.

**Authentication**: Not required

**Response**:
```json
{
  "success": true,
  "message": "Server is running successfully!",
  "timestamp": "2026-02-10T10:30:00.000Z"
}
```

---

#### Get Readiness Status

```http
GET /api/health/ready
```

**Description**: Check if the server is ready to accept requests (includes database connectivity).

**Authentication**: Not required

**Response**:
```json
{
  "success": true,
  "database": "connected",
  "timestamp": "2026-02-10T10:30:00.000Z"
}
```

---

### Authentication Endpoints

#### Register New User

```http
POST /api/auth/register
```

**Description**: Create a new user account.

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Validation**:
- `email`: Valid email format, unique
- `password`: Minimum 8 characters, must include uppercase, lowercase, and number

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "createdAt": "2026-02-10T10:30:00.000Z"
    }
  }
}
```

**Errors**:
- `409 Conflict`: Email already exists
- `400 Bad Request`: Validation errors

---

#### Login User

```http
POST /api/auth/login
```

**Description**: Authenticate user and receive JWT token.

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "createdAt": "2026-02-10T10:30:00.000Z"
    }
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded

**Note**: JWT token is set in HttpOnly cookie automatically.

---

#### Get Current User

```http
GET /api/auth/me
```

**Description**: Get authenticated user information.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "createdAt": "2026-02-10T10:30:00.000Z"
    }
  }
}
```

---

#### Verify Token

```http
GET /api/auth/verify
```

**Description**: Verify JWT token validity.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com"
    }
  }
}
```

---

#### Logout User

```http
POST /api/auth/logout
```

**Description**: Revoke JWT token and clear cookies.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Project Endpoints

#### List Projects

```http
GET /api/projects
```

**Description**: Get all accessible projects (owned + public).

**Authentication**: Required

**Query Parameters**:
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 10): Items per page
- `isPublic` (boolean, optional): Filter by public/private
- `search` (string, optional): Search in project names

**Example**:
```http
GET /api/projects?page=1&limit=20&isPublic=false&search=marketing
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Q1 Marketing Campaign",
        "isPublic": false,
        "ownerId": "user-id",
        "createdAt": "2026-01-15T10:00:00.000Z",
        "updatedAt": "2026-02-10T15:30:00.000Z",
        "owner": {
          "id": "user-id",
          "email": "owner@example.com",
          "createdAt": "2025-12-01T10:00:00.000Z"
        },
        "tasks": [
          {
            "id": "task-id",
            "name": "Design Phase",
            "startDate": "2026-02-01T00:00:00.000Z",
            "endDate": "2026-02-14T00:00:00.000Z",
            "color": "#3B82F6",
            "position": 0,
            "createdAt": "2026-01-15T11:00:00.000Z"
          }
        ],
        "_count": {
          "tasks": 12,
          "versions": 5
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasMore": true
    }
  }
}
```

---

#### Create Project

```http
POST /api/projects
```

**Description**: Create a new project.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "New Project",
  "isPublic": false
}
```

**Validation**:
- `name`: Required, max 200 characters
- `isPublic`: Optional, boolean (default: false)

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "id": "new-project-id",
      "name": "New Project",
      "isPublic": false,
      "ownerId": "user-id",
      "createdAt": "2026-02-10T16:00:00.000Z",
      "updatedAt": "2026-02-10T16:00:00.000Z",
      "owner": {
        "id": "user-id",
        "email": "user@example.com",
        "createdAt": "2025-12-01T10:00:00.000Z"
      }
    }
  }
}
```

---

#### Get Project

```http
GET /api/projects/:id
```

**Description**: Get a specific project with all tasks.

**Authentication**: Optional (required for private projects)

**Path Parameters**:
- `id`: Project UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "project-id",
      "name": "Q1 Marketing Campaign",
      "isPublic": false,
      "ownerId": "user-id",
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-02-10T15:30:00.000Z",
      "owner": {
        "id": "user-id",
        "email": "owner@example.com",
        "createdAt": "2025-12-01T10:00:00.000Z"
      },
      "tasks": [ /* array of tasks */ ],
      "_count": {
        "versions": 5,
        "shareLinks": 2
      }
    }
  }
}
```

**Errors**:
- `404 Not Found`: Project doesn't exist
- `403 Forbidden`: No access to private project

---

#### Update Project

```http
PUT /api/projects/:id
```

**Description**: Update project metadata.

**Authentication**: Required (must be owner)

**Path Parameters**:
- `id`: Project UUID

**Request Body**:
```json
{
  "name": "Updated Project Name",
  "isPublic": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "project": { /* updated project */ }
  }
}
```

**Errors**:
- `403 Forbidden`: Not project owner
- `404 Not Found`: Project doesn't exist

---

#### Delete Project

```http
DELETE /api/projects/:id
```

**Description**: Permanently delete a project and all associated data.

**Authentication**: Required (must be owner)

**Path Parameters**:
- `id`: Project UUID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Errors**:
- `403 Forbidden`: Not project owner
- `404 Not Found`: Project doesn't exist

**Warning**: This action is permanent and cannot be undone. All tasks, versions, and share links are also deleted.

---

### Task Endpoints

#### Get Project Tasks

```http
GET /api/projects/:projectId/tasks
```

**Description**: Get all tasks for a project.

**Authentication**: Optional (required for private projects)

**Path Parameters**:
- `projectId`: Project UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-id",
        "projectId": "project-id",
        "name": "Design Phase",
        "startDate": "2026-02-01T00:00:00.000Z",
        "endDate": "2026-02-14T00:00:00.000Z",
        "color": "#3B82F6",
        "position": 0,
        "createdAt": "2026-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

---

#### Create Task

```http
POST /api/projects/:projectId/tasks
```

**Description**: Create a new task in a project.

**Authentication**: Required (must be owner)

**Path Parameters**:
- `projectId`: Project UUID

**Request Body**:
```json
{
  "name": "New Task",
  "startDate": "2026-02-15T00:00:00.000Z",
  "endDate": "2026-02-28T00:00:00.000Z",
  "color": "#10B981",
  "position": 0,
  "createSnapshot": false
}
```

**Validation**:
- `name`: Required, max 200 characters
- `startDate`: Required, ISO 8601 date
- `endDate`: Required, must be after startDate
- `color`: Optional, hex color code (default: "#3B82F6")
- `position`: Optional, integer (default: 0)
- `createSnapshot`: Optional, boolean (default: false)

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "id": "new-task-id",
      "projectId": "project-id",
      "name": "New Task",
      "startDate": "2026-02-15T00:00:00.000Z",
      "endDate": "2026-02-28T00:00:00.000Z",
      "color": "#10B981",
      "position": 0,
      "createdAt": "2026-02-10T16:30:00.000Z"
    }
  }
}
```

---

#### Update Task

```http
PUT /api/tasks/:id
```

**Description**: Update a task.

**Authentication**: Required (must be project owner)

**Path Parameters**:
- `id`: Task UUID

**Request Body**:
```json
{
  "name": "Updated Task Name",
  "startDate": "2026-02-16T00:00:00.000Z",
  "endDate": "2026-03-01T00:00:00.000Z",
  "color": "#EF4444",
  "position": 1,
  "createSnapshot": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "task": { /* updated task */ }
  }
}
```

---

#### Bulk Update Tasks

```http
PATCH /api/projects/:projectId/tasks/bulk
```

**Description**: Update multiple tasks at once.

**Authentication**: Required (must be project owner)

**Path Parameters**:
- `projectId`: Project UUID

**Request Body**:
```json
{
  "tasks": [
    {
      "id": "task-1-id",
      "name": "Updated Task 1",
      "position": 0
    },
    {
      "id": "task-2-id",
      "startDate": "2026-03-01T00:00:00.000Z",
      "position": 1
    }
  ],
  "createSnapshot": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Tasks updated successfully",
  "data": {
    "tasks": [ /* updated tasks */ ]
  }
}
```

---

#### Delete Task

```http
DELETE /api/tasks/:id
```

**Description**: Delete a task.

**Authentication**: Required (must be project owner)

**Path Parameters**:
- `id`: Task UUID

**Query Parameters**:
- `createSnapshot` (boolean, optional): Create version before deletion

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

### Version Endpoints

#### List Versions

```http
GET /api/projects/:id/versions
```

**Description**: Get all versions for a project.

**Authentication**: Required (must be owner)

**Path Parameters**:
- `id`: Project UUID

**Query Parameters**:
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 10): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "version-id",
        "projectId": "project-id",
        "versionNumber": 5,
        "snapshotData": {
          "name": "Q1 Marketing Campaign",
          "tasks": [ /* array of tasks */ ],
          "isManual": true,
          "description": "Phase 1 Complete"
        },
        "createdAt": "2026-02-10T14:00:00.000Z",
        "createdBy": "user-id"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasMore": true
    }
  }
}
```

---

#### Create Version

```http
POST /api/projects/:id/versions
```

**Description**: Create a manual version snapshot.

**Authentication**: Required (must be owner)

**Path Parameters**:
- `id`: Project UUID

**Request Body**:
```json
{
  "description": "Milestone: Phase 1 Complete",
  "versionNumber": 6
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Version created successfully",
  "data": {
    "version": {
      "id": "new-version-id",
      "projectId": "project-id",
      "versionNumber": 6,
      "snapshotData": { /* current project state */ },
      "createdAt": "2026-02-10T17:00:00.000Z",
      "createdBy": "user-id"
    }
  }
}
```

---

#### Get Version

```http
GET /api/projects/:id/versions/:versionNumber
```

**Description**: Get a specific version.

**Authentication**: Required (must be owner)

**Path Parameters**:
- `id`: Project UUID
- `versionNumber`: Version number (integer)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "version": { /* version details */ }
  }
}
```

---

#### Delete Version

```http
DELETE /api/projects/:id/versions/:versionNumber
```

**Description**: Delete a version.

**Authentication**: Required (must be owner)

**Path Parameters**:
- `id`: Project UUID
- `versionNumber`: Version number (integer)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Version deleted successfully"
}
```

---

#### Restore Version

```http
POST /api/projects/:id/versions/:versionId/restore
```

**Description**: Restore project to a previous version.

**Authentication**: Required (must be owner)

**Path Parameters**:
- `id`: Project UUID
- `versionId`: Version UUID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Version restored successfully",
  "data": {
    "project": { /* restored project state */ }
  }
}
```

**Note**: Current project state is automatically backed up before restoration.

---

### Share Link Endpoints

#### Create Share Link

```http
POST /api/projects/:id/share-links
```

**Description**: Create a shareable link for a project.

**Authentication**: Required (must be owner)

**Path Parameters**:
- `id`: Project UUID

**Request Body**:
```json
{
  "accessType": "READONLY",
  "expiresAt": "2026-02-17T00:00:00.000Z"
}
```

**Validation**:
- `accessType`: Required, one of: "READONLY" or "EDITABLE"
- `expiresAt`: Optional, ISO 8601 date (null for no expiration)

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Share link created successfully",
  "data": {
    "shareLink": {
      "id": "share-link-id",
      "projectId": "project-id",
      "token": "unique-token-string",
      "accessType": "READONLY",
      "createdAt": "2026-02-10T17:30:00.000Z",
      "expiresAt": "2026-02-17T00:00:00.000Z"
    }
  }
}
```

---

#### List Share Links

```http
GET /api/projects/:id/share-links
```

**Description**: Get all share links for a project.

**Authentication**: Required (must be owner)

**Path Parameters**:
- `id`: Project UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "shareLinks": [
      {
        "id": "share-link-id",
        "projectId": "project-id",
        "token": "unique-token-string",
        "accessType": "READONLY",
        "createdAt": "2026-02-10T17:30:00.000Z",
        "expiresAt": "2026-02-17T00:00:00.000Z"
      }
    ]
  }
}
```

---

#### Revoke Share Link

```http
DELETE /api/share-links/:token
```

**Description**: Revoke (delete) a share link.

**Authentication**: Required (must be project owner)

**Path Parameters**:
- `token`: Share token

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Share link revoked successfully"
}
```

---

#### Access Shared Project

```http
GET /api/share/:token
```

**Description**: Access a project via share link.

**Authentication**: Not required

**Path Parameters**:
- `token`: Share token

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "project": { /* project details */ },
    "accessType": "READONLY",
    "expiresAt": "2026-02-17T00:00:00.000Z"
  }
}
```

**Errors**:
- `404 Not Found`: Invalid token
- `403 Forbidden`: Link expired

---

## WebSocket API

### Overview

WebSocket API for real-time collaboration (planned feature).

**Endpoint**: `wss://your-domain.com/ws`

### Connection

```javascript
const ws = new WebSocket('wss://your-domain.com/ws');

ws.onopen = () => {
  // Send authentication
  ws.send(JSON.stringify({
    type: 'auth',
    token: jwtToken
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle message
};
```

### Message Types

**Subscribe to Project**:
```json
{
  "type": "subscribe",
  "projectId": "project-id"
}
```

**Task Update Broadcast**:
```json
{
  "type": "task:update",
  "projectId": "project-id",
  "task": { /* updated task */ },
  "userId": "user-id"
}
```

**User Presence**:
```json
{
  "type": "presence:update",
  "projectId": "project-id",
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "lastSeen": "2026-02-10T18:00:00.000Z"
    }
  ]
}
```

---

## Changelog

### Version 1.0.0 (2026-02-10)

**Initial Release**:
- Authentication endpoints (register, login, logout)
- Project CRUD operations
- Task CRUD operations
- Version history management
- Share link functionality
- Rate limiting
- CSRF protection
- HttpOnly cookie authentication

**Security Enhancements**:
- JWT token blacklist
- Helmet security headers
- Input validation
- SQL injection protection

---

## Support

### Getting Help

**Documentation**: See USER_MANUAL.md and SUPPORT_MANUAL.md
**Bug Reports**: Submit via GitHub Issues
**API Questions**: Contact support@your-domain.com

### API Status

**Status Page**: https://status.your-domain.com
**Uptime**: 99.9% SLA
**Maintenance Windows**: Saturdays 2-4 AM UTC

---

## Legal

### Terms of Use

By using this API, you agree to:
- Use the API only for authorized purposes
- Not exceed rate limits
- Not attempt to bypass security measures
- Comply with all applicable laws

### Data Privacy

- User data is stored securely
- Passwords are hashed with bcrypt
- Sensitive data is never logged
- GDPR compliant (if applicable)

---

**End of API Reference**
