# Database Setup - Quick Start Guide

## 🎯 What Was Created

### Database Schema (5 Models)

1. **User** - Authentication and user management
   - Email/password authentication
   - Owner of projects
   - Creator of project versions

2. **Project** - Gantt chart projects
   - Owned by a user
   - Can be public or private
   - Contains tasks, versions, and share links

3. **Task** - Individual tasks in Gantt charts
   - Belongs to a project
   - Has start/end dates, color, and position
   - Optimized for timeline visualization

4. **ProjectVersion** - Version history
   - Snapshots of project state
   - Tracks who created each version
   - Enables rollback and audit trail

5. **ShareLink** - Project sharing
   - Unique token-based sharing
   - Access control (readonly/editable)
   - Optional expiration dates

### TypeScript Types

- ✅ Database models exported to frontend
- ✅ DTOs for all CRUD operations
- ✅ API response types
- ✅ Frontend-specific Gantt chart types

### Seed Data

- 3 test users (password: `password123`)
  - john.doe@example.com
  - jane.smith@example.com
  - demo@example.com
- 4 sample projects
- 20 tasks across projects
- 3 project versions
- 3 share links

### Documentation

- 📄 `server/prisma/DATABASE.md` - Complete schema documentation
- 📄 `server/prisma/MIGRATIONS.md` - Migration guide and workflows
- 📄 `server/prisma/schema.prisma` - Prisma schema definition
- 📄 `server/prisma/seed.ts` - Seed data script

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database Connection

Edit `server/.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/gantt_chart_db?schema=public"
```

Replace `username` and `password` with your PostgreSQL credentials.

### 3. Create Database

```bash
createdb gantt_chart_db
```

Or using psql:
```sql
CREATE DATABASE gantt_chart_db;
```

### 4. Run Migrations

```bash
npm run prisma:migrate
```

This will:
- ✅ Create all database tables
- ✅ Set up indexes and relationships
- ✅ Generate Prisma Client

### 5. Seed Test Data (Optional)

```bash
npm run prisma:seed
```

This creates sample users, projects, and tasks for testing.

### 6. Verify Setup

Open Prisma Studio to view your data:

```bash
npm run prisma:studio
```

Visit http://localhost:5555

## 📊 Database Schema Overview

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ owns
       │
       ├──────> ┌─────────────┐
       │        │   Project   │
       │        └──────┬──────┘
       │               │
       │               ├──────> ┌─────────────┐
       │               │        │    Task     │
       │               │        └─────────────┘
       │               │
       │               ├──────> ┌──────────────────┐
       │               │        │  ProjectVersion  │
       │               │        └─────────┬────────┘
       │               │                  │ created_by
       │               │                  │
       └───────────────┼──────────────────┘
                       │
                       └──────> ┌─────────────┐
                                │  ShareLink  │
                                └─────────────┘
```

## 🔑 Key Features

### Performance

- ✅ Strategic indexes on all foreign keys
- ✅ Indexed email lookups for authentication
- ✅ Indexed token lookups for share links
- ✅ Date range indexes for task queries
- ✅ Position index for ordered task retrieval

### Data Integrity

- ✅ Cascade deletes configured
- ✅ Unique constraints on emails and tokens
- ✅ Foreign key relationships enforced
- ✅ Unique version numbers per project

### Security

- ✅ Password hashing with bcrypt
- ✅ UUID-based tokens for share links
- ✅ Access control through AccessType enum
- ✅ Expiration dates for share links

## 📝 Common Commands

```bash
# Development
npm run dev                    # Start frontend + backend
npm run dev:server            # Start backend only
npm run dev:client            # Start frontend only

# Database
npm run prisma:generate       # Generate Prisma Client
npm run prisma:migrate        # Create and apply migration
npm run prisma:studio         # Open database GUI
npm run prisma:seed           # Seed test data

# Production
npm run build                 # Build all packages
npm run start                 # Start production server
```

## 🔧 Prisma Client Usage Examples

### Query Users

```typescript
import prisma from './config/database'

// Find user by email
const user = await prisma.user.findUnique({
  where: { email: 'john.doe@example.com' }
})

// Get user with their projects
const userWithProjects = await prisma.user.findUnique({
  where: { id: userId },
  include: { ownedProjects: true }
})
```

### Query Projects

```typescript
// Get project with all relations
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    owner: true,
    tasks: { orderBy: { position: 'asc' } },
    versions: { orderBy: { versionNumber: 'desc' } },
    shareLinks: true
  }
})

// Get user's projects
const projects = await prisma.project.findMany({
  where: { ownerId: userId },
  include: { tasks: true }
})

// Get public projects
const publicProjects = await prisma.project.findMany({
  where: { isPublic: true },
  include: { owner: true }
})
```

### Create Tasks

```typescript
// Create a single task
const task = await prisma.task.create({
  data: {
    projectId: projectId,
    name: 'New Task',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    color: '#3B82F6',
    position: 0
  }
})

// Create multiple tasks
await prisma.task.createMany({
  data: [
    { projectId, name: 'Task 1', startDate, endDate, position: 0 },
    { projectId, name: 'Task 2', startDate, endDate, position: 1 }
  ]
})
```

### Create Share Links

```typescript
// Create a readonly share link that expires in 7 days
const shareLink = await prisma.shareLink.create({
  data: {
    projectId: projectId,
    accessType: 'READONLY',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
})

// Create a permanent editable link
const permanentLink = await prisma.shareLink.create({
  data: {
    projectId: projectId,
    accessType: 'EDITABLE',
    expiresAt: null
  }
})
```

### Create Project Versions

```typescript
// Save project snapshot
const version = await prisma.projectVersion.create({
  data: {
    projectId: projectId,
    versionNumber: nextVersionNumber,
    snapshotData: {
      tasks: tasks,
      projectName: project.name,
      timestamp: new Date().toISOString()
    },
    createdBy: userId
  }
})
```

## 📚 Documentation

- **Full Schema Docs**: `server/prisma/DATABASE.md`
- **Migration Guide**: `server/prisma/MIGRATIONS.md`
- **Prisma Schema**: `server/prisma/schema.prisma`
- **Shared Types**: `shared/src/types.ts`

## 🐛 Troubleshooting

### Can't connect to database

```bash
# Test PostgreSQL connection
psql -U postgres

# Check if PostgreSQL is running
# Windows: Check Services
# Linux/Mac: sudo systemctl status postgresql
```

### Migration errors

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Check migration status
cd server && npx prisma migrate status
```

### Prisma Client out of sync

```bash
npm run prisma:generate
```

## 🎓 Next Steps

1. ✅ Database schema is ready
2. 🔄 Build API endpoints (projects, tasks, auth)
3. 🔄 Implement authentication middleware
4. 🔄 Build Gantt chart UI components
5. 🔄 Add drag-and-drop functionality
6. 🔄 Implement project sharing
7. 🔄 Add version control features

## 📞 Need Help?

- Review `server/prisma/DATABASE.md` for detailed schema docs
- Check `server/prisma/MIGRATIONS.md` for migration workflows
- Open Prisma Studio: `npm run prisma:studio`
- View seed data: `server/prisma/seed.ts`

Happy building! 🚀
