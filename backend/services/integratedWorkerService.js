// backend/services/integratedWorkerService.js
const Call = require('../models/Call');
const conversationService = require('./conversationService');

class IntegratedWorkerService {
  constructor() {
    this.isRunning = false;
    this.callProcessingInterval = null;
    this.conversationProcessingInterval = null;
  }

  start() {
    console.log('🔄 Starting Integrated Worker Service...');
    
    this.isRunning = true;
    
    // Start call processing (every 5 seconds)
    this.callProcessingInterval = setInterval(() => {
      this.processCallQueue();
    }, 5000);
    
    // Start conversation processing (every 10 seconds)
    this.conversationProcessingInterval = setInterval(() => {
      this.processConversationQueue();
    }, 10000);
    
    console.log('✅ Integrated Worker Service started');
  }

  async processCallQueue() {
    if (!this.isRunning) return;
    
    try {
      // Process pending calls (limit to 3 at a time)
      const pendingCalls = await Call.find({
        status: { $in: ['initiated', 'ringing', 'answered'] },
        $or: [
          { lastProcessed: { $exists: false } },
          { lastProcessed: { $lt: new Date(Date.now() - 30000) } }
        ]
      }).limit(3);

      for (const call of pendingCalls) {
        await this.processCall(call);
      }
    } catch (error) {
      console.error('❌ Error in call processing:', error);
    }
  }

  async processConversationQueue() {
    if (!this.isRunning) return;
    
    try {
      // Process calls needing conversation analysis (limit to 2 at a time)
      const callsToAnalyze = await Call.find({
        status: { $in: ['completed', 'answered'] },
        $or: [
          { qualificationScore: { $exists: false } },
          { conversationAnalysis: { $exists: false } },
          { lastAnalyzed: { $lt: new Date(Date.now() - 5 * 60 * 1000) } }
        ]
      }).limit(2);

      for (const call of callsToAnalyze) {
        await this.analyzeConversation(call);
      }
    } catch (error) {
      console.error('❌ Error in conversation processing:', error);
    }
  }

  async processCall(call) {
    try {
      console.log(`🔄 Processing call ${call._id} - Status: ${call.status}`);
      
      call.lastProcessed = new Date();
      await call.save();

      // Add your call processing logic here
      // This replaces the callWorker.js functionality
      
    } catch (error) {
      console.error(`❌ Error processing call ${call._id}:`, error);
    }
  }

  async analyzeConversation(call) {
    try {
      console.log(`🤖 Analyzing conversation for call ${call._id}`);
      
      call.lastAnalyzed = new Date();
      await call.save();

      // Add your conversation analysis logic here
      // This replaces the conversationWorker.js functionality
      
    } catch (error) {
      console.error(`❌ Error analyzing conversation ${call._id}:`, error);
    }
  }

  stop() {
    console.log('🛑 Stopping Integrated Worker Service...');
    
    this.isRunning = false;
    
    if (this.callProcessingInterval) {
      clearInterval(this.callProcessingInterval);
    }
    
    if (this.conversationProcessingInterval) {
      clearInterval(this.conversationProcessingInterval);
    }
    
    console.log('✅ Integrated Worker Service stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      callProcessingActive: !!this.callProcessingInterval,
      conversationProcessingActive: !!this.conversationProcessingInterval,
      uptime: this.isRunning ? process.uptime() : 0
    };
  }
}

module.exports = new IntegratedWorkerService();
