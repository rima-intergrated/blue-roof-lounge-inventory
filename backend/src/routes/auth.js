const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  getUserPermissions,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateChangePassword
} = require('../middleware/validation');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);

// Protected routes
router.use(auth); // All routes below require authentication

router.post('/logout', logout);
router.get('/profile', getProfile);
router.get('/permissions', getUserPermissions);
router.put('/profile', updateProfile);
router.put('/change-password', validateChangePassword, changePassword);

module.exports = router;
