const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const validator = require('validator');

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// Different rate limits for different endpoints
const rateLimits = {
  // General API rate limit
  general: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests per window
    'Too many requests from this IP. Please try again later.'
  ),

  // Authentication endpoints - stricter
  auth: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 requests per window
    'Too many authentication attempts. Please try again later.'
  ),

  // Call initiation - moderate
  calls: createRateLimit(
    60 * 1000, // 1 minute
    10, // 10 calls per minute
    'Too many call requests. Please wait before making another call.'
  ),

  // Webhook endpoints - higher limit
  webhooks: createRateLimit(
    60 * 1000, // 1 minute
    1000, // 1000 requests per minute
    'Webhook rate limit exceeded.'
  ),
};

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: [
        "'self'",
        'https://api.openai.com',
        'https://api.elevenlabs.io',
        'https://api.deepgram.com',
        'https://api.telnyx.com',
      ],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://outbound-ai-frontend.vercel.app',
      'https://outbound-ai.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
    ];

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
};

// Input validation middleware
const validateInput = (req, res, next) => {
  try {
    // Sanitize all string inputs
    const sanitizeObject = obj => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = validator.escape(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };

    if (req.body) {
      sanitizeObject(req.body);
    }

    if (req.query) {
      sanitizeObject(req.query);
    }

    next();
  } catch (error) {
    console.error('Input validation error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid input data',
    });
  }
};

// MongoDB injection protection
const mongoSanitize = (req, res, next) => {
  try {
    const sanitize = obj => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
          } else {
            sanitize(obj[key]);
          }
        }
      }
    };

    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);

    next();
  } catch (error) {
    console.error('MongoDB sanitization error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid request format',
    });
  }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    };

    // Log different levels based on status code
    if (res.statusCode >= 400) {
      console.error('Request Error:', logData);
    } else if (res.statusCode >= 300) {
      console.warn('Request Redirect:', logData);
    } else {
      console.log('Request Success:', logData);
    }
  });

  next();
};

// Error handling middleware
const errorHandler = (err, req, res) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDevelopment && { error: err.message, stack: err.stack }),
  });
};

// Health check middleware
const healthCheck = (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health') {
    return res.json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
    });
  }
  next();
};

// API key validation for external services
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required',
    });
  }

  // Validate API key format (basic validation)
  if (apiKey.length < 20 || !apiKey.startsWith('sk-')) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key format',
    });
  }

  next();
};

// Production security middleware stack
const productionSecurity = [
  securityHeaders,
  cors(corsOptions),
  rateLimits.general,
  validateInput,
  mongoSanitize,
  requestLogger,
  healthCheck,
];

module.exports = {
  rateLimits,
  securityHeaders,
  corsOptions,
  validateInput,
  mongoSanitize,
  requestLogger,
  errorHandler,
  healthCheck,
  validateApiKey,
  productionSecurity,
};
