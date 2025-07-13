# API Configuration Setup Instructions

## Overview
Your AI SDR calling system requires API keys from Telnyx (for calling) and OpenAI (for AI conversations) to function properly.

## Required API Keys

### 1. Telnyx API Configuration
Telnyx provides the voice calling infrastructure.

**Steps:**
1. Sign up at [https://telnyx.com](https://telnyx.com)
2. Go to the [API Keys section](https://portal.telnyx.com/app/api-keys)
3. Create a new API key
4. Purchase a phone number from the [Numbers section](https://portal.telnyx.com/app/numbers)
5. Add these to your backend `.env` file:
   ```
   TELNYX_API_KEY=your-actual-telnyx-api-key
   TELNYX_PHONE_NUMBER=your-actual-telnyx-phone-number
   ```

### 2. OpenAI API Configuration
OpenAI provides the AI conversation capabilities.

**Steps:**
1. Sign up at [https://platform.openai.com](https://platform.openai.com)
2. Go to [API Keys](https://platform.openai.com/api-keys)
3. Create a new API key
4. Add this to your backend `.env` file:
   ```
   OPENAI_API_KEY=your-actual-openai-api-key
   ```

## Backend Environment File Setup

Create a `.env` file in the `backend` directory with the following content:

```env
# Environment Configuration
NODE_ENV=development
PORT=5001

# MongoDB Configuration
MONGODB_URI=mongodb+srv://krishjain:Krish%40123@cluster0.v7ckm.mongodb.net/outbound-ai-mvp?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
JWT_EXPIRE=30d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Telnyx Configuration (Required for calling)
TELNYX_API_KEY=your-actual-telnyx-api-key-here
TELNYX_PUBLIC_KEY=your-actual-telnyx-public-key-here
TELNYX_PHONE_NUMBER=your-actual-telnyx-phone-number-here

# OpenAI Configuration (Required for AI conversations)
OPENAI_API_KEY=your-actual-openai-api-key-here

# Backend URL for webhooks
BACKEND_URL=http://localhost:5001
```

## Testing Configuration

1. Start your backend server: `npm run dev`
2. Go to the Call Page in your frontend
3. You should see a green checkmark if all APIs are configured correctly
4. If you see a red warning banner, check the console for missing API keys

## Troubleshooting

### "Failed to initiate call" Error
- Check that you have valid Telnyx API key and phone number
- Ensure your Telnyx account has sufficient balance
- Verify the phone number format is correct

### "Authentication failed" Error
- Double-check your Telnyx API key
- Make sure there are no extra spaces in your .env file

### "Missing API credentials" Error
- Ensure all required environment variables are set in your .env file
- Restart the backend server after making changes

## Cost Considerations

- **Telnyx**: Charges per minute for calls (typically $0.01-0.05 per minute)
- **OpenAI**: Charges per token for AI conversations (typically $0.001-0.003 per 1K tokens)
- Test with small amounts first to understand costs

## Next Steps

Once configured, you can:
1. Make test calls to verify everything works
2. Customize the AI prompt for your specific use case
3. Import lead lists and start making automated calls
4. Monitor call analytics and conversion rates 