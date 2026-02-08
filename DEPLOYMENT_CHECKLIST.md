# Deployment Checklist

Quick reference checklist for deploying the Gantt Chart application.

## 📋 Pre-Deployment

### Code Preparation
- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Code reviewed and merged to `main`
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated

### Security
- [ ] All secrets moved to environment variables
- [ ] No API keys or passwords in code
- [ ] Dependencies updated (`npm audit`)
- [ ] Security vulnerabilities fixed
- [ ] Rate limiting configured
- [ ] CORS configured for production domain

## 🎯 Frontend Deployment (Vercel)

### Account Setup
- [ ] Vercel account created
- [ ] Repository connected to Vercel
- [ ] Project created in Vercel dashboard

### Configuration
- [ ] `vercel.json` configured
- [ ] Build command set: `npm run build`
- [ ] Output directory set: `dist`
- [ ] Node version specified: `18`

### Environment Variables
- [ ] `VITE_API_URL` set to production backend URL
- [ ] `VITE_SENTRY_DSN` set (if using Sentry)
- [ ] `VITE_ENVIRONMENT` set to `production`
- [ ] Environment variables added to Vercel project

### Deployment
- [ ] Test deployment to preview URL
- [ ] Verify build succeeds
- [ ] Check application loads correctly
- [ ] Deploy to production domain
- [ ] Verify production deployment

## 🚀 Backend Deployment (Railway/Render)

### Account Setup
- [ ] Railway/Render account created
- [ ] Repository connected
- [ ] Project/service created

### Database
- [ ] PostgreSQL database created
- [ ] Connection string obtained
- [ ] Database migrations ready

### Configuration
- [ ] `Dockerfile` configured
- [ ] Health check endpoint ready
- [ ] Build command configured
- [ ] Start command configured

### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` set
- [ ] `JWT_SECRET` generated and set
- [ ] `JWT_REFRESH_SECRET` generated and set
- [ ] `CORS_ORIGIN` set to frontend URL
- [ ] `SENTRY_DSN` set (if using Sentry)
- [ ] All other required env vars set

### Deployment
- [ ] Deploy backend service
- [ ] Run database migrations
- [ ] Verify health checks pass
- [ ] Test API endpoints
- [ ] Check error logs

## 🔄 CI/CD Setup (GitHub Actions)

### Repository Secrets
- [ ] `VERCEL_TOKEN` added
- [ ] `VERCEL_ORG_ID` added
- [ ] `VERCEL_PROJECT_ID` added
- [ ] `RAILWAY_TOKEN` added (if using Railway)
- [ ] `VITE_API_URL` added
- [ ] `VITE_SENTRY_DSN` added
- [ ] `SENTRY_DSN` added
- [ ] `SLACK_WEBHOOK` added (optional)

### Workflow Configuration
- [ ] `.github/workflows/ci-cd.yml` configured
- [ ] Test jobs configured
- [ ] Build jobs configured
- [ ] Deploy jobs configured
- [ ] Proper branch triggers set

### Testing
- [ ] Create test PR
- [ ] Verify tests run automatically
- [ ] Check build process
- [ ] Merge to `develop` for staging deploy
- [ ] Merge to `main` for production deploy

## 📊 Monitoring Setup (Sentry)

### Sentry Account
- [ ] Sentry account created
- [ ] Organization created
- [ ] Frontend project created (React)
- [ ] Backend project created (Node.js)

### Configuration
- [ ] Frontend DSN obtained
- [ ] Backend DSN obtained
- [ ] DSNs added to environment variables
- [ ] Sentry SDK initialized in code
- [ ] Error filtering configured
- [ ] Performance monitoring enabled

### Verification
- [ ] Test error sent to Sentry
- [ ] Error appears in dashboard
- [ ] Alerts configured
- [ ] Slack/email notifications set up

## 🌐 Domain Setup (Optional)

### Domain Configuration
- [ ] Domain purchased
- [ ] DNS records configured
- [ ] SSL certificate obtained
- [ ] Frontend domain configured in Vercel
- [ ] Backend domain configured in Railway/Render

### DNS Records
- [ ] `A` or `CNAME` record for frontend
- [ ] `CNAME` record for backend API
- [ ] DNS propagation verified
- [ ] HTTPS working

### CORS Update
- [ ] Backend `CORS_ORIGIN` updated with custom domain
- [ ] Frontend `VITE_API_URL` updated
- [ ] Both deployed with new configuration

## ✅ Post-Deployment Verification

### Frontend Checks
- [ ] Application loads without errors
- [ ] All pages accessible
- [ ] Assets loading correctly
- [ ] API calls working
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance acceptable (Lighthouse score >80)

### Backend Checks
- [ ] Health endpoints responding
- [ ] API endpoints working
- [ ] Database connection successful
- [ ] Authentication working
- [ ] Error handling working
- [ ] Rate limiting active
- [ ] CORS configured correctly

### Integration Tests
- [ ] User registration works
- [ ] User login works
- [ ] Create project works
- [ ] Create task works
- [ ] Update operations work
- [ ] Delete operations work
- [ ] Real-time features work (if applicable)

### Monitoring
- [ ] Sentry receiving errors
- [ ] Health checks passing
- [ ] Performance metrics being tracked
- [ ] Alerts configured
- [ ] Dashboard accessible

## 📱 User Acceptance

### Testing
- [ ] Test with real user account
- [ ] Test all major features
- [ ] Test on different devices
- [ ] Test on different browsers
- [ ] Test error scenarios
- [ ] Verify data persistence

### Documentation
- [ ] README.md updated
- [ ] API documentation updated
- [ ] User guide updated (if any)
- [ ] Deployment docs reviewed
- [ ] Known issues documented

## 🔐 Security Checklist

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] SQL injection protected
- [ ] XSS protected
- [ ] CSRF protection (if needed)
- [ ] Authentication secure
- [ ] Passwords hashed
- [ ] Secrets not exposed
- [ ] Error messages sanitized
- [ ] File uploads restricted (if applicable)

## 📈 Performance Checklist

- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading configured
- [ ] Caching headers set
- [ ] Database queries optimized
- [ ] Indexes created
- [ ] CDN configured (optional)
- [ ] Compression enabled

## 🎉 Launch

### Pre-Launch
- [ ] All checklist items complete
- [ ] Stakeholders notified
- [ ] Backup plan ready
- [ ] Rollback procedure tested

### Launch
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Watch server resources
- [ ] Check user feedback
- [ ] Document any issues

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Address any critical issues
- [ ] Collect user feedback
- [ ] Plan next iteration

## 📞 Support Contacts

- **Hosting Issues**: Support tickets with Vercel/Railway
- **Database Issues**: Platform support
- **Monitoring**: Sentry dashboard
- **CI/CD**: GitHub Actions logs

## 🔄 Rollback Procedure

If deployment fails:

1. **Vercel**: `vercel rollback`
2. **Railway**: `railway rollback`
3. **Render**: Redeploy previous successful deployment
4. **Database**: Restore from backup (if migrations failed)
5. **Notify team**: Alert about rollback
6. **Investigate**: Check logs and fix issues
7. **Redeploy**: After fixes are verified

---

## Quick Commands

```bash
# Frontend Deploy
cd client && vercel --prod

# Backend Deploy (Railway)
cd server && railway up

# Backend Deploy (Render)
# Use Render dashboard or git push

# Run Migrations
railway run npm run migrate

# View Logs
vercel logs
railway logs

# Rollback
vercel rollback
railway rollback
```

---

✅ **Deployment Complete!**

Remember to:
- Monitor Sentry for errors
- Check health endpoints regularly
- Keep dependencies updated
- Regular backups of database
- Document any issues for future reference
