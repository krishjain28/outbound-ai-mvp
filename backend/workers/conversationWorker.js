const mongoose = require('mongoose');
const Call = require('../models/Call');
const conversationService = require('../services/conversationService');
const OpenAI = require('openai');
require('dotenv').config();

class ConversationWorker {
  constructor() {
    this.isRunning = false;
    this.processingQueue = [];
    this.maxConcurrentProcessing = 3;
    this.currentProcessing = 0;
    
    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async start() {
    console.log('🤖 Starting Conversation Worker...');
    
    // Connect to MongoDB
    await this.connectDB();
    
    // Initialize services
    await this.initializeServices();
    
    // Start processing queue
    this.isRunning = true;
    this.processQueue();
    
    console.log('✅ Conversation Worker started successfully');
  }

  async connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ MongoDB connected for Conversation Worker');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  async initializeServices() {
    console.log('🔧 Initializing conversation services...');
    
    // Validate required environment variables
    const required = ['OPENAI_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }
    
    console.log('✅ Conversation services initialized');
  }

  async processQueue() {
    while (this.isRunning) {
      try {
        // Find calls that need conversation analysis
        const callsToProcess = await Call.find({
          status: { $in: ['completed', 'answered'] },
          $or: [
            { qualificationScore: { $exists: false } },
            { conversationAnalysis: { $exists: false } },
            { lastAnalyzed: { $lt: new Date(Date.now() - 5 * 60 * 1000) } }, // 5 minutes ago
            { 'conversation.0': { $exists: true }, qualificationScore: { $exists: false } }
          ]
        }).limit(this.maxConcurrentProcessing - this.currentProcessing);

        for (const call of callsToProcess) {
          if (this.currentProcessing < this.maxConcurrentProcessing) {
            this.processConversation(call);
          }
        }

        // Wait before next iteration
        await this.sleep(2000);
      } catch (error) {
        console.error('❌ Error in conversation processing queue:', error);
        await this.sleep(5000); // Wait longer on error
      }
    }
  }

  async processConversation(call) {
    this.currentProcessing++;
    
    try {
      console.log(`🤖 Processing conversation for call ${call._id}`);
      
      // Update last analyzed timestamp
      call.lastAnalyzed = new Date();
      await call.save();

      // Analyze conversation if it exists
      if (call.conversation && call.conversation.length > 0) {
        await this.analyzeConversation(call);
        await this.generateQualificationScore(call);
        await this.extractLeadInformation(call);
        await this.generateCallSummary(call);
      }

      // Generate follow-up recommendations
      await this.generateFollowUpRecommendations(call);

      console.log(`✅ Conversation analysis completed for call ${call._id}`);
    } catch (error) {
      console.error(`❌ Error processing conversation for call ${call._id}:`, error);
    } finally {
      this.currentProcessing--;
    }
  }

  async analyzeConversation(call) {
    try {
      const conversationText = call.conversation
        .map(entry => `${entry.speaker}: ${entry.message}`)
        .join('\n');

      const analysisPrompt = `
        Analyze this sales conversation and provide insights:
        
        ${conversationText}
        
        Please provide analysis in the following JSON format:
        {
          "sentiment": "positive|neutral|negative",
          "engagement_level": "high|medium|low",
          "interest_indicators": ["list", "of", "indicators"],
          "objections_raised": ["list", "of", "objections"],
          "key_topics": ["list", "of", "topics"],
          "conversation_quality": "excellent|good|fair|poor",
          "next_steps_discussed": ["list", "of", "next", "steps"],
          "pain_points_identified": ["list", "of", "pain", "points"]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a sales conversation analyst. Provide detailed analysis in valid JSON format.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      call.conversationAnalysis = analysis;
      await call.save();
      
      console.log(`📊 Conversation analysis completed for call ${call._id}`);
    } catch (error) {
      console.error(`❌ Error analyzing conversation for call ${call._id}:`, error);
    }
  }

  async generateQualificationScore(call) {
    try {
      const conversationText = call.conversation
        .map(entry => `${entry.speaker}: ${entry.message}`)
        .join('\n');

      const scoringPrompt = `
        Based on this sales conversation, provide a lead qualification score:
        
        ${conversationText}
        
        Consider these factors:
        - Budget indicators (1-25 points)
        - Authority/Decision making power (1-25 points)
        - Need/Pain points expressed (1-25 points)
        - Timeline/Urgency (1-25 points)
        
        Provide response in JSON format:
        {
          "total_score": 0-100,
          "budget_score": 0-25,
          "authority_score": 0-25,
          "need_score": 0-25,
          "timeline_score": 0-25,
          "qualification_level": "hot|warm|cold",
          "reasoning": "Brief explanation of the score"
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a lead qualification expert. Provide accurate BANT scoring in JSON format.' },
          { role: 'user', content: scoringPrompt }
        ],
        temperature: 0.2,
        max_tokens: 500
      });

      const scoring = JSON.parse(response.choices[0].message.content);
      
      call.qualificationScore = scoring.total_score;
      call.qualificationDetails = scoring;
      await call.save();
      
      console.log(`🎯 Qualification score generated for call ${call._id}: ${scoring.total_score}/100`);
    } catch (error) {
      console.error(`❌ Error generating qualification score for call ${call._id}:`, error);
    }
  }

  async extractLeadInformation(call) {
    try {
      const conversationText = call.conversation
        .map(entry => `${entry.speaker}: ${entry.message}`)
        .join('\n');

      const extractionPrompt = `
        Extract lead information from this conversation:
        
        ${conversationText}
        
        Provide extracted information in JSON format:
        {
          "company_name": "extracted or null",
          "industry": "extracted or null",
          "company_size": "extracted or null",
          "role": "extracted or null",
          "budget_range": "extracted or null",
          "current_solution": "extracted or null",
          "pain_points": ["list", "of", "pain", "points"],
          "decision_timeline": "extracted or null",
          "decision_makers": ["list", "if", "mentioned"],
          "contact_preferences": "extracted or null"
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a lead information extraction expert. Extract only explicitly mentioned information.' },
          { role: 'user', content: extractionPrompt }
        ],
        temperature: 0.1,
        max_tokens: 600
      });

      const leadInfo = JSON.parse(response.choices[0].message.content);
      
      call.leadInformation = leadInfo;
      await call.save();
      
      console.log(`📋 Lead information extracted for call ${call._id}`);
    } catch (error) {
      console.error(`❌ Error extracting lead information for call ${call._id}:`, error);
    }
  }

  async generateCallSummary(call) {
    try {
      const conversationText = call.conversation
        .map(entry => `${entry.speaker}: ${entry.message}`)
        .join('\n');

      const summaryPrompt = `
        Generate a concise call summary for this sales conversation:
        
        ${conversationText}
        
        Provide summary in JSON format:
        {
          "executive_summary": "2-3 sentence overview",
          "key_discussion_points": ["list", "of", "main", "topics"],
          "outcomes": ["list", "of", "outcomes"],
          "action_items": ["list", "of", "action", "items"],
          "follow_up_required": true/false,
          "meeting_scheduled": true/false,
          "call_rating": "excellent|good|fair|poor"
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a sales call summarization expert. Provide clear, actionable summaries.' },
          { role: 'user', content: summaryPrompt }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const summary = JSON.parse(response.choices[0].message.content);
      
      call.callSummary = summary;
      call.meetingBooked = summary.meeting_scheduled || false;
      await call.save();
      
      console.log(`📝 Call summary generated for call ${call._id}`);
    } catch (error) {
      console.error(`❌ Error generating call summary for call ${call._id}:`, error);
    }
  }

  async generateFollowUpRecommendations(call) {
    try {
      const context = {
        status: call.status,
        outcome: call.outcome,
        qualificationScore: call.qualificationScore,
        conversationAnalysis: call.conversationAnalysis,
        leadInformation: call.leadInformation
      };

      const recommendationPrompt = `
        Based on this call context, provide follow-up recommendations:
        
        ${JSON.stringify(context, null, 2)}
        
        Provide recommendations in JSON format:
        {
          "priority": "high|medium|low",
          "recommended_actions": ["list", "of", "actions"],
          "timeline": "immediate|within_24h|within_week|within_month",
          "next_contact_method": "email|phone|linkedin|meeting",
          "personalization_notes": "specific notes for personalization",
          "success_probability": 0-100
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a sales follow-up strategist. Provide actionable recommendations.' },
          { role: 'user', content: recommendationPrompt }
        ],
        temperature: 0.4,
        max_tokens: 600
      });

      const recommendations = JSON.parse(response.choices[0].message.content);
      
      call.followUpRecommendations = recommendations;
      await call.save();
      
      console.log(`🎯 Follow-up recommendations generated for call ${call._id}`);
    } catch (error) {
      console.error(`❌ Error generating follow-up recommendations for call ${call._id}:`, error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    console.log('🛑 Stopping Conversation Worker...');
    this.isRunning = false;
    
    // Wait for current processing to finish
    while (this.currentProcessing > 0) {
      console.log(`⏳ Waiting for ${this.currentProcessing} conversations to finish processing...`);
      await this.sleep(1000);
    }
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('✅ Conversation Worker stopped');
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📨 Received SIGTERM, shutting down gracefully...');
  if (global.conversationWorker) {
    await global.conversationWorker.stop();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📨 Received SIGINT, shutting down gracefully...');
  if (global.conversationWorker) {
    await global.conversationWorker.stop();
  }
  process.exit(0);
});

// Start the worker
const main = async () => {
  try {
    global.conversationWorker = new ConversationWorker();
    await global.conversationWorker.start();
  } catch (error) {
    console.error('❌ Failed to start Conversation Worker:', error);
    process.exit(1);
  }
};

main(); 