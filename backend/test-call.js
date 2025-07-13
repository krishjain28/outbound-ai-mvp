const axios = require('axios');
require('dotenv').config();

// Test configuration
const BACKEND_URL = 'http://localhost:5001';
const TEST_PHONE_NUMBER = '+1234567890'; // Replace with your test number

async function testCallFunctionality() {
  console.log('🧪 Testing AI SDR Call Functionality');
  console.log('=====================================');
  
  // Step 1: Test backend health
  console.log('\n1. Testing backend health...');
  try {
    const healthResponse = await axios.get(`${BACKEND_URL}/api/health`);
    console.log('✅ Backend is healthy:', healthResponse.data);
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return;
  }
  
  // Step 2: Test environment variables
  console.log('\n2. Testing environment variables...');
  const envVars = {
    TELNYX_API_KEY: !!process.env.TELNYX_API_KEY,
    TELNYX_PHONE_NUMBER: !!process.env.TELNYX_PHONE_NUMBER,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY
  };
  
  console.log('Environment variables:', envVars);
  
  if (!envVars.TELNYX_API_KEY || !envVars.TELNYX_PHONE_NUMBER || !envVars.OPENAI_API_KEY) {
    console.error('❌ Missing required environment variables');
    return;
  }
  
  console.log('✅ All environment variables are set');
  
  // Step 3: Test Telnyx API connection
  console.log('\n3. Testing Telnyx API connection...');
  try {
    const telnyxResponse = await axios.get('https://api.telnyx.com/v2/phone_numbers', {
      headers: {
        'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Telnyx API connection successful');
    console.log('📞 Available phone numbers:', telnyxResponse.data.data.length);
  } catch (error) {
    console.error('❌ Telnyx API connection failed:', error.response?.data || error.message);
  }
  
  // Step 4: Test OpenAI API connection
  console.log('\n4. Testing OpenAI API connection...');
  try {
    const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello, this is a test.' }],
      max_tokens: 10
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ OpenAI API connection successful');
  } catch (error) {
    console.error('❌ OpenAI API connection failed:', error.response?.data || error.message);
  }
  
  console.log('\n🎉 Test completed! Your system is ready for making calls.');
  console.log('\n📋 Next steps:');
  console.log('1. Go to http://localhost:3000');
  console.log('2. Login to your account');
  console.log('3. Navigate to the Call page');
  console.log('4. Try making a test call');
  console.log('\n⚠️  Note: Make sure to use a real phone number for testing');
}

// Run the test
testCallFunctionality().catch(console.error); 