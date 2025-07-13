const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['ai', 'human'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  audioUrl: {
    type: String // URL to audio recording if available
  }
});

const callSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
  },
  leadName: {
    type: String,
    default: 'Unknown Lead'
  },
  callId: {
    type: String, // Telnyx call ID
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'answered', 'in_progress', 'completed', 'failed', 'busy', 'no_answer'],
    default: 'initiated'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  conversation: [conversationSchema],
  outcome: {
    type: String,
    enum: ['qualified', 'not_qualified', 'callback_requested', 'meeting_booked', 'no_answer', 'not_interested', 'incomplete', 'engaged'],
    default: 'incomplete'
  },
  qualificationScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  notes: {
    type: String
  },
  meetingBooked: {
    type: Boolean,
    default: false
  },
  meetingDetails: {
    scheduledTime: Date,
    meetingLink: String,
    attendees: [String]
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  recordingUrl: {
    type: String // URL to call recording
  },
  transcription: {
    type: String // Full call transcription
  },
  aiPrompt: {
    type: String, // The AI prompt/script used for this call
    default: 'You are a professional sales representative. Be conversational, friendly, and focus on qualifying the lead.'
  },
  metadata: {
    type: Map,
    of: String // Additional metadata like campaign ID, lead source, etc.
  }
}, {
  timestamps: true
});

// Indexes for better query performance
callSchema.index({ userId: 1, createdAt: -1 });
callSchema.index({ phoneNumber: 1 });
callSchema.index({ status: 1 });
callSchema.index({ outcome: 1 });
callSchema.index({ callId: 1 });

// Calculate duration when call ends
callSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

// Virtual for formatted duration
callSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return '0:00';
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for call success rate
callSchema.virtual('isSuccessful').get(function() {
  return ['qualified', 'meeting_booked', 'callback_requested'].includes(this.outcome);
});

// Static method to get call statistics
callSchema.statics.getCallStats = async function(userId, dateRange = {}) {
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (dateRange.start || dateRange.end) {
    matchStage.createdAt = {};
    if (dateRange.start) matchStage.createdAt.$gte = new Date(dateRange.start);
    if (dateRange.end) matchStage.createdAt.$lte = new Date(dateRange.end);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        completedCalls: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        qualifiedLeads: {
          $sum: { $cond: [{ $eq: ['$outcome', 'qualified'] }, 1, 0] }
        },
        meetingsBooked: {
          $sum: { $cond: [{ $eq: ['$outcome', 'meeting_booked'] }, 1, 0] }
        },
        totalDuration: { $sum: '$duration' },
        avgQualificationScore: { $avg: '$qualificationScore' }
      }
    }
  ]);

  return stats[0] || {
    totalCalls: 0,
    completedCalls: 0,
    qualifiedLeads: 0,
    meetingsBooked: 0,
    totalDuration: 0,
    avgQualificationScore: 0
  };
};

// Instance method to add conversation message
callSchema.methods.addConversationMessage = function(role, message, audioUrl = null) {
  this.conversation.push({
    role,
    message,
    audioUrl,
    timestamp: new Date()
  });
  return this.save();
};

// Instance method to update call status
callSchema.methods.updateStatus = function(status, additionalData = {}) {
  this.status = status;
  
  if (status === 'completed' || status === 'failed') {
    this.endTime = new Date();
  }
  
  Object.assign(this, additionalData);
  return this.save();
};

module.exports = mongoose.model('Call', callSchema); 