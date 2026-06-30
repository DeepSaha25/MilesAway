const express = require('express');
const authenticate = require('../middlewares/auth');
const { validateLocationUpdate, validateAccountDeletion } = require('../middlewares/validators');
const { locationLimiter } = require('../middlewares/rateLimits');
const { getProfile, updateLocation, getStats, deleteAccount } = require('../controllers/userController');
const asyncWrapper = require('../utils/asyncWrapper');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/user/profile
 * Get user profile
 */
router.get('/profile', asyncWrapper(getProfile));

/**
 * GET /api/user/me
 * Get authenticated user profile
 */
router.get('/me', asyncWrapper(getProfile));

/**
 * PUT /api/user/location
 * Update user location
 */
router.put('/location', locationLimiter, validateLocationUpdate, asyncWrapper(updateLocation));

/**
 * GET /api/user/stats
 * Get user stats
 */
router.get('/stats', asyncWrapper(getStats));

/**
 * DELETE /api/user/account
 * Delete authenticated user account
 */
router.delete('/account', validateAccountDeletion, asyncWrapper(deleteAccount));

module.exports = router;
