const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./user');
const runRoutes = require('./run');
const leaderboardRoutes = require('./leaderboard');
const communityRoutes = require('./community');

const router = express.Router();

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'MilesAway backend is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * API Routes
 */
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/run', runRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/community', communityRoutes);

module.exports = router;

