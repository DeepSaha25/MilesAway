const CommunityService = require('../services/communityService');
const RunningEventService = require('../services/runningEventService');

const createPost = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { text, runId } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Post text is required'
      });
    }

    const post = await CommunityService.createPost(userId, { text, runId });

    res.status(201).json({
      status: 'success',
      message: 'Post created successfully',
      data: post
    });
  } catch (err) {
    next(err);
  }
};

const getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const feed = await CommunityService.getFeed(
      parseInt(page, 10),
      parseInt(limit, 10)
    );

    res.status(200).json({
      status: 'success',
      message: 'Feed retrieved successfully',
      ...feed
    });
  } catch (err) {
    next(err);
  }
};

const getRunningEvents = async (req, res, next) => {
  try {
    const {
      countryCode = 'IN',
      keyword = 'running',
      limit = 10,
      latitude,
      longitude,
      radiusKm
    } = req.query;
    const events = await RunningEventService.getLiveEvents({
      countryCode: String(countryCode).toUpperCase(),
      keyword: String(keyword),
      limit: Number(limit),
      latitude: latitude === undefined ? undefined : Number(latitude),
      longitude: longitude === undefined ? undefined : Number(longitude),
      radiusKm: radiusKm === undefined ? undefined : Number(radiusKm)
    });

    res.status(200).json({
      status: 'success',
      message: 'Running events retrieved successfully',
      events
    });
  } catch (err) {
    next(err);
  }
};

const toggleLike = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;

    const result = await CommunityService.toggleLike(postId, userId);

    res.status(200).json({
      status: 'success',
      message: result.liked ? 'Post liked' : 'Post unliked',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const addComment = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Comment text is required'
      });
    }

    const post = await CommunityService.addComment(postId, userId, text);

    res.status(201).json({
      status: 'success',
      message: 'Comment added',
      data: post
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPost, getFeed, getRunningEvents, toggleLike, addComment };
