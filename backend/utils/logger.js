const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple console logger to replace Winston
class SimpleLogger {
  constructor(service = 'app') {
    this.service = service;
  }

  _log(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${level}] [${this.service}]: ${message}`;
    
    // Console output
    if (process.env.NODE_ENV !== 'production') {
      const colors = {
        error: '\x1b[31m', // red
        warn: '\x1b[33m',  // yellow
        info: '\x1b[36m',  // cyan
        debug: '\x1b[35m'  // magenta
      };
      console.log(`${colors[level] || ''}${logMessage}\x1b[0m`);
    } else {
      console.log(logMessage);
    }
    
    // File output for errors
    if (level === 'error') {
      const errorLogFile = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
      fs.appendFileSync(errorLogFile, logMessage + '\n');
    }
  }

  error(message) {
    this._log('error', message);
  }

  warn(message) {
    this._log('warn', message);
  }

  info(message) {
    this._log('info', message);
  }

  debug(message) {
    if (process.env.NODE_ENV !== 'production') {
      this._log('debug', message);
    }
  }
}

// Create main logger
const logger = new SimpleLogger('outbound-ai-backend');

// Create specialized loggers for different services
const createServiceLogger = (serviceName) => {
  return new SimpleLogger(serviceName);
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
  
  // Helper methods - ALL STRING ONLY
  logApiRequest: (req, res, next) => {
    const start = Date.now();
    const apiLogger = createServiceLogger('api');
    
    apiLogger.info(`API Request | method: ${req.method} | url: ${req.url} | ip: ${req.ip} | userAgent: ${req.get('User-Agent')} | requestId: ${req.headers['x-request-id']}`);
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      apiLogger.info(`API Response | method: ${req.method} | url: ${req.url} | statusCode: ${res.statusCode} | duration: ${duration}ms | requestId: ${req.headers['x-request-id']}`);
    });
    
    if (next) next();
  },
  
  logCallEvent: (event, callId, data = {}) => {
    const callLogger = createServiceLogger('calls');
    const dataStr = Object.keys(data).length > 0 ? ` | data: ${JSON.stringify(data)}` : '';
    callLogger.info(`Call Event: ${event} | callId: ${callId}${dataStr}`);
  },
  
  logError: (error, context = '') => {
    // Only log safe string information to avoid circular references
    const errorMessage = error.message || 'Unknown error';
    const errorName = error.name || 'Error';
    const errorStack = error.stack ? error.stack.split('\n')[0] : 'No stack trace';
    
    // Use the context string directly if provided
    const contextStr = context ? ` | ${context}` : '';
    
    logger.error(`Application Error: ${errorName} - ${errorMessage}${contextStr} | Stack: ${errorStack}`);
  },
  
  logSpeechEvent: (event, callId, data = {}) => {
    const speechLogger = createServiceLogger('speech');
    const dataStr = Object.keys(data).length > 0 ? ` | data: ${JSON.stringify(data)}` : '';
    speechLogger.info(`Speech Event: ${event} | callId: ${callId}${dataStr}`);
  },
  
  logConversationEvent: (event, callId, data = {}) => {
    const conversationLogger = createServiceLogger('conversation');
    const dataStr = Object.keys(data).length > 0 ? ` | data: ${JSON.stringify(data)}` : '';
    conversationLogger.info(`Conversation Event: ${event} | callId: ${callId}${dataStr}`);
  },
  
  logWorkerEvent: (event, data = {}) => {
    const workerLogger = createServiceLogger('worker');
    const dataStr = Object.keys(data).length > 0 ? ` | data: ${JSON.stringify(data)}` : '';
    workerLogger.info(`Worker Event: ${event}${dataStr}`);
  },
  
  logDatabaseEvent: (event, data = {}) => {
    const dbLogger = createServiceLogger('database');
    const dataStr = Object.keys(data).length > 0 ? ` | data: ${JSON.stringify(data)}` : '';
    dbLogger.info(`Database Event: ${event}${dataStr}`);
  },
  
  logSecurityEvent: (event, data = {}) => {
    const securityLogger = createServiceLogger('security');
    const dataStr = Object.keys(data).length > 0 ? ` | data: ${JSON.stringify(data)}` : '';
    securityLogger.warn(`Security Event: ${event}${dataStr}`);
  }
};

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message} | stack: ${error.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason} | promise: ${promise.toString()}`);
});

module.exports = loggers; 