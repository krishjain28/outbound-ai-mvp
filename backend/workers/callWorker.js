const mongoose = require('mongoose');
const axios = require('axios');
const Call = require('../models/Call');
const speechService = require('../services/speechService');
const conversationService = require('../services/conversationService');
require('dotenv').config();

class CallWorker {
  constructor() {
    this.isRunning = false;
    this.processingQueue = [];
    this.maxConcurrentCalls = 5;
    this.currentCalls = 0;
  }

  async start() {
    console.log('🔄 Starting Call Worker...');
    
    // Connect to MongoDB
    await this.connectDB();
    
    // Initialize services
    await this.initializeServices();
    
    // Start processing queue
    this.isRunning = true;
    this.processQueue();
    
    console.log('✅ Call Worker started successfully');
  }

  async connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ MongoDB connected for Call Worker');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  async initializeServices() {
    // Initialize speech and conversation services
    console.log('🔧 Initializing services...');
    
    // Validate required environment variables
    const required = ['TELNYX_API_KEY', 'OPENAI_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }
    
    console.log('✅ Services initialized');
  }

  async processQueue() {
    while (this.isRunning) {
      try {
        // Check for pending calls
        const pendingCalls = await Call.find({
          status: { $in: ['initiated', 'ringing', 'answered'] },
          $or: [
            { lastProcessed: { $exists: false } },
            { lastProcessed: { $lt: new Date(Date.now() - 30000) } } // 30 seconds ago
          ]
        }).limit(this.maxConcurrentCalls - this.currentCalls);

        for (const call of pendingCalls) {
          if (this.currentCalls < this.maxConcurrentCalls) {
            this.processCall(call);
          }
        }

        // Process webhook events
        await this.processWebhookEvents();

        // Wait before next iteration
        await this.sleep(1000);
      } catch (error) {
        console.error('❌ Error in call processing queue:', error);
        await this.sleep(5000); // Wait longer on error
      }
    }
  }

  async processCall(call) {
    this.currentCalls++;
    
    try {
      console.log(`🔄 Processing call ${call._id} - Status: ${call.status}`);
      
      // Update last processed timestamp
      call.lastProcessed = new Date();
      await call.save();

      switch (call.status) {
        case 'initiated':
          await this.handleInitiatedCall(call);
          break;
        case 'ringing':
          await this.handleRingingCall(call);
          break;
        case 'answered':
          await this.handleAnsweredCall(call);
          break;
        default:
          console.log(`ℹ️  Call ${call._id} in status ${call.status} - no action needed`);
      }
    } catch (error) {
      console.error(`❌ Error processing call ${call._id}:`, error);
      
      // Update call with error status
      call.status = 'failed';
      call.outcome = 'system_error';
      call.endTime = new Date();
      await call.save();
    } finally {
      this.currentCalls--;
    }
  }

  async handleInitiatedCall(call) {
    // Check if call has been initiated with Telnyx
    if (!call.callId) {
      console.log(`⚠️  Call ${call._id} missing Telnyx call ID - marking as failed`);
      call.status = 'failed';
      call.outcome = 'system_error';
      call.endTime = new Date();
      await call.save();
      return;
    }

    // Check call status with Telnyx
    try {
      const response = await axios.get(`https://api.telnyx.com/v2/calls/${call.callId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const telnyxCall = response.data.data;
      
      if (telnyxCall.call_state === 'ringing') {
        call.status = 'ringing';
        await call.save();
        console.log(`📞 Call ${call._id} is ringing`);
      } else if (telnyxCall.call_state === 'active') {
        call.status = 'answered';
        call.startTime = new Date();
        await call.save();
        console.log(`✅ Call ${call._id} answered`);
      } else if (['completed', 'failed'].includes(telnyxCall.call_state)) {
        call.status = 'completed';
        call.outcome = telnyxCall.call_state === 'failed' ? 'failed' : 'completed';
        call.endTime = new Date();
        await call.save();
        console.log(`🔚 Call ${call._id} ended: ${call.outcome}`);
      }
    } catch (error) {
      console.error(`❌ Error checking Telnyx call status for ${call._id}:`, error);
    }
  }

  async handleRingingCall(call) {
    // Similar to handleInitiatedCall but specifically for ringing state
    await this.handleInitiatedCall(call);
  }

  async handleAnsweredCall(call) {
    // Handle active call conversation
    try {
      // Check if conversation is active
      const timeSinceAnswer = Date.now() - call.startTime.getTime();
      const maxCallDuration = 10 * 60 * 1000; // 10 minutes

      if (timeSinceAnswer > maxCallDuration) {
        console.log(`⏰ Call ${call._id} exceeded maximum duration - ending call`);
        await this.endCall(call, 'timeout');
        return;
      }

      // Process any pending conversation updates
      await this.processConversationUpdates(call);

    } catch (error) {
      console.error(`❌ Error handling answered call ${call._id}:`, error);
    }
  }

  async processConversationUpdates(call) {
    // Check for conversation updates that need processing
    const lastConversationEntry = call.conversation[call.conversation.length - 1];
    
    if (lastConversationEntry && lastConversationEntry.needsProcessing) {
      console.log(`🤖 Processing conversation update for call ${call._id}`);
      
      // Generate AI response
      const aiResponse = await conversationService.generateResponse(
        call.conversation,
        call.aiPrompt,
        call.leadName
      );

      // Add AI response to conversation
      call.conversation.push({
        speaker: 'ai',
        message: aiResponse,
        timestamp: new Date(),
        needsProcessing: false
      });

      // Send response via speech service
      await speechService.speak(call.callId, aiResponse);
      
      // Update call
      lastConversationEntry.needsProcessing = false;
      await call.save();
    }
  }

  async processWebhookEvents() {
    // Process any webhook events that need background processing
    // This could include call recordings, transcriptions, etc.
    
    // For now, just log that we're checking
    // console.log('🔍 Checking for webhook events to process...');
  }

  async endCall(call, reason) {
    try {
      // End the call via Telnyx
      await axios.post(`https://api.telnyx.com/v2/calls/${call.callId}/actions/hangup`, {}, {
        headers: {
          'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      // Update call record
      call.status = 'completed';
      call.outcome = reason;
      call.endTime = new Date();
      await call.save();

      console.log(`🔚 Call ${call._id} ended: ${reason}`);
    } catch (error) {
      console.error(`❌ Error ending call ${call._id}:`, error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    console.log('🛑 Stopping Call Worker...');
    this.isRunning = false;
    
    // Wait for current calls to finish
    while (this.currentCalls > 0) {
      console.log(`⏳ Waiting for ${this.currentCalls} calls to finish...`);
      await this.sleep(1000);
    }
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('✅ Call Worker stopped');
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📨 Received SIGTERM, shutting down gracefully...');
  if (global.callWorker) {
    await global.callWorker.stop();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📨 Received SIGINT, shutting down gracefully...');
  if (global.callWorker) {
    await global.callWorker.stop();
  }
  process.exit(0);
});

// Start the worker
const main = async () => {
  try {
    global.callWorker = new CallWorker();
    await global.callWorker.start();
  } catch (error) {
    console.error('❌ Failed to start Call Worker:', error);
    process.exit(1);
  }
};

main(); 