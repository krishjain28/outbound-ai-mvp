const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { auth: logger } = require('../utils/logger');

const router = express.Router();

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

// @route   GET /api/user/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const user = req.user;

    // You can add more dashboard-specific data here
    const dashboardData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        memberSince: user.createdAt,
      },
      stats: {
        // Add any relevant statistics here
        accountAge: Math.floor(
          (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)
        ), // days
      },
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    logger.error('Dashboard error', { 
      error: error.message, 
      stack: error.stack, 
      userId: req.user?.id,
      ip: req.ip 
    });
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data',
    });
  }
});

// @route   PUT /api/user/change-password
// @desc    Change user password
// @access  Private
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'New password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select('+password');

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.error('Change password error', { 
      error: error.message, 
      stack: error.stack, 
      userId: req.user?.id,
      ip: req.ip 
    });
      res.status(500).json({
        success: false,
        message: 'Server error while changing password',
      });
    }
  }
);

// @route   DELETE /api/user/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', authenticate, async (req, res) => {
  try {
    const user = req.user;

    // Deactivate instead of deleting
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    logger.error('Deactivate account error', { 
      error: error.message, 
      stack: error.stack, 
      userId: req.user?.id,
      ip: req.ip 
    });
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating account',
    });
  }
});

// Admin routes
// @route   GET /api/user/all
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({});

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get all users error', { 
      error: error.message, 
      stack: error.stack, 
      userId: req.user?.id,
      ip: req.ip 
    });
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
    });
  }
});

// @route   PUT /api/user/:id/role
// @desc    Update user role (Admin only)
// @access  Private/Admin
router.put(
  '/:id/role',
  authenticate,
  authorize('admin'),
  [
    body('role')
      .isIn(['user', 'admin'])
      .withMessage('Role must be either user or admin'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { role } = req.body;
      const userId = req.params.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      user.role = role;
      await user.save();

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      logger.error('Update user role error', { 
      error: error.message, 
      stack: error.stack, 
      userId: req.user?.id,
      targetUserId: req.params.id,
      ip: req.ip 
    });
      res.status(500).json({
        success: false,
        message: 'Server error while updating user role',
      });
    }
  }
);

module.exports = router;
