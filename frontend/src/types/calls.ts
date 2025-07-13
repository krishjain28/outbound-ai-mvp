// Call Status Types
export type CallStatus = 
  | 'initiating'
  | 'ringing'
  | 'answered'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'no-answer'
  | 'busy'
  | 'cancelled';

// Call Direction
export type CallDirection = 'outbound' | 'inbound';

// Call Priority
export type CallPriority = 'low' | 'medium' | 'high' | 'urgent';

// Call Outcome
export type CallOutcome = 
  | 'qualified'
  | 'not-interested'
  | 'call-back'
  | 'wrong-number'
  | 'no-answer'
  | 'busy'
  | 'voicemail'
  | 'other';

// Lead Information
export interface Lead {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  title?: string;
  industry?: string;
  source?: string;
  notes?: string;
  priority: CallPriority;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  lastContacted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Call Record
export interface Call {
  id: string;
  callId: string;
  leadId: string;
  lead: Lead;
  status: CallStatus;
  direction: CallDirection;
  phoneNumber: string;
  duration?: number; // in seconds
  startTime: Date;
  endTime?: Date;
  outcome?: CallOutcome;
  notes?: string;
  recordingUrl?: string;
  transcript?: string;
  aiResponse?: string;
  customerResponse?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Call Statistics
export interface CallStats {
  totalCalls: number;
  answeredCalls: number;
  completedCalls: number;
  failedCalls: number;
  averageDuration: number;
  successRate: number;
  totalDuration: number;
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
}

// Call Initiation Request
export interface InitiateCallRequest {
  leadId: string;
  phoneNumber: string;
  script?: string;
  priority?: CallPriority;
  metadata?: Record<string, unknown>;
}

// Call Initiation Response
export interface InitiateCallResponse {
  success: boolean;
  message: string;
  data?: {
    call: Call;
    callControlId: string;
    status: CallStatus;
  };
}

// Call Update Request
export interface UpdateCallRequest {
  status?: CallStatus;
  outcome?: CallOutcome;
  notes?: string;
  duration?: number;
  transcript?: string;
  aiResponse?: string;
  customerResponse?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  tags?: string[];
}

// Call List Response
export interface CallListResponse {
  success: boolean;
  message: string;
  data?: {
    calls: Call[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Call Filter Options
export interface CallFilterOptions {
  status?: CallStatus[];
  direction?: CallDirection;
  outcome?: CallOutcome[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  leadId?: string;
  phoneNumber?: string;
  tags?: string[];
}

// Call Search Options
export interface CallSearchOptions {
  query: string;
  fields?: ('lead.name' | 'lead.phoneNumber' | 'lead.email' | 'notes' | 'transcript')[];
  limit?: number;
  offset?: number;
}

// Real-time Call Events
export interface CallEvent {
  type: 'call.started' | 'call.answered' | 'call.ended' | 'call.failed' | 'transcript.updated';
  callId: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

// Call Recording
export interface CallRecording {
  id: string;
  callId: string;
  url: string;
  duration: number;
  format: 'mp3' | 'wav' | 'm4a';
  size: number; // in bytes
  createdAt: Date;
}

// Call Transcript
export interface CallTranscript {
  id: string;
  callId: string;
  segments: TranscriptSegment[];
  fullText: string;
  confidence: number;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

// Transcript Segment
export interface TranscriptSegment {
  id: string;
  speaker: 'customer' | 'ai' | 'system';
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  confidence: number;
  isFinal: boolean;
}

// AI Conversation Context
export interface ConversationContext {
  callId: string;
  lead: Lead;
  conversationHistory: TranscriptSegment[];
  currentStage: 'introduction' | 'qualification' | 'objection-handling' | 'closing';
  aiResponses: string[];
  customerResponses: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  nextAction?: string;
  metadata?: Record<string, unknown>;
} 