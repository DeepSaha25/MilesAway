const express = require('express');
const authenticate = require('../middlewares/auth');
const { communityLimiter } = require('../middlewares/rateLimits');
const {
  validateObjectIdParams,
  validatePagination,
  validateCommunityPost,
  validateCommunityComment,
  validateRunningEventsQuery
} = require('../middlewares/validators');
const asyncWrapper = require('../utils/asyncWrapper');
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
router.get('/events', communityLimiter, validateRunningEventsQuery, asyncWrapper(getRunningEvents));

// All routes require auth
router.use(authenticate);
router.use(communityLimiter);

/**
 * GET /api/community/feed
 * Get paginated community feed
 */
router.get('/feed', validatePagination, asyncWrapper(getFeed));

/**
 * POST /api/community/post
 * Create a new community post
 */
router.post('/post', validateCommunityPost, asyncWrapper(createPost));

/**
 * POST /api/community/post/:postId/like
 * Toggle like on a post
 */
router.post('/post/:postId/like', validateObjectIdParams('postId'), asyncWrapper(toggleLike));

/**
 * POST /api/community/post/:postId/comment
 * Add comment to a post
 */
router.post(
  '/post/:postId/comment',
  validateObjectIdParams('postId'),
  validateCommunityComment,
  asyncWrapper(addComment)
);

module.exports = router;
