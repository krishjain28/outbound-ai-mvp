# 🚀 AI SDR Cloud Deployment Guide

## Overview

This guide ensures your AI SDR system runs entirely on cloud providers without any local development servers.

## Cloud Infrastructure

### ✅ Backend (Render)
- **URL**: https://outbound-ai-backend.onrender.com
- **Environment**: Production
- **Database**: MongoDB Atlas (cloud)
- **Auto-deploy**: Enabled on main branch

### ✅ Frontend (Vercel)
- **URL**: https://outbound-ai-frontend.vercel.app
- **Environment**: Production
- **Auto-deploy**: Enabled on main branch

### ✅ Database (MongoDB Atlas)
- **Type**: Cloud-hosted MongoDB
- **Connection**: Secure connection string
- **Backup**: Automated daily backups

## Environment Configuration

### Backend Environment Variables (Render)

All environment variables are configured in `render.yaml`:

```yaml
envVars:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: 10000
  - key: MONGODB_URI
    value: mongodb+srv://krishjain:Krish%40123@cluster0.v7ckm.mongodb.net/outbound-ai-mvp?retryWrites=true&w=majority
  - key: JWT_SECRET
    generateValue: true
  - key: FRONTEND_URL
    value: https://outbound-ai-frontend.vercel.app
  - key: BACKEND_URL
    value: https://outbound-ai-backend.onrender.com
```

### Frontend Environment Variables (Vercel)

Configured in `vercel.json`:

```json
{
  "env": {
    "REACT_APP_API_URL": "@react_app_api_url",
    "REACT_APP_ENVIRONMENT": "@react_app_environment"
  }
}
```

## Deployment Status Check

### Quick Status Check

Run the cloud deployment checker to verify all services:

```bash
node check-cloud-deployment.js
```

This script will:
- ✅ Check backend health on Render
- ✅ Verify frontend accessibility on Vercel
- ✅ Test database connectivity
- ✅ Validate API endpoints
- ✅ Confirm environment configuration

### Manual Health Checks

#### Backend Health
```bash
curl https://outbound-ai-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": "2h 15m 30s",
  "memoryUsage": "45.2 MB",
  "workers": {
    "status": "running"
  }
}
```

#### Frontend Check
```bash
curl https://outbound-ai-frontend.vercel.app
```

Should return HTML with React application.

## Common Issues & Solutions

### 1. Backend Connection Issues

**Problem**: Backend trying to connect to localhost MongoDB
**Solution**: Ensure `MONGODB_URI` is set to MongoDB Atlas URL in Render environment

**Problem**: Backend not responding
**Solution**: 
- Check Render dashboard for deployment status
- Verify environment variables are set correctly
- Check logs in Render dashboard

### 2. Frontend API Connection Issues

**Problem**: Frontend can't connect to backend
**Solution**: 
- Verify `REACT_APP_API_URL` points to Render backend
- Check CORS configuration in backend
- Ensure backend is running on Render

### 3. Database Connection Issues

**Problem**: MongoDB connection errors
**Solution**:
- Verify MongoDB Atlas cluster is running
- Check IP whitelist in MongoDB Atlas
- Validate connection string format
- Ensure network connectivity

## Deployment Workflow

### 1. Code Changes
```bash
# Make your changes
git add .
git commit -m "Your commit message"
git push origin main
```

### 2. Automatic Deployment
- **Backend**: Render automatically deploys from main branch
- **Frontend**: Vercel automatically deploys from main branch

### 3. Verification
```bash
# Check deployment status
node check-cloud-deployment.js

# Or manually verify
curl https://outbound-ai-backend.onrender.com/health
curl https://outbound-ai-frontend.vercel.app
```

## Monitoring & Logs

### Backend Logs (Render)
- Access via Render dashboard
- Winston logging configured for production
- Structured JSON logs with timestamps

### Frontend Logs (Vercel)
- Access via Vercel dashboard
- Build logs and runtime errors
- Performance metrics

### Database Monitoring (MongoDB Atlas)
- Real-time performance metrics
- Connection monitoring
- Query performance analysis

## Security Considerations

### ✅ HTTPS Enabled
- Backend: https://outbound-ai-backend.onrender.com
- Frontend: https://outbound-ai-frontend.vercel.app

### ✅ Environment Variables
- Sensitive data stored in cloud environment variables
- No hardcoded secrets in code

### ✅ CORS Configuration
- Backend configured to allow frontend domain
- Secure cross-origin requests

### ✅ JWT Authentication
- Secure token-based authentication
- Auto-generated JWT secret in production

## Performance Optimization

### Backend (Render)
- Production-grade Node.js runtime
- Optimized for cloud deployment
- Winston logging for monitoring
- Error handling and recovery

### Frontend (Vercel)
- CDN distribution
- Optimized builds
- Static asset caching
- Performance monitoring

### Database (MongoDB Atlas)
- Cloud-optimized MongoDB
- Connection pooling
- Index optimization
- Automated backups

## Troubleshooting

### Backend Issues
1. Check Render dashboard for deployment status
2. Verify environment variables in Render
3. Check backend logs in Render dashboard
4. Test health endpoint manually

### Frontend Issues
1. Check Vercel dashboard for build status
2. Verify environment variables in Vercel
3. Check browser console for errors
4. Test API connectivity

### Database Issues
1. Check MongoDB Atlas dashboard
2. Verify connection string format
3. Check IP whitelist settings
4. Test connection from backend

## Best Practices

### ✅ Never Run Locally
- All development should be tested on cloud deployment
- Use staging environment for testing
- Production environment for live system

### ✅ Environment Management
- Use cloud environment variables
- Never commit secrets to Git
- Use different environments for dev/staging/prod

### ✅ Monitoring
- Regular health checks
- Log monitoring
- Performance tracking
- Error alerting

### ✅ Security
- HTTPS everywhere
- Secure environment variables
- Regular security updates
- Access control

## Quick Commands

```bash
# Check cloud deployment status
node check-cloud-deployment.js

# Check backend health
curl https://outbound-ai-backend.onrender.com/health

# Check frontend
curl https://outbound-ai-frontend.vercel.app

# Deploy changes
git add . && git commit -m "Update" && git push origin main
```

## Support

If you encounter issues:
1. Check the deployment status checker
2. Review logs in cloud dashboards
3. Verify environment configuration
4. Test endpoints manually
5. Check this guide for common solutions

Remember: **Everything runs on the cloud - no local development needed!** 🚀 