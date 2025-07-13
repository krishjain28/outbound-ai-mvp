const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');

// Custom format for better readability
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let logMessage = `${timestamp} [${level}]`;
    
    if (service) {
      logMessage += ` [${service}]`;
    }
    
    logMessage += `: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// Create transports
const transports = [];

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
}

// File transports for all environments
transports.push(
  // Error logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: customFormat,
    maxSize: '20m',
    maxFiles: '14d',
    auditFile: path.join(logsDir, 'error-audit.json')
  }),
  
  // Combined logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: customFormat,
    maxSize: '20m',
    maxFiles: '14d',
    auditFile: path.join(logsDir, 'combined-audit.json')
  }),
  
  // API logs for call-related activities
  new DailyRotateFile({
    filename: path.join(logsDir, 'api-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: customFormat,
    maxSize: '20m',
    maxFiles: '30d',
    auditFile: path.join(logsDir, 'api-audit.json'),
    level: 'info'
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: customFormat,
  defaultMeta: { service: 'outbound-ai-backend' },
  transports,
  exitOnError: false
});

// Create specialized loggers for different services
const createServiceLogger = (serviceName) => {
  return logger.child({ service: serviceName });
};

// Helper functions for common logging patterns
const loggers = {
  // Main application logger
  app: logger,
  
  // Service-specific loggers
  auth: createServiceLogger('auth'),
  calls: createServiceLogger('calls'),
  speech: createServiceLogger('speech'),
  conversation: createServiceLogger('conversation'),
  worker: createServiceLogger('worker'),
  database: createServiceLogger('database'),
  api: createServiceLogger('api'),
  security: createServiceLogger('security'),
  monitoring: createServiceLogger('monitoring'),
  
  // Helper methods
  logApiRequest: (req, res, next) => {
    const start = Date.now();
    const apiLogger = createServiceLogger('api');
    
    apiLogger.info('API Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.headers['x-request-id']
    });
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      apiLogger.info('API Response', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        requestId: req.headers['x-request-id']
      });
    });
    
    if (next) next();
  },
  
  logCallEvent: (event, callId, data = {}) => {
    const callLogger = createServiceLogger('calls');
    callLogger.info(`Call Event: ${event}`, {
      callId,
      event,
      ...data
    });
  },
  
  logError: (error, context = {}) => {
    logger.error('Application Error', {
      error: error.message,
      stack: error.stack,
      ...context
    });
  },
  
  logSpeechEvent: (event, callId, data = {}) => {
    const speechLogger = createServiceLogger('speech');
    speechLogger.info(`Speech Event: ${event}`, {
      callId,
      event,
      ...data
    });
  },
  
  logConversationEvent: (event, callId, data = {}) => {
    const conversationLogger = createServiceLogger('conversation');
    conversationLogger.info(`Conversation Event: ${event}`, {
      callId,
      event,
      ...data
    });
  },
  
  logWorkerEvent: (event, data = {}) => {
    const workerLogger = createServiceLogger('worker');
    workerLogger.info(`Worker Event: ${event}`, {
      event,
      ...data
    });
  },
  
  logDatabaseEvent: (event, data = {}) => {
    const dbLogger = createServiceLogger('database');
    dbLogger.info(`Database Event: ${event}`, {
      event,
      ...data
    });
  },
  
  logSecurityEvent: (event, data = {}) => {
    const securityLogger = createServiceLogger('security');
    securityLogger.warn(`Security Event: ${event}`, {
      event,
      ...data
    });
  }
};

// Handle uncaught exceptions and rejections
logger.exceptions.handle(
  new winston.transports.File({ 
    filename: path.join(logsDir, 'exceptions.log'),
    format: customFormat
  })
);

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason.toString(),
    promise: promise.toString()
  });
});

module.exports = loggers; 