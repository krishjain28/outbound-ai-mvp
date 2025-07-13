#!/usr/bin/env node

const https = require('https');

// Configuration
const RENDER_API_URL = 'https://api.render.com/v1';
const GITHUB_REPO = 'https://github.com/krishjain28/outbound-ai-mvp';

// Service configuration
const serviceConfig = {
  name: 'outbound-ai-backend',
  type: 'web_service',
  repo: GITHUB_REPO,
  branch: 'main',
  buildCommand: 'cd backend && npm install --production',
  startCommand: 'cd backend && node server.js',
  envVars: [
    { key: 'NODE_ENV', value: 'production' },
    { key: 'PORT', value: '10000' }
  ],
  region: 'oregon',
  plan: 'starter',
  healthCheckPath: '/api/health'
};

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RENDER_API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function deployToRender() {
  console.log('🚀 Starting Render deployment...');
  
  try {
    // Check if service exists
    console.log('📋 Checking existing services...');
    const services = await makeRequest('GET', '/services');
    
    if (services.status !== 200) {
      console.error('❌ Failed to get services:', services.data);
      return;
    }
    
    const existingService = services.data.find(s => s.name === serviceConfig.name);
    
    if (existingService) {
      console.log('🔄 Service exists, triggering deployment...');
      const deploy = await makeRequest('POST', `/services/${existingService.id}/deploys`);
      
      if (deploy.status === 201) {
        console.log('✅ Deployment triggered successfully!');
        console.log(`📊 Deployment ID: ${deploy.data.id}`);
        console.log(`🌐 Service URL: https://${existingService.name}.onrender.com`);
      } else {
        console.error('❌ Failed to trigger deployment:', deploy.data);
      }
    } else {
      console.log('🆕 Creating new service...');
      const service = await makeRequest('POST', '/services', serviceConfig);
      
      if (service.status === 201) {
        console.log('✅ Service created successfully!');
        console.log(`🌐 Service URL: https://${service.data.name}.onrender.com`);
      } else {
        console.error('❌ Failed to create service:', service.data);
      }
    }
    
  } catch (error) {
    console.error('💥 Deployment failed:', error.message);
  }
}

// Check for API key
if (!process.env.RENDER_API_KEY) {
  console.error('❌ RENDER_API_KEY environment variable is required');
  console.log('💡 Get your API key from: https://dashboard.render.com/account');
  process.exit(1);
}

deployToRender();
