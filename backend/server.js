const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Import logging utilities
const { app: logger, database: dbLogger, worker: workerLogger } = require('./utils/logger');

// Import error handling utilities
const { 
  errorHandler: globalErrorHandler, 
  asyncHandler, 
  handleDatabaseError
} = require('./utils/errorHandler');

// Import production middleware
const {
  productionSecurity,
  rateLimits,
} = require('./middleware/security');
const {
  requestMonitoring,
  performanceMonitoring,
  getHealthStatus,
} = require('./middleware/monitoring');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const callRoutes = require('./routes/calls');
const dashboardRoutes = require('./routes/dashboard');

// Import integrated worker service
const IntegratedWorkerService = require('./services/integratedWorkerService');
const integratedWorkerService = new IntegratedWorkerService();

const app = express();

// Trust proxy for ngrok and other reverse proxies
app.set('trust proxy', 1);

// Production security middleware stack
app.use(productionSecurity);

// Production monitoring middleware
app.use(requestMonitoring());
app.use(performanceMonitoring());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Specific rate limits for different endpoints
app.use('/api/auth', rateLimits.auth);
app.use('/api/calls', rateLimits.calls);
app.use('/api/calls/webhook', rateLimits.webhooks);

// Connect to MongoDB with enhanced error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    dbLogger.info('Attempting to connect to MongoDB...', { 
      mongoURI: mongoURI.replace(/\/\/.*@/, '//***:***@'),
      environment: process.env.NODE_ENV || 'development'
    });

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      heartbeatFrequencyMS: 10000, // Send a ping every 10s
      retryWrites: true,
      w: 'majority'
    });

    dbLogger.info('MongoDB connected successfully');
  } catch (error) {
    handleDatabaseError(error, {
      operation: 'connection',
      mongoURI: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@') : 'NOT_SET'
    });
    
    dbLogger.info('Possible solutions:', {
      solutions: [
        'Check if your IP is whitelisted in MongoDB Atlas',
        'Verify your MongoDB connection string in Render environment variables',
        'Check if MongoDB Atlas cluster is running',
        'Ensure network connectivity to MongoDB Atlas',
        'Verify MongoDB Atlas username and password are correct'
      ]
    });

    // Don't exit the process, let the app run without MongoDB for now
    dbLogger.warn('Server will continue running without MongoDB connection');
    
    // Set up reconnection logic
    setTimeout(() => {
      dbLogger.info('Attempting to reconnect to MongoDB...');
      connectDB();
    }, 30000); // Try to reconnect every 30 seconds
  }
};

// Connect to MongoDB
connectDB();

// Dashboard route (accessible at root URL)
app.use('/dashboard', dashboardRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/calls', callRoutes);

// Worker management endpoints
app.get('/api/workers/status', asyncHandler(async (req, res) => {
  const workerStatus = integratedWorkerService.getStatus();
  res.json(workerStatus);
}));

app.post('/api/workers/start', asyncHandler(async (req, res) => {
  integratedWorkerService.start();
  res.json({ message: 'Workers started successfully' });
}));

app.post('/api/workers/stop', asyncHandler(async (req, res) => {
  integratedWorkerService.stop();
  res.json({ message: 'Workers stopped successfully' });
}));

// Enhanced health check endpoint with monitoring data
app.get('/health', asyncHandler(async (req, res) => {
  const healthStatus = getHealthStatus();
  const workerStatus = integratedWorkerService.getStatus();
  
  // Check MongoDB connection status
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  const response = {
    ...healthStatus,
    workers: workerStatus,
    database: {
      status: mongoStatus,
      readyState: mongoose.connection.readyState
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };

  // Return 503 if database is not connected in production
  const statusCode = (process.env.NODE_ENV === 'production' && mongoStatus === 'disconnected') ? 503 : 200;
  
  res.status(statusCode).json(response);
}));

app.get('/api/health', asyncHandler(async (req, res) => {
  const healthStatus = getHealthStatus();
  const workerStatus = integratedWorkerService.getStatus();
  
  // Check MongoDB connection status
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  const response = {
    ...healthStatus,
    workers: workerStatus,
    database: {
      status: mongoStatus,
      readyState: mongoose.connection.readyState
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };

  // Return 503 if database is not connected in production
  const statusCode = (process.env.NODE_ENV === 'production' && mongoStatus === 'disconnected') ? 503 : 200;
  
  res.status(statusCode).json(response);
}));

// Global error handling middleware
app.use(globalErrorHandler);

// Welcome page for root URL
app.get('/', asyncHandler(async (req, res) => {
  res.json({
    name: 'AI SDR API',
    version: '1.0.0',
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    documentation: '/dashboard',
    health: '/health',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      calls: '/api/calls',
      workers: '/api/workers'
    }
  });
}));

// 404 handler
app.use('*', asyncHandler(async (req, res) => {
  res.status(404).json({ 
    error: {
      type: 'NOT_FOUND',
      message: 'Route not found'
    },
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id']
  });
}));

const PORT = process.env.PORT || 5001;

// Start workers when server starts
const originalListen = app.listen;
app.listen = function (port, callback) {
  const server = originalListen.call(this, port, () => {
    logger.info('Server started', { 
      port, 
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });

    // Start integrated workers
    setTimeout(() => {
      workerLogger.info('Starting integrated workers after server initialization delay');
      integratedWorkerService.start();
    }, 3000); // Wait 3 seconds for server to fully initialize

    if (callback) callback();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    workerLogger.info('Stopping integrated workers due to SIGTERM');
    integratedWorkerService.stop();
    server.close(() => {
      logger.info('Server closed gracefully');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    workerLogger.info('Stopping integrated workers due to SIGINT');
    integratedWorkerService.stop();
    server.close(() => {
      logger.info('Server closed gracefully');
      process.exit(0);
    });
  });

  return server;
};

app.listen(PORT);
logger.info('🔧 Integrated worker service configured');
logger.info('🚀 Worker endpoints: /api/workers/status, /api/workers/start, /api/workers/stop');
logger.info('🔧 Deployment timestamp:', { timestamp: new Date().toISOString() });
