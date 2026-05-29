const express = require('express');
const authenticate = require('../middlewares/auth');
const { validateRunSubmission } = require('../middlewares/validators');
const { writeLimiter } = require('../middlewares/rateLimits');
const asyncWrapper = require('../utils/asyncWrapper');
const {
  submitRun,
  getHistory,
  getStats,
  getWeeklyStats,
  getDailyStats
} = require('../controllers/runController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/run/add
 * Submit a new run
 */
router.post('/add', writeLimiter, validateRunSubmission, asyncWrapper(submitRun));

/**
 * GET /api/run/history
 * Get user run history
 */
router.get('/history', asyncWrapper(getHistory));

/**
 * GET /api/run/stats
 * Get user aggregated stats
 */
router.get('/stats', asyncWrapper(getStats));

/**
 * GET /api/run/weekly-stats
 * Get weekly stats
 */
router.get('/weekly-stats', asyncWrapper(getWeeklyStats));

/**
 * GET /api/run/daily-stats
 * Get daily stats
 */
router.get('/daily-stats', asyncWrapper(getDailyStats));

module.exports = router;
