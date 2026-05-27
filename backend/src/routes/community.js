const express = require('express');
const authenticate = require('../middlewares/auth');
const { communityLimiter } = require('../middlewares/rateLimits');
const {
  createPost,
  getFeed,
  getRunningEvents,
  toggleLike,
  addComment
} = require('../controllers/communityController');

const router = express.Router();

/**
 * GET /api/community/events
 * Get upcoming live running events and marathons
 */
router.get('/events', communityLimiter, getRunningEvents);

// All routes require auth
router.use(authenticate);
router.use(communityLimiter);

/**
 * GET /api/community/feed
 * Get paginated community feed
 */
router.get('/feed', getFeed);

/**
 * POST /api/community/post
 * Create a new community post
 */
router.post('/post', createPost);

/**
 * POST /api/community/post/:postId/like
 * Toggle like on a post
 */
router.post('/post/:postId/like', toggleLike);

/**
 * POST /api/community/post/:postId/comment
 * Add comment to a post
 */
router.post('/post/:postId/comment', addComment);

module.exports = router;
