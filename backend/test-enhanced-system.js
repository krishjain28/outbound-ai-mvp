const axios = require('axios');
const { createClient } = require('@deepgram/sdk');
const { ElevenLabsAPI } = require('@elevenlabs/elevenlabs-js');
require('dotenv').config();

// Test colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEnhancedSystem() {
  colorLog('bright', '🚀 ENHANCED AI CONVERSATION SYSTEM TEST');
  colorLog('bright', '='.repeat(50));

  const results = {
    backend: false,
    requiredApis: false,
    enhancedApis: false,
    telnyx: false,
    openai: false,
    deepgram: false,
    elevenlabs: false,
    services: false,
  };

  try {
    // 1. Test Backend Health
    colorLog('blue', '\n📡 Testing Backend Health...');
    try {
      const response = await axios.get('http://localhost:5001/api/health', {
        timeout: 5000,
      });

      if (response.status === 200) {
        colorLog('green', '✅ Backend is running on port 5001');
        results.backend = true;
      } else {
        colorLog('red', '❌ Backend health check failed');
      }
    } catch (error) {
      colorLog(
        'red',
        '❌ Backend not accessible. Please start the backend server.'
      );
      colorLog('yellow', '   Run: cd backend && npm run dev');
      return results;
    }

    // 2. Test Environment Variables
    colorLog('blue', '\n🔑 Testing Environment Variables...');

    const requiredEnvs = {
      TELNYX_API_KEY: process.env.TELNYX_API_KEY,
      TELNYX_PHONE_NUMBER: process.env.TELNYX_PHONE_NUMBER,
      TELNYX_CONNECTION_ID: process.env.TELNYX_CONNECTION_ID,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      BACKEND_URL: process.env.BACKEND_URL,
    };

    const enhancedEnvs = {
      DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
      ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID,
    };

    // Check required environment variables
    let requiredMissing = [];
    for (const [key, value] of Object.entries(requiredEnvs)) {
      if (value) {
        colorLog('green', `✅ ${key}: configured`);
      } else {
        colorLog('red', `❌ ${key}: missing`);
        requiredMissing.push(key);
      }
    }

    if (requiredMissing.length === 0) {
      results.requiredApis = true;
      colorLog('green', '✅ All required environment variables configured');
    } else {
      colorLog(
        'red',
        `❌ Missing required environment variables: ${requiredMissing.join(', ')}`
      );
    }

    // Check enhanced environment variables
    let enhancedMissing = [];
    for (const [key, value] of Object.entries(enhancedEnvs)) {
      if (value) {
        colorLog('green', `✅ ${key}: configured`);
      } else {
        colorLog('yellow', `⚠️  ${key}: not configured (optional)`);
        enhancedMissing.push(key);
      }
    }

    if (enhancedMissing.length === 0) {
      results.enhancedApis = true;
      colorLog('green', '✅ All enhanced environment variables configured');
    } else {
      colorLog(
        'yellow',
        `⚠️  Optional enhanced APIs not configured: ${enhancedMissing.join(', ')}`
      );
    }

    // 3. Test Telnyx API
    if (process.env.TELNYX_API_KEY) {
      colorLog('blue', '\n📞 Testing Telnyx API...');
      try {
        const response = await axios.get(
          'https://api.telnyx.com/v2/phone_numbers',
          {
            headers: {
              Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
            },
            timeout: 10000,
          }
        );

        const phoneNumbers = response.data.data || [];
        colorLog('green', `✅ Telnyx API connected successfully`);
        colorLog('green', `📱 Available phone numbers: ${phoneNumbers.length}`);

        if (phoneNumbers.length > 0) {
          const configuredNumber = phoneNumbers.find(
            num => num.phone_number === process.env.TELNYX_PHONE_NUMBER
          );
          if (configuredNumber) {
            colorLog(
              'green',
              `✅ Configured phone number ${process.env.TELNYX_PHONE_NUMBER} is available`
            );
          } else {
            colorLog(
              'yellow',
              `⚠️  Configured phone number ${process.env.TELNYX_PHONE_NUMBER} not found in account`
            );
          }
        }

        results.telnyx = true;
      } catch (error) {
        colorLog('red', '❌ Telnyx API connection failed');
        colorLog(
          'red',
          `   Error: ${error.response?.data?.errors?.[0]?.detail || error.message}`
        );
      }
    }

    // 4. Test OpenAI API
    if (process.env.OPENAI_API_KEY) {
      colorLog('blue', '\n🤖 Testing OpenAI API...');
      try {
        const response = await axios.get('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          timeout: 10000,
        });

        const models = response.data.data || [];
        const gpt4Models = models.filter(model => model.id.includes('gpt-4'));

        colorLog('green', `✅ OpenAI API connected successfully`);
        colorLog('green', `🧠 Available GPT-4 models: ${gpt4Models.length}`);

        if (gpt4Models.length > 0) {
          colorLog('green', `✅ GPT-4 access confirmed`);
        } else {
          colorLog(
            'yellow',
            `⚠️  GPT-4 access not available, will use GPT-3.5`
          );
        }

        results.openai = true;
      } catch (error) {
        colorLog('red', '❌ OpenAI API connection failed');
        colorLog(
          'red',
          `   Error: ${error.response?.data?.error?.message || error.message}`
        );
      }
    }

    // 5. Test Deepgram API
    if (process.env.DEEPGRAM_API_KEY) {
      colorLog('blue', '\n🎙️ Testing Deepgram API...');
      try {
        const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

        // Test with a simple API call
        const response = await axios.get(
          'https://api.deepgram.com/v1/projects',
          {
            headers: {
              Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
            },
            timeout: 10000,
          }
        );

        colorLog('green', `✅ Deepgram API connected successfully`);
        colorLog('green', `🎯 Real-time speech recognition available`);
        results.deepgram = true;
      } catch (error) {
        colorLog('red', '❌ Deepgram API connection failed');
        colorLog(
          'red',
          `   Error: ${error.response?.data?.message || error.message}`
        );
      }
    }

    // 6. Test ElevenLabs API
    if (process.env.ELEVENLABS_API_KEY) {
      colorLog('blue', '\n🎤 Testing ElevenLabs API...');
      try {
        const elevenlabs = new ElevenLabsAPI({
          apiKey: process.env.ELEVENLABS_API_KEY,
        });

        // Test by getting available voices
        const voices = await elevenlabs.voices.getAll();

        colorLog('green', `✅ ElevenLabs API connected successfully`);
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
              `⚠️  Configured voice ID not found, will use default`
            );
          }
        }

        results.elevenlabs = true;
      } catch (error) {
        colorLog('red', '❌ ElevenLabs API connection failed');
        colorLog('red', `   Error: ${error.message}`);
      }
    }

    // 7. Test Enhanced Services
    if (results.backend) {
      colorLog('blue', '\n🔧 Testing Enhanced Services...');
      try {
        // Test speech service
        const speechService = require('./services/speechService');
        colorLog('green', '✅ Speech service loaded successfully');

        // Test conversation service
        const conversationService = require('./services/conversationService');
        colorLog('green', '✅ Conversation service loaded successfully');

        // Test conversation initialization
        const testCallId = 'test-call-123';
        const testContext = conversationService.initializeConversation(
          testCallId,
          'Test User'
        );

        if (testContext && testContext.callId === testCallId) {
          colorLog('green', '✅ Conversation initialization working');

          // Test opening message generation
          const openingMessage =
            conversationService.generateOpeningMessage('Test User');
          if (openingMessage && openingMessage.includes('Test User')) {
            colorLog('green', '✅ Opening message generation working');
          }

          // Cleanup test conversation
          conversationService.cleanupConversation(testCallId);
        }

        results.services = true;
      } catch (error) {
        colorLog('red', '❌ Enhanced services test failed');
        colorLog('red', `   Error: ${error.message}`);
      }
    }

    // 8. Test Backend Config Status
    if (results.backend) {
      colorLog('blue', '\n⚙️ Testing Backend Configuration Status...');
      try {
        // Create a test JWT token (simplified for testing)
        const testToken = 'test-token'; // In real scenario, you'd need a valid JWT

        const response = await axios.get(
          'http://localhost:5001/api/calls/config-status',
          {
            headers: {
              Authorization: `Bearer ${testToken}`,
            },
            timeout: 5000,
          }
        );

        if (response.status === 200 || response.status === 401) {
          colorLog('green', '✅ Config status endpoint accessible');
          if (response.status === 401) {
            colorLog(
              'yellow',
              '⚠️  Authentication required (expected for security)'
            );
          }
        }
      } catch (error) {
        if (error.response?.status === 401) {
          colorLog(
            'green',
            '✅ Config status endpoint accessible (auth required)'
          );
        } else {
          colorLog('red', '❌ Config status endpoint failed');
          colorLog('red', `   Error: ${error.message}`);
        }
      }
    }

    // 9. Summary
    colorLog('bright', '\n📊 ENHANCED SYSTEM TEST SUMMARY');
    colorLog('bright', '='.repeat(50));

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    colorLog(
      'blue',
      `Backend Health: ${results.backend ? '✅ PASS' : '❌ FAIL'}`
    );
    colorLog(
      'blue',
      `Required APIs: ${results.requiredApis ? '✅ PASS' : '❌ FAIL'}`
    );
    colorLog(
      'blue',
      `Enhanced APIs: ${results.enhancedApis ? '✅ PASS' : '⚠️  PARTIAL'}`
    );
    colorLog('blue', `Telnyx API: ${results.telnyx ? '✅ PASS' : '❌ FAIL'}`);
    colorLog('blue', `OpenAI API: ${results.openai ? '✅ PASS' : '❌ FAIL'}`);
    colorLog(
      'blue',
      `Deepgram API: ${results.deepgram ? '✅ PASS' : '⚠️  NOT CONFIGURED'}`
    );
    colorLog(
      'blue',
      `ElevenLabs API: ${results.elevenlabs ? '✅ PASS' : '⚠️  NOT CONFIGURED'}`
    );
    colorLog(
      'blue',
      `Enhanced Services: ${results.services ? '✅ PASS' : '❌ FAIL'}`
    );

    colorLog('bright', `\n🎯 Overall Success Rate: ${successRate}%`);

    if (
      results.backend &&
      results.requiredApis &&
      results.telnyx &&
      results.openai &&
      results.services
    ) {
      colorLog('green', '🎉 BASIC SYSTEM READY FOR CALLS!');

      if (results.deepgram && results.elevenlabs) {
        colorLog('green', '🚀 FULL ENHANCED FEATURES AVAILABLE!');
        colorLog('green', '   • Real-time speech recognition with Deepgram');
        colorLog(
          'green',
          '   • Ultra-realistic voice synthesis with ElevenLabs'
        );
        colorLog('green', '   • Natural conversation with GPT-4');
        colorLog('green', '   • Professional SDR capabilities');
      } else {
        colorLog('yellow', '⚡ ENHANCED FEATURES PARTIALLY AVAILABLE');
        colorLog(
          'yellow',
          '   Add Deepgram and ElevenLabs API keys for full features'
        );
      }
    } else {
      colorLog(
        'red',
        '❌ SYSTEM NOT READY - Please fix the failed tests above'
      );
    }

    // 10. Next Steps
    colorLog('bright', '\n🔧 NEXT STEPS:');
    if (!results.backend) {
      colorLog(
        'yellow',
        '1. Start the backend server: cd backend && npm run dev'
      );
    }
    if (!results.requiredApis) {
      colorLog(
        'yellow',
        '2. Configure required environment variables in backend/.env'
      );
    }
    if (!results.deepgram) {
      colorLog(
        'yellow',
        '3. Add DEEPGRAM_API_KEY for real-time speech recognition'
      );
    }
    if (!results.elevenlabs) {
      colorLog('yellow', '4. Add ELEVENLABS_API_KEY for ultra-realistic voice');
    }
    if (results.backend && results.requiredApis) {
      colorLog('green', '5. Start the frontend: cd frontend && npm start');
      colorLog('green', '6. Access the application at http://localhost:3000');
      colorLog('green', '7. Test calls using the enhanced interface');
    }

    return results;
  } catch (error) {
    colorLog('red', `❌ Test failed with error: ${error.message}`);
    return results;
  }
}

// Run the test
if (require.main === module) {
  testEnhancedSystem()
    .then(results => {
      process.exit(0);
    })
    .catch(error => {
      colorLog('red', `❌ Test execution failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = testEnhancedSystem;
