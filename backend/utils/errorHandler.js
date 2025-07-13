const { logError, logSecurityEvent } = require('./logger');

// Error types for classification
const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  DATABASE: 'DATABASE_ERROR',
  EXTERNAL_API: 'EXTERNAL_API_ERROR',
  SPEECH: 'SPEECH_ERROR',
  CONVERSATION: 'CONVERSATION_ERROR',
  WORKER: 'WORKER_ERROR',
  NETWORK: 'NETWORK_ERROR',
  CONFIGURATION: 'CONFIGURATION_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// HTTP status codes mapping
const StatusCodes = {
  [ErrorTypes.VALIDATION]: 400,
  [ErrorTypes.AUTHENTICATION]: 401,
  [ErrorTypes.AUTHORIZATION]: 403,
  [ErrorTypes.DATABASE]: 500,
  [ErrorTypes.EXTERNAL_API]: 502,
  [ErrorTypes.SPEECH]: 500,
  [ErrorTypes.CONVERSATION]: 500,
  [ErrorTypes.WORKER]: 500,
  [ErrorTypes.NETWORK]: 503,
  [ErrorTypes.CONFIGURATION]: 500,
  [ErrorTypes.RATE_LIMIT]: 429,
  [ErrorTypes.TIMEOUT]: 408,
  [ErrorTypes.UNKNOWN]: 500
};

// Custom error classes
class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, statusCode = null, context = {}) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.statusCode = statusCode || StatusCodes[type] || 500;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.isOperational = true; // Distinguish operational errors from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, context = {}) {
    super(message, ErrorTypes.VALIDATION, StatusCodes[ErrorTypes.VALIDATION], context);
  }
}

class AuthenticationError extends AppError {
  constructor(message, context = {}) {
    super(message, ErrorTypes.AUTHENTICATION, StatusCodes[ErrorTypes.AUTHENTICATION], context);
  }
}

class AuthorizationError extends AppError {
  constructor(message, context = {}) {
    super(message, ErrorTypes.AUTHORIZATION, StatusCodes[ErrorTypes.AUTHORIZATION], context);
  }
}

class DatabaseError extends AppError {
  constructor(message, context = {}) {
    super(message, ErrorTypes.DATABASE, StatusCodes[ErrorTypes.DATABASE], context);
  }
}

class ExternalApiError extends AppError {
  constructor(message, context = {}) {
    super(message, ErrorTypes.EXTERNAL_API, StatusCodes[ErrorTypes.EXTERNAL_API], context);
  }
}

class SpeechError extends AppError {
  constructor(message, context = {}) {
    super(message, ErrorTypes.SPEECH, StatusCodes[ErrorTypes.SPEECH], context);
  }
}

class ConversationError extends AppError {
  constructor(message, context = {}) {
    super(message, ErrorTypes.CONVERSATION, StatusCodes[ErrorTypes.CONVERSATION], context);
  }
}

class WorkerError extends AppError {
  constructor(message, context = {}) {
    super(message, ErrorTypes.WORKER, StatusCodes[ErrorTypes.WORKER], context);
  }
}

class NetworkError extends AppError {
  constructor(message, context = {}) {
    super(message, ErrorTypes.NETWORK, StatusCodes[ErrorTypes.NETWORK], context);
  }
}

class ConfigurationError extends AppError {
  constructor(message, context = {}) {
    super(message, ErrorTypes.CONFIGURATION, StatusCodes[ErrorTypes.CONFIGURATION], context);
  }
}

class RateLimitError extends AppError {
  constructor(message, context = {}) {
    super(message, ErrorTypes.RATE_LIMIT, StatusCodes[ErrorTypes.RATE_LIMIT], context);
  }
}

class TimeoutError extends AppError {
  constructor(message, context = {}) {
    super(message, ErrorTypes.TIMEOUT, StatusCodes[ErrorTypes.TIMEOUT], context);
  }
}

// Error classification function
function classifyError(error) {
  if (error instanceof AppError) {
    return error.type;
  }
  
  // Classify based on error message or properties
  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';
  
  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorTypes.VALIDATION;
  }
  
  if (message.includes('unauthorized') || message.includes('authentication')) {
    return ErrorTypes.AUTHENTICATION;
  }
  
  if (message.includes('forbidden') || message.includes('permission')) {
    return ErrorTypes.AUTHORIZATION;
  }
  
  if (message.includes('database') || message.includes('mongodb') || message.includes('connection')) {
    return ErrorTypes.DATABASE;
  }
  
  if (message.includes('api') || message.includes('external') || message.includes('third-party')) {
    return ErrorTypes.EXTERNAL_API;
  }
  
  if (message.includes('speech') || message.includes('audio') || message.includes('deepgram') || message.includes('elevenlabs')) {
    return ErrorTypes.SPEECH;
  }
  
  if (message.includes('conversation') || message.includes('ai') || message.includes('openai')) {
    return ErrorTypes.CONVERSATION;
  }
  
  if (message.includes('worker') || message.includes('queue')) {
    return ErrorTypes.WORKER;
  }
  
  if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
    return ErrorTypes.NETWORK;
  }
  
  if (message.includes('config') || message.includes('environment')) {
    return ErrorTypes.CONFIGURATION;
  }
  
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return ErrorTypes.RATE_LIMIT;
  }
  
  if (message.includes('timeout') || code === 'timeout') {
    return ErrorTypes.TIMEOUT;
  }
  
  return ErrorTypes.UNKNOWN;
}

// Enhanced error logging function
function logErrorWithContext(error, context = {}) {
  const errorType = classifyError(error);
  const isOperational = error instanceof AppError && error.isOperational;
  
  // Create context string instead of object
  let contextStr = `errorType: ${errorType} | isOperational: ${isOperational} | statusCode: ${error.statusCode || StatusCodes[errorType]}`;
  
  // Add request context if available
  if (context.req) {
    contextStr += ` | method: ${context.req.method} | url: ${context.req.url} | ip: ${context.req.ip} | userAgent: ${context.req.get('User-Agent')} | userId: ${context.req.user?.id}`;
  }
  
  // Add other context properties
  Object.keys(context).forEach(key => {
    if (key !== 'req' && typeof context[key] === 'string' || typeof context[key] === 'number' || typeof context[key] === 'boolean') {
      contextStr += ` | ${key}: ${context[key]}`;
    }
  });
  
  // Log security events for auth/authorization errors
  if (errorType === ErrorTypes.AUTHENTICATION || errorType === ErrorTypes.AUTHORIZATION) {
    logSecurityEvent(`Security Error: ${errorType} - ${error.message} | ${contextStr}`);
  }
  
  logError(error, contextStr);
}

// Express error handling middleware
function errorHandler(err, req, res, next) {
  const errorType = classifyError(err);
  const statusCode = err.statusCode || StatusCodes[errorType] || 500;
  
  // Log the error with request context
  logErrorWithContext(err, { req });
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = {
    error: {
      type: errorType,
      message: isDevelopment ? err.message : 'An error occurred',
      ...(isDevelopment && { stack: err.stack })
    },
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id']
  };
  
  res.status(statusCode).json(errorResponse);
}

// Async error wrapper for route handlers
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Error handling for promises
function handlePromiseError(error, context = {}) {
  logErrorWithContext(error, context);
  return Promise.reject(error);
}

// Error handling for worker processes
function handleWorkerError(error, workerContext = {}) {
  const workerError = new WorkerError(error.message, {
    originalError: error,
    ...workerContext
  });
  
  logErrorWithContext(workerError, workerContext);
  return workerError;
}

// Error handling for external API calls
function handleApiError(error, apiContext = {}) {
  const apiError = new ExternalApiError(error.message, {
    originalError: error,
    ...apiContext
  });
  
  logErrorWithContext(apiError, apiContext);
  return apiError;
}

// Error handling for database operations
function handleDatabaseError(error, dbContext = {}) {
  const dbError = new DatabaseError(error.message, {
    originalError: error,
    ...dbContext
  });
  
  logErrorWithContext(dbError, dbContext);
  return dbError;
}

// Error handling for speech processing
function handleSpeechError(error, speechContext = {}) {
  const speechError = new SpeechError(error.message, {
    originalError: error,
    ...speechContext
  });
  
  logErrorWithContext(speechError, speechContext);
  return speechError;
}

// Error handling for conversation processing
function handleConversationError(error, conversationContext = {}) {
  const conversationError = new ConversationError(error.message, {
    originalError: error,
    ...conversationContext
  });
  
  logErrorWithContext(conversationError, conversationContext);
  return conversationError;
}

// Validation helper
function validateRequired(data, requiredFields, context = {}) {
  const missing = requiredFields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`, {
      missingFields: missing,
      providedData: Object.keys(data),
      ...context
    });
  }
}

// Configuration validation
function validateConfiguration(config, requiredConfig, context = {}) {
  const missing = requiredConfig.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new ConfigurationError(`Missing required configuration: ${missing.join(', ')}`, {
      missingConfig: missing,
      availableConfig: Object.keys(config),
      ...context
    });
  }
}

module.exports = {
  // Error types
  ErrorTypes,
  StatusCodes,
  
  // Custom error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  ExternalApiError,
  SpeechError,
  ConversationError,
  WorkerError,
  NetworkError,
  ConfigurationError,
  RateLimitError,
  TimeoutError,
  
  // Utility functions
  classifyError,
  logErrorWithContext,
  errorHandler,
  asyncHandler,
  handlePromiseError,
  handleWorkerError,
  handleApiError,
  handleDatabaseError,
  handleSpeechError,
  handleConversationError,
  validateRequired,
  validateConfiguration
}; 