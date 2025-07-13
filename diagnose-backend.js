#!/usr/bin/env node

/**
 * Backend Deployment Diagnostic Tool
 * Helps diagnose backend deployment issues on Render
 */

const https = require('https');
const { URL } = require('url');

const BACKEND_URL = 'https://outbound-ai-backend.onrender.com';

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
        'User-Agent': 'Backend-Diagnostic/1.0',
        ...options.headers
      },
      timeout: 15000 // 15 second timeout
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

async function diagnoseBackend() {
  log(`${colors.bold}🔍 Backend Deployment Diagnostic${colors.reset}`, 'blue');
  log('Checking backend deployment status on Render...\n', 'blue');

  // Test 1: Basic connectivity
  log('1️⃣ Testing basic connectivity...', 'blue');
  try {
    const response = await makeRequest(BACKEND_URL);
    log(`   ✅ Backend is responding`, 'green');
    log(`   Status Code: ${response.statusCode}`, 'green');
    log(`   Content Type: ${response.headers['content-type'] || 'N/A'}`, 'green');
  } catch (error) {
    log(`   ❌ Backend is not responding`, 'red');
    log(`   Error: ${error.message}`, 'red');
  }

  // Test 2: Health endpoint
  log('\n2️⃣ Testing health endpoint...', 'blue');
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    log(`   ✅ Health endpoint is responding`, 'green');
    log(`   Status Code: ${response.statusCode}`, 'green');
    
    if (response.statusCode === 200) {
      try {
        const healthData = JSON.parse(response.data);
        log(`   Environment: ${healthData.environment || 'N/A'}`, 'green');
        if (healthData.database) {
          log(`   Database: ${healthData.database.status}`, 
              healthData.database.status === 'connected' ? 'green' : 'red');
        }
      } catch (e) {
        log('   Health data parsing failed', 'yellow');
      }
    }
  } catch (error) {
    log(`   ❌ Health endpoint failed`, 'red');
    log(`   Error: ${error.message}`, 'red');
  }

  // Test 3: API endpoints
  log('\n3️⃣ Testing API endpoints...', 'blue');
  const endpoints = ['/api/auth/login', '/api/user/profile', '/api/workers/status'];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BACKEND_URL}${endpoint}`);
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

  // Test 4: DNS resolution
  log('\n4️⃣ Testing DNS resolution...', 'blue');
  const dns = require('dns').promises;
  try {
    const hostname = new URL(BACKEND_URL).hostname;
    const addresses = await dns.resolve4(hostname);
    log(`   ✅ DNS resolution successful`, 'green');
    log(`   Hostname: ${hostname}`, 'green');
    log(`   IP Addresses: ${addresses.join(', ')}`, 'green');
  } catch (error) {
    log(`   ❌ DNS resolution failed`, 'red');
    log(`   Error: ${error.message}`, 'red');
  }

  // Test 5: SSL/TLS
  log('\n5️⃣ Testing SSL/TLS...', 'blue');
  try {
    const response = await makeRequest(BACKEND_URL);
    log(`   ✅ SSL/TLS connection successful`, 'green');
    log(`   Protocol: ${response.headers['server'] || 'N/A'}`, 'green');
  } catch (error) {
    log(`   ❌ SSL/TLS connection failed`, 'red');
    log(`   Error: ${error.message}`, 'red');
  }

  // Summary and recommendations
  log('\n📋 Diagnostic Summary:', 'blue');
  log('If the backend is not responding, check:', 'blue');
  log('   1. Render dashboard for deployment status', 'blue');
  log('   2. Build logs for any errors', 'blue');
  log('   3. Environment variables configuration', 'blue');
  log('   4. MongoDB Atlas connection', 'blue');
  log('   5. Render service logs', 'blue');
  
  log('\n🔧 Common Solutions:', 'blue');
  log('   - Wait for deployment to complete (can take 5-10 minutes)', 'blue');
  log('   - Check Render dashboard for build errors', 'blue');
  log('   - Verify environment variables in Render', 'blue');
  log('   - Check MongoDB Atlas cluster status', 'blue');
  log('   - Restart the Render service if needed', 'blue');
  
  log('\n🌐 Render Dashboard:', 'blue');
  log('   https://dashboard.render.com/web/srv-xxx', 'blue');
  log('   (Replace with your actual service ID)', 'blue');
}

// Run the diagnostic
diagnoseBackend().catch(error => {
  log(`\n❌ Diagnostic failed: ${error.message}`, 'red');
  process.exit(1);
}); 