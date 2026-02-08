# Deployment Guide

Comprehensive guide for deploying the Gantt Chart application to production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Backend Deployment (Railway/Render)](#backend-deployment-railwayrender)
4. [Database Setup](#database-setup)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring & Error Tracking](#monitoring--error-tracking)
7. [Environment Variables](#environment-variables)
8. [Custom Domain Setup](#custom-domain-setup)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account with repository access
- [ ] Vercel account (for frontend)
- [ ] Railway or Render account (for backend)
- [ ] Sentry account (for error tracking)
- [ ] PostgreSQL database (provided by Railway/Render)
- [ ] Node.js 18+ installed locally

---

## Frontend Deployment (Vercel)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy from CLI

```bash
cd client
vercel
```

Follow the prompts:
- **Project name**: `gantt-chart`
- **Framework**: `Vite`
- **Build command**: `npm run build`
- **Output directory**: `dist`

### 4. Configure Environment Variables

In Vercel Dashboard:

1. Go to **Project Settings** → **Environment Variables**
2. Add the following variables:

| Variable | Value | Environments |
|----------|-------|--------------|
| `VITE_API_URL` | Your backend URL | Production, Preview |
| `VITE_SENTRY_DSN` | Your Sentry DSN | Production |
| `VITE_ENVIRONMENT` | `production` or `staging` | Production, Preview |

### 5. Deploy to Production

```bash
vercel --prod
```

### 6. Automatic Deployments

Vercel automatically deploys on:
- **Production**: Push to `main` branch
- **Preview**: Push to any branch or pull request

---

## Backend Deployment (Railway/Render)

### Option A: Railway

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

#### 2. Login to Railway

```bash
railway login
```

#### 3. Initialize Project

```bash
cd server
railway init
```

#### 4. Add PostgreSQL Database

```bash
railway add postgresql
```

#### 5. Configure Environment Variables

```bash
# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -base64 64)
railway variables set JWT_REFRESH_SECRET=$(openssl rand -base64 64)
railway variables set CORS_ORIGIN=https://your-frontend-url.vercel.app
railway variables set SENTRY_DSN=your-sentry-dsn
```

#### 6. Deploy

```bash
railway up
```

#### 7. Run Migrations

```bash
railway run npm run migrate
```

### Option B: Render

#### 1. Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `gantt-chart-api`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Plan**: `Starter` or higher

#### 2. Add PostgreSQL Database

1. Click **New** → **PostgreSQL**
2. Configure:
   - **Name**: `gantt-chart-db`
   - **Plan**: `Starter` or higher
3. Note the connection string

#### 3. Configure Environment Variables

In Web Service settings:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | From PostgreSQL service |
| `JWT_SECRET` | Generate with `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | Generate with `openssl rand -base64 64` |
| `CORS_ORIGIN` | Your frontend URL |
| `SENTRY_DSN` | Your Sentry DSN |

#### 4. Deploy

Render automatically deploys on push to `main` branch.

#### 5. Run Migrations

Use Render Shell or create a cron job:

```bash
npm run migrate
```

---

## Database Setup

### 1. Create Database Schema

The migrations will run automatically on deploy, but you can also run them manually:

```bash
# Railway
railway run npm run migrate

# Render
# Use Render Shell or create a one-off job
npm run migrate
```

### 2. Seed Data (Optional)

```bash
# Railway
railway run npm run seed

# Render
npm run seed
```

### 3. Database Backups

#### Railway
- Automatic daily backups included
- Manual backup: `railway pg:backup`

#### Render
- Configure in PostgreSQL service settings
- Automatic daily backups on paid plans

---

## CI/CD Pipeline

### GitHub Actions Setup

The CI/CD pipeline is configured in `.github/workflows/ci-cd.yml`.

#### 1. Add GitHub Secrets

Go to **Settings** → **Secrets and variables** → **Actions**:

| Secret | Description | How to Get |
|--------|-------------|------------|
| `VERCEL_TOKEN` | Vercel deploy token | [Vercel Settings](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel org ID | `vercel.json` or Vercel Dashboard |
| `VERCEL_PROJECT_ID` | Vercel project ID | `vercel.json` or Vercel Dashboard |
| `RAILWAY_TOKEN` | Railway deploy token | `railway login --browserless` |
| `VITE_API_URL` | Backend API URL | Your Railway/Render URL |
| `VITE_SENTRY_DSN` | Frontend Sentry DSN | Sentry Dashboard |
| `SENTRY_DSN` | Backend Sentry DSN | Sentry Dashboard |
| `SLACK_WEBHOOK` | Slack notifications (optional) | Slack Webhooks |

#### 2. Workflow Triggers

The pipeline runs on:
- **Push to `main`**: Full deploy to production
- **Push to `develop`**: Deploy to staging
- **Pull requests**: Run tests only

#### 3. Pipeline Stages

1. **Test Frontend**: Lint, type-check, test with coverage
2. **Test Backend**: Lint, type-check, test with PostgreSQL
3. **Build**: Create production builds
4. **Deploy Staging**: On `develop` branch
5. **Deploy Production**: On `main` branch
6. **Notify**: Send Slack notifications

---

## Monitoring & Error Tracking

### Sentry Setup

#### 1. Create Sentry Project

1. Go to [Sentry.io](https://sentry.io/)
2. Create new organization (or use existing)
3. Create two projects:
   - **Frontend**: React
   - **Backend**: Node.js

#### 2. Get DSN Keys

Copy the DSN from each project's settings.

#### 3. Configure Frontend

Environment variables:
```env
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_ENVIRONMENT=production
```

The Sentry client is configured in `client/src/utils/sentry.ts`.

#### 4. Configure Backend

Environment variables:
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NODE_ENV=production
```

The Sentry server is configured in `server/src/utils/sentry.ts`.

### Performance Monitoring

Sentry automatically tracks:
- ✅ Error rates
- ✅ Response times
- ✅ Database query performance
- ✅ User session data
- ✅ Release tracking

### Health Checks

Backend provides health check endpoints:

| Endpoint | Purpose |
|----------|---------|
| `/health` | Basic health check |
| `/health/ready` | Readiness check (includes DB) |
| `/health/live` | Liveness check |
| `/health/status` | Detailed status info |

Configure your hosting platform to use these for health monitoring.

---

## Environment Variables

### Frontend (.env)

```env
# Production
VITE_API_URL=https://api.yourdomain.com
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true

# Staging
VITE_API_URL=https://api-staging.yourdomain.com
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_ENVIRONMENT=staging
```

### Backend (.env)

```env
# Production
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/db
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Generate Secrets

```bash
# JWT Secret
openssl rand -base64 64

# Session Secret
openssl rand -base64 32
```

---

## Custom Domain Setup

### Frontend (Vercel)

1. Go to **Project Settings** → **Domains**
2. Add your domain: `yourdomain.com`
3. Configure DNS records:

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

4. Wait for DNS propagation (up to 48 hours)

### Backend (Railway)

1. Go to **Service Settings** → **Networking**
2. Add custom domain: `api.yourdomain.com`
3. Configure DNS records:

```
Type: CNAME
Name: api
Value: your-railway-url.railway.app
```

### Backend (Render)

1. Go to **Service Settings** → **Custom Domain**
2. Add domain: `api.yourdomain.com`
3. Configure DNS records:

```
Type: CNAME
Name: api
Value: your-render-url.onrender.com
```

---

## Troubleshooting

### Build Failures

#### Frontend Build Fails

**Problem**: Build fails with "memory exceeded"

**Solution**: Increase Node memory
```json
// package.json
{
  "scripts": {
    "build": "node --max-old-space-size=4096 ./node_modules/vite/bin/vite.js build"
  }
}
```

#### Backend Build Fails

**Problem**: TypeScript compilation errors

**Solution**:
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Database Connection Issues

**Problem**: Can't connect to database

**Solution**:
1. Check `DATABASE_URL` format
2. Verify database is running
3. Check firewall rules
4. Test connection:

```bash
psql $DATABASE_URL
```

### CORS Errors

**Problem**: Frontend can't connect to backend

**Solution**:
1. Verify `CORS_ORIGIN` matches frontend URL
2. Include protocol: `https://yourdomain.com`
3. Check backend CORS configuration

### Environment Variables Not Loading

**Problem**: Env vars not available at runtime

**Solution**:

**Frontend**:
- Prefix with `VITE_`
- Rebuild after changing

**Backend**:
- Restart server after changing
- Check for typos in variable names

### Slow Performance

**Problem**: Application is slow

**Solution**:
1. Check Sentry performance monitoring
2. Enable database query logging
3. Add database indexes
4. Upgrade hosting plan
5. Enable CDN for static assets

### Deployment Rollback

#### Vercel
```bash
vercel rollback
```

#### Railway
```bash
railway rollback
```

#### Render
1. Go to **Deploys** tab
2. Find previous successful deploy
3. Click **Redeploy**

---

## Post-Deployment Checklist

- [ ] Frontend deploys successfully
- [ ] Backend deploys successfully
- [ ] Database migrations complete
- [ ] Environment variables configured
- [ ] Health checks pass
- [ ] Sentry receives test errors
- [ ] Custom domain configured
- [ ] SSL certificates active
- [ ] CORS configured correctly
- [ ] Performance monitoring active
- [ ] Backup strategy in place
- [ ] Documentation updated

---

## Maintenance

### Regular Tasks

**Daily**:
- Monitor error rates in Sentry
- Check health check status

**Weekly**:
- Review performance metrics
- Check database size/backups
- Review server logs

**Monthly**:
- Update dependencies
- Review and optimize database queries
- Check storage usage
- Review and update documentation

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update all
npm update

# Test thoroughly
npm test

# Deploy
git push
```

---

## Support

For deployment issues:

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Check [Railway Documentation](https://docs.railway.app/)
3. Check [Render Documentation](https://render.com/docs)
4. Check [Sentry Documentation](https://docs.sentry.io/)

---

## Quick Reference

### Useful Commands

```bash
# Frontend
vercel                    # Deploy to preview
vercel --prod            # Deploy to production
vercel logs             # View logs

# Backend (Railway)
railway up              # Deploy
railway logs            # View logs
railway run <command>   # Run command

# Backend (Render)
# Use Render Dashboard for logs and shell access

# Database
railway pg:backup       # Backup database (Railway)
railway pg:restore      # Restore database (Railway)

# CI/CD
git push origin main    # Trigger production deploy
git push origin develop # Trigger staging deploy
```

### Important URLs

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Render Dashboard**: https://dashboard.render.com/
- **Sentry Dashboard**: https://sentry.io/
- **GitHub Actions**: https://github.com/your-repo/actions

---

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate secrets regularly** - Especially after team changes
3. **Use strong secrets** - Generate with `openssl rand`
4. **Enable 2FA** - On all deployment platforms
5. **Review access logs** - Check for suspicious activity
6. **Keep dependencies updated** - Run `npm audit` regularly
7. **Use HTTPS** - Always use SSL/TLS
8. **Implement rate limiting** - Protect against abuse
9. **Monitor error rates** - Set up Sentry alerts
10. **Regular backups** - Test restore procedure

---

Your application is now ready for production! 🚀
