# Gantt Chart Application - Support Manual

**Version:** 1.0
**Last Updated:** February 10, 2026
**Audience:** Support Staff, System Administrators

---

## Table of Contents

1. [Support Overview](#support-overview)
2. [Common Support Scenarios](#common-support-scenarios)
3. [User Account Management](#user-account-management)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Database Operations](#database-operations)
6. [Security & Access Control](#security--access-control)
7. [Performance Monitoring](#performance-monitoring)
8. [Backup & Recovery](#backup--recovery)
9. [Error Code Reference](#error-code-reference)
10. [Escalation Procedures](#escalation-procedures)

---

## Support Overview

### Support Tiers

**Tier 1 - Basic Support**:
- Password resets
- Account access issues
- Basic navigation help
- Feature explanations

**Tier 2 - Technical Support**:
- Application errors
- Data integrity issues
- Performance problems
- Integration troubleshooting

**Tier 3 - Engineering**:
- Critical bugs
- Security incidents
- Database corruption
- System-wide outages

### Support Tools

**Required Access**:
- Database query access (read-only for Tier 1, write for Tier 2+)
- Server logs access
- Application admin panel
- User management interface

**Monitoring Tools**:
- Application logs (Pino logging)
- Database performance metrics
- Error tracking (Sentry, if configured)
- Server health dashboard

---

## Common Support Scenarios

### Scenario 1: User Cannot Log In

**Symptoms**:
- "Invalid credentials" error
- Account locked message
- Infinite loading on login

**Diagnosis Steps**:

1. **Verify user account exists**:
   ```sql
   SELECT id, email, "createdAt"
   FROM "User"
   WHERE email = 'user@example.com';
   ```

2. **Check rate limiting**:
   - Rate limit: 5 login attempts per 15 minutes
   - Wait time: 15 minutes from last attempt
   - Action: Inform user to wait or reset rate limit

3. **Check browser/cache issues**:
   - Have user clear cache/cookies
   - Try incognito mode
   - Try different browser

4. **Check server status**:
   - Verify backend is running
   - Check database connectivity
   - Review error logs

**Resolution**:

**If rate limited**:
- Wait 15 minutes, or
- Reset rate limit (requires database access)

**If password forgotten**:
- Initiate password reset process
- Verify email delivery

**If account locked**:
- Contact Tier 2 for investigation
- May require manual unlock

---

### Scenario 2: Tasks Not Saving

**Symptoms**:
- "Auto-save failed" errors
- Changes disappear after refresh
- "Saving..." indicator stuck

**Diagnosis Steps**:

1. **Check network connectivity**:
   - Have user check internet connection
   - Test with ping/traceroute
   - Verify no firewall issues

2. **Check server status**:
   ```bash
   # Health check
   curl https://your-app.com/api/health

   # Expected: {"success": true, "message": "Server is running"}
   ```

3. **Check database connectivity**:
   ```sql
   SELECT COUNT(*) FROM "Task";
   ```

4. **Review server logs**:
   ```bash
   # Check for errors around the time of issue
   tail -n 100 /var/log/gantt-app/error.log | grep "save"
   ```

5. **Check user permissions**:
   ```sql
   SELECT p.id, p.name, p."ownerId"
   FROM "Project" p
   WHERE p.id = 'project-uuid';
   ```

**Resolution**:

**If network issue**:
- User should check their connection
- Try manual save (Ctrl+S)
- Refresh and retry

**If server issue**:
- Check server health
- Restart application if needed
- Escalate to Tier 2

**If permission issue**:
- Verify user owns the project
- Check share link access type
- Grant appropriate permissions

---

### Scenario 3: Shared Project Link Not Working

**Symptoms**:
- "Invalid or expired link" error
- "Access denied" message
- Link leads to 404 page

**Diagnosis Steps**:

1. **Verify share link exists**:
   ```sql
   SELECT
     sl.id,
     sl.token,
     sl."accessType",
     sl."expiresAt",
     sl."createdAt",
     p.name as project_name
   FROM "ShareLink" sl
   JOIN "Project" p ON sl."projectId" = p.id
   WHERE sl.token = 'share-token-here';
   ```

2. **Check expiration**:
   - If `expiresAt` is in the past, link has expired
   - If `expiresAt` is NULL, link never expires

3. **Check project still exists**:
   ```sql
   SELECT id, name, "isPublic"
   FROM "Project"
   WHERE id = 'project-uuid';
   ```

4. **Check link was copied correctly**:
   - Verify full URL including token
   - Check for URL encoding issues
   - Test link yourself

**Resolution**:

**If link expired**:
- Inform user link has expired
- Ask project owner to create new link

**If link revoked**:
- Inform user link was revoked by owner
- Request new link from owner

**If project deleted**:
- Inform user project no longer exists
- Cannot be recovered without backup

**If technical issue**:
- Test with different browser
- Clear cache/cookies
- Try incognito mode

---

### Scenario 4: Version Restore Failed

**Symptoms**:
- "Version restore failed" error
- Project appears unchanged
- Tasks disappeared after restore

**Diagnosis Steps**:

1. **Verify version exists**:
   ```sql
   SELECT
     id,
     "versionNumber",
     "snapshotData",
     "createdAt"
   FROM "ProjectVersion"
   WHERE id = 'version-uuid';
   ```

2. **Check snapshot data integrity**:
   ```sql
   SELECT
     jsonb_typeof("snapshotData") as data_type,
     "snapshotData"->'tasks' as tasks
   FROM "ProjectVersion"
   WHERE id = 'version-uuid';
   ```
   - Should return `data_type = 'object'`
   - Should have valid `tasks` array

3. **Check user permissions**:
   ```sql
   SELECT p."ownerId", pv."projectId"
   FROM "ProjectVersion" pv
   JOIN "Project" p ON pv."projectId" = p.id
   WHERE pv.id = 'version-uuid';
   ```

4. **Review application logs**:
   - Look for version restore errors
   - Check for database transaction failures

**Resolution**:

**If version data corrupted**:
- Try restoring a different version
- Escalate to Tier 3 for data recovery
- May require manual data reconstruction

**If permission issue**:
- Verify user is project owner
- Share links cannot restore versions

**If transaction failed**:
- Retry the restore
- Check database connectivity
- Escalate if persistent

---

### Scenario 5: Performance Issues

**Symptoms**:
- Slow page loads
- Chart rendering takes long
- Browser freezes
- High memory usage

**Diagnosis Steps**:

1. **Check project size**:
   ```sql
   SELECT
     p.id,
     p.name,
     COUNT(t.id) as task_count
   FROM "Project" p
   LEFT JOIN "Task" t ON t."projectId" = p.id
   WHERE p.id = 'project-uuid'
   GROUP BY p.id, p.name;
   ```
   - >500 tasks: Consider project splitting
   - >1000 tasks: Definite performance concern

2. **Check browser compatibility**:
   - Verify browser version
   - Recommend Chrome/Firefox latest
   - Check for browser extensions interfering

3. **Check user's time scale selection**:
   - Day view with 1000+ tasks = slow
   - Recommend higher-level time scale

4. **Check server performance**:
   ```bash
   # CPU usage
   top -b -n 1 | grep "node"

   # Memory usage
   free -h

   # Database connections
   SELECT count(*) FROM pg_stat_activity;
   ```

**Resolution**:

**If too many tasks**:
- Recommend splitting project
- Suggest using Month/Quarter view
- Archive completed tasks

**If browser issue**:
- Clear cache/cookies
- Update browser
- Try different browser
- Disable unnecessary extensions

**If server issue**:
- Check server resources
- Scale up if needed
- Optimize database queries
- Escalate to engineering

---

## User Account Management

### Creating User Accounts

Users self-register through the application. Support staff typically don't create accounts manually, but if needed:

```sql
-- DO NOT USE DIRECTLY - Use application API or admin panel
-- This is for reference only
```

**Recommended Method**: Use application's `/api/auth/register` endpoint or admin panel.

### Resetting Passwords

**Password Reset Process**:

1. User requests password reset (if feature implemented)
2. System generates reset token
3. Email sent with reset link
4. User clicks link, enters new password
5. Token validated and password updated

**Manual Password Reset** (if reset feature unavailable):

```javascript
// Using bcrypt to generate hash
const bcrypt = require('bcrypt');
const newPassword = 'TemporaryPassword123!';
const hash = await bcrypt.hash(newPassword, 10);

// Update in database
UPDATE "User"
SET "passwordHash" = 'hash-value-here'
WHERE email = 'user@example.com';
```

**Security Notes**:
- Never ask users for their passwords
- Never store plaintext passwords
- Always use bcrypt with 10+ salt rounds
- Notify user of password change

### Viewing User Activity

**Recent Projects**:
```sql
SELECT
  p.name,
  p."createdAt",
  p."updatedAt",
  COUNT(t.id) as task_count
FROM "Project" p
LEFT JOIN "Task" t ON t."projectId" = p.id
WHERE p."ownerId" = 'user-id-here'
GROUP BY p.id, p.name, p."createdAt", p."updatedAt"
ORDER BY p."updatedAt" DESC
LIMIT 10;
```

**Recent Tasks Created**:
```sql
SELECT
  t.name,
  t."createdAt",
  p.name as project_name
FROM "Task" t
JOIN "Project" p ON t."projectId" = p.id
WHERE p."ownerId" = 'user-id-here'
ORDER BY t."createdAt" DESC
LIMIT 20;
```

### Deleting User Accounts

⚠️ **WARNING**: User deletion is permanent and cascades to all owned projects.

**What Gets Deleted**:
- User account
- All owned projects
- All tasks in those projects
- All versions in those projects
- All share links in those projects

**Pre-Deletion Checklist**:
1. Confirm user's request in writing
2. Backup user's data if requested
3. Warn about cascade deletion
4. Verify no active collaborations
5. Get manager approval (if applicable)

**Deletion Query**:
```sql
-- Cascading delete (configured in Prisma schema)
DELETE FROM "User"
WHERE id = 'user-id-here';
```

---

## Troubleshooting Guide

### Application Logs

**Log Locations**:
- **Development**: Console output
- **Production**: `/var/log/gantt-app/combined.log`
- **Errors Only**: `/var/log/gantt-app/error.log`

**Reading Logs**:
```bash
# Tail live logs
tail -f /var/log/gantt-app/combined.log

# Search for errors
grep "ERROR" /var/log/gantt-app/combined.log | tail -20

# Filter by user
grep "user-email@example.com" /var/log/gantt-app/combined.log

# Filter by time
awk '$2 > "2026-02-10T10:00:00"' /var/log/gantt-app/combined.log
```

**Log Levels**:
- `TRACE`: Very detailed debug info
- `DEBUG`: Debug information
- `INFO`: General information
- `WARN`: Warning messages
- `ERROR`: Error messages
- `FATAL`: Fatal errors requiring immediate attention

### Database Troubleshooting

**Connection Issues**:
```bash
# Test database connection
psql postgresql://username:password@localhost:5432/gantt_chart_db

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check for locked transactions
SELECT * FROM pg_locks WHERE NOT granted;
```

**Slow Queries**:
```sql
-- Enable query logging (PostgreSQL)
ALTER DATABASE gantt_chart_db SET log_min_duration_statement = 1000;

-- View slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Data Integrity Checks**:
```sql
-- Orphaned tasks (project deleted but task remains)
SELECT t.* FROM "Task" t
LEFT JOIN "Project" p ON t."projectId" = p.id
WHERE p.id IS NULL;

-- Orphaned versions
SELECT pv.* FROM "ProjectVersion" pv
LEFT JOIN "Project" p ON pv."projectId" = p.id
WHERE p.id IS NULL;

-- Orphaned share links
SELECT sl.* FROM "ShareLink" sl
LEFT JOIN "Project" p ON sl."projectId" = p.id
WHERE p.id IS NULL;
```

### Authentication Issues

**Token Blacklist Status**:
- Tokens are blacklisted on logout
- Blacklist is in-memory (lost on server restart)
- Automatic cleanup every hour

**Check Token Validity**:
```bash
# Using JWT verification
curl -X GET https://your-app.com/api/auth/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Rate Limiting Issues**:
- Auth endpoints: 5 requests / 15 minutes
- General endpoints: 100 requests / 15 minutes
- Rate limits reset automatically
- No manual reset available (by design)

### CSRF Issues

**CSRF Token Problems**:

If users see "CSRF token missing" or "Invalid CSRF token":

1. **Check cookies enabled**:
   - CSRF uses cookies
   - Users must allow cookies

2. **Check same-site policy**:
   - Verify CORS configuration
   - Check cookie `sameSite` setting

3. **Check token generation**:
   ```bash
   # Test CSRF token endpoint
   curl -c cookies.txt https://your-app.com/api/health
   curl -b cookies.txt https://your-app.com/api/projects
   ```

---

## Database Operations

### Backup Procedures

**Automated Backups** (Recommended):
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/gantt-app"
DB_NAME="gantt_chart_db"

pg_dump -U postgres -F c -b -v -f "$BACKUP_DIR/backup_$DATE.dump" $DB_NAME

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
```

**Manual Backup**:
```bash
# Full database backup
pg_dump -U postgres -F c -b -v -f backup_$(date +%Y%m%d).dump gantt_chart_db

# Schema only
pg_dump -U postgres -s -f schema_$(date +%Y%m%d).sql gantt_chart_db

# Data only
pg_dump -U postgres -a -f data_$(date +%Y%m%d).sql gantt_chart_db
```

### Restore Procedures

**Full Restore**:
```bash
# Stop application first
systemctl stop gantt-app

# Drop existing database (careful!)
dropdb -U postgres gantt_chart_db

# Create new database
createdb -U postgres gantt_chart_db

# Restore from backup
pg_restore -U postgres -d gantt_chart_db backup_20260210.dump

# Start application
systemctl start gantt-app
```

**Partial Restore** (Single Table):
```bash
# Restore specific table
pg_restore -U postgres -d gantt_chart_db -t Project backup_20260210.dump
```

### Data Cleanup

**Remove Old Versions** (Auto versions only):
```sql
DELETE FROM "ProjectVersion"
WHERE "createdAt" < NOW() - INTERVAL '30 days'
AND id NOT IN (
  -- Keep manual versions
  SELECT id FROM "ProjectVersion"
  WHERE "snapshotData"->>'isManual' = 'true'
);
```

**Remove Expired Share Links**:
```sql
DELETE FROM "ShareLink"
WHERE "expiresAt" < NOW();
```

**Remove Blacklisted Tokens** (if persisted):
```sql
-- Note: Current implementation uses in-memory storage
-- This is for reference if you implement persistent blacklist
DELETE FROM "TokenBlacklist"
WHERE "expiresAt" < NOW();
```

---

## Security & Access Control

### Security Best Practices

**Password Policy**:
- Minimum 8 characters
- Must include: uppercase, lowercase, number
- Hashed with bcrypt (10 rounds)
- No password history (currently)

**Session Management**:
- JWT tokens with 7-day expiration
- HttpOnly cookies prevent XSS
- CSRF tokens protect state-changing operations
- Token blacklist on logout

**Access Control**:
- Project owners have full control
- Public projects: view-only without share link
- Share links: read-only or editable
- No role-based permissions (currently)

### Security Monitoring

**Failed Login Attempts**:
```sql
-- Check application logs for patterns
grep "Invalid credentials" /var/log/gantt-app/error.log | wc -l
```

**Suspicious Activity**:
- Multiple failed logins from same IP
- Unusual access patterns
- Large number of API requests
- Database query anomalies

**Security Headers Check**:
```bash
# Verify security headers
curl -I https://your-app.com | grep -i "x-\|content-security\|strict-transport"
```

Expected headers:
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`

### Incident Response

**Security Incident Procedure**:

1. **Identify**: Confirm security incident
2. **Contain**: Isolate affected systems
3. **Eradicate**: Remove threat
4. **Recover**: Restore normal operations
5. **Document**: Log all actions taken
6. **Review**: Post-incident analysis

**Immediate Actions**:
- Notify security team
- Document incident details
- Preserve logs and evidence
- Follow escalation procedure

---

## Performance Monitoring

### Key Metrics

**Application Performance**:
- Response time (target: <200ms for API calls)
- Throughput (requests per second)
- Error rate (target: <1%)
- Database query time (target: <100ms)

**System Resources**:
- CPU usage (target: <70%)
- Memory usage (target: <80%)
- Disk space (alert at 80% full)
- Database connections (monitor for leaks)

### Monitoring Queries

**Active Users**:
```sql
SELECT COUNT(DISTINCT "ownerId")
FROM "Project"
WHERE "updatedAt" > NOW() - INTERVAL '24 hours';
```

**Project Activity**:
```sql
SELECT
  DATE("updatedAt") as date,
  COUNT(*) as projects_updated
FROM "Project"
WHERE "updatedAt" > NOW() - INTERVAL '7 days'
GROUP BY DATE("updatedAt")
ORDER BY date DESC;
```

**Database Size**:
```sql
SELECT
  pg_size_pretty(pg_database_size('gantt_chart_db')) as db_size,
  pg_size_pretty(pg_total_relation_size('"Project"')) as projects_size,
  pg_size_pretty(pg_total_relation_size('"Task"')) as tasks_size,
  pg_size_pretty(pg_total_relation_size('"ProjectVersion"')) as versions_size;
```

**Slow Endpoints** (from logs):
```bash
# Find requests taking > 1 second
grep "duration.*[1-9][0-9][0-9][0-9]" /var/log/gantt-app/combined.log | tail -20
```

---

## Backup & Recovery

### Backup Strategy

**Backup Schedule**:
- **Full Backups**: Daily at 2 AM
- **Incremental**: Every 6 hours
- **Retention**: 30 days for dailies, 7 days for incremental
- **Off-site**: Weekly full backup to cloud storage

**What to Backup**:
1. Database (PostgreSQL dump)
2. Environment configuration
3. Application logs (last 7 days)
4. User-uploaded files (if any)

### Recovery Scenarios

**Scenario 1: Single Project Corruption**

1. Identify project ID
2. Locate last good backup
3. Extract project data:
   ```bash
   pg_restore -U postgres -d temp_db backup.dump
   pg_dump -U postgres -t Project -a --where="id='project-id'" temp_db > project.sql
   psql -U postgres -d gantt_chart_db < project.sql
   ```

**Scenario 2: Complete Database Loss**

1. Stop application
2. Create new database
3. Restore from most recent full backup
4. Apply incremental backups if available
5. Verify data integrity
6. Restart application
7. Monitor for issues

**Scenario 3: Accidental Data Deletion**

1. Stop application immediately (prevent auto-cleanup)
2. Identify deletion time
3. Find backup before deletion
4. Restore deleted data only
5. Verify with user
6. Restart application

---

## Error Code Reference

### HTTP Status Codes

| Code | Meaning | Common Causes | Resolution |
|------|---------|--------------|------------|
| 400 | Bad Request | Invalid input data | Check request format |
| 401 | Unauthorized | Invalid/missing token | Re-authenticate |
| 403 | Forbidden | Insufficient permissions | Check ownership/access |
| 404 | Not Found | Resource doesn't exist | Verify ID is correct |
| 409 | Conflict | Duplicate/constraint violation | Check for existing record |
| 429 | Too Many Requests | Rate limit exceeded | Wait and retry |
| 500 | Internal Server Error | Server/database error | Check logs, contact Tier 2 |
| 503 | Service Unavailable | Server down/maintenance | Check server status |

### Application Error Codes

**Authentication Errors**:
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Account locked
- `AUTH_003`: Token expired
- `AUTH_004`: Token revoked
- `AUTH_005`: Password too weak

**Authorization Errors**:
- `AUTHZ_001`: Not project owner
- `AUTHZ_002`: Share link expired
- `AUTHZ_003`: Share link invalid
- `AUTHZ_004`: Insufficient permissions

**Validation Errors**:
- `VAL_001`: Required field missing
- `VAL_002`: Invalid date format
- `VAL_003`: End date before start date
- `VAL_004`: Name too long
- `VAL_005`: Invalid color format

**Database Errors**:
- `DB_001`: Connection failed
- `DB_002`: Query timeout
- `DB_003`: Constraint violation
- `DB_004`: Transaction failed

**Business Logic Errors**:
- `BIZ_001`: Cannot delete project with active shares
- `BIZ_002`: Cannot restore version (data corrupted)
- `BIZ_003`: Task overlap detected
- `BIZ_004`: Version limit reached

---

## Escalation Procedures

### When to Escalate

**Tier 1 → Tier 2**:
- Issue persists after basic troubleshooting
- Requires database access
- Performance degradation
- Data integrity concerns
- Complex technical issues

**Tier 2 → Tier 3**:
- Critical bugs affecting multiple users
- Security incidents
- Database corruption
- System-wide outages
- Application deployment issues

### Escalation Information

When escalating, provide:

1. **Ticket Number**: Support ticket ID
2. **User Information**:
   - User ID
   - Email address
   - Account creation date
3. **Issue Description**:
   - What user was trying to do
   - What actually happened
   - When it started
4. **Steps Taken**:
   - Troubleshooting steps performed
   - Results of each step
5. **System Information**:
   - Browser/OS
   - Application version
   - Server environment
6. **Log Excerpts**:
   - Relevant error logs
   - Timestamps
7. **Impact Assessment**:
   - Single user or multiple?
   - Data loss risk?
   - Urgency level

### Severity Levels

**P1 - Critical**:
- System down for all users
- Data loss occurring
- Security breach
- Response: Immediate (24/7)

**P2 - High**:
- Major feature unavailable
- Affects multiple users
- Workaround not available
- Response: Within 4 hours

**P3 - Medium**:
- Feature degraded
- Affects single user
- Workaround available
- Response: Within 24 hours

**P4 - Low**:
- Minor inconvenience
- Enhancement request
- Cosmetic issue
- Response: Within 5 business days

---

## Support Scripts

### Health Check Script

```bash
#!/bin/bash
# health-check.sh - Verify system health

echo "=== Gantt Chart Application Health Check ==="
echo ""

# Check application is running
echo "1. Application Status:"
if curl -s http://localhost:5000/api/health | grep -q "success"; then
    echo "   ✓ Application is running"
else
    echo "   ✗ Application is NOT running"
fi

# Check database
echo "2. Database Status:"
if psql -U postgres -d gantt_chart_db -c "SELECT 1" > /dev/null 2>&1; then
    echo "   ✓ Database is accessible"
else
    echo "   ✗ Database is NOT accessible"
fi

# Check disk space
echo "3. Disk Space:"
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo "   ✓ Disk usage: ${DISK_USAGE}%"
else
    echo "   ⚠ Disk usage: ${DISK_USAGE}% (Warning!)"
fi

# Check memory
echo "4. Memory:"
MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [ $MEM_USAGE -lt 80 ]; then
    echo "   ✓ Memory usage: ${MEM_USAGE}%"
else
    echo "   ⚠ Memory usage: ${MEM_USAGE}% (Warning!)"
fi

echo ""
echo "=== End Health Check ==="
```

### User Activity Report Script

```bash
#!/bin/bash
# user-activity.sh - Generate user activity report

USER_ID=$1

if [ -z "$USER_ID" ]; then
    echo "Usage: ./user-activity.sh <user-id>"
    exit 1
fi

echo "=== User Activity Report ==="
echo "User ID: $USER_ID"
echo ""

psql -U postgres -d gantt_chart_db <<EOF
-- User info
SELECT
    'User Info:' as section,
    email,
    "createdAt"
FROM "User"
WHERE id = '$USER_ID';

-- Project count
SELECT
    'Project Statistics:' as section,
    COUNT(*) as total_projects
FROM "Project"
WHERE "ownerId" = '$USER_ID';

-- Task count
SELECT
    'Task Statistics:' as section,
    COUNT(*) as total_tasks
FROM "Task" t
JOIN "Project" p ON t."projectId" = p.id
WHERE p."ownerId" = '$USER_ID';

-- Recent activity
SELECT
    'Recent Activity:' as section,
    p.name as project,
    p."updatedAt" as last_updated
FROM "Project" p
WHERE p."ownerId" = '$USER_ID'
ORDER BY p."updatedAt" DESC
LIMIT 5;
EOF
```

---

## Contact Information

### Support Team Contacts

**Tier 1 Support**: support@your-company.com
**Tier 2 Technical**: tech-support@your-company.com
**Tier 3 Engineering**: engineering@your-company.com
**Security Team**: security@your-company.com

### On-Call Schedule

Maintain on-call rotation for P1 incidents:
- Weekdays: 9 AM - 5 PM (business hours)
- After hours: On-call rotation
- Weekends: On-call rotation

---

## Document Maintenance

**Version History**:
- v1.0 (2026-02-10): Initial release

**Review Schedule**: Quarterly

**Maintainers**: Support Team Lead, Technical Documentation Team

---

**End of Support Manual**
