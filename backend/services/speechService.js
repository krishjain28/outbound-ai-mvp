const { createClient } = require('@deepgram/sdk');
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
const WebSocket = require('ws');
const axios = require('axios');
const { speech: logger } = require('../utils/logger');
const { 
  handleSpeechError, 
  handleApiError, 
  ConfigurationError,
  validateConfiguration 
} = require('../utils/errorHandler');

class SpeechService {
  constructor() {
    // Initialize Deepgram client (only if API key is available)
    this.deepgram = null;
    if (
      process.env.DEEPGRAM_API_KEY &&
      process.env.DEEPGRAM_API_KEY !== 'your-deepgram-api-key-here'
    ) {
      try {
        this.deepgram = createClient(process.env.DEEPGRAM_API_KEY);
        logger.info('Deepgram client initialized successfully');
      } catch (error) {
        const speechError = handleSpeechError(error, { 
          operation: 'deepgram_initialization',
          service: 'deepgram'
        });
        logger.warn('Failed to initialize Deepgram client', { error: speechError.message });
      }
    } else {
      logger.warn('⚠️ Deepgram API key not provided - speech recognition will be disabled');
    }

    // Initialize ElevenLabs client (only if API key is available)
    this.elevenlabs = null;
    if (
      process.env.ELEVENLABS_API_KEY &&
      process.env.ELEVENLABS_API_KEY !== 'your-elevenlabs-api-key-here'
    ) {
      try {
        this.elevenlabs = new ElevenLabsClient({
          apiKey: process.env.ELEVENLABS_API_KEY,
        });
        logger.info('ElevenLabs client initialized successfully');
      } catch (error) {
        const speechError = handleSpeechError(error, { 
          operation: 'elevenlabs_initialization',
          service: 'elevenlabs'
        });
        logger.warn('⚠️ Failed to initialize ElevenLabs client:', { error: speechError.message });
      }
    } else {
      logger.warn('⚠️ ElevenLabs API key not provided - enhanced TTS will be disabled');
    }

    // Optimized voice configuration for faster processing
    this.voiceConfig = {
      voice_id: process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB', // Adam voice
      model_id: 'eleven_turbo_v2', // Use turbo model for faster processing
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.8,
        style: 0.2,
        use_speaker_boost: true,
      },
    };

    // Active speech recognition sessions
    this.activeSessions = new Map();
  }

  /**
   * Start real-time speech recognition for a call
   * @param {string} callControlId - Telnyx call control ID
   * @param {Object} call - Call object from database
   * @param {Function} onTranscript - Callback for transcript results
   * @param {Function} onError - Callback for errors
   */
  async startRealTimeSpeechRecognition(
    callControlId,
    call,
    onTranscript,
    onError
  ) {
    try {
      // Check if Deepgram is available
      if (!this.deepgram) {
        logger.warn('⚠️ Deepgram not available - using fallback speech recognition');
        return { success: false, error: 'Deepgram API key not configured' };
      }

      logger.info(`🎙️ Starting Deepgram real-time speech recognition for call ${callControlId}`);

      // Create Deepgram live transcription with optimized settings
      const deepgramLive = this.deepgram.listen.live({
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        interim_results: false, // Only final results to reduce noise
        utterance_end_ms: 800, // Faster utterance detection
        vad_events: true,
        endpointing: 250, // Faster endpointing
        punctuate: true,
        diarize: false, // Disable for faster processing
        multichannel: false,
        sample_rate: 8000, // Phone quality
        channels: 1,
      });

      // Handle Deepgram events
      deepgramLive.on('open', () => {
        logger.info('✅ Deepgram connection opened');
      });

      deepgramLive.on('results', data => {
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript && transcript.trim() && data.is_final) {
          logger.info(`📝 Final transcript: "${transcript}"`);
          onTranscript(transcript);
        }
      });

      deepgramLive.on('error', error => {
        const speechError = handleSpeechError(error, { 
          operation: 'deepgram_stream',
          callControlId 
        });
        logger.error('❌ Deepgram error:', { error: speechError.message });
        onError(speechError);
      });

      deepgramLive.on('close', () => {
        logger.info('🔒 Deepgram connection closed');
      });

      // Store session for cleanup
      this.activeSessions.set(callControlId, {
        deepgramLive,
        call,
        startTime: Date.now(),
      });

      // Start Telnyx media streaming directly to Deepgram
      const streamResponse = await this.startTelnyxMediaStreamDirect(
        callControlId,
        deepgramLive
      );

      if (!streamResponse.success) {
        throw new Error(
          `Failed to start media stream: ${streamResponse.error}`
        );
      }

      return { success: true, sessionId: callControlId };
    } catch (error) {
      const speechError = handleSpeechError(error, { 
        operation: 'start_speech_recognition',
        callControlId 
      });
      logger.error('❌ Failed to start speech recognition:', { error: speechError.message });
      onError(speechError);
      return { success: false, error: speechError.message };
    }
  }

  /**
   * Start media streaming from Telnyx directly to Deepgram
   */
  async startTelnyxMediaStreamDirect(callControlId, deepgramLive) {
    try {
      const response = await axios.post(
        `https://api.telnyx.com/v2/calls/${callControlId}/actions/streaming_start`,
        {
          stream_url: `${process.env.BACKEND_URL}/api/calls/deepgram-stream`,
          stream_track: 'inbound_track', // Only customer audio
          enable_dialogflow_integration: false,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('✅ Telnyx media streaming started');
      return { success: true, data: response.data };
    } catch (error) {
      const apiError = handleApiError(error, { 
        operation: 'telnyx_media_stream',
        callControlId 
      });
      logger.error('❌ Telnyx media stream error:', { error: apiError.message });
      return { success: false, error: apiError.message };
    }
  }

  /**
   * Generate natural speech using ElevenLabs with optimizations
   * @param {string} text - Text to convert to speech
   * @param {string} callControlId - Call control ID for context
   */
  async generateSpeech(text, callControlId) {
    try {
      // Check if ElevenLabs is available
      if (!this.elevenlabs) {
        logger.warn('⚠️ ElevenLabs not available - falling back to Telnyx TTS');
        return { success: false, error: 'ElevenLabs not configured' };
      }

      logger.info(`🎤 Generating ElevenLabs speech for call ${callControlId}: "${text}"`);

      // Optimize text for faster processing
      const optimizedText = this.optimizeTextForSpeech(text);

      // Generate speech with ElevenLabs using optimized settings
      const audioResponse = await this.elevenlabs.textToSpeech.convert(
        this.voiceConfig.voice_id,
        {
          model_id: this.voiceConfig.model_id,
          text: optimizedText,
          voice_settings: this.voiceConfig.voice_settings,
          output_format: 'mp3_22050_32', // Optimized format for phone calls
        }
      );

      // Convert to buffer if needed
      let audioBuffer;
      if (audioResponse instanceof Buffer) {
        audioBuffer = audioResponse;
      } else if (audioResponse.arrayBuffer) {
        audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      } else {
        audioBuffer = Buffer.from(audioResponse);
      }

      return {
        success: true,
        audioBuffer,
        text: optimizedText,
        voiceId: this.voiceConfig.voice_id,
      };
    } catch (error) {
      const speechError = handleSpeechError(error, { 
        operation: 'elevenlabs_tts',
        callControlId,
        text 
      });
      logger.error('❌ ElevenLabs TTS error:', { error: speechError.message });
      return {
        success: false,
        error: speechError.message,
        fallbackText: text,
      };
    }
  }

  /**
   * Optimize text for faster speech processing
   */
  optimizeTextForSpeech(text) {
    // Keep text concise and natural
    let optimized = text;

    // Remove excessive punctuation that might slow processing
    optimized = optimized.replace(/\.{2,}/g, '.');
    optimized = optimized.replace(/\?{2,}/g, '?');
    optimized = optimized.replace(/!{2,}/g, '!');

    // Ensure proper sentence structure
    optimized = optimized.trim();
    if (optimized && !optimized.match(/[.!?]$/)) {
      optimized += '.';
    }

    return optimized;
  }

  /**
   * Speak text using optimized ElevenLabs + Telnyx pipeline
   */
  async speakText(callControlId, text) {
    try {
      logger.info(`🎤 Starting optimized speech for call ${callControlId}: "${text}"`);

      // Generate speech with ElevenLabs
      const speechResult = await this.generateSpeech(text, callControlId);

      if (!speechResult.success) {
        logger.info('⚠️ ElevenLabs failed, using Telnyx fallback');
        return this.speakWithTelnyxTTS(callControlId, text);
      }

      // Use Telnyx to play the ElevenLabs audio with optimized settings
      const response = await axios.post(
        `https://api.telnyx.com/v2/calls/${callControlId}/actions/playback_start`,
        {
          audio_url: `data:audio/mpeg;base64,${speechResult.audioBuffer.toString('base64')}`,
          overlay: false,
          target_legs: 'self', // Only play to the caller
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      logger.info('✅ ElevenLabs speech playback started successfully');
      return { success: true, data: response.data };
    } catch (error) {
      const speechError = handleSpeechError(error, { 
        operation: 'speech_playback',
        callControlId 
      });
      logger.error('❌ Speech playback error:', { error: speechError.message });
      logger.info('🔄 Falling back to Telnyx TTS');
      return this.speakWithTelnyxTTS(callControlId, text);
    }
  }

  /**
   * Fallback to optimized Telnyx TTS
   */
  async speakWithTelnyxTTS(callControlId, text) {
    try {
      const optimizedText = this.optimizeTextForSpeech(text);

      const response = await axios.post(
        `https://api.telnyx.com/v2/calls/${callControlId}/actions/speak`,
        {
          text: optimizedText,
          voice: 'male',
          language: 'en-US',
          service_level: 'premium',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000, // 8 second timeout
        }
      );

      logger.info('✅ Telnyx TTS successful');
      return { success: true, data: response.data };
    } catch (error) {
      const speechError = handleSpeechError(error, { 
        operation: 'telnyx_tts_fallback',
        callControlId,
        text 
      });
      logger.error('❌ Telnyx TTS fallback error:', { error: speechError.message });
      return { success: false, error: speechError.message };
    }
  }

  /**
   * Stop speech recognition for a call
   */
  async stopSpeechRecognition(callControlId) {
    try {
      const session = this.activeSessions.get(callControlId);

      if (session) {
        // Close Deepgram connection
        if (session.deepgramLive) {
          session.deepgramLive.finish();
        }

        // Stop Telnyx media streaming
        try {
          await axios.post(
            `https://api.telnyx.com/v2/calls/${callControlId}/actions/streaming_stop`,
            {},
            {
              headers: {
                Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (stopError) {
          const apiError = handleApiError(stopError, { 
            operation: 'stop_telnyx_stream',
            callControlId 
          });
          logger.warn('⚠️ Error stopping Telnyx stream:', { error: apiError.message });
        }

        // Remove session
        this.activeSessions.delete(callControlId);

        logger.info(`✅ Speech recognition stopped for call ${callControlId}`);
      }

      return { success: true };
    } catch (error) {
      const speechError = handleSpeechError(error, { 
        operation: 'stop_speech_recognition',
        callControlId 
      });
      logger.error('❌ Error stopping speech recognition:', { error: speechError.message });
      return { success: false, error: speechError.message };
    }
  }

  /**
   * Clean up all active sessions
   */
  async cleanup() {
    logger.info('🧹 Cleaning up all speech recognition sessions');

    for (const [callControlId] of this.activeSessions) {
      await this.stopSpeechRecognition(callControlId);
    }

    this.activeSessions.clear();
  }

  /**
   * Process audio stream from Telnyx
   */
  processAudioStream(callControlId, audioData) {
    const session = this.activeSessions.get(callControlId);
    if (session && session.deepgramLive) {
      try {
        // Send audio data to Deepgram
        session.deepgramLive.send(audioData);
      } catch (error) {
        const speechError = handleSpeechError(error, { 
          operation: 'send_audio_to_deepgram',
          callControlId 
        });
        logger.error('❌ Error sending audio to Deepgram:', { error: speechError.message });
      }
    }
  }
}

module.exports = new SpeechService();
