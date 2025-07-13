# 🚀 Production Deployment Guide - AI SDR Application

## 📋 **OVERVIEW**

This guide will walk you through deploying your AI SDR application to production using:
- **Frontend**: Vercel (React/Next.js)
- **Backend**: Render Web Service (Express.js)
- **Database**: MongoDB Atlas (Cloud)
- **Background Workers**: Render Background Workers
- **CI/CD**: GitHub Actions
- **Monitoring**: Built-in monitoring + external integrations

## 🏗️ **ARCHITECTURE DIAGRAM**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Workers       │
│   (Vercel)      │    │   (Render)      │    │   (Render)      │
│                 │    │                 │    │                 │
│ • React App     │◄──►│ • Express API   │◄──►│ • Call Worker   │
│ • Static Files  │    │ • Webhooks      │    │ • AI Worker     │
│ • CDN           │    │ • Auth          │    │ • Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        ▼                        │
        │               ┌─────────────────┐               │
        │               │   MongoDB       │               │
        │               │   Atlas         │               │
        │               │                 │               │
        │               │ • Production DB │               │
        │               │ • Backups       │               │
        │               │ • Monitoring    │               │
        │               └─────────────────┘               │
        │                                                 │
        └─────────────────────────────────────────────────┘
```

## 🔧 **PREREQUISITES**

### Required Accounts
- [ ] GitHub account (for code repository)
- [ ] Vercel account (for frontend deployment)
- [ ] Render account (for backend and workers)
- [ ] MongoDB Atlas account (for database)
- [ ] Domain registrar (for custom domain)

### Required API Keys
- [ ] Telnyx API key and phone number
- [ ] OpenAI API key
- [ ] Deepgram API key (optional)
- [ ] ElevenLabs API key (optional)

## 📦 **STEP 1: PREPARE YOUR REPOSITORY**

### 1.1 Repository Structure
Ensure your repository has the following structure:
```
your-repo/
├── frontend/          # React application
├── backend/           # Express.js API
├── .github/workflows/ # CI/CD pipelines
├── vercel.json        # Vercel configuration
├── render.yaml        # Render configuration
└── README.md
```

### 1.2 Environment Files
Create environment examples:
```bash
# Create environment examples
cp backend/env.example backend/.env.production
cp frontend/env.example frontend/.env.production
```

## 🗄️ **STEP 2: SETUP MONGODB ATLAS (PRODUCTION)**

### 2.1 Create Production Cluster
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new project: "Outbound AI Production"
3. Create a cluster:
   - **Tier**: M10 (Production tier)
   - **Region**: Choose closest to your users
   - **Cluster Name**: `outbound-ai-prod`

### 2.2 Configure Security
1. **Database Access**:
   - Username: `prod-user`
   - Password: Generate strong password
   - Role: `readWrite` to `outbound-ai-mvp` database

2. **Network Access**:
   - Add Render's IP ranges
   - Add your deployment IP if needed

### 2.3 Get Connection String
```
mongodb+srv://prod-user:<password>@outbound-ai-prod.xxxxx.mongodb.net/outbound-ai-mvp?retryWrites=true&w=majority
```

## 🌐 **STEP 3: DEPLOY FRONTEND TO VERCEL**

### 3.1 Connect Repository
1. Log in to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure build settings:
   - **Framework**: React
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3.2 Environment Variables
Add these environment variables in Vercel dashboard:
```
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
REACT_APP_ENVIRONMENT=production
```

### 3.3 Custom Domain (Optional)
1. Add your custom domain in Vercel
2. Configure DNS records as instructed
3. SSL certificates are automatically handled

## 🖥️ **STEP 4: DEPLOY BACKEND TO RENDER**

### 4.1 Create Web Service
1. Log in to [Render](https://render.com)
2. Create new **Web Service**
3. Connect your GitHub repository
4. Configure service:
   - **Name**: `outbound-ai-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 4.2 Environment Variables
Add these environment variables in Render dashboard:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRE=30d
FRONTEND_URL=https://your-frontend-domain.vercel.app
BACKEND_URL=https://your-backend-url.onrender.com
TELNYX_API_KEY=your-telnyx-api-key
TELNYX_PHONE_NUMBER=your-telnyx-phone-number
TELNYX_CONNECTION_ID=your-telnyx-connection-id
OPENAI_API_KEY=your-openai-api-key
DEEPGRAM_API_KEY=your-deepgram-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
```

### 4.3 Health Check
Configure health check endpoint: `/api/health`

## 👷 **STEP 5: DEPLOY BACKGROUND WORKERS**

### 5.1 Call Worker
1. Create new **Background Worker** in Render
2. Configure:
   - **Name**: `outbound-ai-call-worker`
   - **Start Command**: `node workers/callWorker.js`
   - **Same environment variables as backend**

### 5.2 Conversation Worker
1. Create new **Background Worker** in Render
2. Configure:
   - **Name**: `outbound-ai-conversation-worker`
   - **Start Command**: `node workers/conversationWorker.js`
   - **Same environment variables as backend**

## 🔄 **STEP 6: SETUP CI/CD PIPELINE**

### 6.1 GitHub Secrets
Add these secrets to your GitHub repository:
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
RENDER_API_KEY=your-render-api-key
RENDER_SERVICE_ID=your-render-backend-service-id
RENDER_CALL_WORKER_ID=your-render-call-worker-id
RENDER_CONVERSATION_WORKER_ID=your-render-conversation-worker-id
MONGODB_URI_TEST=your-test-mongodb-connection
JWT_SECRET=your-jwt-secret
SLACK_WEBHOOK=your-slack-webhook-url (optional)
```

### 6.2 Deploy Pipeline
The GitHub Actions workflow will automatically:
1. Run tests on pull requests
2. Deploy to production on main branch pushes
3. Send notifications to Slack

## 🔒 **STEP 7: SECURITY CONFIGURATION**

### 7.1 API Keys Security
- Store all API keys in environment variables
- Use different keys for production vs development
- Regularly rotate API keys

### 7.2 Database Security
- Use MongoDB Atlas IP whitelisting
- Enable database auditing
- Set up automated backups

### 7.3 Application Security
- HTTPS enforced automatically
- Security headers configured
- Rate limiting enabled
- Input validation and sanitization

## 📊 **STEP 8: MONITORING SETUP**

### 8.1 Built-in Monitoring
Your application includes:
- Request/response monitoring
- Error tracking
- Performance metrics
- System health checks

### 8.2 External Monitoring (Optional)
Configure these services:
- **Sentry**: Error tracking
- **DataDog**: Application monitoring
- **Slack**: Alert notifications

Environment variables:
```
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-api-key
SLACK_WEBHOOK=your-slack-webhook
```

## 🚦 **STEP 9: TESTING PRODUCTION DEPLOYMENT**

### 9.1 Health Checks
Test these endpoints:
```bash
# Backend health
curl https://your-backend-url.onrender.com/api/health

# Frontend
curl https://your-frontend-domain.vercel.app
```

### 9.2 Functionality Tests
1. **Authentication**: Register/login users
2. **Call System**: Initiate test calls
3. **Webhooks**: Verify webhook processing
4. **Workers**: Check background processing

### 9.3 Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery run loadtest.yml
```

## 🔧 **STEP 10: POST-DEPLOYMENT CONFIGURATION**

### 10.1 Domain Setup
1. Configure custom domain in Vercel
2. Update CORS settings in backend
3. Update Telnyx webhook URLs

### 10.2 SSL Certificates
- Vercel: Automatic SSL
- Render: Automatic SSL
- Custom domains: Configure DNS

### 10.3 CDN Configuration
- Vercel provides global CDN
- Configure caching headers
- Optimize static assets

## 📈 **STEP 11: SCALING CONSIDERATIONS**

### 11.1 Backend Scaling
- Render auto-scales based on traffic
- Consider upgrading to higher plans
- Monitor resource usage

### 11.2 Database Scaling
- MongoDB Atlas auto-scaling
- Consider sharding for large datasets
- Monitor query performance

### 11.3 Worker Scaling
- Scale workers based on call volume
- Monitor queue lengths
- Consider Redis for job queues

## 🔍 **STEP 12: MONITORING & MAINTENANCE**

### 12.1 Regular Monitoring
- Check health endpoints daily
- Monitor error rates
- Review performance metrics

### 12.2 Backup Strategy
- MongoDB Atlas automated backups
- Code repository backups
- Environment variable backups

### 12.3 Updates & Maintenance
- Regular dependency updates
- Security patches
- Performance optimizations

## 🆘 **TROUBLESHOOTING**

### Common Issues:

#### 1. Deployment Failures
```bash
# Check build logs
# Verify environment variables
# Check dependency versions
```

#### 2. Database Connection Issues
```bash
# Verify MongoDB Atlas IP whitelist
# Check connection string format
# Test connection from local environment
```

#### 3. API Rate Limiting
```bash
# Check rate limit configurations
# Monitor API usage
# Implement exponential backoff
```

#### 4. Worker Issues
```bash
# Check worker logs in Render
# Verify environment variables
# Monitor queue processing
```

## 📞 **SUPPORT RESOURCES**

- **Vercel Documentation**: https://vercel.com/docs
- **Render Documentation**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **GitHub Actions**: https://docs.github.com/en/actions

## 🎯 **PRODUCTION CHECKLIST**

### Pre-Launch
- [ ] All environment variables configured
- [ ] Database properly secured
- [ ] Health checks passing
- [ ] SSL certificates active
- [ ] Monitoring configured
- [ ] Backup strategy in place

### Launch Day
- [ ] Deploy to production
- [ ] Run functionality tests
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all integrations

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Check logs for errors
- [ ] Verify scaling works
- [ ] Update documentation
- [ ] Plan regular maintenance

## 💰 **COST ESTIMATES**

### Monthly Costs (USD):
- **Vercel**: $0-20 (depending on usage)
- **Render**: $25-100 (web service + workers)
- **MongoDB Atlas**: $9-50 (M10 cluster)
- **Domain**: $10-15/year
- **Total**: ~$50-200/month

### Cost Optimization:
- Use free tiers during development
- Monitor usage and scale appropriately
- Consider reserved instances for predictable loads

---

**🎉 Congratulations! Your AI SDR application is now deployed to production with a scalable, secure, and monitored infrastructure.** 