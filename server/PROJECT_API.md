# Project Management API Documentation

## Overview

RESTful API endpoints for managing projects and project versions in the Gantt chart application.

**Base URL:** `http://localhost:5000/api`

---

## Table of Contents

1. [Project Endpoints](#project-endpoints)
2. [Project Version Endpoints](#project-version-endpoints)
3. [Authentication](#authentication)
4. [Authorization](#authorization)
5. [Error Handling](#error-handling)
6. [Testing](#testing)

---

## Project Endpoints

### 1. List All Projects

Get all projects for the authenticated user with pagination and filtering.

**Endpoint:** `GET /api/projects`

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `isPublic` (optional): Filter by public/private ("true" or "false")
- `search` (optional): Search by project name (case-insensitive)

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "Project Name",
        "isPublic": false,
        "ownerId": "uuid",
        "createdAt": "2026-02-07T00:00:00.000Z",
        "updatedAt": "2026-02-07T00:00:00.000Z",
        "owner": {
          "id": "uuid",
          "email": "user@example.com",
          "createdAt": "2026-02-07T00:00:00.000Z"
        },
        "tasks": [],
        "_count": {
          "tasks": 0,
          "versions": 0
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1,
      "hasMore": false
    }
  }
}
```

**Access Rules:**
- Returns user's own projects
- Returns all public projects
- Excludes other users' private projects

**Example:**
```bash
curl -X GET "http://localhost:5000/api/projects?page=1&limit=10&isPublic=false&search=My Project" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Create Project

Create a new project.

**Endpoint:** `POST /api/projects`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "My New Project",
  "isPublic": false
}
```

**Validation:**
- `name`: Required, 1-200 characters
- `isPublic`: Optional, boolean (default: false)

**Response:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "id": "uuid",
      "name": "My New Project",
      "isPublic": false,
      "ownerId": "uuid",
      "createdAt": "2026-02-07T00:00:00.000Z",
      "updatedAt": "2026-02-07T00:00:00.000Z",
      "owner": {
        "id": "uuid",
        "email": "user@example.com",
        "createdAt": "2026-02-07T00:00:00.000Z"
      }
    }
  }
}
```

**Status Code:** `201 Created`

**Example:**
```bash
curl -X POST "http://localhost:5000/api/projects" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My New Project", "isPublic": false}'
```

---

### 3. Get Single Project

Get a single project by ID with all tasks.

**Endpoint:** `GET /api/projects/:id`

**Authentication:** Optional (but required for private projects)

**URL Parameters:**
- `id`: Project UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "uuid",
      "name": "Project Name",
      "isPublic": false,
      "ownerId": "uuid",
      "createdAt": "2026-02-07T00:00:00.000Z",
      "updatedAt": "2026-02-07T00:00:00.000Z",
      "owner": {
        "id": "uuid",
        "email": "user@example.com",
        "createdAt": "2026-02-07T00:00:00.000Z"
      },
      "tasks": [],
      "_count": {
        "versions": 0,
        "shareLinks": 0
      }
    }
  }
}
```

**Access Rules:**
- Public projects: Anyone can access
- Private projects: Only the owner can access

**Status Codes:**
- `200 OK`: Success
- `403 Forbidden`: User doesn't have access to private project
- `404 Not Found`: Project doesn't exist

**Example:**
```bash
# Public project (no auth required)
curl -X GET "http://localhost:5000/api/projects/PROJECT_UUID"

# Private project (auth required)
curl -X GET "http://localhost:5000/api/projects/PROJECT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Update Project

Update project metadata (name, visibility).

**Endpoint:** `PUT /api/projects/:id`

**Authentication:** Required

**URL Parameters:**
- `id`: Project UUID

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "isPublic": true
}
```

**Validation:**
- `name`: Optional, 1-200 characters
- `isPublic`: Optional, boolean

**Response:**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "project": {
      "id": "uuid",
      "name": "Updated Project Name",
      "isPublic": true,
      "ownerId": "uuid",
      "createdAt": "2026-02-07T00:00:00.000Z",
      "updatedAt": "2026-02-07T00:00:00.000Z",
      "owner": {
        "id": "uuid",
        "email": "user@example.com",
        "createdAt": "2026-02-07T00:00:00.000Z"
      },
      "tasks": []
    }
  }
}
```

**Authorization:** User must be the project owner

**Status Codes:**
- `200 OK`: Success
- `403 Forbidden`: User is not the project owner
- `404 Not Found`: Project doesn't exist

**Example:**
```bash
curl -X PUT "http://localhost:5000/api/projects/PROJECT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "isPublic": true}'
```

---

### 5. Delete Project

Permanently delete a project (cascade deletes related tasks, versions, and share links).

**Endpoint:** `DELETE /api/projects/:id`

**Authentication:** Required

**URL Parameters:**
- `id`: Project UUID

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Authorization:** User must be the project owner

**Status Codes:**
- `200 OK`: Success
- `403 Forbidden`: User is not the project owner
- `404 Not Found`: Project doesn't exist

⚠️ **Warning:** This is a hard delete that cascades to:
- All tasks in the project
- All project versions
- All share links

**Example:**
```bash
curl -X DELETE "http://localhost:5000/api/projects/PROJECT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Project Version Endpoints

### 1. List All Versions

Get all versions for a project.

**Endpoint:** `GET /api/projects/:id/versions`

**Authentication:** Optional (but required for private projects)

**URL Parameters:**
- `id`: Project UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "uuid",
        "projectId": "uuid",
        "versionNumber": 1,
        "snapshotData": {
          "tasks": [],
          "metadata": {}
        },
        "createdAt": "2026-02-07T00:00:00.000Z",
        "project": {
          "id": "uuid",
          "name": "Project Name"
        }
      }
    ]
  }
}
```

**Access Rules:**
- Public projects: Anyone can access versions
- Private projects: Only the owner can access versions

**Status Codes:**
- `200 OK`: Success
- `403 Forbidden`: User doesn't have access to project
- `404 Not Found`: Project doesn't exist

**Example:**
```bash
curl -X GET "http://localhost:5000/api/projects/PROJECT_UUID/versions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Create Version

Create a new project version (snapshot).

**Endpoint:** `POST /api/projects/:id/versions`

**Authentication:** Required

**URL Parameters:**
- `id`: Project UUID

**Request Body:**
```json
{
  "versionNumber": 1,
  "snapshotData": {
    "tasks": [
      {
        "id": "uuid",
        "name": "Task 1",
        "startDate": "2026-02-01",
        "endDate": "2026-02-10"
      }
    ],
    "metadata": {
      "description": "Initial version"
    }
  }
}
```

**Validation:**
- `versionNumber`: Required, positive integer
- `snapshotData`: Required, JSON object

**Response:**
```json
{
  "success": true,
  "message": "Project version created successfully",
  "data": {
    "version": {
      "id": "uuid",
      "projectId": "uuid",
      "versionNumber": 1,
      "snapshotData": {
        "tasks": [],
        "metadata": {}
      },
      "createdAt": "2026-02-07T00:00:00.000Z",
      "project": {
        "id": "uuid",
        "name": "Project Name"
      }
    }
  }
}
```

**Authorization:** User must be the project owner

**Status Codes:**
- `201 Created`: Success
- `400 Bad Request`: Version number already exists
- `403 Forbidden`: User is not the project owner
- `404 Not Found`: Project doesn't exist

**Example:**
```bash
curl -X POST "http://localhost:5000/api/projects/PROJECT_UUID/versions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"versionNumber": 1, "snapshotData": {"tasks": []}}'
```

---

### 3. Get Specific Version

Get a specific version by version number.

**Endpoint:** `GET /api/projects/:id/versions/:versionNumber`

**Authentication:** Optional (but required for private projects)

**URL Parameters:**
- `id`: Project UUID
- `versionNumber`: Version number (integer)

**Response:**
```json
{
  "success": true,
  "data": {
    "version": {
      "id": "uuid",
      "projectId": "uuid",
      "versionNumber": 1,
      "snapshotData": {
        "tasks": [],
        "metadata": {}
      },
      "createdAt": "2026-02-07T00:00:00.000Z",
      "project": {
        "id": "uuid",
        "name": "Project Name"
      }
    }
  }
}
```

**Access Rules:**
- Public projects: Anyone can access versions
- Private projects: Only the owner can access versions

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid version number
- `403 Forbidden`: User doesn't have access to project
- `404 Not Found`: Project or version doesn't exist

**Example:**
```bash
curl -X GET "http://localhost:5000/api/projects/PROJECT_UUID/versions/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Delete Version

Delete a specific version.

**Endpoint:** `DELETE /api/projects/:id/versions/:versionNumber`

**Authentication:** Required

**URL Parameters:**
- `id`: Project UUID
- `versionNumber`: Version number (integer)

**Response:**
```json
{
  "success": true,
  "message": "Project version deleted successfully"
}
```

**Authorization:** User must be the project owner

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid version number
- `403 Forbidden`: User is not the project owner
- `404 Not Found`: Project or version doesn't exist

**Example:**
```bash
curl -X DELETE "http://localhost:5000/api/projects/PROJECT_UUID/versions/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

To get a token, use the authentication endpoints:

```bash
# Register
curl -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}'

# Login
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}'
```

Both endpoints return:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Authorization

The API implements the following authorization patterns:

### 1. Owner-Only Access
These endpoints require the authenticated user to be the project owner:
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/versions` - Create version
- `DELETE /api/projects/:id/versions/:versionNumber` - Delete version

### 2. Owner or Public Access
These endpoints allow access if:
- User is the project owner, OR
- Project is public (no authentication required)

Endpoints:
- `GET /api/projects/:id` - View project
- `GET /api/projects/:id/versions` - List versions
- `GET /api/projects/:id/versions/:versionNumber` - View version

### 3. Authenticated User Access
These endpoints require any authenticated user:
- `GET /api/projects` - List projects (returns user's projects + public projects)
- `POST /api/projects` - Create project

---

## Error Handling

All endpoints return consistent error responses:

### Error Response Format

```json
{
  "success": false,
  "error": "Error message here",
  "statusCode": 400
}
```

### HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data or validation failed
- `401 Unauthorized` - Authentication token missing or invalid
- `403 Forbidden` - User doesn't have permission to access resource
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error

### Common Error Examples

**Missing Authentication:**
```json
{
  "success": false,
  "error": "Authentication required",
  "statusCode": 403
}
```

**Not Project Owner:**
```json
{
  "success": false,
  "error": "You do not own this project",
  "statusCode": 403
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Project name is required"
    }
  ],
  "statusCode": 400
}
```

**Resource Not Found:**
```json
{
  "success": false,
  "error": "Project not found",
  "statusCode": 404
}
```

---

## Testing

### Manual Testing with curl

1. **Register a user:**
```bash
curl -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'
```

2. **Login and save token:**
```bash
TOKEN=$(curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}' \
  | jq -r '.data.token')
```

3. **Create a project:**
```bash
PROJECT_ID=$(curl -X POST "http://localhost:5000/api/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project", "isPublic": false}' \
  | jq -r '.data.project.id')
```

4. **List projects:**
```bash
curl -X GET "http://localhost:5000/api/projects" \
  -H "Authorization: Bearer $TOKEN"
```

5. **Get project details:**
```bash
curl -X GET "http://localhost:5000/api/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

6. **Create a version:**
```bash
curl -X POST "http://localhost:5000/api/projects/$PROJECT_ID/versions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"versionNumber": 1, "snapshotData": {"tasks": [], "notes": "Initial version"}}'
```

7. **Update project:**
```bash
curl -X PUT "http://localhost:5000/api/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Project Name", "isPublic": true}'
```

### Testing with Postman

Import the following endpoints into Postman:

1. Set up an environment variable:
   - `baseUrl`: `http://localhost:5000`
   - `token`: (will be set after login)

2. Create requests for each endpoint using the examples above

3. Use Postman's Tests tab to save the token:
```javascript
// After login request
const response = pm.response.json();
pm.environment.set("token", response.data.token);
```

---

## Files Created

### Controllers
- `server/src/controllers/project.controller.ts` - Project CRUD operations
- `server/src/controllers/version.controller.ts` - Version management

### Validators
- `server/src/validators/project.validator.ts` - Project validation rules
- `server/src/validators/version.validator.ts` - Version validation rules

### Routes
- `server/src/routes/project.routes.ts` - Project routes
- `server/src/routes/version.routes.ts` - Version routes (nested under projects)

### Types
- `shared/src/types.ts` - Updated with project and version types

### Server Integration
- `server/src/index.ts` - Updated to mount project and version routes

---

## Next Steps

To complete the Gantt chart application, consider implementing:

1. **Task Management API**
   - `GET /api/projects/:id/tasks` - List tasks
   - `POST /api/projects/:id/tasks` - Create task
   - `PUT /api/projects/:id/tasks/:taskId` - Update task
   - `DELETE /api/projects/:id/tasks/:taskId` - Delete task
   - `PUT /api/projects/:id/tasks/bulk` - Bulk update (for drag/drop)

2. **Share Link API**
   - `GET /api/projects/:id/share-links` - List share links
   - `POST /api/projects/:id/share-links` - Create share link
   - `DELETE /api/share-links/:token` - Revoke share link
   - `GET /api/share-links/:token/validate` - Validate share link

3. **Frontend Integration**
   - Build React components for project management
   - Implement Gantt chart visualization
   - Add drag-and-drop task management
   - Create project versioning UI

4. **Testing**
   - Write integration tests for project endpoints
   - Write integration tests for version endpoints
   - Test authentication and authorization flows

5. **Additional Features**
   - WebSocket support for real-time collaboration
   - Export projects (PDF, PNG, JSON)
   - Project templates
   - User permissions and roles

---

## Summary

✅ **Implemented:**
- Complete project CRUD operations
- Project version management
- Pagination for project lists
- Search and filtering
- Owner-based authorization
- Public/private project access control
- Proper error handling
- Input validation
- TypeScript types

All endpoints are properly authenticated, authorized, and validated. The API is ready for frontend integration and testing.
