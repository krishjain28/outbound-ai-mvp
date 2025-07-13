const express = require('express');
const router = express.Router();
const Call = require('../models/Call');
const { authenticate: auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const OpenAI = require('openai');

// Import new services
const speechService = require('../services/speechService');
const conversationService = require('../services/conversationService');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Telnyx configuration
const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_PUBLIC_KEY = process.env.TELNYX_PUBLIC_KEY;
const TELNYX_PHONE_NUMBER = process.env.TELNYX_PHONE_NUMBER || '+1234567890'; // Default for testing

// Validate required environment variables
const validateEnvironmentVariables = () => {
  const missing = [];
  if (!process.env.TELNYX_API_KEY) missing.push('TELNYX_API_KEY');
  if (!process.env.TELNYX_PHONE_NUMBER) missing.push('TELNYX_PHONE_NUMBER');
  if (!process.env.OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
  
  // Optional but recommended for enhanced features
  const optional = [];
  if (!process.env.DEEPGRAM_API_KEY) optional.push('DEEPGRAM_API_KEY');
  if (!process.env.ELEVENLABS_API_KEY) optional.push('ELEVENLABS_API_KEY');
  
  if (missing.length > 0) {
    console.error('⚠️  Missing required environment variables:', missing.join(', '));
    console.error('📝 Please create a .env file in the backend directory with:');
    console.error('   TELNYX_API_KEY=your-telnyx-api-key');
    console.error('   TELNYX_PHONE_NUMBER=your-telnyx-phone-number');
    console.error('   OPENAI_API_KEY=your-openai-api-key');
    console.error('   DEEPGRAM_API_KEY=your-deepgram-api-key (optional)');
    console.error('   ELEVENLABS_API_KEY=your-elevenlabs-api-key (optional)');
    return false;
  }
  
  if (optional.length > 0) {
    console.log('ℹ️  Optional environment variables not set:', optional.join(', '));
    console.log('📝 For enhanced features, add to your .env file:');
    if (optional.includes('DEEPGRAM_API_KEY')) console.log('   DEEPGRAM_API_KEY=your-deepgram-api-key');
    if (optional.includes('ELEVENLABS_API_KEY')) console.log('   ELEVENLABS_API_KEY=your-elevenlabs-api-key');
  }
  
  return true;
};

// Helper function to make Telnyx API calls
const telnyxAPI = axios.create({
  baseURL: 'https://api.telnyx.com/v2',
  headers: {
    'Authorization': `Bearer ${TELNYX_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// @route   GET /api/calls/config-status
// @desc    Check configuration status
// @access  Private
router.get('/config-status', auth, async (req, res) => {
  try {
    const config = {
      // Required APIs
      telnyx_api_key: !!process.env.TELNYX_API_KEY,
      telnyx_phone_number: !!process.env.TELNYX_PHONE_NUMBER,
      openai_api_key: !!process.env.OPENAI_API_KEY,
      backend_url: process.env.BACKEND_URL || 'http://localhost:5001',
      phone_number_configured: process.env.TELNYX_PHONE_NUMBER || 'Not configured',
      
      // Enhanced features
      deepgram_api_key: !!process.env.DEEPGRAM_API_KEY,
      elevenlabs_api_key: !!process.env.ELEVENLABS_API_KEY,
      elevenlabs_voice_id: process.env.ELEVENLABS_VOICE_ID || 'Default (Adam)',
      
      // Feature status
      enhanced_speech_recognition: !!process.env.DEEPGRAM_API_KEY,
      enhanced_voice_synthesis: !!process.env.ELEVENLABS_API_KEY,
      natural_conversation: true // Always available with GPT-4
    };
    
    const isConfigured = config.telnyx_api_key && config.telnyx_phone_number && config.openai_api_key;
    const isEnhanced = config.deepgram_api_key && config.elevenlabs_api_key;
    
    let message = 'Basic configuration incomplete';
    if (isConfigured && isEnhanced) {
      message = 'All APIs configured - Full enhanced features available';
    } else if (isConfigured) {
      message = 'Basic APIs configured - Enhanced features available with additional API keys';
    }
    
    res.json({
      success: true,
      configured: isConfigured,
      enhanced: isEnhanced,
      config,
      message
    });
  } catch (error) {
    console.error('Config status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking configuration',
      error: error.message
    });
  }
});

// @route   POST /api/calls/initiate
// @desc    Initiate a new call
// @access  Private
router.post('/initiate', [
  auth,
  body('phoneNumber')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .isLength({ min: 7, max: 15 })
    .withMessage('Please provide a valid international phone number (7-15 digits)'),
  body('leadName').optional().isString(),
  body('aiPrompt').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber, leadName, aiPrompt } = req.body;

    // Clean phone number (remove spaces, dashes, parentheses)
    const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Format phone number for international calling
    let formattedPhoneNumber;
    if (cleanPhoneNumber.startsWith('+')) {
      // Already has country code
      formattedPhoneNumber = cleanPhoneNumber;
    } else if (cleanPhoneNumber.length === 10) {
      // US/Canada number without country code
      formattedPhoneNumber = `+1${cleanPhoneNumber}`;
    } else {
      // International number - user must provide country code
      formattedPhoneNumber = `+${cleanPhoneNumber}`;
    }

    // Create call record in database
    const call = new Call({
      userId: req.user.id,
      phoneNumber: formattedPhoneNumber,
      leadName: leadName || 'Unknown Lead',
      aiPrompt: aiPrompt || 'You are a professional sales representative. Be conversational, friendly, and focus on qualifying the lead.',
      status: 'initiated'
    });

    await call.save();

    // Validate environment variables
    if (!validateEnvironmentVariables()) {
      console.error('Missing Telnyx configuration');
      return res.status(500).json({
        success: false,
        message: 'Call service not configured. Please set up your Telnyx and OpenAI API keys in the backend .env file.',
        error: 'Missing API credentials',
        details: 'Check the server console for setup instructions'
      });
    }

    console.log(`Initiating call to ${formattedPhoneNumber} from ${TELNYX_PHONE_NUMBER}`);

    // Initiate call via Telnyx
    try {
      // Use the configured connection ID
      const connectionId = process.env.TELNYX_CONNECTION_ID;
      
      if (!connectionId) {
        throw new Error('TELNYX_CONNECTION_ID not configured. Please create a Call Control Application in Telnyx Portal.');
      }

      const telnyxResponse = await telnyxAPI.post('/calls', {
        to: formattedPhoneNumber,
        from: TELNYX_PHONE_NUMBER,
        connection_id: connectionId,
        outbound_voice_profile_id: '2735262782093001961', // Use the Default profile
        webhook_url: `${process.env.BACKEND_URL}/api/calls/webhook`,
        webhook_url_method: 'POST',
        record: 'record-from-answer',
        record_format: 'mp3',
        record_channels: 'dual',
        client_state: call._id.toString() // Pass our call ID to track the call
      });

      console.log('Telnyx call initiated:', telnyxResponse.data.data.call_control_id);

      // Update call with Telnyx call ID
      call.callId = telnyxResponse.data.data.call_control_id;
      call.status = 'ringing';
      await call.save();

      res.json({
        success: true,
        message: 'Call initiated successfully',
        _id: call._id,
        callId: call.callId,
        phoneNumber: call.phoneNumber,
        leadName: call.leadName,
        status: call.status,
        startTime: call.startTime,
        conversation: call.conversation,
        outcome: call.outcome,
        qualificationScore: call.qualificationScore,
        meetingBooked: call.meetingBooked,
        createdAt: call.createdAt
      });

    } catch (telnyxError) {
      console.error('Telnyx API Error:', telnyxError.response?.data || telnyxError.message);
      
      const errorDetail = telnyxError.response?.data?.errors?.[0]?.detail || telnyxError.message;
      const errorCode = telnyxError.response?.data?.errors?.[0]?.code;
      
      // Update call status to failed
      call.status = 'failed';
      call.notes = `Telnyx Error: ${errorDetail}`;
      await call.save();

      // Provide specific error messages for common issues
      let userMessage = 'Failed to initiate call';
      if (errorCode === 10010 || errorDetail.includes('whitelisted countries')) {
        userMessage = 'International calling not enabled for this destination. Please use a US number (+1) or enable international calling in your Telnyx account.';
      } else if (errorCode === '10015') {
        userMessage = 'Call Control Application configuration error. Please check your Telnyx setup.';
      } else if (errorCode === '10032') {
        userMessage = 'Invalid API parameter. Please contact support.';
      }

      res.status(500).json({
        success: false,
        message: userMessage,
        error: errorDetail,
        errorCode: errorCode,
        suggestion: errorCode === 10010 ? 'Try using a US phone number like +1-555-123-4567 for testing' : null
      });
    }

  } catch (error) {
    console.error('Call initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/calls/webhook
// @desc    Handle Telnyx webhooks
// @access  Public (but verified)
router.post('/webhook', async (req, res) => {
  try {
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Event Type:', req.body.data?.event_type);
    console.log('Call Control ID:', req.body.data?.payload?.call_control_id);
    console.log('Full payload:', JSON.stringify(req.body, null, 2));
    
    const { data } = req.body;
    
    if (!data || !data.event_type) {
      console.error('❌ Invalid webhook data:', req.body);
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    const callControlId = data.payload?.call_control_id;
    const clientState = data.payload?.client_state;
    
    console.log(`🔄 Processing webhook: ${data.event_type} for call ${callControlId}`);
    
    // Find the call by either callId or _id from client_state
    let call = await Call.findOne({ callId: callControlId });
    if (!call && clientState) {
      call = await Call.findById(clientState);
      if (call) {
        console.log(`📝 Updating call ${call._id} with callId: ${callControlId}`);
        call.callId = callControlId;
        await call.save();
      }
    }

    if (!call) {
      console.error('❌ Call not found for webhook:', { callControlId, clientState, eventType: data.event_type });
      return res.status(404).json({ error: 'Call not found' });
    }

    console.log(`✅ Found call ${call._id} (status: ${call.status}) for webhook ${data.event_type}`);

    // Handle different webhook events
    switch (data.event_type) {
      case 'call.initiated':
        console.log(`📞 Call initiated: ${callControlId}`);
        call.callId = callControlId;
        await call.updateStatus('ringing');
        break;

      case 'call.answered':
        console.log(`Call ${callControlId} answered, starting optimized AI conversation`);
        await call.updateStatus('answered');
        
        // Minimal delay for call establishment - optimized for speed
        setTimeout(async () => {
          try {
            // Initialize conversation with the new service
            conversationService.initializeConversation(call._id.toString(), call.leadName);
            
            // Generate concise opening message for faster processing
            const welcomeMessage = `Hi ${call.leadName || 'there'}! This is Mike from WebCraft Solutions. How are you doing today?`;
            await call.addConversationMessage('ai', welcomeMessage);
            
            // Send welcome message using optimized speech service
            const speechResult = await speechService.speakText(callControlId, welcomeMessage);
            
            if (speechResult.success) {
              console.log('🎤 Optimized voice synthesis successful');
            } else {
              console.log('⚠️ ElevenLabs failed, using Telnyx fallback');
              await speakWithNaturalVoice(callControlId, welcomeMessage);
            }
            
            await call.updateStatus('in_progress');
          } catch (error) {
            console.error('Error starting AI conversation:', error);
            await call.updateStatus('failed', { 
              notes: 'Failed to start AI conversation' 
            });
          }
        }, 500); // Reduced to 500ms for faster response
        break;

      case 'call.hangup':
        console.log(`📴 Call hangup: ${callControlId}`);
        const endTime = new Date();
        const duration = call.startTime ? Math.floor((endTime - call.startTime) / 1000) : 0;
        
        // Cleanup speech recognition and conversation services
        try {
          await speechService.stopSpeechRecognition(callControlId);
          conversationService.cleanupConversation(call._id.toString());
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
        
        await call.updateOne({
          status: 'completed',
          endTime,
          duration,
          outcome: call.outcome === 'incomplete' ? 'no_answer' : call.outcome
        });
        console.log(`✅ Call ${callControlId} completed, duration: ${duration}s`);
        break;

      case 'call.speak.ended':
        console.log(`🎤 AI finished speaking for call ${callControlId}, starting optimized speech recognition`);
        // AI finished speaking, immediately start speech recognition for faster response
        setTimeout(async () => {
          try {
            // Check if call is still active
            const currentCall = await Call.findOne({ callId: callControlId });
            if (!currentCall || currentCall.status === 'completed' || currentCall.status === 'failed') {
              console.log(`Call ${callControlId} is not active, skipping speech recognition`);
              return;
            }
            
            // Start optimized speech recognition
            console.log(`🎙️ Starting optimized speech recognition for call ${callControlId}`);
            
            const speechResult = await speechService.startRealTimeSpeechRecognition(
              callControlId,
              call,
              async (transcript) => {
                // Handle transcript with faster processing
                console.log(`📝 Customer said: "${transcript}"`);
                
                // Stop speech recognition immediately to prevent overlap
                await speechService.stopSpeechRecognition(callControlId);
                
                // Generate quick AI response
                const aiResponse = await generateQuickResponse(call, transcript);
                
                // Add messages to conversation
                  await call.addConversationMessage('customer', transcript);
                await call.addConversationMessage('ai', aiResponse);
                  
                // Speak the AI response immediately
                const speechResult = await speechService.speakText(callControlId, aiResponse);
                  
                  if (!speechResult.success) {
                    // Fallback to Telnyx TTS
                  await speakWithNaturalVoice(callControlId, aiResponse);
                  }
                  
                // Update call outcome
                const conversationLength = call.conversation.length;
                if (conversationLength >= 6) {
                  await call.updateOne({ outcome: 'engaged' });
                }
              },
              (error) => {
                console.error('Speech recognition error:', error);
                // Fallback to Telnyx streaming
                startRealSpeechRecognition(callControlId, call);
              }
            );
            
            if (!speechResult.success) {
              console.log('⚠️ Deepgram failed, using Telnyx fallback');
              await startRealSpeechRecognition(callControlId, call);
            }
            
          } catch (error) {
            console.error('Speech recognition start error:', error);
            // Fallback to Telnyx streaming
            await startRealSpeechRecognition(callControlId, call);
          }
        }, 200); // Reduced to 200ms for immediate response
        break;

      case 'call.recording.saved':
        console.log(`🎵 Recording saved for call ${callControlId}`);
        // Save recording URL for later analysis
        if (data.payload?.recording_urls?.mp3) {
          call.recordingUrl = data.payload.recording_urls.mp3;
          await call.save();
        }
        break;

      case 'call.machine.detection.ended':
        if (data.payload?.result === 'human') {
          // Human answered, continue with conversation
          await call.updateStatus('answered');
        } else {
          // Voicemail detected, leave message or hang up
          await call.updateStatus('completed', { outcome: 'no_answer' });
        }
        break;

      default:
        console.log('Unhandled webhook event:', data.event_type);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// @route   GET /api/calls
// @desc    Get user's calls
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, outcome } = req.query;
    
    const filter = { userId: req.user.id };
    if (status) filter.status = status;
    if (outcome) filter.outcome = outcome;

    const calls = await Call.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-conversation'); // Exclude conversation for list view

    const total = await Call.countDocuments(filter);

    res.json({
      success: true,
      calls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/calls/:id
// @desc    Get specific call details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const call = await Call.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    res.json({
      success: true,
      call
    });

  } catch (error) {
    console.error('Get call error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/calls/:id/hangup
// @desc    Hang up a call
// @access  Private
router.post('/:id/hangup', auth, async (req, res) => {
  try {
    const call = await Call.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    if (call.status === 'completed' || call.status === 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Call is already ended'
      });
    }

    // Hang up via Telnyx
    if (call.callId) {
      await telnyxAPI.post(`/calls/${call.callId}/actions/hangup`);
    }

    await call.updateStatus('completed');

    res.json({
      success: true,
      message: 'Call ended successfully'
    });

  } catch (error) {
    console.error('Hangup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/calls/stats
// @desc    Get call statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = {};
    if (startDate) dateRange.start = startDate;
    if (endDate) dateRange.end = endDate;

    const stats = await Call.getCallStats(req.user.id, dateRange);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/calls/speech-stream
// @desc    Handle real-time speech recognition stream
// @access  Public (webhook)
router.post('/speech-stream', async (req, res) => {
  try {
    console.log('🎙️ Speech stream received:', JSON.stringify(req.body, null, 2));
    
    const { data } = req.body;
    
    if (!data || !data.event_type) {
      return res.status(400).json({ error: 'Invalid speech stream data' });
    }

    const callControlId = data.payload?.call_control_id;
    
    // Find the call
    const call = await Call.findOne({ callId: callControlId });
    if (!call) {
      console.error('❌ Call not found for speech stream:', callControlId);
      return res.status(404).json({ error: 'Call not found' });
    }

    // Handle different speech events with optimized processing
    switch (data.event_type) {
      case 'stream.transcription':
        if (data.payload?.transcription?.text) {
          const transcriptionText = data.payload.transcription.text.trim();
          const isFinal = data.payload.transcription.is_final;
          
          console.log(`📝 ${isFinal ? 'FINAL' : 'interim'} transcription for call ${callControlId}: "${transcriptionText}"`);
          
          // Only process final transcriptions with meaningful content
          if (isFinal && transcriptionText.length > 2) {
            console.log(`✅ Processing customer response: "${transcriptionText}"`);
            
            // Stop listening immediately to prevent overlap
            try {
              await telnyxAPI.post(`/calls/${callControlId}/actions/streaming_stop`);
              console.log(`🛑 Stopped speech recognition for call ${callControlId}`);
            } catch (stopError) {
              console.error('Error stopping speech stream:', stopError.response?.data || stopError.message);
            }
            
            // Process response with optimized quick response
            const aiResponse = await generateQuickResponse(call, transcriptionText);
            
            // Add messages to conversation
            await call.addConversationMessage('customer', transcriptionText);
            await call.addConversationMessage('ai', aiResponse);
            
            // Speak the response immediately
            const speechResult = await speechService.speakText(callControlId, aiResponse);
            
            if (!speechResult.success) {
              // Fallback to Telnyx TTS
              await speakWithNaturalVoice(callControlId, aiResponse);
            }
            
            // Update call status
            const conversationLength = call.conversation.length;
            if (conversationLength >= 6) {
              await call.updateOne({ outcome: 'engaged' });
            }
          }
        }
        break;
        
      case 'stream.started':
        console.log(`🎤 Speech recognition stream started for call: ${callControlId}`);
        break;
        
      case 'stream.stopped':
        console.log(`⏹️ Speech recognition stream stopped for call: ${callControlId}`);
        break;
        
      case 'stream.error':
        console.error(`❌ Speech recognition error for call ${callControlId}:`, data.payload);
        // Continue conversation even if speech recognition fails
        const conversationTurn = Math.floor(call.conversation.length / 2) + 1;
        await handleUserResponse(call, callControlId, "I'm sorry, could you repeat that? I want to make sure I understand you correctly.", conversationTurn);
        break;
        
      default:
        console.log('Unhandled speech stream event:', data.event_type);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Speech stream error:', error);
    res.status(500).json({ error: 'Speech stream processing failed' });
  }
});

// @route   POST /api/calls/deepgram-stream
// @desc    Handle Deepgram audio stream from Telnyx
// @access  Public (webhook)
router.post('/deepgram-stream', async (req, res) => {
  try {
    const { event, media } = req.body;
    
    if (event === 'media' && media) {
      // Extract call control ID from the stream
      const callControlId = media.call_control_id;
      
      if (callControlId && media.payload) {
        // Convert base64 audio to buffer
        const audioData = Buffer.from(media.payload, 'base64');
        
        // Forward to speech service
        speechService.processAudioStream(callControlId, audioData);
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Deepgram stream error:', error);
    res.status(200).send('OK'); // Always respond OK to avoid retries
  }
});

// Generate quick AI response for faster conversation
async function generateQuickResponse(call, userResponse) {
  try {
    const conversationHistory = call.conversation || [];
    const leadName = call.leadName || 'there';
    
    // Use predefined quick responses for common scenarios
    const lowerResponse = userResponse.toLowerCase();
    
    // Greeting responses
    if (lowerResponse.includes('good') || lowerResponse.includes('fine') || lowerResponse.includes('great')) {
      return `That's great to hear, ${leadName}! I'm calling because I help businesses like yours get more customers online. Are you currently looking for ways to grow your business?`;
    }
    
    // Busy responses
    if (lowerResponse.includes('busy') || lowerResponse.includes('not a good time')) {
      return `I totally understand you're busy. This will just take 30 seconds - I help businesses get more customers through better websites. Would that be something you'd be interested in hearing about?`;
    }
    
    // Positive interest
    if (lowerResponse.includes('yes') || lowerResponse.includes('sure') || lowerResponse.includes('interested')) {
      return `Perfect! So tell me, what's your biggest challenge when it comes to getting new customers right now?`;
    }
    
    // Negative responses
    if (lowerResponse.includes('no') || lowerResponse.includes('not interested')) {
      return `I understand. Can I ask - what's working best for you right now to get new customers?`;
    }
    
    // Questions about the business
    if (lowerResponse.includes('what') || lowerResponse.includes('how')) {
      return `Great question! I help businesses get more customers through better websites and online marketing. What kind of business are you in?`;
    }
    
    // Default response for other cases
    return `That's interesting. So tell me, what's your biggest challenge when it comes to getting new customers for your business?`;
    
  } catch (error) {
    console.error('Quick response generation error:', error);
    return `I see. Can you tell me more about your business and what's working for you right now?`;
  }
}

// Enhanced TTS function with natural speech patterns and error handling
async function speakWithNaturalVoice(callControlId, message) {
  try {
    // Validate call control ID
    if (!callControlId) {
      throw new Error('Call control ID is required');
    }
    
    // Check if call is still active
    const call = await Call.findOne({ callId: callControlId });
    if (!call) {
      throw new Error('Call not found in database');
    }
    
    if (call.status === 'completed' || call.status === 'failed') {
      console.log(`Call ${callControlId} is already ${call.status}, skipping TTS`);
      return;
    }
    
    // Add natural pauses and speech patterns
    const naturalMessage = addNaturalPauses(message);
    
    console.log(`Speaking to call ${callControlId}: "${message}"`);
    
    const response = await telnyxAPI.post(`/calls/${callControlId}/actions/speak`, {
      payload: naturalMessage,
      voice: 'male', // Natural male voice
      language: 'en-US',
      payload_type: 'ssml',
      // Enhanced voice settings for more natural speech
      service_level: 'premium', // Use premium voice quality
      speed: 1.0, // Natural speaking speed
      pitch: 1.0, // Natural pitch
      volume: 1.0 // Natural volume
    });
    
    console.log(`TTS successful for call ${callControlId}`);
    return response;
    
  } catch (error) {
    console.error(`TTS Error for call ${callControlId}:`, error.response?.data || error.message);
    
    // If call is not found, mark it as failed
    if (error.response?.status === 404) {
      const call = await Call.findOne({ callId: callControlId });
      if (call) {
        await call.updateStatus('failed', { 
          notes: 'Call session expired during TTS attempt' 
        });
      }
    }
    
    throw error;
  }
}

// Add natural pauses and speech patterns to make AI sound more human
function addNaturalPauses(message) {
  let naturalMessage = message;
  
  // Convert to SSML format for better control
  naturalMessage = `<speak>${naturalMessage}</speak>`;
  
  // Natural greetings with warmth
  naturalMessage = naturalMessage.replace(/Hi ([^,!]+)[,!]/g, 'Hi $1!<break time="0.4s"/>');
  naturalMessage = naturalMessage.replace(/Hey ([^,!]+)[,!]/g, 'Hey $1!<break time="0.3s"/>');
  naturalMessage = naturalMessage.replace(/Hello ([^,!]+)[,!]/g, 'Hello $1!<break time="0.4s"/>');
  
  // Natural conversation fillers with pauses (human speech patterns)
  naturalMessage = naturalMessage.replace(/You know,/g, 'You know,<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/I mean,/g, 'I mean,<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/Actually,/g, 'Actually,<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/Honestly,/g, 'Honestly,<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/So,/g, 'So,<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/Well,/g, 'Well,<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/Oh,/g, 'Oh,<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/Like,/g, 'Like,<break time="0.1s"/>');
  naturalMessage = naturalMessage.replace(/Right,/g, 'Right,<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/Okay,/g, 'Okay,<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/Yeah,/g, 'Yeah,<break time="0.1s"/>');
  naturalMessage = naturalMessage.replace(/Totally,/g, 'Totally,<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/Absolutely,/g, 'Absolutely,<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/For sure,/g, 'For sure,<break time="0.2s"/>');
  
  // Natural hesitations and thinking patterns
  naturalMessage = naturalMessage.replace(/Um,/g, 'Um,<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/Uh,/g, 'Uh,<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/Hmm,/g, 'Hmm,<break time="0.3s"/>');
  naturalMessage = naturalMessage.replace(/Let me think/g, 'Let me think<break time="0.3s"/>');
  naturalMessage = naturalMessage.replace(/Let me see/g, 'Let me see<break time="0.2s"/>');
  
  // Authentic reactions with emphasis and natural timing
  naturalMessage = naturalMessage.replace(/Oh really\?/g, '<emphasis level="moderate">Oh really?</emphasis><break time="0.4s"/>');
  naturalMessage = naturalMessage.replace(/That\'s interesting!/g, '<emphasis level="moderate">That\'s interesting!</emphasis><break time="0.3s"/>');
  naturalMessage = naturalMessage.replace(/Wow,/g, '<emphasis level="moderate">Wow,</emphasis><break time="0.3s"/>');
  naturalMessage = naturalMessage.replace(/Cool!/g, '<emphasis level="moderate">Cool!</emphasis><break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/Nice!/g, '<emphasis level="moderate">Nice!</emphasis><break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/No way!/g, '<emphasis level="moderate">No way!</emphasis><break time="0.3s"/>');
  naturalMessage = naturalMessage.replace(/Really\?/g, '<emphasis level="moderate">Really?</emphasis><break time="0.3s"/>');
  naturalMessage = naturalMessage.replace(/Seriously\?/g, '<emphasis level="moderate">Seriously?</emphasis><break time="0.3s"/>');
  naturalMessage = naturalMessage.replace(/That\'s crazy!/g, '<emphasis level="moderate">That\'s crazy!</emphasis><break time="0.3s"/>');
  naturalMessage = naturalMessage.replace(/I get it/g, '<emphasis level="moderate">I get it</emphasis><break time="0.2s"/>');
  
  // Natural acknowledgments
  naturalMessage = naturalMessage.replace(/Mm-hmm/g, 'Mm-hmm<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/Uh-huh/g, 'Uh-huh<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/Got it/g, 'Got it<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/Makes sense/g, 'Makes sense<break time="0.2s"/>');
  naturalMessage = naturalMessage.replace(/I hear you/g, 'I hear you<break time="0.2s"/>');
  
  // Questions with natural pause patterns
  naturalMessage = naturalMessage.replace(/\?/g, '?<break time="0.5s"/>');
  
  // Commas with natural breathing
  naturalMessage = naturalMessage.replace(/,/g, ',<break time="0.2s"/>');
  
  // Thoughtful pauses before important points (natural human style)
  naturalMessage = naturalMessage.replace(/Here\'s the thing/g, '<break time="0.3s"/>Here\'s the thing');
  naturalMessage = naturalMessage.replace(/You know what/g, '<break time="0.2s"/>You know what');
  naturalMessage = naturalMessage.replace(/I\'m curious/g, '<break time="0.2s"/>I\'m curious');
  naturalMessage = naturalMessage.replace(/Let me ask you/g, '<break time="0.3s"/>Let me ask you');
  naturalMessage = naturalMessage.replace(/Can I ask/g, '<break time="0.2s"/>Can I ask');
  naturalMessage = naturalMessage.replace(/Tell me/g, '<break time="0.2s"/>Tell me');
  naturalMessage = naturalMessage.replace(/So tell me/g, '<break time="0.2s"/>So tell me');
  naturalMessage = naturalMessage.replace(/Actually, that reminds me/g, '<break time="0.2s"/>Actually, that reminds me');
  
  // Sentence endings with natural flow
  naturalMessage = naturalMessage.replace(/\. ([A-Z])/g, '.<break time="0.4s"/> $1');
  naturalMessage = naturalMessage.replace(/! ([A-Z])/g, '!<break time="0.3s"/> $1');
  
  // Add prosody for more natural speech with human-like patterns
  naturalMessage = naturalMessage.replace(/haha/g, '<prosody rate="fast" pitch="+10%">haha</prosody>');
  naturalMessage = naturalMessage.replace(/oh my gosh/g, '<prosody pitch="+15%">oh my gosh</prosody>');
  naturalMessage = naturalMessage.replace(/that\'s awesome/g, '<prosody pitch="+10%">that\'s awesome</prosody>');
  naturalMessage = naturalMessage.replace(/that\'s great/g, '<prosody pitch="+10%">that\'s great</prosody>');
  
  // Slow down for emphasis on important words but keep it natural
  naturalMessage = naturalMessage.replace(/(customers|business|website|results|help|solution)/g, '<prosody rate="0.9">$1</prosody>');
  
  // Add natural breathing patterns
  naturalMessage = naturalMessage.replace(/\. So /g, '.<break time="0.3s"/> So ');
  naturalMessage = naturalMessage.replace(/\. And /g, '.<break time="0.3s"/> And ');
  naturalMessage.replace(/\. But /g, '.<break time="0.3s"/> But ');
  naturalMessage = naturalMessage.replace(/\. I /g, '.<break time="0.3s"/> I ');
  
  return naturalMessage;
}

// Improved conversation management with proper error handling
async function startListeningForResponse(callControlId, call, conversationTurn = 1) {
  try {
    // Check if call is still active
    const currentCall = await Call.findOne({ callId: callControlId });
    if (!currentCall || currentCall.status === 'completed' || currentCall.status === 'failed') {
      console.log(`Call ${callControlId} is not active, skipping recording`);
      return;
    }
    
    console.log(`Starting recording for call ${callControlId}, turn ${conversationTurn}`);
    
    // Start recording with error handling
    await telnyxAPI.post(`/calls/${callControlId}/actions/start_recording`, {
      format: 'mp3',
      channels: 'dual'
    });
    
    // Set a shorter timeout for more responsive conversation
    setTimeout(async () => {
      try {
        const stillActive = await Call.findOne({ callId: callControlId });
        if (stillActive && stillActive.status === 'in_progress') {
          await telnyxAPI.post(`/calls/${callControlId}/actions/stop_recording`);
        }
      } catch (error) {
        console.error('Stop recording error:', error.response?.data || error.message);
      }
    }, 5000); // Record for 5 seconds then process
    
    // Set a timeout to handle if customer doesn't respond
    setTimeout(async () => {
      try {
        await handleSilentCustomer(callControlId, call, conversationTurn);
      } catch (error) {
        console.error('Silent customer handling error:', error);
      }
    }, 8000); // Wait 8 seconds for response
    
  } catch (error) {
    console.error('Speech recognition start error:', error.response?.data || error.message);
    
    // If call is not found, mark it as failed
    if (error.response?.status === 404) {
      const call = await Call.findOne({ callId: callControlId });
      if (call) {
        await call.updateStatus('failed', { 
          notes: 'Call session expired during recording attempt' 
        });
      }
    }
  }
}

// Handle when customer is silent or doesn't respond
async function handleSilentCustomer(callControlId, call, conversationTurn) {
  const silentResponses = [
    "Hey, are you still there?",
    "Can you hear me okay?",
    "Did I lose you for a second?",
    "Hello? Everything alright on your end?",
    "Let me know if you have any questions about what I just shared.",
    "I want to make sure I'm not losing you here. Are you with me?"
  ];
  
  const response = silentResponses[Math.floor(Math.random() * silentResponses.length)];
  await call.addConversationMessage('ai', response);
  
  try {
    await speakWithNaturalVoice(callControlId, response);
  } catch (error) {
    console.error('Silent customer TTS error:', error);
  }
  
  // Continue listening for response
  setTimeout(async () => {
    await startListeningForResponse(callControlId, call, conversationTurn);
  }, 3000);
}

// Real Speech Recognition using Telnyx Streaming
async function startRealSpeechRecognition(callControlId, call) {
  try {
    // Check if call is still active
    const currentCall = await Call.findOne({ callId: callControlId });
    if (!currentCall || currentCall.status === 'completed' || currentCall.status === 'failed') {
      console.log(`Call ${callControlId} is not active, skipping real speech recognition`);
      return;
    }
    
    console.log(`🎙️ Starting real-time speech recognition for call ${callControlId}`);
    
    // Start streaming audio for real-time transcription with optimized settings
    await telnyxAPI.post(`/calls/${callControlId}/actions/streaming_start`, {
      stream_url: `${process.env.BACKEND_URL}/api/calls/speech-stream`,
      stream_track: 'inbound_track', // Listen to customer's audio only
      enable_dialogflow_integration: false,
      // Optimized transcription settings for faster processing
      transcription: {
        transcription_engine: 'google', // Use Google's speech recognition
        language: 'en-US',
        interim_results: false, // Only final results to reduce processing overhead
        profanity_filter: false,
        punctuation: true,
        speech_model: 'phone_call', // Optimized for phone calls
        enhanced: true // Use enhanced model for better accuracy
      }
    });
    
    console.log(`✅ Optimized speech recognition started for call ${callControlId}`);
    
    // Shorter timeout for more responsive conversation
    setTimeout(async () => {
      try {
        const stillActive = await Call.findOne({ callId: callControlId });
        if (stillActive && stillActive.status === 'in_progress') {
          console.log(`⏰ Speech recognition timeout for call ${callControlId}, prompting customer`);
          await handleSilentCustomer(callControlId, call, Math.floor(call.conversation.length / 2) + 1);
        }
      } catch (error) {
        console.error('Speech recognition timeout handling error:', error);
      }
    }, 6000); // Reduced timeout for faster response
    
  } catch (error) {
    console.error('Real speech recognition start error:', error.response?.data || error.message);
    
    // Fallback: If real speech recognition fails, try basic recording
    try {
      console.log(`🔄 Fallback: Starting basic recording for call ${callControlId}`);
      await telnyxAPI.post(`/calls/${callControlId}/actions/start_recording`, {
        format: 'mp3',
        channels: 'dual'
      });
      
      // Stop recording after 8 seconds and continue conversation
      setTimeout(async () => {
        try {
          await telnyxAPI.post(`/calls/${callControlId}/actions/stop_recording`);
          // Continue conversation with a generic response
          const conversationTurn = Math.floor(call.conversation.length / 2) + 1;
          await handleUserResponse(call, callControlId, "I'm listening, please continue.", conversationTurn);
        } catch (stopError) {
          console.error('Stop recording error:', stopError);
        }
      }, 8000);
      
    } catch (fallbackError) {
      console.error('Fallback recording failed:', fallbackError.response?.data || fallbackError.message);
      // If everything fails, continue conversation anyway
      const conversationTurn = Math.floor(call.conversation.length / 2) + 1;
      await handleUserResponse(call, callControlId, "Could you repeat that? I want to make sure I understand.", conversationTurn);
    }
  }
}

// Natural Human-like Conversation System
async function generateNaturalResponse(call, userResponse, stage) {
  try {
    const conversationHistory = call.conversation || [];
    const leadName = call.leadName || 'there';
    
    let systemPrompt = `You are Mike, a real human sales rep who talks EXACTLY like a genuine person - not an AI or robot. You're warm, authentic, and conversational.

CRITICAL: You must sound like a REAL HUMAN, not artificial or scripted.

HUMAN PERSONALITY TRAITS:
- Warm, genuine, and naturally conversational
- Use natural speech patterns with hesitations and fillers
- Show authentic emotions and reactions
- Sound like you're having a real conversation with a friend
- Be naturally curious and interested in their business
- Use contractions naturally (I'm, you're, we've, that's, it's, don't, won't)
- Sound relaxed and confident but not robotic

NATURAL HUMAN SPEECH PATTERNS:
- Use conversation fillers naturally: "um", "uh", "you know", "actually", "like", "so", "well"
- Add natural hesitations: "I mean...", "Let me think...", "Actually..."
- Show genuine reactions: "Oh really?", "That's interesting!", "Wow!", "No way!", "Cool!"
- Use natural transitions: "So tell me...", "I'm curious...", "Actually, that reminds me..."
- Sound like you're thinking out loud sometimes
- Use natural acknowledgments: "Mm-hmm", "Right", "Totally", "Absolutely", "For sure"

AUTHENTIC CONVERSATION STYLE:
- Keep responses short and conversational (1-2 sentences max)
- Ask questions like a genuinely curious person
- React naturally to what they say
- Build on their responses authentically
- Show you're listening by referencing what they just said
- Use natural enthusiasm when appropriate
- Sound like you're having a real phone conversation

BUSINESS CONTEXT (Natural Human):
- You help businesses with websites and getting more customers
- You're calling because you thought they might be interested
- You're genuinely curious about their business challenges
- You want to understand if you can actually help them
- You're not pushy - just having a real conversation

NATURAL HUMAN EXAMPLES:
- "Hey [name]! This is Mike from WebCraft Solutions. How's your day going?"
- "Oh really? That's actually pretty interesting..."
- "You know what? I hear that a lot from business owners..."
- "Hmm, that's a good point. So tell me..."
- "Actually, that reminds me of another client I worked with..."
- "I'm curious - what's been your experience with...?"
- "Oh wow, that sounds frustrating. Um, can I ask..."
- "That's exactly what I was thinking! So..."

CRITICAL RULES:
- Sound like a real human having a genuine conversation
- Use natural speech patterns with fillers and hesitations
- Show authentic reactions and emotions
- Be conversational, not scripted or robotic
- Ask questions like a genuinely curious person
- Build rapport naturally through authentic interest
- Sound warm and approachable, not corporate or artificial`;

    if (stage === 'opening') {
      systemPrompt += `\n\nThis is your opening call. Start like a real human - warm, natural, and genuinely friendly. Build rapport first with authentic interest in how they're doing.`;
    } else {
      systemPrompt += `\n\nContinue the conversation like a real human based on what they just said: "${userResponse}". React naturally and authentically to their response, then ask a genuine follow-up question.`;
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add conversation history for context
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.speaker === 'ai' ? 'assistant' : 'user',
        content: msg.message
      });
    });

    // Add current user response if this isn't the opening
    if (stage !== 'opening' && userResponse) {
      messages.push({
        role: 'user',
        content: userResponse
      });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4', // Use GPT-4 for more natural conversations
      messages,
      max_tokens: 80, // Even shorter for more natural flow
      temperature: 1.3, // Maximum naturalness and variation
      presence_penalty: 0.7, // Encourage varied responses
      frequency_penalty: 0.6 // Reduce repetition
    });

    let aiMessage = response.choices[0].message.content.trim();
    
    // Replace lead name placeholder if present
    aiMessage = aiMessage.replace(/\{leadName\}/g, leadName);
    
    return aiMessage;
    
  } catch (error) {
    console.error('Natural response generation error:', error);
    // Fallback to a natural human greeting
    if (stage === 'opening') {
      return `Hey ${call.leadName || 'there'}! This is Mike from WebCraft Solutions. How's your day treating you so far?`;
    }
    return "Oh really? That's actually pretty interesting. Tell me more about that.";
  }
}

// Legacy function - replaced by generateNaturalResponse

// Helper function to handle user responses and determine next steps
async function handleUserResponse(call, callControlId, userResponse, conversationTurn = 1) {
  try {
    console.log(`Processing user response for call ${callControlId}, turn ${conversationTurn}: "${userResponse}"`);
    
    // Check if call is still active
    const currentCall = await Call.findOne({ callId: callControlId });
    if (!currentCall || currentCall.status === 'completed' || currentCall.status === 'failed') {
      console.log(`Call ${callControlId} is not active, skipping response processing`);
      return;
    }
    
    // Add user response to conversation
    await call.addConversationMessage('human', userResponse);
    
    // Generate natural AI response based on conversation context
    const aiResponse = await generateNaturalResponse(call, userResponse, 'conversation');
    await call.addConversationMessage('ai', aiResponse);
    
    // Send response via TTS with natural speech patterns
    try {
      await speakWithNaturalVoice(callControlId, aiResponse);
    } catch (speakError) {
      console.error('TTS Error in conversation:', speakError.response?.data || speakError.message);
      // If TTS fails, the call might be over
      await call.updateStatus('failed', { 
        notes: 'TTS failed during conversation' 
      });
      return;
    }
    
    // Update call status based on conversation progress (simplified for natural conversations)
    const conversationLength = call.conversation.length;
    if (conversationLength >= 8) { // If conversation is progressing well
      await call.updateOne({ 
        outcome: 'engaged',
        qualificationScore: 75
      });
    }
    
    // End conversation after 5 turns for natural flow
    if (conversationTurn >= 5) {
      console.log(`Ending conversation for call ${callControlId} after ${conversationTurn} turns`);
      setTimeout(async () => {
        try {
          await telnyxAPI.post(`/calls/${callControlId}/actions/hangup`);
        } catch (hangupError) {
          console.error('Hangup error:', hangupError.response?.data || hangupError.message);
        }
      }, 3000); // Give time for final response
    }
    // Note: Conversation continues when AI speaks again via call.speak.ended webhook
    
  } catch (error) {
    console.error('User response handling error:', error);
    // Mark call as failed if there's an error
    await call.updateStatus('failed', { 
      notes: 'Error processing user response' 
    });
  }
}

// Legacy functions removed - now using natural conversation system

module.exports = router; 