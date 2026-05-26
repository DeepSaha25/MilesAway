const express = require('express');
const authenticate = require('../middlewares/auth');
const { leaderboardLimiter } = require('../middlewares/rateLimits');
const {
  getGlobalLeaderboard,
  getLocalLeaderboard,
  getCityLeaderboard,
  getDistrictLeaderboard,
  getStateLeaderboard,
  getCountryLeaderboard
} = require('../controllers/leaderboardController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(leaderboardLimiter);

/**
 * GET /api/leaderboard/global
 * Get global leaderboard
 */
router.get('/global', getGlobalLeaderboard);

/**
 * GET /api/leaderboard/local
 * Get local (city) leaderboard
 */
router.get('/local', getLocalLeaderboard);

/**
 * GET /api/leaderboard/city
 * Get city leaderboard
 */
router.get('/city', getCityLeaderboard);

/**
 * GET /api/leaderboard/district
 * Get district leaderboard
 */
router.get('/district', getDistrictLeaderboard);

/**
 * GET /api/leaderboard/state
 * Get state leaderboard
 */
router.get('/state', getStateLeaderboard);

/**
 * GET /api/leaderboard/country
 * Get country leaderboard
 */
router.get('/country', getCountryLeaderboard);

module.exports = router;
