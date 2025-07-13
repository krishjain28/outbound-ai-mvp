# 🚀 Render CLI Management Guide

## ✅ Installation Complete

The Render CLI has been successfully installed and is ready to use!

**Version**: v2.1.4
**Location**: `/Users/krishjain/.local/bin/render`

## 🔐 Authentication

First, you need to authenticate with Render:

```bash
render login
```

This will open your browser to authenticate with your Render account.

## 📋 Useful Commands for Your Backend

### 1. **View Services**
```bash
render services
```
Lists all your services including your backend.

### 2. **View Logs**
```bash
render logs
```
Shows real-time logs for your backend service.

### 3. **Restart Service**
```bash
render restart
```
Restarts your backend service (useful for applying changes).

### 4. **View Deployments**
```bash
render deploys
```
Shows deployment history and status.

### 5. **Check Service Status**
```bash
render services --output json
```
Shows detailed service information in JSON format.

## 🎯 Quick Management Commands

### **Check Backend Status**
```bash
# View service status
render services

# View recent logs
render logs

# Check deployment status
render deploys
```

### **Restart Backend**
```bash
# Restart the service
render restart

# Wait for restart and check logs
render logs
```

### **Monitor Deployment**
```bash
# View deployment progress
render deploys

# Watch logs during deployment
render logs --follow
```

## 🔧 Troubleshooting Commands

### **If Backend is Down**
```bash
# Check service status
render services

# View error logs
render logs

# Restart service
render restart

# Monitor restart
render logs --follow
```

### **Check Environment Variables**
```bash
# View service details (includes env vars)
render services --output json
```

### **Force New Deployment**
```bash
# Trigger manual deployment
render deploys create
```

## 📊 Monitoring Your Backend

### **Real-time Logs**
```bash
# Follow logs in real-time
render logs --follow

# View last 100 log lines
render logs --tail 100
```

### **Service Health**
```bash
# Check service status
render services

# View detailed service info
render services --output json
```

## 🚀 Deployment Workflow

### **1. Make Code Changes**
```bash
git add .
git commit -m "Your changes"
git push origin main
```

### **2. Monitor Deployment**
```bash
# Watch deployment progress
render deploys

# Monitor logs during deployment
render logs --follow
```

### **3. Verify Deployment**
```bash
# Check service status
render services

# Test your endpoints
curl https://outbound-ai.onrender.com/
curl https://outbound-ai.onrender.com/health
```

## 🔍 Common Use Cases

### **Quick Status Check**
```bash
render services && render logs --tail 20
```

### **Restart and Monitor**
```bash
render restart && render logs --follow
```

### **Full Health Check**
```bash
# Check service status
render services

# Check recent logs
render logs --tail 50

# Test API endpoints
curl https://outbound-ai.onrender.com/health
```

## 📝 Tips

1. **Use `--follow` flag** to watch logs in real-time
2. **Use `--output json`** for structured data
3. **Use `--tail N`** to see last N log lines
4. **Always check logs** after restarting services
5. **Monitor deployments** to catch issues early

## 🆘 Emergency Commands

### **If Service is Completely Down**
```bash
# Check service status
render services

# View error logs
render logs --tail 100

# Restart service
render restart

# Monitor restart process
render logs --follow
```

### **If Deployment Failed**
```bash
# Check deployment status
render deploys

# View build logs
render logs

# Trigger new deployment
render deploys create
```

---

**Your Render CLI is now ready to manage your backend!** 🚀

Use `render --help` for more commands and options. 