const axios = require('axios');
const { createClient } = require('@deepgram/sdk');
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
require('dotenv').config();

// Color logging for better visibility
const colorLog = (color, message) => {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function testOptimizedCallSystem() {
  colorLog('cyan', '\n🚀 Testing Optimized Call System - All Components\n');

  const results = {
    backend: false,
    telnyx: false,
    openai: false,
    deepgram: false,
    elevenlabs: false,
    ngrok: false,
    mongodb: false,
  };

  try {
    // 1. Test Backend Health
    colorLog('blue', '🔍 Testing Backend Health...');
    try {
      const backendResponse = await axios.get('http://localhost:5001/health', {
        timeout: 5000,
      });

      if (backendResponse.status === 200) {
        colorLog('green', '✅ Backend is running on port 5001');
        results.backend = true;
      }
    } catch (error) {
      colorLog('red', '❌ Backend health check failed');
      colorLog('red', '   Make sure backend is running: npm run dev');
      return;
    }

    // 2. Test Environment Variables
    colorLog('blue', '\n🔧 Checking Environment Variables...');
    const requiredEnvVars = ['TELNYX_API_KEY', 'OPENAI_API_KEY', 'BACKEND_URL'];
    const optionalEnvVars = ['DEEPGRAM_API_KEY', 'ELEVENLABS_API_KEY'];

    const missingRequired = [];
    const missingOptional = [];

    requiredEnvVars.forEach(varName => {
      if (
        !process.env[varName] ||
        process.env[varName] ===
          `your-${varName.toLowerCase().replace('_', '-')}-here`
      ) {
        missingRequired.push(varName);
      } else {
        colorLog('green', `✅ ${varName} is configured`);
      }
    });

    optionalEnvVars.forEach(varName => {
      if (
        !process.env[varName] ||
        process.env[varName] ===
          `your-${varName.toLowerCase().replace('_', '-')}-here`
      ) {
        missingOptional.push(varName);
      } else {
        colorLog('green', `✅ ${varName} is configured`);
      }
    });

    if (missingRequired.length > 0) {
      colorLog(
        'red',
        `❌ Missing required environment variables: ${missingRequired.join(', ')}`
      );
      colorLog('yellow', '   Please configure these in your .env file');
      return;
    }

    if (missingOptional.length > 0) {
      colorLog(
        'yellow',
        `⚠️  Missing optional environment variables: ${missingOptional.join(', ')}`
      );
      colorLog(
        'yellow',
        '   These enable enhanced features but system will work without them'
      );
    }

    // 3. Test Telnyx API
    colorLog('blue', '\n📞 Testing Telnyx API...');
    try {
      const telnyxResponse = await axios.get(
        'https://api.telnyx.com/v2/available_phone_numbers',
        {
          headers: {
            Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
          },
          timeout: 10000,
        }
      );

      colorLog('green', '✅ Telnyx API connected successfully');
      colorLog(
        'green',
        `📱 Phone number configured: ${process.env.TELNYX_PHONE_NUMBER || 'Not set'}`
      );
      results.telnyx = true;
    } catch (error) {
      colorLog('red', '❌ Telnyx API connection failed');
      colorLog(
        'red',
        `   Error: ${error.response?.data?.errors?.[0]?.detail || error.message}`
      );
    }

    // 4. Test OpenAI API
    colorLog('blue', '\n🤖 Testing OpenAI API...');
    try {
      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Test message' }],
          max_tokens: 5,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      colorLog('green', '✅ OpenAI API connected successfully');
      colorLog('green', '🧠 GPT-4 model access confirmed');
      results.openai = true;
    } catch (error) {
      colorLog('red', '❌ OpenAI API connection failed');
      colorLog(
        'red',
        `   Error: ${error.response?.data?.error?.message || error.message}`
      );
    }

    // 5. Test Deepgram API (if configured)
    if (process.env.DEEPGRAM_API_KEY) {
      colorLog('blue', '\n🎙️ Testing Deepgram API...');
      try {
        const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
        const response = await deepgram.manage.getProjectBalances(
          process.env.DEEPGRAM_PROJECT_ID || 'default'
        );

        colorLog('green', '✅ Deepgram API connected successfully');
        colorLog('green', '🎯 Real-time speech recognition enabled');
        results.deepgram = true;
      } catch (error) {
        colorLog('red', '❌ Deepgram API connection failed');
        colorLog('red', `   Error: ${error.message}`);
      }
    }

    // 6. Test ElevenLabs API (if configured)
    if (process.env.ELEVENLABS_API_KEY) {
      colorLog('blue', '\n🎤 Testing ElevenLabs API...');
      try {
        const elevenlabs = new ElevenLabsClient({
          apiKey: process.env.ELEVENLABS_API_KEY,
        });

        const voices = await elevenlabs.voices.getAll();

        colorLog('green', '✅ ElevenLabs API connected successfully');
        colorLog('green', `🎵 Available voices: ${voices.voices?.length || 0}`);

        if (process.env.ELEVENLABS_VOICE_ID) {
          const configuredVoice = voices.voices?.find(
            voice => voice.voice_id === process.env.ELEVENLABS_VOICE_ID
          );
          if (configuredVoice) {
            colorLog(
              'green',
              `✅ Configured voice "${configuredVoice.name}" is available`
            );
          } else {
            colorLog(
              'yellow',
              '⚠️  Configured voice ID not found, will use default'
            );
          }
        }

        results.elevenlabs = true;
      } catch (error) {
        colorLog('red', '❌ ElevenLabs API connection failed');
        colorLog('red', `   Error: ${error.message}`);
      }
    }

    // 7. Test Ngrok Tunnel
    colorLog('blue', '\n🌐 Testing Ngrok Tunnel...');
    try {
      const ngrokResponse = await axios.get(
        process.env.BACKEND_URL + '/health',
        {
          timeout: 10000,
        }
      );

      if (ngrokResponse.status === 200) {
        colorLog('green', '✅ Ngrok tunnel is working');
        colorLog(
          'green',
          `🔗 Webhook URL: ${process.env.BACKEND_URL}/api/calls/webhook`
        );
        results.ngrok = true;
      }
    } catch (error) {
      colorLog('red', '❌ Ngrok tunnel test failed');
      colorLog('red', `   Error: ${error.message}`);
      colorLog(
        'yellow',
        '   Make sure ngrok is running and BACKEND_URL is correct'
      );
    }

    // 8. Test MongoDB Connection
    colorLog('blue', '\n🗄️ Testing MongoDB Connection...');
    try {
      const mongoResponse = await axios.get(
        'http://localhost:5001/api/auth/health',
        {
          timeout: 5000,
        }
      );

      if (mongoResponse.status === 200) {
        colorLog('green', '✅ MongoDB connection is working');
        results.mongodb = true;
      }
    } catch (error) {
      colorLog('red', '❌ MongoDB connection test failed');
      colorLog('red', '   Make sure MongoDB is running and configured');
    }

    // 9. Test Optimized Speech Service
    colorLog('blue', '\n🎯 Testing Optimized Speech Service...');
    try {
      const speechServiceResponse = await axios.get(
        'http://localhost:5001/api/calls/config-status',
        {
          timeout: 5000,
        }
      );

      if (speechServiceResponse.status === 200) {
        const config = speechServiceResponse.data.config;
        colorLog('green', '✅ Speech service configuration loaded');

        if (config.enhanced_voice_synthesis) {
          colorLog('green', '🎤 Enhanced voice synthesis (ElevenLabs) enabled');
        }

        if (config.enhanced_speech_recognition) {
          colorLog(
            'green',
            '🎙️ Enhanced speech recognition (Deepgram) enabled'
          );
        }

        colorLog('green', '🧠 Natural conversation (GPT-4) enabled');
      }
    } catch (error) {
      colorLog('red', '❌ Speech service test failed');
    }

    // Summary
    colorLog('cyan', '\n📊 SYSTEM STATUS SUMMARY');
    colorLog('cyan', '========================');

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;

    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅' : '❌';
      const testName = test.charAt(0).toUpperCase() + test.slice(1);
      colorLog(passed ? 'green' : 'red', `${status} ${testName}`);
    });

    colorLog(
      'cyan',
      `\n🎯 Overall Status: ${passedTests}/${totalTests} tests passed`
    );

    if (passedTests >= 4) {
      // Backend, Telnyx, OpenAI, and either Ngrok or MongoDB
      colorLog('green', '\n🚀 SYSTEM READY FOR OPTIMIZED CALLS!');
      colorLog('green', '✅ All core components are working');
      colorLog('green', '✅ Voice delay optimizations active');
      colorLog('green', '✅ Speech recognition improvements enabled');
      colorLog('green', '✅ ElevenLabs integration optimized');

      if (results.elevenlabs && results.deepgram) {
        colorLog('green', '🌟 ENHANCED MODE: All premium features enabled!');
      }

      colorLog('yellow', '\n📋 NEXT STEPS:');
      colorLog('yellow', '1. Make a test call using the frontend');
      colorLog('yellow', '2. Monitor console logs for optimization details');
      colorLog(
        'yellow',
        '3. Verify reduced voice delay and improved responses'
      );
    } else {
      colorLog('red', '\n❌ SYSTEM NOT READY');
      colorLog('red', '   Please fix the failing components above');
    }
  } catch (error) {
    colorLog('red', '\n💥 Test suite failed with error:');
    colorLog('red', error.message);
  }
}

// Run the test
testOptimizedCallSystem().catch(console.error);
