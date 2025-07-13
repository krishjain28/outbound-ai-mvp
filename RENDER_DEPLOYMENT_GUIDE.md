# 🚀 RENDER DEPLOYMENT GUIDE

## Complete step-by-step guide to deploy your Outbound AI backend to Render

### 📋 Prerequisites

1. **GitHub Repository**: [https://github.com/krishjain28/outbound-ai-mvp](https://github.com/krishjain28/outbound-ai-mvp)
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **API Keys**: Gather all your API keys (listed below)

---

## 🔧 STEP 1: CREATE RENDER WEB SERVICE

### 1.1 Create New Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New" → "Web Service"**
3. Connect your GitHub account if not already connected
4. Select repository: `krishjain28/outbound-ai-mvp`
5. Click **"Connect"**

### 1.2 Configure Web Service Settings
```
Name: outbound-ai-backend
Region: Oregon (US West)
Branch: main
Root Directory: (leave blank)
Runtime: Node
Build Command: npm run build
Start Command: npm start
Instance Type: Starter ($7/month) or Free (for testing)
```

### 1.3 Health Check (Optional but Recommended)
```
Health Check Path: /api/health
```

---

## 🔑 STEP 2: CONFIGURE ENVIRONMENT VARIABLES

Add these environment variables in Render Dashboard → Your Service → Environment:

### Required Variables:
```bash
NODE_ENV=production
PORT=10000

# Database
MONGODB_URI=your-mongodb-atlas-connection-string

# JWT
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRE=30d

# URLs
FRONTEND_URL=https://your-frontend-domain.vercel.app
BACKEND_URL=https://your-backend-name.onrender.com

# Telnyx (Phone Service)
TELNYX_API_KEY=your-telnyx-api-key
TELNYX_PHONE_NUMBER=your-telnyx-phone-number
TELNYX_CONNECTION_ID=your-telnyx-connection-id

# AI Services
OPENAI_API_KEY=your-openai-api-key
DEEPGRAM_API_KEY=your-deepgram-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
```

---

## �� STEP 3: AUTOMATED DEPLOYMENT (OPTIONAL)

### 3.1 Get Render API Key
1. Go to [Render Account Settings](https://dashboard.render.com/account)
2. Click **"API Keys"**
3. Create new API key
4. Copy the key

### 3.2 Get Service ID
1. Go to your service in Render Dashboard
2. Copy the Service ID from the URL (starts with `srv-`)

### 3.3 Add GitHub Secrets
1. Go to your GitHub repository
2. Click **Settings → Secrets and variables → Actions**
3. Add these secrets:
   - `RENDER_SERVICE_ID`: Your service ID
   - `RENDER_API_KEY`: Your API key

### 3.4 Trigger Automated Deployment
The GitHub Actions workflow will automatically deploy when you push to main branch.

---

## 🧪 STEP 4: MANUAL DEPLOYMENT

### 4.1 Deploy via Render Dashboard
1. Go to your service in Render Dashboard
2. Click **"Manual Deploy" → "Deploy latest commit"**
3. Monitor the deployment logs

### 4.2 Expected Deployment Logs
```
==> Cloning from https://github.com/krishjain28/outbound-ai-mvp
==> Using Node.js version 24.4.0
==> Running build command 'npm run build'...
==> Installing dependencies...
==> Running postinstall: cd backend && npm install
==> Build successful 🎉
==> Deploying...
==> Running 'npm start'
🚀 Starting Outbound AI Backend Server...
==> Changing working directory to backend
==> Loading server.js...
==> Server running on port 10000
==> Database connected successfully
==> Your service is live 🎉
```

---

## ✅ STEP 5: VERIFY DEPLOYMENT

### 5.1 Check Service Status
1. Your service URL will be: `https://your-service-name.onrender.com`
2. Test the health endpoint: `https://your-service-name.onrender.com/api/health`

### 5.2 Expected Health Response
```json
{
  "status": "healthy",
  "timestamp": "2025-01-12T23:XX:XX.XXXZ",
  "uptime": "XX seconds",
  "services": {
    "database": "connected",
    "telnyx": "configured",
    "openai": "configured"
  }
}
```

---

## 🔧 TROUBLESHOOTING

### Common Issues & Solutions:

#### 1. "Cannot find module" errors
- **Solution**: All dependencies are now in root package.json ✅

#### 2. "Cannot find server.js" errors  
- **Solution**: Fixed with proper path resolution in index.js ✅

#### 3. Environment variables not loading
- **Solution**: Check Render Dashboard → Environment tab

#### 4. Database connection issues
- **Solution**: Verify MONGODB_URI is correct and database allows connections

#### 5. API key errors
- **Solution**: Verify all API keys are added to Render environment variables

---

## 📊 MONITORING

### 1. Render Dashboard Metrics
- CPU usage
- Memory usage
- Response times
- Error rates

### 2. Logs
- Real-time logs in Render Dashboard
- Error tracking and monitoring

### 3. Health Checks
- Automatic health monitoring
- Alert notifications

---

## 💰 COST ESTIMATION

### Render Pricing:
- **Free Tier**: $0/month (limited, spins down after 15 minutes)
- **Starter**: $7/month (always-on, 512MB RAM, 0.5 CPU)
- **Standard**: $25/month (2GB RAM, 1 CPU)

### Total Monthly Cost:
- **Development**: $0 (Free tier)
- **Production**: $7-25/month (depending on usage)

---

## 🎉 SUCCESS!

Your Outbound AI backend is now deployed to Render with:
- ✅ Production-ready Node.js server
- ✅ MongoDB Atlas integration
- ✅ All AI services configured
- ✅ Health monitoring
- ✅ Automated deployments
- ✅ Zero-downtime updates

**Backend URL**: `https://your-service-name.onrender.com`
**Health Check**: `https://your-service-name.onrender.com/api/health`

---

## 📞 SUPPORT

If you encounter any issues:
1. Check Render Dashboard logs
2. Verify environment variables
3. Test health endpoint
4. Review this guide

**Happy deploying!** 🚀
