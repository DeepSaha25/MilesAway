const express = require('express');
const {
  signup,
  login,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { validateSignup, validateLogin } = require('../middlewares/validators');
const { authLimiter } = require('../middlewares/rateLimits');

const router = express.Router();

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', authLimiter, validateSignup, signup);

/**
 * POST /api/auth/login
 * Login user and get JWT token
 */
router.post('/login', authLimiter, validateLogin, login);

/**
 * POST /api/auth/forgot-password
 * Create a password reset token.
 */
router.post('/forgot-password', authLimiter, forgotPassword);

/**
 * POST /api/auth/reset-password
 * Reset password with a valid token.
 */
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
