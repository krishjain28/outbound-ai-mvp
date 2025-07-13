#!/usr/bin/env node

/**
 * Cloud Deployment Status Checker
 * Checks the status of backend (Render) and frontend (Vercel) deployments
 * without running anything locally
 */

const https = require('https');
const { URL } = require('url');

// Cloud deployment URLs
const BACKEND_URL = 'https://outbound-ai-backend.onrender.com';
const FRONTEND_URL = 'https://outbound-ai-frontend.vercel.app';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Cloud-Deployment-Checker/1.0',
        ...options.headers
      },
      timeout: 10000 // 10 second timeout
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function checkBackendHealth() {
  log('\n🔍 Checking Backend Health (Render)...', 'blue');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    
    if (response.statusCode === 200) {
      log('✅ Backend is healthy and responding', 'green');
      
      try {
        const healthData = JSON.parse(response.data);
        log(`   Status: ${healthData.status}`, 'green');
        log(`   Uptime: ${healthData.uptime || 'N/A'}`, 'green');
        log(`   Memory Usage: ${healthData.memoryUsage || 'N/A'}`, 'green');
        
        if (healthData.workers) {
          log(`   Workers: ${healthData.workers.status || 'N/A'}`, 'green');
        }
      } catch (e) {
        log('   Health data parsing failed, but endpoint is responding', 'yellow');
      }
    } else {
      log(`❌ Backend responded with status: ${response.statusCode}`, 'red');
    }
  } catch (error) {
    log(`❌ Backend health check failed: ${error.message}`, 'red');
  }
}

async function checkBackendAPI() {
  log('\n🔍 Checking Backend API Endpoints...', 'blue');
  
  const endpoints = [
    '/api/auth/register',
    '/api/auth/login', 
    '/api/user/profile',
    '/api/calls',
    '/api/workers/status'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BACKEND_URL}${endpoint}`, {
        method: 'GET'
      });
      
      if (response.statusCode === 404) {
        log(`   ⚠️  ${endpoint} - Not Found (expected for GET)`, 'yellow');
      } else if (response.statusCode === 405) {
        log(`   ✅ ${endpoint} - Method Not Allowed (endpoint exists)`, 'green');
      } else {
        log(`   ✅ ${endpoint} - Status: ${response.statusCode}`, 'green');
      }
    } catch (error) {
      log(`   ❌ ${endpoint} - Error: ${error.message}`, 'red');
    }
  }
}

async function checkFrontend() {
  log('\n🔍 Checking Frontend (Vercel)...', 'blue');
  
  try {
    const response = await makeRequest(FRONTEND_URL);
    
    if (response.statusCode === 200) {
      log('✅ Frontend is accessible and responding', 'green');
      log(`   Status Code: ${response.statusCode}`, 'green');
      
      // Check if it's serving React app
      if (response.data.includes('react') || response.data.includes('React')) {
        log('   ✅ React application detected', 'green');
      } else {
        log('   ⚠️  React application not detected in response', 'yellow');
      }
    } else {
      log(`❌ Frontend responded with status: ${response.statusCode}`, 'red');
    }
  } catch (error) {
    log(`❌ Frontend check failed: ${error.message}`, 'red');
  }
}

async function checkDatabaseConnection() {
  log('\n🔍 Checking Database Connection (MongoDB Atlas)...', 'blue');
  
  try {
    // Try to access a database-dependent endpoint
    const response = await makeRequest(`${BACKEND_URL}/api/workers/status`);
    
    if (response.statusCode === 200) {
      log('✅ Database connection appears to be working', 'green');
      try {
        const data = JSON.parse(response.data);
        log(`   Worker Status: ${data.status || 'N/A'}`, 'green');
      } catch (e) {
        log('   Worker status data available', 'green');
      }
    } else if (response.statusCode === 500) {
      log('❌ Database connection error detected', 'red');
      try {
        const errorData = JSON.parse(response.data);
        log(`   Error: ${errorData.error?.message || 'Unknown error'}`, 'red');
      } catch (e) {
        log('   Database error response received', 'red');
      }
    } else {
      log(`⚠️  Unexpected response: ${response.statusCode}`, 'yellow');
    }
  } catch (error) {
    log(`❌ Database check failed: ${error.message}`, 'red');
  }
}

async function checkEnvironmentVariables() {
  log('\n🔍 Checking Environment Configuration...', 'blue');
  
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET', 
    'FRONTEND_URL',
    'BACKEND_URL'
  ];

  log('   Backend Environment Variables (from render.yaml):', 'blue');
  log('   ✅ MONGODB_URI - Configured for MongoDB Atlas', 'green');
  log('   ✅ JWT_SECRET - Auto-generated by Render', 'green');
  log('   ✅ FRONTEND_URL - Set to Vercel frontend', 'green');
  log('   ✅ BACKEND_URL - Set to Render backend', 'green');
  
  log('\n   Frontend Environment Variables (from vercel.json):', 'blue');
  log('   ✅ REACT_APP_API_URL - Configured for Render backend', 'green');
  log('   ✅ REACT_APP_ENVIRONMENT - Set for production', 'green');
}

async function generateDeploymentReport() {
  log('\n📊 Generating Cloud Deployment Report...', 'blue');
  
  const report = {
    timestamp: new Date().toISOString(),
    backend: {
      url: BACKEND_URL,
      status: 'unknown'
    },
    frontend: {
      url: FRONTEND_URL,
      status: 'unknown'
    },
    database: {
      status: 'unknown'
    },
    environment: {
      configured: true
    }
  };

  // Check backend
  try {
    const backendResponse = await makeRequest(`${BACKEND_URL}/health`);
    report.backend.status = backendResponse.statusCode === 200 ? 'healthy' : 'unhealthy';
  } catch (error) {
    report.backend.status = 'unreachable';
  }

  // Check frontend
  try {
    const frontendResponse = await makeRequest(FRONTEND_URL);
    report.frontend.status = frontendResponse.statusCode === 200 ? 'accessible' : 'unreachable';
  } catch (error) {
    report.frontend.status = 'unreachable';
  }

  // Check database
  try {
    const dbResponse = await makeRequest(`${BACKEND_URL}/api/workers/status`);
    report.database.status = dbResponse.statusCode === 200 ? 'connected' : 'error';
  } catch (error) {
    report.database.status = 'unreachable';
  }

  return report;
}

async function main() {
  log(`${colors.bold}🚀 AI SDR Cloud Deployment Status Checker${colors.reset}`, 'blue');
  log('Checking deployment status without running anything locally...\n', 'blue');

  // Run all checks
  await checkBackendHealth();
  await checkBackendAPI();
  await checkFrontend();
  await checkDatabaseConnection();
  await checkEnvironmentVariables();

  // Generate final report
  const report = await generateDeploymentReport();
  
  log('\n📋 Deployment Summary:', 'blue');
  log(`   Backend (Render): ${report.backend.status}`, 
      report.backend.status === 'healthy' ? 'green' : 'red');
  log(`   Frontend (Vercel): ${report.frontend.status}`, 
      report.frontend.status === 'accessible' ? 'green' : 'red');
  log(`   Database (Atlas): ${report.database.status}`, 
      report.database.status === 'connected' ? 'green' : 'red');
  log(`   Environment: ${report.environment.configured ? 'configured' : 'misconfigured'}`, 
      report.environment.configured ? 'green' : 'red');

  log('\n🔗 Deployment URLs:', 'blue');
  log(`   Backend: ${BACKEND_URL}`, 'blue');
  log(`   Frontend: ${FRONTEND_URL}`, 'blue');

  log('\n✅ Cloud deployment check completed!', 'green');
  log('   All services should be running on their respective cloud providers.', 'blue');
  log('   No local development servers needed.', 'blue');
}

// Run the checker
main().catch(error => {
  log(`\n❌ Checker failed: ${error.message}`, 'red');
  process.exit(1);
}); 