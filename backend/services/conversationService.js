const OpenAI = require('openai');

class ConversationService {
  constructor() {
    this.openai = null;

    // Conversation memory for each call
    this.conversationMemory = new Map();
  }

  // Initialize OpenAI client when needed
  getOpenAI() {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Professional SDR personality
    this.systemPrompt = `You are Mike, a highly experienced and professional Sales Development Representative (SDR) with 5+ years of experience at WebCraft Solutions. You specialize in helping small to medium-sized businesses establish their online presence through professional website development.

PERSONALITY TRAITS:
- Professional yet approachable and conversational
- Confident but not pushy - you're a trusted business advisor
- Genuinely interested in helping businesses grow
- Skilled at building rapport and asking the right qualifying questions
- Natural conversationalist who speaks like a real human

CONVERSATION STYLE:
- Speak naturally with authentic human speech patterns
- Use natural fillers occasionally: "um", "uh", "you know", "actually", "like", "so", "well"
- Add genuine reactions: "Oh really?", "That's interesting!", "Wow!", "I see", "Got it", "Makes sense"
- Use contractions: "I'm", "you're", "we've", "that's", "it's", "can't", "won't"
- Be conversational, not scripted
- Ask one question at a time and listen to responses
- Build on what the customer says
- Use acknowledgments: "Mm-hmm", "Right", "Absolutely", "For sure", "I hear that a lot"

SALES APPROACH:
- Start with warm rapport building before diving into business
- Ask consultative questions to understand their business challenges
- Listen actively and respond to what they actually say
- Position yourself as a business advisor, not just a salesperson
- Use phrases like "I hear that a lot from business owners" or "That's exactly why I reached out"
- Be genuinely curious about their business

QUALIFYING QUESTIONS (ask naturally in conversation):
- What's your biggest challenge with getting customers online right now?
- How are you currently handling your online presence?
- What's been your experience with websites or online marketing so far?
- What would having a professional website mean for your business?
- What's your timeline for getting something like this set up?

CONVERSATION FLOW:
1. Warm opening with rapport building
2. Transition to business discussion naturally
3. Ask qualifying questions based on their responses
4. Listen and respond authentically to their answers
5. Gauge interest and next steps if appropriate

IMPORTANT RULES:
- Never sound scripted or robotic
- Always respond to what the customer actually says
- If they seem uninterested, acknowledge it professionally
- If they hang up or seem rushed, be understanding
- Keep responses conversational length (2-3 sentences max usually)
- Remember context from earlier in the conversation
- Be authentic - if you don't know something, say so

Remember: You're having a real conversation with a real person. Be human, be genuine, and focus on helping them solve their business challenges.`;
  }

  /**
   * Initialize conversation memory for a call
   */
  initializeConversation(callId, leadName, businessType = null) {
    const conversationContext = {
      callId,
      leadName,
      businessType,
      conversationHistory: [],
      currentStage: 'opening',
      qualificationData: {},
      startTime: new Date(),
      turnCount: 0,
    };

    this.conversationMemory.set(callId, conversationContext);
    console.log(`🧠 Initialized conversation memory for call ${callId}`);

    return conversationContext;
  }

  /**
   * Generate opening message for the call
   */
  generateOpeningMessage(leadName) {
    const openings = [
      `Hey ${leadName}, this is Mike from WebCraft Solutions. How's your day treating you so far?`,
      `Hi ${leadName}, Mike here from WebCraft Solutions. Hope you're having a good day so far!`,
      `Hey there ${leadName}, this is Mike from WebCraft Solutions. How are things going today?`,
      `Hi ${leadName}, it's Mike from WebCraft Solutions. Hope I'm not catching you at a bad time?`,
    ];

    return openings[Math.floor(Math.random() * openings.length)];
  }

  /**
   * Generate AI response based on customer input
   */
  async generateResponse(callId, customerInput, stage = 'conversation') {
    try {
      const context = this.conversationMemory.get(callId);

      if (!context) {
        throw new Error(`No conversation context found for call ${callId}`);
      }

      // Update conversation history
      context.conversationHistory.push({
        role: 'user',
        content: customerInput,
        timestamp: new Date(),
      });

      context.turnCount++;

      // Build conversation messages for GPT-4
      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...this.buildConversationHistory(context),
        { role: 'user', content: customerInput },
      ];

      // Add context about the conversation stage
      let stageContext = '';
      switch (stage) {
        case 'opening':
          stageContext =
            'This is the opening of the call. Focus on building rapport and transitioning to business discussion.';
          break;
        case 'qualification':
          stageContext =
            'You are in the qualification phase. Ask relevant questions to understand their business needs.';
          break;
        case 'interest_building':
          stageContext =
            'The customer has shown some interest. Build on that and explore their specific needs.';
          break;
        case 'closing':
          stageContext =
            'Wrap up the conversation professionally. If appropriate, suggest next steps.';
          break;
        default:
          stageContext =
            'Continue the natural conversation flow based on what the customer is saying.';
      }

      if (stageContext) {
        messages.push({ role: 'system', content: stageContext });
      }

      console.log(
        `🤖 Generating GPT-4 response for call ${callId}, turn ${context.turnCount}`
      );

      const completion = await this.getOpenAI().chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 150,
        temperature: 0.8, // Higher temperature for more natural variation
        presence_penalty: 0.3,
        frequency_penalty: 0.3,
      });

      const aiResponse = completion.choices[0].message.content.trim();

      // Add AI response to conversation history
      context.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      });

      // Update conversation stage based on content
      this.updateConversationStage(context, customerInput, aiResponse);

      // Extract qualification data
      this.extractQualificationData(context, customerInput);

      console.log(`💬 Generated response for call ${callId}: "${aiResponse}"`);

      return {
        success: true,
        response: aiResponse,
        stage: context.currentStage,
        turnCount: context.turnCount,
        qualificationData: context.qualificationData,
      };
    } catch (error) {
      console.error('❌ Error generating AI response:', error);

      // Fallback response
      const fallbackResponses = [
        "I'm sorry, could you repeat that? I want to make sure I understand you correctly.",
        "That's interesting. Can you tell me a bit more about that?",
        "I see. What's your main concern about that?",
        'Got it. How has that been working for you so far?',
      ];

      const fallbackResponse =
        fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

      return {
        success: false,
        response: fallbackResponse,
        error: error.message,
        stage: 'conversation',
        turnCount: 0,
      };
    }
  }

  /**
   * Build conversation history for GPT-4 context
   */
  buildConversationHistory(context) {
    // Include last 6 exchanges to maintain context without exceeding token limits
    const recentHistory = context.conversationHistory.slice(-6);

    return recentHistory.map(entry => ({
      role: entry.role,
      content: entry.content,
    }));
  }

  /**
   * Update conversation stage based on content
   */
  updateConversationStage(context, customerInput, aiResponse) {
    const input = customerInput.toLowerCase();

    // Stage progression logic
    if (context.currentStage === 'opening') {
      if (
        input.includes('good') ||
        input.includes('fine') ||
        input.includes('okay')
      ) {
        context.currentStage = 'qualification';
      }
    } else if (context.currentStage === 'qualification') {
      if (
        input.includes('interested') ||
        input.includes('need') ||
        input.includes('want')
      ) {
        context.currentStage = 'interest_building';
      }
    } else if (context.currentStage === 'interest_building') {
      if (
        input.includes('when') ||
        input.includes('how much') ||
        input.includes('next step')
      ) {
        context.currentStage = 'closing';
      }
    }

    // Check for negative signals
    if (
      input.includes('not interested') ||
      input.includes('no thanks') ||
      input.includes('busy')
    ) {
      context.currentStage = 'closing';
    }
  }

  /**
   * Extract qualification data from customer responses
   */
  extractQualificationData(context, customerInput) {
    const input = customerInput.toLowerCase();

    // Business type
    if (input.includes('restaurant') || input.includes('food')) {
      context.qualificationData.businessType = 'restaurant';
    } else if (input.includes('retail') || input.includes('store')) {
      context.qualificationData.businessType = 'retail';
    } else if (input.includes('service') || input.includes('consulting')) {
      context.qualificationData.businessType = 'service';
    }

    // Current online presence
    if (input.includes('no website') || input.includes("don't have")) {
      context.qualificationData.hasWebsite = false;
    } else if (input.includes('website') || input.includes('site')) {
      context.qualificationData.hasWebsite = true;
    }

    // Budget indicators
    if (
      input.includes('expensive') ||
      input.includes('cost') ||
      input.includes('price')
    ) {
      context.qualificationData.budgetConcern = true;
    }

    // Timeline
    if (
      input.includes('soon') ||
      input.includes('asap') ||
      input.includes('quickly')
    ) {
      context.qualificationData.timeline = 'urgent';
    } else if (input.includes('month') || input.includes('weeks')) {
      context.qualificationData.timeline = 'medium';
    }

    // Interest level
    if (
      input.includes('interested') ||
      input.includes('sounds good') ||
      input.includes('tell me more')
    ) {
      context.qualificationData.interestLevel = 'high';
    } else if (input.includes('maybe') || input.includes('thinking about')) {
      context.qualificationData.interestLevel = 'medium';
    }
  }

  /**
   * Get conversation summary
   */
  getConversationSummary(callId) {
    const context = this.conversationMemory.get(callId);

    if (!context) {
      return null;
    }

    return {
      callId,
      leadName: context.leadName,
      duration: Math.floor((new Date() - context.startTime) / 1000),
      turnCount: context.turnCount,
      finalStage: context.currentStage,
      qualificationData: context.qualificationData,
      conversationHistory: context.conversationHistory,
    };
  }

  /**
   * Determine call outcome based on conversation
   */
  determineCallOutcome(callId) {
    const context = this.conversationMemory.get(callId);

    if (!context) {
      return 'unknown';
    }

    const { qualificationData, currentStage, turnCount } = context;

    // Determine outcome based on qualification data and conversation flow
    if (qualificationData.interestLevel === 'high' && turnCount >= 3) {
      return 'qualified';
    } else if (
      qualificationData.interestLevel === 'medium' ||
      currentStage === 'interest_building'
    ) {
      return 'follow_up';
    } else if (turnCount < 2 || currentStage === 'opening') {
      return 'no_answer';
    } else {
      return 'not_interested';
    }
  }

  /**
   * Clean up conversation memory
   */
  cleanupConversation(callId) {
    this.conversationMemory.delete(callId);
    console.log(`🧹 Cleaned up conversation memory for call ${callId}`);
  }

  /**
   * Get active conversation count
   */
  getActiveConversationCount() {
    return this.conversationMemory.size;
  }
}

module.exports = new ConversationService();
