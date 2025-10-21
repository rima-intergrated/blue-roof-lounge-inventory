const express = require('express');
const router = express.Router();
const {
  verifyPasswordSetupToken,
  setupPassword,
  resendPasswordSetup
} = require('../controllers/passwordSetupController');

// Public routes (no authentication required)

// Verify password setup token
router.get('/verify-token', verifyPasswordSetupToken);

// Set up password
router.post('/setup-password', setupPassword);

// Resend password setup instructions
router.post('/resend', resendPasswordSetup);

module.exports = router;