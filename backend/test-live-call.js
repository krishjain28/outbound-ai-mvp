const axios = require('axios');
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

// Test user credentials (create a test user if needed)
const TEST_USER = {
  name: 'Test User',
  email: 'testuser@livetest.com',
  password: 'TestPassword123',
};

async function authenticateUser() {
  colorLog('blue', '🔐 Authenticating test user...');

  try {
    // Try to sign in first
    const signinResponse = await axios.post(
      'http://localhost:5001/api/auth/signin',
      {
        email: TEST_USER.email,
        password: TEST_USER.password,
      }
    );

    colorLog('green', '✅ User signed in successfully');
    return signinResponse.data.data.token;
  } catch (signinError) {
    if (signinError.response?.status === 401) {
      colorLog('yellow', '⚠️ User not found, creating test user...');

      try {
        // Create the test user
        const signupResponse = await axios.post(
          'http://localhost:5001/api/auth/signup',
          TEST_USER
        );
        colorLog('green', '✅ Test user created successfully');
        return signupResponse.data.data.token;
      } catch (signupError) {
        if (signupError.response?.data?.message?.includes('already exists')) {
          colorLog(
            'red',
            '❌ User exists but signin failed. Check credentials.'
          );
          throw new Error('Authentication failed');
        }
        throw signupError;
      }
    }
    throw signinError;
  }
}

async function makeLiveTestCall() {
  const testPhoneNumber = '+917678347987'; // User's number (India)
  const leadName = 'Krish';

  colorLog('cyan', '\n🚀 Making Live Test Call to Monitor Performance\n');

  try {
    // Step 1: Authenticate
    const token = await authenticateUser();

    // Step 2: Check system configuration
    colorLog('blue', '🔐 Checking system configuration...');

    try {
      const configResponse = await axios.get(
        'http://localhost:5001/api/calls/config-status',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      colorLog('green', '✅ Configuration check passed');
      console.log('Config:', configResponse.data);
    } catch (configError) {
      colorLog('yellow', '⚠️ Config check failed, but continuing...');
      console.log(
        'Config error:',
        configError.response?.data || configError.message
      );
    }

    // Step 3: Initiate the call
    colorLog('blue', `📞 Initiating call to ${testPhoneNumber}...`);

    const callData = {
      phoneNumber: testPhoneNumber,
      leadName: leadName,
      aiPrompt:
        'You are Mike, a friendly sales rep testing the optimized call system. Keep responses short and natural. Ask how they are doing and mention this is a test call to verify the system optimizations are working properly.',
    };

    const callResponse = await axios.post(
      'http://localhost:5001/api/calls/initiate',
      callData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    colorLog('green', '✅ Call initiated successfully!');
    console.log('Call details:', callResponse.data);

    const callId = callResponse.data.callId || callResponse.data._id;

    // Step 4: Monitor the call for 60 seconds
    colorLog('yellow', '👀 Monitoring call for 60 seconds...');
    colorLog('yellow', '📱 Please answer the call and have a conversation');
    colorLog('yellow', '🎙️ Watch the console for real-time logs');
    colorLog('cyan', '\n🧪 TEST PHRASES TO TRY:');
    colorLog('cyan', '- "I\'m good, thanks" (should trigger business pitch)');
    colorLog('cyan', '- "I\'m busy" (should offer time-saving response)');
    colorLog('cyan', '- "Yes, I\'m interested" (should ask about challenges)');
    colorLog('cyan', '- "What do you do?" (should explain services)');
    colorLog(
      'cyan',
      '- "No, not interested" (should ask about current methods)\n'
    );

    let monitorCount = 0;
    const monitorInterval = setInterval(async () => {
      try {
        monitorCount++;
        colorLog('blue', `📊 Monitor check ${monitorCount}/12`);

        // Check call status
        const statusResponse = await axios.get(
          `http://localhost:5001/api/calls/${callId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const call = statusResponse.data.call;
        colorLog('cyan', `📞 Call Status: ${call.status}`);

        if (call.conversation && call.conversation.length > 0) {
          colorLog(
            'green',
            `💬 Conversation turns: ${call.conversation.length}`
          );

          // Show last few conversation turns
          const recentTurns = call.conversation.slice(-2);
          recentTurns.forEach(turn => {
            const speaker = turn.role === 'ai' ? '🤖 AI' : '👤 Customer';
            colorLog('magenta', `${speaker}: ${turn.message}`);
          });
        }

        if (call.status === 'completed' || call.status === 'failed') {
          clearInterval(monitorInterval);
          colorLog('green', '✅ Call completed');

          // Show final stats
          colorLog('cyan', '\n📊 CALL SUMMARY');
          colorLog('cyan', '================');
          colorLog('green', `Status: ${call.status}`);
          colorLog('green', `Duration: ${call.duration || 0} seconds`);
          colorLog(
            'green',
            `Conversation turns: ${call.conversation?.length || 0}`
          );
          colorLog('green', `Outcome: ${call.outcome || 'unknown'}`);

          if (call.conversation && call.conversation.length > 0) {
            colorLog('yellow', '\n💬 FULL CONVERSATION:');
            call.conversation.forEach((turn, index) => {
              const speaker = turn.role === 'ai' ? '🤖 AI' : '👤 Customer';
              colorLog('white', `${index + 1}. ${speaker}: ${turn.message}`);
            });
          }

          // Performance analysis
          colorLog('cyan', '\n⚡ PERFORMANCE ANALYSIS:');
          colorLog('cyan', '========================');
          colorLog('yellow', 'Expected optimized timings:');
          colorLog('yellow', '- Call Answer Delay: ~500ms (was 1000ms)');
          colorLog('yellow', '- Speech Recognition Start: ~200ms (was 1000ms)');
          colorLog('yellow', '- Voice Response Time: 1-2s (was 3-5s)');
          colorLog('yellow', '- Conversation Turn Time: 2-4s (was 5-8s)');

          process.exit(0);
        }
      } catch (error) {
        colorLog('red', `❌ Monitor error: ${error.message}`);
      }
    }, 5000); // Check every 5 seconds

    // Stop monitoring after 60 seconds
    setTimeout(() => {
      clearInterval(monitorInterval);
      colorLog('yellow', '⏰ Monitoring timeout reached');
      colorLog(
        'cyan',
        '\n📝 If the call is still active, check the backend logs for real-time updates'
      );
      process.exit(0);
    }, 60000);
  } catch (error) {
    colorLog('red', '❌ Test call failed:');
    colorLog('red', error.response?.data?.message || error.message);

    if (error.response?.status === 401) {
      colorLog(
        'yellow',
        '🔐 Authentication failed. Check test user credentials.'
      );
    } else if (error.response?.status === 500) {
      colorLog(
        'yellow',
        '🔧 Server error. Check if all environment variables are configured.'
      );
      colorLog(
        'yellow',
        '📝 Required: TELNYX_API_KEY, TELNYX_PHONE_NUMBER, OPENAI_API_KEY'
      );
      colorLog('yellow', '📝 Optional: DEEPGRAM_API_KEY, ELEVENLABS_API_KEY');
    } else if (error.response?.status === 503) {
      colorLog(
        'yellow',
        '🗄️ Database connection issue. Check MongoDB connection.'
      );
    }

    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  colorLog('yellow', '\n👋 Test call monitoring stopped');
  process.exit(0);
});

colorLog('green', '🎯 Starting Live Call Test with Authentication');
colorLog('blue', '📋 Test Details:');
colorLog('blue', `   📞 Phone: +91 7678347987`);
colorLog('blue', `   👤 Lead: Krish`);
colorLog('blue', `   🤖 AI: Mike (optimized system test)`);
colorLog('blue', `   🔐 Auth: Automatic test user creation/login\n`);

makeLiveTestCall().catch(console.error);
