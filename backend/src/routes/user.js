const express = require('express');
const authenticate = require('../middlewares/auth');
const { validateLocationUpdate } = require('../middlewares/validators');
const { locationLimiter } = require('../middlewares/rateLimits');
const { getProfile, updateLocation, getStats } = require('../controllers/userController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/user/profile
 * Get user profile
 */
router.get('/profile', getProfile);

/**
 * GET /api/user/me
 * Get authenticated user profile
 */
router.get('/me', getProfile);

/**
 * PUT /api/user/location
 * Update user location
 */
router.put('/location', locationLimiter, validateLocationUpdate, updateLocation);

/**
 * GET /api/user/stats
 * Get user stats
 */
router.get('/stats', getStats);

module.exports = router;
