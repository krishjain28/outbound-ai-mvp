# 🔧 API Integrations Setup Guide

## 📊 **Current Status**

✅ **Backend**: Working  
❌ **Telnyx**: Not configured  
❌ **OpenAI**: Not configured  
❌ **Deepgram**: Not configured  
❌ **ElevenLabs**: Not configured  

## 🚀 **Required API Keys Setup**

### **1. 📞 Telnyx (Voice Calls)**
**Purpose**: Make and receive phone calls

**Setup Steps**:
1. **Sign up**: https://telnyx.com/
2. **Get API Key**: Dashboard → API Keys → Create Key
3. **Get Phone Number**: Dashboard → Phone Numbers → Buy Number
4. **Get Connection ID**: Dashboard → Voice → Connections → Create Connection

**Environment Variables**:
```
TELNYX_API_KEY=your-telnyx-api-key
TELNYX_PHONE_NUMBER=+1234567890
TELNYX_CONNECTION_ID=your-connection-id
```

**Cost**: ~$0.01/minute for calls

---

### **2. 🤖 OpenAI (AI Conversations)**
**Purpose**: Generate intelligent responses for calls

**Setup Steps**:
1. **Sign up**: https://platform.openai.com/
2. **Get API Key**: Dashboard → API Keys → Create Key
3. **Add billing**: Required for API usage

**Environment Variables**:
```
OPENAI_API_KEY=sk-your-openai-api-key
```

**Cost**: ~$0.002/1K tokens

---

### **3. 🎤 Deepgram (Speech-to-Text)**
**Purpose**: Convert speech to text during calls

**Setup Steps**:
1. **Sign up**: https://deepgram.com/
2. **Get API Key**: Dashboard → API Keys → Create Key
3. **Select model**: Nova-2 (recommended)

**Environment Variables**:
```
DEEPGRAM_API_KEY=your-deepgram-api-key
```

**Cost**: ~$0.0044/minute

---

### **4. 🎵 ElevenLabs (Text-to-Speech)**
**Purpose**: Convert AI responses to natural speech

**Setup Steps**:
1. **Sign up**: https://elevenlabs.io/
2. **Get API Key**: Dashboard → Profile → API Key
3. **Select Voice**: Choose a voice ID (default: pNInz6obpgDQGcFmaJgB)

**Environment Variables**:
```
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
```

**Cost**: ~$0.30/1K characters

---

## 🔄 **Update Render Environment Variables**

### **Step 1: Get All API Keys**
- Telnyx: Voice calling service
- OpenAI: AI conversation generation
- Deepgram: Speech-to-text conversion
- ElevenLabs: Text-to-speech synthesis

### **Step 2: Update Render Dashboard**
1. **Go to**: https://dashboard.render.com/
2. **Select** your backend service (`outbound-ai`)
3. **Go to Environment** tab
4. **Add/Update** these variables:

```
TELNYX_API_KEY=your-telnyx-api-key
TELNYX_PHONE_NUMBER=+1234567890
TELNYX_CONNECTION_ID=your-connection-id
OPENAI_API_KEY=sk-your-openai-api-key
DEEPGRAM_API_KEY=your-deepgram-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
```

### **Step 3: Redeploy Backend**
1. **Click Save** in Environment tab
2. **Click Redeploy** to apply changes
3. **Wait** 2-3 minutes for deployment

---

## 🧪 **Test After Setup**

```bash
# Test all integrations
cd backend && node test-api-integrations.js

# Expected output:
# 📞 Telnyx: ✅ Working
# 🤖 OpenAI: ✅ Working
# 🎤 Deepgram: ✅ Working
# 🎵 ElevenLabs: ✅ Working
# 🌐 Backend: ✅ Working
```

---

## 💰 **Estimated Monthly Costs**

**For 100 calls/month (5 minutes each)**:
- **Telnyx**: $5.00 (500 minutes)
- **OpenAI**: $2.00 (1M tokens)
- **Deepgram**: $11.00 (2,500 minutes)
- **ElevenLabs**: $15.00 (50K characters)
- **Total**: ~$33/month

**For 10 calls/month (5 minutes each)**:
- **Total**: ~$3.30/month

---

## 🎯 **Priority Order**

1. **OpenAI** (Essential for AI conversations)
2. **ElevenLabs** (Essential for voice output)
3. **Deepgram** (Important for speech input)
4. **Telnyx** (Required for actual calls)

---

## 🔍 **Troubleshooting**

### **If API keys don't work**:
1. **Check key format**: Ensure no extra spaces
2. **Verify permissions**: Some keys need specific scopes
3. **Check billing**: Ensure accounts have sufficient credits
4. **Test individually**: Use the test script to isolate issues

### **If calls fail**:
1. **Check Telnyx webhook**: Ensure backend URL is correct
2. **Verify phone numbers**: Must be in E.164 format (+1234567890)
3. **Test connection**: Use Telnyx dashboard to test calls

---

**Last Updated**: July 13, 2025
**Status**: Ready for API key configuration 