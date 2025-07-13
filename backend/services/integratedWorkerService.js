// backend/services/integratedWorkerService.js
const Call = require('../models/Call');
const { worker: logger } = require('../utils/logger');
const { 
  handleWorkerError, 
  handleDatabaseError 
} = require('../utils/errorHandler');

class IntegratedWorkerService {
  constructor() {
    this.isRunning = false;
    this.callProcessingInterval = null;
    this.conversationProcessingInterval = null;
  }

  start() {
    logger.info('Starting Integrated Worker Service...');

    this.isRunning = true;

    // Start call processing (every 5 seconds)
    this.callProcessingInterval = setInterval(() => {
      this.processCallQueue();
    }, 5000);

    // Start conversation processing (every 10 seconds)
    this.conversationProcessingInterval = setInterval(() => {
      this.processConversationQueue();
    }, 10000);

    logger.info('Integrated Worker Service started');
  }

  async processCallQueue() {
    if (!this.isRunning) return;

    try {
      // Process pending calls (limit to 3 at a time)
      const pendingCalls = await Call.find({
        status: { $in: ['initiated', 'ringing', 'answered'] },
        $or: [
          { lastProcessed: { $exists: false } },
          { lastProcessed: { $lt: new Date(Date.now() - 30000) } },
        ],
      }).limit(3);

      for (const call of pendingCalls) {
        await this.processCall(call);
      }
    } catch (error) {
      handleWorkerError(error, 'call processing');
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
          { lastAnalyzed: { $lt: new Date(Date.now() - 5 * 60 * 1000) } },
        ],
      }).limit(2);

      for (const call of callsToAnalyze) {
        await this.analyzeConversation(call);
      }
    } catch (error) {
      handleWorkerError(error, 'conversation processing');
    }
  }

  async processCall(call) {
    try {
      logger.info(`🔄 Processing call ${call._id} - Status: ${call.status}`);

      call.lastProcessed = new Date();
      await call.save();

      // Add your call processing logic here
      // This replaces the callWorker.js functionality
    } catch (error) {
      handleDatabaseError(error, `Error processing call ${call._id}`);
    }
  }

  async analyzeConversation(call) {
    try {
      logger.info(`🤖 Analyzing conversation for call ${call._id}`);

      call.lastAnalyzed = new Date();
      await call.save();

      // Add your conversation analysis logic here
      // This replaces the conversationWorker.js functionality
    } catch (error) {
      handleDatabaseError(error, `Error analyzing conversation ${call._id}`);
    }
  }

  stop() {
    logger.info('Stopping Integrated Worker Service...');

    this.isRunning = false;

    if (this.callProcessingInterval) {
      clearInterval(this.callProcessingInterval);
    }

    if (this.conversationProcessingInterval) {
      clearInterval(this.conversationProcessingInterval);
    }

    logger.info('Integrated Worker Service stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      callProcessingActive: !!this.callProcessingInterval,
      conversationProcessingActive: !!this.conversationProcessingInterval,
      uptime: this.isRunning ? process.uptime() : 0,
    };
  }
}

module.exports = IntegratedWorkerService;
