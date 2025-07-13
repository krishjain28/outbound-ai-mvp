# Enhanced AI Conversation System Setup Guide

## 🚀 Overview

This enhanced system provides a complete AI-powered conversation solution with:

- **Real-time Speech Recognition** using Deepgram
- **Ultra-realistic Voice Synthesis** using ElevenLabs  
- **Natural Conversation AI** using GPT-4
- **Professional Voice Calling** using Telnyx
- **Conversation Memory & Context** tracking
- **Professional SDR Capabilities**

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (cloud database)
- ngrok for webhook tunneling

## 🔧 Required API Keys

### Essential APIs (Required)
1. **Telnyx** - Voice calling infrastructure
2. **OpenAI** - GPT-4 for natural conversation
3. **MongoDB Atlas** - Database for call tracking

### Enhanced APIs (Optional but Recommended)
1. **Deepgram** - Real-time speech recognition
2. **ElevenLabs** - Ultra-realistic voice synthesis

## 🛠️ Installation Steps

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd outbound-ai-mvp

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create `backend/.env` file with the following:

```env
# Server Configuration
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=your-mongodb-atlas-connection-string

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d

# Telnyx Configuration (Required)
TELNYX_API_KEY=your-telnyx-api-key
TELNYX_PHONE_NUMBER=your-telnyx-phone-number
TELNYX_CONNECTION_ID=your-telnyx-connection-id
BACKEND_URL=https://your-ngrok-url.ngrok-free.app

# OpenAI Configuration (Required)
OPENAI_API_KEY=your-openai-api-key

# Deepgram Configuration (Optional - for real-time speech recognition)
DEEPGRAM_API_KEY=your-deepgram-api-key

# ElevenLabs Configuration (Optional - for ultra-realistic voice)
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
```

### 3. Set Up API Accounts

#### Telnyx Setup (Required)
1. Sign up at [Telnyx.com](https://telnyx.com)
2. Create a Call Control Application
3. Purchase a phone number
4. Get your API key from the dashboard
5. Configure webhook URL: `https://your-ngrok-url.ngrok-free.app/api/calls/webhook`

#### OpenAI Setup (Required)
1. Sign up at [OpenAI.com](https://openai.com)
2. Create an API key
3. Ensure GPT-4 access (required for best results)

#### MongoDB Atlas Setup (Required)
1. Sign up at [MongoDB.com](https://mongodb.com)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address
5. Get the connection string

#### Deepgram Setup (Optional)
1. Sign up at [Deepgram.com](https://deepgram.com)
2. Create an API key
3. Enables real-time speech recognition

#### ElevenLabs Setup (Optional)
1. Sign up at [ElevenLabs.io](https://elevenlabs.io)
2. Create an API key
3. Choose a voice ID (default: Adam)
4. Enables ultra-realistic voice synthesis

### 4. Start the System

#### Terminal 1: Start ngrok (for webhooks)
```bash
ngrok http 5001
```
Copy the HTTPS URL and update `BACKEND_URL` in your `.env` file.

#### Terminal 2: Start Backend
```bash
cd backend
npm run dev
```

#### Terminal 3: Start Frontend
```bash
cd frontend
npm start
```

### 5. Test the System

Run the comprehensive test script:
```bash
cd backend
node test-enhanced-system.js
```

## 🎯 Feature Levels

### Basic Level (Required APIs only)
- ✅ Voice calling with Telnyx
- ✅ Natural conversation with GPT-4
- ✅ Basic TTS with Telnyx
- ✅ Simulated customer responses
- ✅ Call tracking and analytics

### Enhanced Level (All APIs configured)
- ✅ **Real-time speech recognition** with Deepgram
- ✅ **Ultra-realistic voice synthesis** with ElevenLabs
- ✅ **Natural conversation flow** with context memory
- ✅ **Professional SDR capabilities**
- ✅ **Advanced call analytics**

## 🔍 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Services      │
│   (React)       │    │   (Node.js)     │    │                 │
│                 │    │                 │    │                 │
│ • Call UI       │◄──►│ • Call Routes   │◄──►│ • Speech Service│
│ • Status        │    │ • Webhooks      │    │ • Conversation  │
│ • Analytics     │    │ • Auth          │    │ • Memory        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   External APIs │
                       │                 │
                       │ • Telnyx        │
                       │ • OpenAI        │
                       │ • Deepgram      │
                       │ • ElevenLabs    │
                       │ • MongoDB       │
                       └─────────────────┘
```

## 🎤 Voice & Speech Features

### Voice Synthesis Options
1. **Basic**: Telnyx TTS (always available)
2. **Enhanced**: ElevenLabs ultra-realistic voices

### Speech Recognition Options
1. **Basic**: Simulated customer responses
2. **Enhanced**: Real-time Deepgram speech recognition

### Conversation Intelligence
- **GPT-4 powered** natural conversation
- **Context memory** throughout calls
- **Professional SDR** qualification techniques
- **Automatic lead scoring**

## 🔧 Troubleshooting

### Common Issues

#### Backend won't start
- Check if port 5001 is available
- Verify MongoDB connection string
- Ensure all required environment variables are set

#### Calls not connecting
- Verify Telnyx API key and phone number
- Check ngrok tunnel is active
- Confirm webhook URL is correct

#### Voice not working
- Check Telnyx connection ID
- Verify phone number format
- Test with basic TTS first

#### Enhanced features not working
- Verify Deepgram API key
- Check ElevenLabs API key
- Ensure voice ID is valid

### Test Commands

```bash
# Test backend health
curl http://localhost:5001/api/health

# Test full system
node backend/test-enhanced-system.js

# Check logs
# Backend logs in terminal
# Frontend logs in browser console
```

## 📱 Usage Guide

### Making Calls
1. Access the frontend at `http://localhost:3000`
2. Login with your account
3. Navigate to the Call page
4. Select country and enter phone number
5. Customize AI prompt if needed
6. Click "Start Call"

### Monitoring Calls
- Real-time call status updates
- Live conversation display
- Call analytics and metrics
- Recording playback (when available)

### Enhanced Features
- **Real-time transcription** shows customer speech
- **Natural AI responses** with context awareness
- **Professional qualification** questions
- **Automatic lead scoring** based on conversation

## 🚀 Production Deployment

### Environment Setup
1. Use production MongoDB cluster
2. Configure production domain for webhooks
3. Set up proper SSL certificates
4. Use environment-specific API keys

### Security Considerations
- Rotate JWT secrets regularly
- Use strong API key management
- Implement rate limiting
- Monitor API usage

### Scaling
- Use load balancers for multiple instances
- Implement Redis for session management
- Monitor API rate limits
- Set up proper logging and monitoring

## 📊 Analytics & Monitoring

### Call Metrics
- Total calls made
- Success rates
- Average call duration
- Conversion rates

### Conversation Analytics
- Qualification scores
- Common objections
- Response patterns
- Lead quality assessment

### System Monitoring
- API response times
- Error rates
- Resource usage
- Cost tracking

## 🆘 Support

### Getting Help
1. Check the troubleshooting section
2. Run the test script for diagnostics
3. Review logs for error messages
4. Check API documentation for each service

### API Documentation
- [Telnyx API Docs](https://developers.telnyx.com)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Deepgram API Docs](https://developers.deepgram.com)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)

---

## 🎉 Congratulations!

You now have a fully enhanced AI conversation system with:
- ✅ Real-time speech recognition
- ✅ Ultra-realistic voice synthesis
- ✅ Natural GPT-4 conversations
- ✅ Professional SDR capabilities
- ✅ Comprehensive analytics

Ready to make some calls! 🚀 