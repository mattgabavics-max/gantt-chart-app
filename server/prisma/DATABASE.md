# Database Schema Documentation

## Overview

This document describes the PostgreSQL database schema for the Gantt Chart application, implemented using Prisma ORM.

## Entity Relationship Diagram

```
User (1) ──────< (N) Project
  │                    │
  │                    ├──< (N) Task
  │                    ├──< (N) ProjectVersion
  │                    └──< (N) ShareLink
  │
  └────────< (N) ProjectVersion (as creator)
```

## Entities

### User

Represents application users who can create and manage projects.

**Fields:**
- `id` (UUID, PK) - Unique user identifier
- `email` (String, Unique) - User's email address (indexed)
- `passwordHash` (String) - Bcrypt hashed password
- `createdAt` (DateTime) - Account creation timestamp

**Relations:**
- `ownedProjects` - Projects owned by this user
- `projectVersions` - Project versions created by this user

**Indexes:**
- `email` - For fast user lookup during authentication

---

### Project

Represents a Gantt chart project containing tasks.

**Fields:**
- `id` (UUID, PK) - Unique project identifier
- `name` (String) - Project name
- `isPublic` (Boolean) - Whether project is publicly visible (default: false)
- `ownerId` (UUID, FK) - References User who owns the project
- `createdAt` (DateTime) - Project creation timestamp
- `updatedAt` (DateTime) - Last modification timestamp

**Relations:**
- `owner` - User who owns this project (cascade delete)
- `tasks` - Tasks belonging to this project
- `versions` - Version history snapshots
- `shareLinks` - Sharing links for this project

**Indexes:**
- `ownerId` - For querying user's projects
- `isPublic` - For filtering public/private projects
- `createdAt` - For sorting by creation date

**Cascade Behavior:**
- Deleting a User cascades to delete their Projects
- Deleting a Project cascades to delete its Tasks, Versions, and ShareLinks

---

### Task

Represents individual tasks within a Gantt chart project.

**Fields:**
- `id` (UUID, PK) - Unique task identifier
- `projectId` (UUID, FK) - References parent Project
- `name` (String) - Task name
- `startDate` (DateTime) - Task start date/time
- `endDate` (DateTime) - Task end date/time
- `color` (String) - Hex color code for visualization (default: #3B82F6)
- `position` (Int) - Order of task in the project (default: 0)
- `createdAt` (DateTime) - Task creation timestamp

**Relations:**
- `project` - Project this task belongs to (cascade delete)

**Indexes:**
- `projectId` - For querying project's tasks
- `position` - For ordered task retrieval
- `startDate` - For date range queries
- `endDate` - For date range queries

**Cascade Behavior:**
- Deleting a Project cascades to delete all its Tasks

---

### ProjectVersion

Stores snapshots of project state for version history and rollback capability.

**Fields:**
- `id` (UUID, PK) - Unique version identifier
- `projectId` (UUID, FK) - References parent Project
- `versionNumber` (Int) - Sequential version number (unique per project)
- `snapshotData` (JSON) - Complete project state snapshot
- `createdAt` (DateTime) - Version creation timestamp
- `createdBy` (UUID, FK) - References User who created this version

**Relations:**
- `project` - Project this version belongs to (cascade delete)
- `creator` - User who created this version (cascade delete)

**Indexes:**
- `projectId` - For querying project's versions
- `createdAt` - For chronological sorting

**Unique Constraints:**
- `(projectId, versionNumber)` - Ensures version numbers are unique per project

**Cascade Behavior:**
- Deleting a Project cascades to delete all its Versions
- Deleting a User cascades to delete versions they created

---

### ShareLink

Enables sharing projects via unique tokens with controlled access levels.

**Fields:**
- `id` (UUID, PK) - Unique share link identifier
- `projectId` (UUID, FK) - References shared Project
- `token` (UUID, Unique) - Random access token for sharing (indexed)
- `accessType` (Enum) - Access level: READONLY or EDITABLE
- `createdAt` (DateTime) - Link creation timestamp
- `expiresAt` (DateTime, Nullable) - Expiration timestamp (null = never expires)

**Relations:**
- `project` - Project being shared (cascade delete)

**Indexes:**
- `token` - For fast token validation
- `projectId` - For querying project's share links
- `expiresAt` - For cleanup of expired links

**Cascade Behavior:**
- Deleting a Project cascades to delete all its ShareLinks

---

## Enums

### AccessType

Defines the level of access granted by a share link.

**Values:**
- `READONLY` - View-only access
- `EDITABLE` - Full edit access

---

## Migration Instructions

### Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Database URL**
   ```bash
   # In server/.env
   DATABASE_URL="postgresql://username:password@localhost:5432/gantt_chart_db?schema=public"
   ```

3. **Create Database**
   ```bash
   createdb gantt_chart_db
   ```

4. **Run Migrations**
   ```bash
   npm run prisma:migrate
   ```

5. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

6. **Seed Database (Optional)**
   ```bash
   npm run prisma:seed
   ```

### Creating New Migrations

When you modify the Prisma schema:

```bash
# Create and apply migration
npm run prisma:migrate

# This will:
# 1. Prompt you for a migration name
# 2. Generate SQL migration files
# 3. Apply the migration to the database
# 4. Regenerate Prisma Client
```

### Resetting Database

To completely reset the database:

```bash
# WARNING: This deletes ALL data
npx prisma migrate reset

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Apply all migrations
# 4. Run seed script (if configured)
```

### Prisma Studio

To visually inspect and edit database data:

```bash
npm run prisma:studio
```

This opens a browser-based GUI at http://localhost:5555

---

## Performance Considerations

### Indexes

Strategic indexes have been added for optimal query performance:

1. **User Lookups**: `email` index for authentication
2. **Project Queries**: `ownerId`, `isPublic`, `createdAt` indexes
3. **Task Queries**: `projectId`, `position`, date range indexes
4. **Share Links**: `token`, `projectId`, `expiresAt` indexes

### Query Optimization Tips

1. **Use Select to limit fields**
   ```typescript
   const project = await prisma.project.findUnique({
     where: { id },
     select: { id: true, name: true, tasks: true }
   })
   ```

2. **Use Include for relations**
   ```typescript
   const project = await prisma.project.findUnique({
     where: { id },
     include: { tasks: true, owner: true }
   })
   ```

3. **Pagination for large datasets**
   ```typescript
   const projects = await prisma.project.findMany({
     skip: (page - 1) * pageSize,
     take: pageSize,
     orderBy: { createdAt: 'desc' }
   })
   ```

4. **Batch operations**
   ```typescript
   await prisma.task.createMany({
     data: tasks
   })
   ```

---

## Security Best Practices

1. **Password Hashing**: Always use bcrypt for password hashing (≥10 rounds)
2. **Never expose passwordHash**: Exclude from API responses
3. **Validate ShareLink expiration**: Check `expiresAt` before granting access
4. **Cascade Deletes**: Configured to maintain referential integrity
5. **Input Validation**: Validate all user input before database queries
6. **Parameterized Queries**: Prisma automatically prevents SQL injection

---

## Backup Strategy

### Manual Backup

```bash
pg_dump gantt_chart_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup

```bash
psql gantt_chart_db < backup_20240101_120000.sql
```

### Automated Backups

Consider setting up automated backups using:
- PostgreSQL's `pg_basebackup` for continuous archiving
- Cloud provider backup services (AWS RDS, Google Cloud SQL, etc.)
- Cron jobs for scheduled pg_dump backups

---

## Troubleshooting

### Connection Issues

```bash
# Test PostgreSQL connection
psql -U username -d gantt_chart_db

# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection string format
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
```

### Migration Conflicts

```bash
# View migration status
npx prisma migrate status

# Resolve conflicts by resetting (WARNING: destroys data)
npx prisma migrate reset

# Or manually resolve in prisma/migrations/
```

### Schema Drift

```bash
# Check for schema drift
npx prisma migrate diff

# Generate migration to fix drift
npx prisma migrate dev
```

---

## Future Enhancements

Potential schema improvements for future versions:

1. **Task Dependencies**: Add support for task prerequisites
2. **User Roles**: Add role-based access control (viewer, editor, admin)
3. **Project Collaborators**: Many-to-many relationship for team projects
4. **Task Comments**: Add commenting system for collaboration
5. **Activity Log**: Track all changes for audit trail
6. **File Attachments**: Support for task-related file uploads
7. **Notifications**: Task reminders and deadline alerts
8. **Tags**: Categorization system for projects and tasks
