const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Staff = require('../models/Staff');

/**
 * Verify password setup token and get user info
 */
const verifyPasswordSetupToken = async (req, res) => {
  try {
    const { token, userId } = req.query;

    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Token and user ID are required'
      });
    }

    // Find user with matching token and check if token is not expired
    const user = await User.findOne({
      _id: userId,
      passwordSetupToken: token,
      passwordSetupExpires: { $gt: new Date() },
      isPasswordSetup: false
    }).populate('staffId');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password setup token'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        userId: user._id,
        name: user.staffId ? user.staffId.name : user.username,
        email: user.email,
        position: user.staffId ? user.staffId.position : 'Unknown'
      }
    });

  } catch (error) {
    console.error('Verify password setup token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Set up new password for user
 */
const setupPassword = async (req, res) => {
  try {
    const { token, userId, password, confirmPassword } = req.body;

    if (!token || !userId || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user with matching token
    const user = await User.findOne({
      _id: userId,
      passwordSetupToken: token,
      passwordSetupExpires: { $gt: new Date() },
      isPasswordSetup: false
    }).populate('staffId');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password setup token'
      });
    }

    // Set the new password (pre-save hook will hash it automatically)
    user.password = password;
    user.passwordSetupToken = null;
    user.passwordSetupExpires = null;
    user.isPasswordSetup = true;
    user.isActive = true;
    user.lastLogin = new Date();

    await user.save();

    // Generate JWT token for immediate login
    const jwtToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Password setup completed successfully! You are now logged in.',
      data: {
        token: jwtToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          name: user.staffId ? user.staffId.name : user.username,
          position: user.staffId ? user.staffId.position : 'Unknown'
        }
      }
    });

  } catch (error) {
    console.error('Setup password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Resend password setup instructions
 */
const resendPasswordSetup = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user who hasn't completed password setup
    const user = await User.findOne({
      email,
      isPasswordSetup: false
    }).populate('staffId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No pending password setup found for this email'
      });
    }

    // Generate new token
    const notificationService = require('../services/notificationService');
    const passwordSetupToken = notificationService.generatePasswordSetupToken();
    const setupUrl = notificationService.generatePasswordSetupUrl(passwordSetupToken, user._id);

    // Update user with new token
    user.passwordSetupToken = passwordSetupToken;
    user.passwordSetupExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send notification
    const notificationResults = await notificationService.sendPasswordSetupNotification(
      {
        name: user.staffId ? user.staffId.name : user.username,
        email: user.email,
        contact: user.staffId ? user.staffId.contact : null,
        position: user.staffId ? user.staffId.position : 'Unknown'
      },
      setupUrl
    );

    res.json({
      success: true,
      message: 'Password setup instructions have been resent',
      data: {
        notificationResults,
        setupUrl: setupUrl // For development/testing
      }
    });

  } catch (error) {
    console.error('Resend password setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  verifyPasswordSetupToken,
  setupPassword,
  resendPasswordSetup
};