require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

async function testSystemHealth() {
  console.log('🔍 COMPREHENSIVE SYSTEM HEALTH CHECK');
  console.log('=====================================\n');
  
  const results = {
    backend: false,
    ngrok: false,
    mongodb: false,
    telnyx: false,
    openai: false,
    environment: false
  };

  // 1. Test Backend Health
  try {
    console.log('1. Testing Backend Health...');
    const response = await axios.get('http://localhost:5001/api/health', { timeout: 5000 });
    if (response.status === 200) {
      console.log('   ✅ Backend is healthy:', response.data);
      results.backend = true;
    }
  } catch (error) {
    console.log('   ❌ Backend health check failed:', error.message);
  }

  // 2. Test Ngrok Tunnel
  try {
    console.log('\n2. Testing Ngrok Tunnel...');
    const response = await axios.get('https://67ee34881245.ngrok-free.app/api/health', { timeout: 10000 });
    if (response.status === 200) {
      console.log('   ✅ Ngrok tunnel is working:', response.data);
      results.ngrok = true;
    }
  } catch (error) {
    console.log('   ❌ Ngrok tunnel failed:', error.message);
  }

  // 3. Test MongoDB Connection
  try {
    console.log('\n3. Testing MongoDB Connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('   ✅ MongoDB connected successfully');
    results.mongodb = true;
    await mongoose.disconnect();
  } catch (error) {
    console.log('   ❌ MongoDB connection failed:', error.message);
  }

  // 4. Test Telnyx API
  try {
    console.log('\n4. Testing Telnyx API...');
    const response = await axios.get('https://api.telnyx.com/v2/phone_numbers', {
      headers: {
        'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log('   ✅ Telnyx API connected successfully');
      console.log(`   📞 Available phone numbers: ${response.data.data.length}`);
      results.telnyx = true;
    }
  } catch (error) {
    console.log('   ❌ Telnyx API failed:', error.response?.status || error.message);
  }

  // 5. Test OpenAI API
  try {
    console.log('\n5. Testing OpenAI API...');
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log('   ✅ OpenAI API connected successfully');
      results.openai = true;
    }
  } catch (error) {
    console.log('   ❌ OpenAI API failed:', error.response?.status || error.message);
  }

  // 6. Test Environment Variables
  console.log('\n6. Testing Environment Variables...');
  const requiredEnvVars = [
    'TELNYX_API_KEY',
    'TELNYX_PHONE_NUMBER', 
    'TELNYX_CONNECTION_ID',
    'OPENAI_API_KEY',
    'MONGODB_URI',
    'BACKEND_URL'
  ];

  let envVarsPresent = 0;
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: Set`);
      envVarsPresent++;
    } else {
      console.log(`   ❌ ${varName}: Missing`);
    }
  });

  if (envVarsPresent === requiredEnvVars.length) {
    console.log('   ✅ All environment variables are set');
    results.environment = true;
  } else {
    console.log(`   ❌ Missing ${requiredEnvVars.length - envVarsPresent} environment variables`);
  }

  // Summary
  console.log('\n📊 SYSTEM HEALTH SUMMARY');
  console.log('========================');
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  console.log(`\n🎯 Overall Health: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL SYSTEMS OPERATIONAL! Ready for calls.');
  } else {
    console.log('⚠️  Some systems need attention before making calls.');
  }
  
  return results;
}

// Run the test
testSystemHealth().catch(console.error); 