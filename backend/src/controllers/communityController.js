const CommunityService = require('../services/communityService');
const RunningEventService = require('../services/runningEventService');

const createPost = async (req, res) => {
  const userId = req.userId;
  const { text, runId } = req.body;
  const post = await CommunityService.createPost(userId, { text, runId });

  res.status(201).json({
    status: 'success',
    message: 'Post created successfully',
    data: post
  });
};

const getFeed = async (req, res) => {
  const { page, limit } = req.query;
  const feed = await CommunityService.getFeed(page, limit);

  res.status(200).json({
    status: 'success',
    message: 'Feed retrieved successfully',
    ...feed
  });
};

const getRunningEvents = async (req, res) => {
  const {
    countryCode,
    keyword,
    limit,
    latitude,
    longitude,
    radiusKm
  } = req.query;
  const events = await RunningEventService.getLiveEvents({
    countryCode,
    keyword,
    limit,
    latitude,
    longitude,
    radiusKm
  });

  res.status(200).json({
    status: 'success',
    message: 'Running events retrieved successfully',
    events
  });
};

const toggleLike = async (req, res) => {
  const userId = req.userId;
  const { postId } = req.params;
  const result = await CommunityService.toggleLike(postId, userId);

  res.status(200).json({
    status: 'success',
    message: result.liked ? 'Post liked' : 'Post unliked',
    data: result
  });
};

const addComment = async (req, res) => {
  const userId = req.userId;
  const { postId } = req.params;
  const { text } = req.body;
  const post = await CommunityService.addComment(postId, userId, text);

  res.status(201).json({
    status: 'success',
    message: 'Comment added',
    data: post
  });
};

module.exports = { createPost, getFeed, getRunningEvents, toggleLike, addComment };
