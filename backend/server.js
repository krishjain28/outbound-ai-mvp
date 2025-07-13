const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Import production middleware
const {
  productionSecurity,
  errorHandler,
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

// Connect to MongoDB with better error handling
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/outbound-ai-mvp';
    console.log('Attempting to connect to MongoDB...');

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      // serverSelectionRetryFrequency: 2000, // This option is not supported
      heartbeatFrequencyMS: 10000, // Send a ping every 10s
    });

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('📝 Possible solutions:');
    console.error(
      '   1. Check if your IP (160.202.36.102) is whitelisted in MongoDB Atlas'
    );
    console.error('   2. Verify your MongoDB connection string in .env file');
    console.error('   3. Check if MongoDB Atlas cluster is running');
    console.error('   4. Ensure network connectivity to MongoDB Atlas');

    // Don't exit the process, let the app run without MongoDB for now
    console.log('⚠️  Server will continue running without MongoDB connection');
  }
};

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/calls', callRoutes);

// Worker management endpoints
app.get('/api/workers/status', (req, res) => {
  const workerStatus = integratedWorkerService.getStatus();
  res.json(workerStatus);
});

app.post('/api/workers/start', (req, res) => {
  integratedWorkerService.start();
  res.json({ message: 'Workers started successfully' });
});

app.post('/api/workers/stop', (req, res) => {
  integratedWorkerService.stop();
  res.json({ message: 'Workers stopped successfully' });
});

// Enhanced health check endpoint with monitoring data
app.get('/health', (req, res) => {
  const healthStatus = getHealthStatus();
  const workerStatus = integratedWorkerService.getStatus();

  res.status(healthStatus.status === 'healthy' ? 200 : 503).json({
    ...healthStatus,
    workers: workerStatus,
  });
});

app.get('/api/health', (req, res) => {
  const healthStatus = getHealthStatus();
  const workerStatus = integratedWorkerService.getStatus();

  res.status(healthStatus.status === 'healthy' ? 200 : 503).json({
    ...healthStatus,
    workers: workerStatus,
  });
});

// Production error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;

// Start workers when server starts
const originalListen = app.listen;
app.listen = function (port, callback) {
  const server = originalListen.call(this, port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // Start integrated workers
    setTimeout(() => {
      integratedWorkerService.start();
    }, 3000); // Wait 3 seconds for server to fully initialize

    if (callback) callback();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    integratedWorkerService.stop();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    integratedWorkerService.stop();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  return server;
};

app.listen(PORT);
console.log('🔧 Integrated worker service configured');
console.log(
  '🚀 Worker endpoints: /api/workers/status, /api/workers/start, /api/workers/stop'
);
console.log('🔧 Deployment timestamp:', new Date().toISOString());
