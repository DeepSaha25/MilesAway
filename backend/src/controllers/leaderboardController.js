const LeaderboardService = require('../services/leaderboardService');
const User = require('../models/User');

const LEVEL_REQUIREMENTS = {
  local: 'latitude',
  city: 'city',
  district: 'district',
  state: 'state'
};

const buildLocationScope = (user, level) => {
  const location = user?.location || {};

  if (level === 'local') {
    return {
      label: `${location.city || 'Current location'} radius`,
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm: Number(process.env.LOCAL_LEADERBOARD_RADIUS_KM || 8)
    };
  }

  if (level === 'global') {
    return {
      label: 'Worldwide',
      city: null,
      district: null,
      state: null,
      country: null
    };
  }

  return {
    label: location[level] || location.country || null,
    city: location.city || null,
    district: location.district || null,
    state: location.state || null,
    country: location.country || null
  };
};

const ensureLocation = (user, level) => {
  const requiredField = LEVEL_REQUIREMENTS[level];
  if (!requiredField) {
    return null;
  }

  if (user?.location?.[requiredField] === undefined || user?.location?.[requiredField] === null) {
    return 'User location not set. Please update your location first.';
  }

  if (level === 'local' && (user?.location?.longitude === undefined || user?.location?.longitude === null)) {
    return 'User location not set. Please update your location first.';
  }

  return null;
};

const buildLeaderboardPayload = async (req, level, fetcher) => {
  const userId = req.userId;
  const { timePeriod = 'today', limit = 100 } = req.query;
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 100);
  const user = await User.findById(userId);

  if (!user) {
    return {
      statusCode: 404,
      body: {
        status: 'error',
        message: 'User not found'
      }
    };
  }

  const locationError = ensureLocation(user, level);
  if (locationError) {
    return {
      statusCode: 400,
      body: {
        status: 'error',
        message: locationError
      }
    };
  }

  const timezone = user.timezone || 'Asia/Kolkata';
  const data = await fetcher(user.location, timePeriod, parsedLimit, timezone);
  const yourRank = await LeaderboardService.getUserRank(userId, level, user.location, timePeriod, timezone);

  return {
    statusCode: 200,
    body: {
      status: 'success',
      message: `${level.charAt(0).toUpperCase() + level.slice(1)} leaderboard retrieved successfully`,
      timePeriod,
      level,
      location: buildLocationScope(user, level).label,
      scope: buildLocationScope(user, level),
      count: data.length,
      yourRank: yourRank ? yourRank.rank : null,
      data
    }
  };
};

/**
 * Get global leaderboard
 */
const getGlobalLeaderboard = async (req, res, next) => {
  try {
    const payload = await buildLeaderboardPayload(
      req,
      'global',
      LeaderboardService.getGlobalLeaderboard.bind(LeaderboardService)
    );
    res.status(payload.statusCode).json(payload.body);
  } catch (err) {
    next(err);
  }
};

/**
 * Get local (city) leaderboard
 */
const getLocalLeaderboard = async (req, res, next) => {
  try {
    const payload = await buildLeaderboardPayload(req, 'local', LeaderboardService.getLocalLeaderboard.bind(LeaderboardService));
    res.status(payload.statusCode).json(payload.body);
  } catch (err) {
    next(err);
  }
};

/**
 * Get city leaderboard
 */
const getCityLeaderboard = async (req, res, next) => {
  try {
    const payload = await buildLeaderboardPayload(req, 'city', LeaderboardService.getCityLeaderboard.bind(LeaderboardService));
    res.status(payload.statusCode).json(payload.body);
  } catch (err) {
    next(err);
  }
};

/**
 * Get district leaderboard
 */
const getDistrictLeaderboard = async (req, res, next) => {
  try {
    const payload = await buildLeaderboardPayload(req, 'district', LeaderboardService.getDistrictLeaderboard.bind(LeaderboardService));
    res.status(payload.statusCode).json(payload.body);
  } catch (err) {
    next(err);
  }
};

/**
 * Get state leaderboard
 */
const getStateLeaderboard = async (req, res, next) => {
  try {
    const payload = await buildLeaderboardPayload(req, 'state', LeaderboardService.getStateLeaderboard.bind(LeaderboardService));
    res.status(payload.statusCode).json(payload.body);
  } catch (err) {
    next(err);
  }
};

/**
 * Get country leaderboard
 */
const getCountryLeaderboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const { timePeriod = 'today', limit = 100 } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 100);
    const leaderboard = await LeaderboardService.getCountryLeaderboard(
      user?.location || {},
      timePeriod,
      parsedLimit,
      user?.timezone || 'Asia/Kolkata'
    );

    res.status(200).json({
      status: 'success',
      message: 'Country leaderboard retrieved successfully',
      timePeriod,
      level: 'country',
      location: user?.location?.country || 'Worldwide',
      count: leaderboard.length,
      yourRank: user ? (await LeaderboardService.getUserRank(req.userId, 'country', user.location || {}, timePeriod, user.timezone || 'Asia/Kolkata'))?.rank || null : null,
      data: leaderboard
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGlobalLeaderboard,
  getLocalLeaderboard,
  getCityLeaderboard,
  getDistrictLeaderboard,
  getStateLeaderboard,
  getCountryLeaderboard
};
