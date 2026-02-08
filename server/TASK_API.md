# Task Management API Documentation

## Overview

RESTful API endpoints for managing tasks (Gantt bars) in the Gantt chart application. Tasks represent work items with start/end dates that are visualized as bars on the Gantt chart.

**Base URL:** `http://localhost:5000/api`

---

## Table of Contents

1. [Task Endpoints](#task-endpoints)
2. [Validation Rules](#validation-rules)
3. [Version Snapshots](#version-snapshots)
4. [Authentication & Authorization](#authentication--authorization)
5. [Error Handling](#error-handling)
6. [Testing Examples](#testing-examples)

---

## Task Endpoints

### 1. Get All Tasks for a Project

Get all tasks for a project in position order.

**Endpoint:** `GET /api/projects/:projectId/tasks`

**Authentication:** Optional (but required for private projects)

**URL Parameters:**
- `projectId`: Project UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "projectId": "uuid",
        "name": "Task 1",
        "startDate": "2026-02-01T00:00:00.000Z",
        "endDate": "2026-02-10T00:00:00.000Z",
        "color": "#3b82f6",
        "position": 0,
        "createdAt": "2026-02-07T00:00:00.000Z"
      }
    ]
  }
}
```

**Access Rules:**
- Public projects: Anyone can access tasks
- Private projects: Only the owner can access tasks

**Status Codes:**
- `200 OK`: Success
- `403 Forbidden`: User doesn't have access to project
- `404 Not Found`: Project doesn't exist

**Example:**
```bash
curl -X GET "http://localhost:5000/api/projects/PROJECT_UUID/tasks" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Create Task

Create a new task for a project.

**Endpoint:** `POST /api/projects/:projectId/tasks`

**Authentication:** Required

**URL Parameters:**
- `projectId`: Project UUID

**Request Body:**
```json
{
  "name": "Design Homepage",
  "startDate": "2026-02-01T00:00:00.000Z",
  "endDate": "2026-02-10T00:00:00.000Z",
  "color": "#3b82f6",
  "position": 0,
  "createSnapshot": false
}
```

**Field Descriptions:**
- `name` (required): Task name (1-200 characters)
- `startDate` (required): Task start date (ISO 8601 format)
- `endDate` (required): Task end date (ISO 8601 format, must be after startDate)
- `color` (optional): Hex color code (default: #3b82f6)
- `position` (optional): Task position/order (default: auto-increment)
- `createSnapshot` (optional): Create version snapshot after creation (default: false)

**Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "id": "uuid",
      "projectId": "uuid",
      "name": "Design Homepage",
      "startDate": "2026-02-01T00:00:00.000Z",
      "endDate": "2026-02-10T00:00:00.000Z",
      "color": "#3b82f6",
      "position": 0,
      "createdAt": "2026-02-07T00:00:00.000Z"
    }
  }
}
```

**Validation:**
- ✅ Start date must be before end date
- ✅ Name cannot be empty
- ✅ Color must be valid hex format (#RRGGBB)
- ✅ Position must be non-negative integer

**Authorization:** User must be the project owner

**Status Codes:**
- `201 Created`: Success
- `400 Bad Request`: Validation failed or start date >= end date
- `403 Forbidden`: User is not the project owner
- `404 Not Found`: Project doesn't exist

**Example:**
```bash
curl -X POST "http://localhost:5000/api/projects/PROJECT_UUID/tasks" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Design Homepage",
    "startDate": "2026-02-01",
    "endDate": "2026-02-10",
    "color": "#3b82f6",
    "createSnapshot": true
  }'
```

---

### 3. Update Task

Update a task (resize, move, rename).

**Endpoint:** `PUT /api/tasks/:id`

**Authentication:** Required

**URL Parameters:**
- `id`: Task UUID

**Request Body:**
```json
{
  "name": "Updated Task Name",
  "startDate": "2026-02-05T00:00:00.000Z",
  "endDate": "2026-02-15T00:00:00.000Z",
  "color": "#ef4444",
  "position": 2,
  "createSnapshot": false
}
```

**Field Descriptions:**
All fields are optional:
- `name`: New task name
- `startDate`: New start date (must be before endDate)
- `endDate`: New end date (must be after startDate)
- `color`: New hex color code
- `position`: New position/order
- `createSnapshot`: Create version snapshot after update

**Response:**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "task": {
      "id": "uuid",
      "projectId": "uuid",
      "name": "Updated Task Name",
      "startDate": "2026-02-05T00:00:00.000Z",
      "endDate": "2026-02-15T00:00:00.000Z",
      "color": "#ef4444",
      "position": 2,
      "createdAt": "2026-02-07T00:00:00.000Z"
    }
  }
}
```

**Use Cases:**
- **Resize:** Update `startDate` and/or `endDate` to change task duration
- **Move:** Update `startDate` and `endDate` to shift task in timeline
- **Rename:** Update `name` to change task label
- **Recolor:** Update `color` to change task appearance
- **Reorder:** Update `position` to change task order

**Validation:**
- ✅ Start date must be before end date (if both provided)
- ✅ Validates against existing dates if only one date is updated

**Authorization:** User must be the project owner

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Validation failed or start date >= end date
- `403 Forbidden`: User is not the project owner
- `404 Not Found`: Task doesn't exist

**Example (Resize task):**
```bash
curl -X PUT "http://localhost:5000/api/tasks/TASK_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-02-01",
    "endDate": "2026-02-20"
  }'
```

**Example (Move task):**
```bash
curl -X PUT "http://localhost:5000/api/tasks/TASK_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-03-01",
    "endDate": "2026-03-10"
  }'
```

---

### 4. Update Task Position

Update only the task position/order (for reordering tasks in the list).

**Endpoint:** `PATCH /api/tasks/:id/position`

**Authentication:** Required

**URL Parameters:**
- `id`: Task UUID

**Request Body:**
```json
{
  "position": 5,
  "createSnapshot": false
}
```

**Field Descriptions:**
- `position` (required): New position (non-negative integer)
- `createSnapshot` (optional): Create version snapshot after update

**Response:**
```json
{
  "success": true,
  "message": "Task position updated successfully",
  "data": {
    "task": {
      "id": "uuid",
      "projectId": "uuid",
      "name": "Task Name",
      "startDate": "2026-02-01T00:00:00.000Z",
      "endDate": "2026-02-10T00:00:00.000Z",
      "color": "#3b82f6",
      "position": 5,
      "createdAt": "2026-02-07T00:00:00.000Z"
    }
  }
}
```

**Use Case:**
- Used when dragging tasks up/down in the task list to reorder them
- Does not affect the timeline position, only the vertical order

**Authorization:** User must be the project owner

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid position
- `403 Forbidden`: User is not the project owner
- `404 Not Found`: Task doesn't exist

**Example:**
```bash
curl -X PATCH "http://localhost:5000/api/tasks/TASK_UUID/position" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"position": 5}'
```

---

### 5. Delete Task

Delete a task permanently.

**Endpoint:** `DELETE /api/tasks/:id`

**Authentication:** Required

**URL Parameters:**
- `id`: Task UUID

**Request Body (optional):**
```json
{
  "createSnapshot": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

**Authorization:** User must be the project owner

**Status Codes:**
- `200 OK`: Success
- `403 Forbidden`: User is not the project owner
- `404 Not Found`: Task doesn't exist

**Example:**
```bash
curl -X DELETE "http://localhost:5000/api/tasks/TASK_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example (with snapshot):**
```bash
curl -X DELETE "http://localhost:5000/api/tasks/TASK_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"createSnapshot": true}'
```

---

### 6. Bulk Update Tasks

Update multiple tasks at once (optimized for drag-and-drop operations).

**Endpoint:** `PATCH /api/projects/:projectId/tasks/bulk`

**Authentication:** Required

**URL Parameters:**
- `projectId`: Project UUID

**Request Body:**
```json
{
  "tasks": [
    {
      "id": "task-uuid-1",
      "position": 0,
      "startDate": "2026-02-01T00:00:00.000Z",
      "endDate": "2026-02-05T00:00:00.000Z"
    },
    {
      "id": "task-uuid-2",
      "position": 1,
      "color": "#ef4444"
    },
    {
      "id": "task-uuid-3",
      "name": "Updated Name",
      "position": 2
    }
  ],
  "createSnapshot": false
}
```

**Field Descriptions:**
- `tasks` (required): Array of task updates (minimum 1 task)
  - `id` (required): Task UUID
  - `name` (optional): New task name
  - `startDate` (optional): New start date
  - `endDate` (optional): New end date
  - `color` (optional): New color
  - `position` (optional): New position
- `createSnapshot` (optional): Create version snapshot after update

**Response:**
```json
{
  "success": true,
  "message": "3 tasks updated successfully",
  "data": {
    "tasks": [
      {
        "id": "task-uuid-1",
        "projectId": "uuid",
        "name": "Task 1",
        "startDate": "2026-02-01T00:00:00.000Z",
        "endDate": "2026-02-05T00:00:00.000Z",
        "color": "#3b82f6",
        "position": 0,
        "createdAt": "2026-02-07T00:00:00.000Z"
      },
      // ... more tasks
    ]
  }
}
```

**Use Cases:**
- **Drag-and-drop reordering:** Update positions of multiple tasks
- **Timeline adjustments:** Move multiple tasks forward/backward
- **Bulk color changes:** Apply same color to multiple tasks
- **Auto-scheduling:** Recalculate and update dates for dependent tasks

**Validation:**
- ✅ All tasks must belong to the specified project
- ✅ Each task validates date range independently
- ✅ Updates are performed in a transaction (all or nothing)

**Authorization:** User must be the project owner

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Validation failed, tasks don't belong to project, or date range invalid
- `403 Forbidden`: User is not the project owner
- `404 Not Found`: Project doesn't exist

**Performance Note:**
This endpoint uses a database transaction to update all tasks atomically. It's much more efficient than updating tasks one by one.

**Example (Reorder tasks):**
```bash
curl -X PATCH "http://localhost:5000/api/projects/PROJECT_UUID/tasks/bulk" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {"id": "task-1", "position": 0},
      {"id": "task-2", "position": 1},
      {"id": "task-3", "position": 2}
    ]
  }'
```

**Example (Move multiple tasks forward 1 week):**
```bash
curl -X PATCH "http://localhost:5000/api/projects/PROJECT_UUID/tasks/bulk" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "id": "task-1",
        "startDate": "2026-02-08",
        "endDate": "2026-02-15"
      },
      {
        "id": "task-2",
        "startDate": "2026-02-09",
        "endDate": "2026-02-16"
      }
    ],
    "createSnapshot": true
  }'
```

---

## Validation Rules

### Date Validation

All task operations validate date ranges:

```typescript
startDate < endDate
```

**Examples:**

✅ **Valid:**
```json
{
  "startDate": "2026-02-01T00:00:00.000Z",
  "endDate": "2026-02-10T00:00:00.000Z"
}
```

❌ **Invalid:**
```json
{
  "startDate": "2026-02-10T00:00:00.000Z",
  "endDate": "2026-02-01T00:00:00.000Z"
}
// Error: "Start date must be before end date"
```

❌ **Invalid:**
```json
{
  "startDate": "2026-02-05T00:00:00.000Z",
  "endDate": "2026-02-05T00:00:00.000Z"
}
// Error: "Start date must be before end date"
```

### Partial Updates

When updating only one date field, validation checks against the existing date:

**Scenario:** Task currently has startDate: 2026-02-01, endDate: 2026-02-10

✅ **Valid:** Update only endDate
```json
{
  "endDate": "2026-02-20T00:00:00.000Z"
}
// Result: startDate: 2026-02-01, endDate: 2026-02-20
```

❌ **Invalid:** Update only endDate to before existing startDate
```json
{
  "endDate": "2026-01-15T00:00:00.000Z"
}
// Error: "Start date must be before end date"
```

### Color Validation

Colors must be valid hex color codes:

✅ **Valid:**
- `#3b82f6` (blue)
- `#ef4444` (red)
- `#10b981` (green)
- `#f59e0b` (yellow)
- `#8b5cf6` (purple)

❌ **Invalid:**
- `3b82f6` (missing #)
- `#3b8` (too short)
- `#3b82f6aa` (too long)
- `blue` (not hex format)

---

## Version Snapshots

Every task operation supports automatic version snapshot creation.

### What is a Version Snapshot?

A version snapshot captures the complete state of all tasks in a project at a specific point in time. This enables:
- **Undo/Redo functionality**
- **Project history tracking**
- **Recovery from mistakes**
- **Comparing different versions**

### When to Create Snapshots

Add `"createSnapshot": true` to the request body:

```json
{
  "name": "Task Name",
  "startDate": "2026-02-01",
  "endDate": "2026-02-10",
  "createSnapshot": true
}
```

**Recommended scenarios:**
- ✅ Before major bulk updates
- ✅ After completing a planning session
- ✅ Before/after drag-and-drop operations
- ✅ When making significant timeline changes

**Not recommended:**
- ❌ On every single task update (creates too many versions)
- ❌ During rapid consecutive edits
- ❌ For minor cosmetic changes (colors, names)

### Snapshot Contents

Each snapshot includes:
- All tasks with their current state
- Creation reason ("Task created", "Task updated", "Bulk task update", etc.)
- Timestamp
- Auto-incremented version number

**Example snapshot data:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "name": "Task 1",
      "startDate": "2026-02-01T00:00:00.000Z",
      "endDate": "2026-02-10T00:00:00.000Z",
      "color": "#3b82f6",
      "position": 0
    }
  ],
  "createdReason": "Task created",
  "timestamp": "2026-02-07T12:00:00.000Z"
}
```

### Accessing Snapshots

Snapshots are managed via the [Version API](PROJECT_API.md#project-version-endpoints):
- `GET /api/projects/:id/versions` - List all versions
- `GET /api/projects/:id/versions/:versionNumber` - Get specific version

---

## Authentication & Authorization

### Authentication

All write operations require JWT authentication:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

Get a token via the auth endpoints:
```bash
# Login
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}'
```

### Authorization Rules

#### Owner-Only Operations
These operations require the user to own the project:
- ✅ `POST /api/projects/:projectId/tasks` - Create task
- ✅ `PUT /api/tasks/:id` - Update task
- ✅ `DELETE /api/tasks/:id` - Delete task
- ✅ `PATCH /api/tasks/:id/position` - Update position
- ✅ `PATCH /api/projects/:projectId/tasks/bulk` - Bulk update

#### Owner or Public Access
These operations allow access if user owns project OR project is public:
- ✅ `GET /api/projects/:projectId/tasks` - View tasks

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message here",
  "statusCode": 400
}
```

### Common Errors

**Date Validation Error:**
```json
{
  "success": false,
  "error": "Start date must be before end date",
  "statusCode": 400
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

**Task Not Found:**
```json
{
  "success": false,
  "error": "Task not found",
  "statusCode": 404
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "startDate",
      "message": "Start date is required"
    },
    {
      "field": "color",
      "message": "Color must be a valid hex color code (e.g., #3b82f6)"
    }
  ],
  "statusCode": 400
}
```

**Bulk Update Error:**
```json
{
  "success": false,
  "error": "One or more tasks do not belong to this project",
  "statusCode": 400
}
```

---

## Testing Examples

### Complete Workflow Test

```bash
# 1. Set up authentication
TOKEN=$(curl -s -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}' \
  | jq -r '.data.token')

# 2. Create a project
PROJECT_ID=$(curl -s -X POST "http://localhost:5000/api/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Gantt Project", "isPublic": false}' \
  | jq -r '.data.project.id')

# 3. Create first task
TASK1_ID=$(curl -s -X POST "http://localhost:5000/api/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Design Phase",
    "startDate": "2026-02-01",
    "endDate": "2026-02-10",
    "color": "#3b82f6"
  }' | jq -r '.data.task.id')

# 4. Create second task
TASK2_ID=$(curl -s -X POST "http://localhost:5000/api/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Development Phase",
    "startDate": "2026-02-11",
    "endDate": "2026-02-28",
    "color": "#10b981"
  }' | jq -r '.data.task.id')

# 5. Create third task
TASK3_ID=$(curl -s -X POST "http://localhost:5000/api/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Testing Phase",
    "startDate": "2026-03-01",
    "endDate": "2026-03-10",
    "color": "#f59e0b",
    "createSnapshot": true
  }' | jq -r '.data.task.id')

# 6. View all tasks
curl -X GET "http://localhost:5000/api/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $TOKEN"

# 7. Update task (resize)
curl -X PUT "http://localhost:5000/api/tasks/$TASK1_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "endDate": "2026-02-15"
  }'

# 8. Update task position
curl -X PATCH "http://localhost:5000/api/tasks/$TASK3_ID/position" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"position": 0}'

# 9. Bulk update tasks (move all forward 1 week)
curl -X PATCH "http://localhost:5000/api/projects/$PROJECT_ID/tasks/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"tasks\": [
      {
        \"id\": \"$TASK1_ID\",
        \"startDate\": \"2026-02-08\",
        \"endDate\": \"2026-02-22\"
      },
      {
        \"id\": \"$TASK2_ID\",
        \"startDate\": \"2026-02-18\",
        \"endDate\": \"2026-03-07\"
      },
      {
        \"id\": \"$TASK3_ID\",
        \"startDate\": \"2026-03-08\",
        \"endDate\": \"2026-03-17\"
      }
    ],
    \"createSnapshot\": true
  }"

# 10. View versions
curl -X GET "http://localhost:5000/api/projects/$PROJECT_ID/versions" \
  -H "Authorization: Bearer $TOKEN"

# 11. Delete a task
curl -X DELETE "http://localhost:5000/api/tasks/$TASK2_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"createSnapshot": true}'
```

### Frontend Integration Example (React)

```typescript
// Task service
class TaskService {
  private baseUrl = 'http://localhost:5000/api'
  private token: string

  async createTask(projectId: string, taskData: CreateTaskDto) {
    const response = await fetch(
      `${this.baseUrl}/projects/${projectId}/tasks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      }
    )
    return response.json()
  }

  async updateTask(taskId: string, updates: UpdateTaskDto) {
    const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })
    return response.json()
  }

  async bulkUpdateTasks(projectId: string, tasks: Array<TaskUpdate>) {
    const response = await fetch(
      `${this.baseUrl}/projects/${projectId}/tasks/bulk`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks, createSnapshot: true }),
      }
    )
    return response.json()
  }
}

// Drag-and-drop handler example
function handleTaskDragEnd(result: DropResult) {
  const { draggableId, source, destination } = result

  if (!destination) return

  // Reorder tasks
  const newTasks = Array.from(tasks)
  const [removed] = newTasks.splice(source.index, 1)
  newTasks.splice(destination.index, 0, removed)

  // Update positions
  const updates = newTasks.map((task, index) => ({
    id: task.id,
    position: index,
  }))

  // Send bulk update
  await taskService.bulkUpdateTasks(projectId, updates)
}

// Timeline resize handler example
function handleTaskResize(taskId: string, newDates: DateRange) {
  await taskService.updateTask(taskId, {
    startDate: newDates.start,
    endDate: newDates.end,
    createSnapshot: false, // Don't snapshot every resize
  })
}
```

---

## Files Created

### Controllers
- `server/src/controllers/task.controller.ts` - Task CRUD operations and bulk update

### Validators
- `server/src/validators/task.validator.ts` - Task validation rules

### Routes
- `server/src/routes/task.routes.ts` - Task routes

### Server Integration
- `server/src/index.ts` - Updated to mount task routes

---

## Summary

✅ **Implemented:**
- Create task with auto-position
- Update task (resize, move, rename, recolor)
- Delete task
- Update task position/order
- Bulk update multiple tasks (optimized for drag-and-drop)
- Get all tasks for a project
- Date range validation (startDate < endDate)
- Auto-save to project (updatedAt timestamp)
- Optional version snapshot creation
- Full authentication and authorization
- Comprehensive input validation
- Error handling with detailed messages
- Transaction-based bulk updates

**Ready for:**
- Frontend Gantt chart integration
- Drag-and-drop task management
- Timeline interactions (resize, move)
- Undo/redo via version snapshots
- Real-time collaboration (with WebSocket support)

All endpoints are production-ready with proper validation, authorization, and error handling!
