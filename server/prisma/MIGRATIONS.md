# Database Migration Guide

## Quick Start

```bash
# 1. Set up your database connection
cp server/.env.example server/.env
# Edit server/.env and set your DATABASE_URL

# 2. Create the database
createdb gantt_chart_db

# 3. Run migrations
npm run prisma:migrate

# 4. Generate Prisma Client
npm run prisma:generate

# 5. Seed test data (optional)
npm run prisma:seed
```

## Understanding Migrations

### What are Migrations?

Migrations are version-controlled changes to your database schema. Each migration:
- Has a unique timestamp
- Contains SQL to update the schema
- Can be applied or rolled back
- Ensures all team members have the same schema

### Migration Files Location

```
server/prisma/migrations/
├── 20240101000000_init/
│   └── migration.sql
├── 20240102000000_add_users/
│   └── migration.sql
└── migration_lock.toml
```

## Common Migration Commands

### Create and Apply Migration

When you modify `schema.prisma`:

```bash
npm run prisma:migrate
# or from server directory:
npx prisma migrate dev --name description_of_change
```

Example:
```bash
npx prisma migrate dev --name add_user_avatar
```

This will:
1. ✅ Generate SQL migration files
2. ✅ Apply the migration to your database
3. ✅ Regenerate Prisma Client
4. ✅ Run seed script (if --seed flag is used)

### View Migration Status

```bash
cd server
npx prisma migrate status
```

Shows:
- Applied migrations
- Pending migrations
- Any schema drift

### Generate Client Only

After pulling new migrations from git:

```bash
npm run prisma:generate
```

### Deploy Migrations (Production)

```bash
cd server
npx prisma migrate deploy
```

This applies pending migrations without prompting for names (suitable for CI/CD).

### Reset Database

⚠️ **WARNING: This deletes ALL data**

```bash
cd server
npx prisma migrate reset
```

This will:
1. Drop the database
2. Create a new database
3. Apply all migrations from scratch
4. Run the seed script

## Migration Scenarios

### Scenario 1: Adding a New Field

1. **Update schema.prisma**
   ```prisma
   model Task {
     id        String   @id @default(uuid())
     name      String
     priority  Int      @default(0)  // New field
   }
   ```

2. **Create migration**
   ```bash
   npm run prisma:migrate
   # Enter name: add_task_priority
   ```

3. **Migration is generated:**
   ```sql
   ALTER TABLE "tasks" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
   ```

### Scenario 2: Renaming a Field

Prisma cannot automatically detect renames. You have two options:

**Option A: Add new field, migrate data, remove old field**
```prisma
model User {
  id    String @id @default(uuid())
  email String @unique // Keep temporarily
  emailAddress String @unique // New field
}
```

**Option B: Write custom migration**
```bash
# Create empty migration
npx prisma migrate dev --name rename_email_field --create-only

# Edit the generated migration.sql
ALTER TABLE "users" RENAME COLUMN "email" TO "email_address";
```

### Scenario 3: Making a Field Optional

```prisma
// Before
model Project {
  name String
}

// After
model Project {
  name String?  // Now optional
}
```

```bash
npm run prisma:migrate
```

Generated SQL:
```sql
ALTER TABLE "projects" ALTER COLUMN "name" DROP NOT NULL;
```

### Scenario 4: Adding a Relation

```prisma
model Task {
  assigneeId String?
  assignee   User?   @relation(fields: [assigneeId], references: [id])
}

model User {
  assignedTasks Task[]
}
```

```bash
npm run prisma:migrate
```

### Scenario 5: Creating an Index

```prisma
model Task {
  name String

  @@index([name])
}
```

```bash
npm run prisma:migrate
```

## Team Workflows

### Developer Workflow

1. **Pull latest code**
   ```bash
   git pull
   ```

2. **Apply new migrations**
   ```bash
   npm run prisma:generate
   cd server
   npx prisma migrate dev
   ```

3. **Make schema changes**
   - Edit `server/prisma/schema.prisma`

4. **Create migration**
   ```bash
   npm run prisma:migrate
   ```

5. **Test changes**
   ```bash
   npm run dev
   ```

6. **Commit migration files**
   ```bash
   git add server/prisma/migrations
   git add server/prisma/schema.prisma
   git commit -m "Add user avatar field"
   git push
   ```

### Handling Migration Conflicts

If you get a migration conflict:

```bash
# Check current status
cd server
npx prisma migrate status

# Option 1: Reset (loses data)
npx prisma migrate reset

# Option 2: Resolve manually
# - Delete conflicting migration folders
# - Create new migration
npx prisma migrate dev
```

## Production Deployment

### Initial Deployment

```bash
# 1. Set production DATABASE_URL
export DATABASE_URL="postgresql://user:pass@prod-host:5432/prod_db"

# 2. Deploy migrations
cd server
npx prisma migrate deploy

# 3. Generate client
npx prisma generate
```

### Subsequent Deployments

```bash
# In your CI/CD pipeline:
npm ci
npm run prisma:generate
cd server && npx prisma migrate deploy
```

### Rollback Strategy

Prisma doesn't support automatic rollbacks. For production rollbacks:

1. **Create down migration manually**
   ```sql
   -- Reverse the changes from the last migration
   ALTER TABLE "tasks" DROP COLUMN "priority";
   ```

2. **Apply using raw SQL**
   ```bash
   psql $DATABASE_URL -f rollback.sql
   ```

3. **Better approach: Forward fixes**
   - Create a new migration that fixes the issue
   - Don't modify existing migrations

## Environment-Specific Migrations

### Development

```bash
# Use migrate dev (interactive)
npx prisma migrate dev
```

### Staging

```bash
# Use migrate deploy (non-interactive)
npx prisma migrate deploy
```

### Production

```bash
# Use migrate deploy with confirmation
npx prisma migrate deploy --preview-feature
```

## Seeding

### Running Seeds

```bash
# Seed database
npm run prisma:seed

# Or with migration reset
npx prisma migrate reset
```

### Seed Script Location

`server/prisma/seed.ts` - Executed automatically after `migrate reset`

### Conditional Seeding

```typescript
// seed.ts
if (process.env.NODE_ENV === 'development') {
  // Create test data
} else {
  // Create minimal production data
}
```

## Best Practices

### ✅ Do

- **Commit migration files** to version control
- **Test migrations** on dev database before production
- **Use descriptive names** for migrations
- **Keep migrations small** and focused
- **Review generated SQL** before applying
- **Back up production** before major migrations
- **Use transactions** for data migrations

### ❌ Don't

- **Don't modify existing migrations** after they're applied
- **Don't delete migration files** from git history
- **Don't skip migrations** in production
- **Don't edit schema.prisma** without creating a migration
- **Don't use migrate dev** in production
- **Don't store sensitive data** in seed files

## Troubleshooting

### Error: "Schema drift detected"

```bash
# View the drift
npx prisma migrate diff

# Fix by creating migration
npx prisma migrate dev
```

### Error: "Migration failed"

```bash
# Check database connection
psql $DATABASE_URL

# Check migration status
npx prisma migrate status

# View last migration
cat server/prisma/migrations/*/migration.sql
```

### Error: "Database is not empty"

```bash
# Mark existing tables as baseline
npx prisma migrate resolve --applied "0_init"

# Or start fresh (destroys data)
npx prisma migrate reset
```

### Error: "Prisma Client out of sync"

```bash
# Regenerate client
npm run prisma:generate
```

## Advanced Topics

### Custom Migrations

Create empty migration for custom SQL:

```bash
npx prisma migrate dev --name custom_function --create-only
```

Edit the generated `migration.sql`:

```sql
-- Create custom function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

### Data Migrations

```sql
-- Example: Migrate data between columns
UPDATE tasks
SET new_priority = CASE
  WHEN old_priority = 'high' THEN 3
  WHEN old_priority = 'medium' THEN 2
  ELSE 1
END;
```

### Schema Snapshots

Save current schema for reference:

```bash
npx prisma db pull > schema_backup_$(date +%Y%m%d).prisma
```

## Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Migration Troubleshooting](https://www.prisma.io/docs/guides/database/troubleshooting-orm)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
