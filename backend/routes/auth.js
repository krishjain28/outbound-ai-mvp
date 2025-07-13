const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { auth: logger } = require('../utils/logger');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateSignup = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
];

const validateSignin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post(
  '/signup',
  authLimiter,
  validateSignup,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
      });

      await user.save();

      // Generate JWT token
      const token = user.generateAuthToken();

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          },
          token,
        },
      });
    } catch (error) {
      logger.error('Signup error', { 
      error: error.message, 
      stack: error.stack, 
      email: req.body.email,
      ip: req.ip 
    });

      // Handle MongoDB connection issues
      if (
        error.name === 'MongooseError' &&
        error.message.includes('buffering timed out')
      ) {
        return res.status(503).json({
          success: false,
          message:
            'Database connection issue. Please try again or contact support.',
          error: 'Database temporarily unavailable',
        });
      }

      if (error.name === 'MongooseServerSelectionError') {
        return res.status(503).json({
          success: false,
          message:
            'Database connection issue. Please try again or contact support.',
          error: 'Database server unavailable',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error during registration',
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Internal server error',
      });
    }
  }
);

// @route   POST /api/auth/signin
// @desc    Authenticate user and get token
// @access  Public
router.post(
  '/signin',
  authLimiter,
  validateSignin,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by credentials
      const user = await User.findByCredentials(email, password);

      // Generate JWT token
      const token = user.generateAuthToken();

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.json({
        success: true,
        message: 'User signed in successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin,
          },
          token,
        },
      });
    } catch (error) {
      logger.error('Signin error', { 
      error: error.message, 
      stack: error.stack, 
      email: req.body.email,
      ip: req.ip 
    });

      if (error.message === 'Invalid login credentials') {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Handle MongoDB connection issues
      if (
        error.name === 'MongooseError' &&
        error.message.includes('buffering timed out')
      ) {
        return res.status(503).json({
          success: false,
          message:
            'Database connection issue. Please try again or contact support.',
          error: 'Database temporarily unavailable',
        });
      }

      if (error.name === 'MongooseServerSelectionError') {
        return res.status(503).json({
          success: false,
          message:
            'Database connection issue. Please try again or contact support.',
          error: 'Database server unavailable',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error during authentication',
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Internal server error',
      });
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'User logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error', { 
      error: error.message, 
      stack: error.stack, 
      userId: req.user?.id,
      ip: req.ip 
    });
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          isActive: req.user.isActive,
          lastLogin: req.user.lastLogin,
          createdAt: req.user.createdAt,
          updatedAt: req.user.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error('Get profile error', { 
      error: error.message, 
      stack: error.stack, 
      userId: req.user?.id,
      ip: req.ip 
    });
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  authenticate,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email } = req.body;
      const user = req.user;

      // Check if email is being changed and if it's already taken
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email is already in use',
          });
        }
        user.email = email;
      }

      if (name) {
        user.name = name;
      }

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error) {
      logger.error('Update profile error', { 
      error: error.message, 
      stack: error.stack, 
      userId: req.user?.id,
      ip: req.ip 
    });
      res.status(500).json({
        success: false,
        message: 'Server error while updating profile',
      });
    }
  }
);

module.exports = router;
