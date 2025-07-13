#!/usr/bin/env node

const axios = require('axios');

console.log('🔍 Testing API Integrations');
console.log('============================\n');

// Test configuration
const config = {
  telnyx: {
    apiKey: process.env.TELNYX_API_KEY,
    phoneNumber: process.env.TELNYX_PHONE_NUMBER,
    connectionId: process.env.TELNYX_CONNECTION_ID
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  deepgram: {
    apiKey: process.env.DEEPGRAM_API_KEY
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID
  }
};

async function testTelnyx() {
  console.log('📞 Testing Telnyx Integration...');
  
  if (!config.telnyx.apiKey) {
    console.log('❌ TELNYX_API_KEY not set');
    return false;
  }
  
  try {
    const response = await axios.get('https://api.telnyx.com/v2/phone_numbers', {
      headers: {
        'Authorization': `Bearer ${config.telnyx.apiKey}`
      }
    });
    
    console.log('✅ Telnyx API working');
    console.log(`   Phone Numbers: ${response.data.data?.length || 0} found`);
    return true;
  } catch (error) {
    console.log('❌ Telnyx API failed:', error.response?.status || error.message);
    return false;
  }
}

async function testOpenAI() {
  console.log('\n🤖 Testing OpenAI Integration...');
  
  if (!config.openai.apiKey) {
    console.log('❌ OPENAI_API_KEY not set');
    return false;
  }
  
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10
    }, {
      headers: {
        'Authorization': `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ OpenAI API working');
    console.log(`   Model: ${response.data.model}`);
    return true;
  } catch (error) {
    console.log('❌ OpenAI API failed:', error.response?.status || error.message);
    return false;
  }
}

async function testDeepgram() {
  console.log('\n🎤 Testing Deepgram Integration...');
  
  if (!config.deepgram.apiKey) {
    console.log('❌ DEEPGRAM_API_KEY not set');
    return false;
  }
  
  try {
    const response = await axios.get('https://api.deepgram.com/v1/projects', {
      headers: {
        'Authorization': `Token ${config.deepgram.apiKey}`
      }
    });
    
    console.log('✅ Deepgram API working');
    console.log(`   Projects: ${response.data.projects?.length || 0} found`);
    return true;
  } catch (error) {
    console.log('❌ Deepgram API failed:', error.response?.status || error.message);
    return false;
  }
}

async function testElevenLabs() {
  console.log('\n🎵 Testing ElevenLabs Integration...');
  
  if (!config.elevenlabs.apiKey) {
    console.log('❌ ELEVENLABS_API_KEY not set');
    return false;
  }
  
  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': config.elevenlabs.apiKey
      }
    });
    
    console.log('✅ ElevenLabs API working');
    console.log(`   Voices: ${response.data.voices?.length || 0} found`);
    return true;
  } catch (error) {
    console.log('❌ ElevenLabs API failed:', error.response?.status || error.message);
    return false;
  }
}

async function testBackendIntegrations() {
  console.log('\n🌐 Testing Backend API Integrations...');
  
  try {
    const response = await axios.get('https://outbound-ai.onrender.com/health');
    console.log('✅ Backend health check passed');
    
    // Test if integrations are configured in backend
    const integrations = response.data;
    console.log('   Backend Status:', integrations.message);
    
    return true;
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting API Integration Tests...\n');
  
  const results = {
    telnyx: await testTelnyx(),
    openai: await testOpenAI(),
    deepgram: await testDeepgram(),
    elevenlabs: await testElevenLabs(),
    backend: await testBackendIntegrations()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`📞 Telnyx: ${results.telnyx ? '✅ Working' : '❌ Failed'}`);
  console.log(`🤖 OpenAI: ${results.openai ? '✅ Working' : '❌ Failed'}`);
  console.log(`🎤 Deepgram: ${results.deepgram ? '✅ Working' : '❌ Failed'}`);
  console.log(`🎵 ElevenLabs: ${results.elevenlabs ? '✅ Working' : '❌ Failed'}`);
  console.log(`🌐 Backend: ${results.backend ? '✅ Working' : '❌ Failed'}`);
  
  const workingCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${workingCount}/${totalCount} integrations working`);
  
  if (workingCount < totalCount) {
    console.log('\n🔧 To fix missing integrations:');
    console.log('1. Get API keys from respective services');
    console.log('2. Update Render environment variables');
    console.log('3. Redeploy the backend');
  }
}

// Run the tests
runAllTests().catch(console.error); 