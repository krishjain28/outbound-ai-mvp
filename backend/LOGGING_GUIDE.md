# Logging Guide for Outbound AI Backend

## Overview

This application uses **Winston** for comprehensive logging with structured log formats, multiple transports, and environment-based configuration.

## Logger Configuration

### Location
- **Logger Utility**: `utils/logger.js`
- **Log Files**: `logs/` directory
- **Configuration**: Environment-based with development console output

### Log Levels (in order of severity)
1. `error` - Application errors, exceptions
2. `warn` - Warning conditions, fallbacks
3. `info` - General information, API requests
4. `debug` - Detailed debugging information

## Available Loggers

### Service-Specific Loggers
```javascript
const { 
  app,           // Main application logger
  auth,          // Authentication operations
  calls,         // Call management
  speech,        // Speech processing
  conversation,  // AI conversation handling
  worker,        // Background worker operations
  database,      // Database operations
  api,           // API request/response
  security,      // Security events
  monitoring     // Performance monitoring
} = require('../utils/logger');
```

### Helper Functions
```javascript
const { 
  logApiRequest,      // Middleware for API logging
  logCallEvent,       // Log call-related events
  logError,           // Log application errors
  logSpeechEvent,     // Log speech processing events
  logConversationEvent, // Log conversation events
  logWorkerEvent,     // Log worker events
  logDatabaseEvent,   // Log database events
  logSecurityEvent    // Log security events
} = require('../utils/logger');
```

## Usage Examples

### Basic Logging
```javascript
const { auth: logger } = require('../utils/logger');

// Info level
logger.info('User login successful', { 
  userId: user.id, 
  email: user.email,
  ip: req.ip 
});

// Error level
logger.error('Login failed', { 
  error: error.message, 
  stack: error.stack,
  email: req.body.email,
  ip: req.ip 
});

// Warning level
logger.warn('Rate limit exceeded', { 
  ip: req.ip, 
  path: req.path,
  timestamp: new Date().toISOString()
});
```

### Event-Specific Logging
```javascript
const { logCallEvent, logSpeechEvent } = require('../utils/logger');

// Log call events
logCallEvent('call_initiated', callId, { 
  phoneNumber: '+1234567890',
  leadName: 'John Doe' 
});

// Log speech events
logSpeechEvent('speech_recognition_started', callId, { 
  provider: 'deepgram',
  language: 'en-US' 
});
```

### API Request Logging
```javascript
const { logApiRequest } = require('../utils/logger');

// Use as middleware
app.use('/api', logApiRequest);
```

### Error Handling
```javascript
const { logError } = require('../utils/logger');

try {
  // Some operation
} catch (error) {
  logError(error, { 
    context: 'user_registration',
    userId: req.user?.id,
    ip: req.ip 
  });
}
```

## Log Files Structure

### File Types
- **`combined-YYYY-MM-DD.log`** - All log levels
- **`error-YYYY-MM-DD.log`** - Error level only
- **`api-YYYY-MM-DD.log`** - API request/response logs
- **`exceptions.log`** - Uncaught exceptions

### File Rotation
- **Max Size**: 20MB per file
- **Retention**: 14 days for combined/error, 30 days for API
- **Compression**: Automatic compression of old files

## Environment Configuration

### Development
- Console output with colors
- Debug level logging
- Pretty-printed JSON in files

### Production
- File logging only
- Info level logging
- Structured JSON format
- Console statements treated as errors by ESLint

### Environment Variables
```bash
# Optional: Set log level (defaults to 'info' in production, 'debug' in development)
LOG_LEVEL=debug

# Environment detection
NODE_ENV=production
```

## Best Practices

### 1. Use Structured Logging
```javascript
// Good
logger.info('User action completed', { 
  action: 'profile_update',
  userId: user.id,
  changes: ['email', 'name'],
  duration: '150ms'
});

// Bad
logger.info(`User ${user.id} updated profile with email and name in 150ms`);
```

### 2. Include Context
Always include relevant context like:
- User ID
- IP address
- Request ID
- Call ID
- Timestamps
- Error stacks

### 3. Use Appropriate Log Levels
- **Error**: System errors, exceptions, failures
- **Warn**: Recoverable issues, fallbacks, deprecated usage
- **Info**: Normal operations, API requests, business events
- **Debug**: Detailed debugging information

### 4. Avoid Sensitive Information
Never log:
- Passwords
- API keys
- Personal information (mask phone numbers, emails)
- Credit card information

```javascript
// Good
logger.info('User login attempt', { 
  email: email.replace(/(.{2}).*@/, '$1***@'),
  ip: req.ip 
});

// Bad
logger.info('User login attempt', { 
  email: email,
  password: password 
});
```

## Migration from Console Statements

### Before (Console)
```javascript
console.log('User logged in:', user.email);
console.error('Database error:', error);
console.warn('Rate limit exceeded for IP:', req.ip);
```

### After (Winston)
```javascript
const { auth: logger } = require('../utils/logger');

logger.info('User logged in', { 
  userId: user.id,
  email: user.email.replace(/(.{2}).*@/, '$1***@'),
  ip: req.ip 
});

logger.error('Database error', { 
  error: error.message,
  stack: error.stack,
  operation: 'user_login' 
});

logger.warn('Rate limit exceeded', { 
  ip: req.ip,
  path: req.path,
  userAgent: req.get('User-Agent') 
});
```

## Monitoring and Alerting

### Log Analysis
Use tools like:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Splunk**
- **Datadog**
- **New Relic**

### Key Metrics to Monitor
- Error rates by service
- API response times
- Call success/failure rates
- Authentication failures
- Rate limit violations

### Alert Conditions
- High error rates (>5% in 5 minutes)
- Authentication failures (>10 in 1 minute)
- API response times (>2 seconds average)
- Disk space for log files

## Troubleshooting

### Common Issues

#### 1. Log Files Not Created
- Check file permissions in `logs/` directory
- Verify Winston configuration in `utils/logger.js`
- Check disk space

#### 2. Performance Impact
- Adjust log levels in production
- Monitor file sizes and rotation
- Consider async logging for high-volume applications

#### 3. Missing Context
- Ensure all loggers include relevant metadata
- Use correlation IDs for request tracking
- Include timestamps and service names

### Debug Commands
```bash
# Check log files
ls -la logs/

# Monitor live logs
tail -f logs/combined-$(date +%Y-%m-%d).log

# Search for errors
grep -n "error" logs/combined-$(date +%Y-%m-%d).log

# Check log file sizes
du -h logs/
```

## ESLint Configuration

Console statements are:
- **Warnings** in development
- **Errors** in production (will fail builds)

This enforces proper logging practices across environments. 