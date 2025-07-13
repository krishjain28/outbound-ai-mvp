// test-worker-deployment.js
const axios = require('axios');

const BASE_URL = 'https://outbound-ai.onrender.com';

async function testWorkerDeployment() {
  console.log('🔍 Testing Worker Deployment Status...\n');
  
  try {
    // Test 1: Health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health endpoint working');
    console.log('Response:', JSON.stringify(healthResponse.data, null, 2));
    
    // Check if workers are in health response
    if (healthResponse.data.workers) {
      console.log('✅ Workers found in health response');
    } else {
      console.log('❌ Workers not found in health response - deployment may not be complete');
    }
    
    console.log('\n2. Testing worker status endpoint...');
    try {
      const workerResponse = await axios.get(`${BASE_URL}/api/workers/status`);
      console.log('✅ Worker status endpoint working');
      console.log('Worker Status:', JSON.stringify(workerResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Worker status endpoint not available yet');
      console.log('Error:', error.response?.data?.message || error.message);
    }
    
    console.log('\n3. Testing API health endpoint...');
    const apiHealthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ API health endpoint working');
    console.log('Response:', JSON.stringify(apiHealthResponse.data, null, 2));
    
    // Check if workers are in API health response
    if (apiHealthResponse.data.workers) {
      console.log('✅ Workers found in API health response');
    } else {
      console.log('❌ Workers not found in API health response');
    }
    
  } catch (error) {
    console.error('❌ Error testing deployment:', error.message);
  }
}

// Run the test
testWorkerDeployment(); 