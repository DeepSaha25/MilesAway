const DailyAggregate = require('../models/DailyAggregate');
const moment = require('moment-timezone');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');
const { normalizeLocationName } = require('../utils/geocoding');

const CACHE_TTL_MS = 30 * 1000;
const leaderboardCache = new Map();
const VALID_PERIODS = new Set(['today', 'weekly', 'week', 'monthly', 'month']);
const VALID_LEVELS = new Set(['local', 'city', 'district', 'state', 'country']);

class LeaderboardService {
  static async generateLeaderboard(level, userLocation = {}, timePeriod = 'today', limit = 100, timezone = 'Asia/Kolkata') {
    const safeLevel = this.validateLevel(level);
    const safePeriod = this.validateTimePeriod(timePeriod);
    const safeLimit = this.validateLimit(limit);
    const dateRange = this.getDateRange(safePeriod, timezone);
    const matchStage = this.buildMatchStage(safeLevel, userLocation, dateRange);
    const cacheKey = this.getCacheKey(safeLevel, userLocation, safePeriod, safeLimit, dateRange);
    const cached = leaderboardCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const aggregates = await DailyAggregate.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$userId',
          totalDistance: { $sum: '$totalDistance' },
          totalDuration: { $sum: '$totalDuration' },
          totalRuns: { $sum: '$totalRuns' },
          caloriesBurned: { $sum: '$caloriesBurned' },
          elevationGain: { $sum: '$elevationGain' },
          lastRunAt: { $max: '$lastRunAt' }
        }
      },
      { $sort: { totalDistance: -1, lastRunAt: 1, _id: 1 } },
      { $limit: safeLimit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ]);

    const value = aggregates.map((aggregate, index) => this.toLeaderboardEntry(aggregate, index));
    leaderboardCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return value;
  }

  static clearCache() {
    leaderboardCache.clear();
  }

  static async getLocalLeaderboard(userLocation, timePeriod = 'today', limit = 100, timezone = 'Asia/Kolkata') {
    return this.generateLeaderboard('local', userLocation, timePeriod, limit, timezone);
  }

  static async getCityLeaderboard(userLocation, timePeriod = 'today', limit = 100, timezone = 'Asia/Kolkata') {
    return this.generateLeaderboard('city', userLocation, timePeriod, limit, timezone);
  }

  static async getDistrictLeaderboard(userLocation, timePeriod = 'today', limit = 100, timezone = 'Asia/Kolkata') {
    return this.generateLeaderboard('district', userLocation, timePeriod, limit, timezone);
  }

  static async getStateLeaderboard(userLocation, timePeriod = 'today', limit = 100, timezone = 'Asia/Kolkata') {
    return this.generateLeaderboard('state', userLocation, timePeriod, limit, timezone);
  }

  static async getCountryLeaderboard(userLocation = {}, timePeriod = 'today', limit = 100, timezone = 'Asia/Kolkata') {
    return this.generateLeaderboard('country', userLocation, timePeriod, limit, timezone);
  }

  static async getUserRank(userId, level, userLocation, timePeriod = 'today', timezone = 'Asia/Kolkata') {
    const safeLevel = this.validateLevel(level);
    const safePeriod = this.validateTimePeriod(timePeriod);
    const dateRange = this.getDateRange(safePeriod, timezone);
    const matchStage = this.buildMatchStage(safeLevel, userLocation, dateRange);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const [userAggregate] = await DailyAggregate.aggregate([
      { $match: { ...matchStage, userId: userObjectId } },
      {
        $group: {
          _id: '$userId',
          totalDistance: { $sum: '$totalDistance' },
          totalDuration: { $sum: '$totalDuration' },
          totalRuns: { $sum: '$totalRuns' },
          lastRunAt: { $max: '$lastRunAt' }
        }
      }
    ]);

    if (!userAggregate) {
      return null;
    }

    const [{ ahead = 0 } = {}] = await DailyAggregate.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$userId',
          totalDistance: { $sum: '$totalDistance' },
          lastRunAt: { $max: '$lastRunAt' }
        }
      },
      {
        $match: {
          $or: [
            { totalDistance: { $gt: userAggregate.totalDistance } },
            {
              totalDistance: userAggregate.totalDistance,
              lastRunAt: { $lt: userAggregate.lastRunAt }
            }
          ]
        }
      },
      { $count: 'ahead' }
    ]);

    return {
      ...this.toLeaderboardEntry({ ...userAggregate, user: { _id: userObjectId, name: null, location: {} } }, ahead),
      rank: ahead + 1
    };
  }

  static getDateRange(timePeriod, timezone = 'Asia/Kolkata') {
    const now = moment.tz(timezone);

    if (timePeriod === 'weekly' || timePeriod === 'week') {
      return {
        startKey: now.clone().startOf('isoWeek').format('YYYY-MM-DD'),
        endKey: now.clone().format('YYYY-MM-DD')
      };
    }

    if (timePeriod === 'monthly' || timePeriod === 'month') {
      return {
        startKey: now.clone().startOf('month').format('YYYY-MM-DD'),
        endKey: now.clone().format('YYYY-MM-DD')
      };
    }

    return {
      startKey: now.clone().format('YYYY-MM-DD'),
      endKey: now.clone().format('YYYY-MM-DD')
    };
  }

  static buildMatchStage(level, userLocation, dateRange) {
    const matchStage = {
      dateKey: {
        $gte: dateRange.startKey,
        $lte: dateRange.endKey
      }
    };

    if (level === 'local' && Number.isFinite(userLocation.latitude) && Number.isFinite(userLocation.longitude)) {
      const radiusKm = Number(process.env.LOCAL_LEADERBOARD_RADIUS_KM || 8);
      matchStage['location.point'] = {
        $geoWithin: {
          $centerSphere: [[userLocation.longitude, userLocation.latitude], radiusKm / 6371]
        }
      };
    }

    if (level === 'city' && userLocation.city) {
      matchStage['location.city'] = normalizeLocationName(userLocation.city);
    }

    if (level === 'district' && userLocation.district) {
      matchStage['location.district'] = normalizeLocationName(userLocation.district);
    }

    if (level === 'state' && userLocation.state) {
      matchStage['location.state'] = normalizeLocationName(userLocation.state);
    }

    if (level === 'country' && userLocation.country) {
      matchStage['location.country'] = normalizeLocationName(userLocation.country);
    }

    return matchStage;
  }

  static toLeaderboardEntry(aggregate, index) {
    const totalDistance = aggregate.totalDistance || 0;
    const totalDuration = aggregate.totalDuration || 0;
    const avgSpeed = totalDuration > 0 ? totalDistance / (totalDuration / 3600) : 0;
    const averagePace = totalDistance > 0 ? (totalDuration / 60) / totalDistance : 0;

    return {
      rank: index + 1,
      userId: aggregate.user._id,
      name: aggregate.user.name,
      avatar: aggregate.user.avatar || null,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalDuration,
      totalRuns: aggregate.totalRuns,
      avgSpeed: Math.round(avgSpeed * 100) / 100,
      averagePace: Math.round(averagePace * 100) / 100,
      caloriesBurned: Math.round((aggregate.caloriesBurned || 0) * 100) / 100,
      elevationGain: Math.round((aggregate.elevationGain || 0) * 100) / 100,
      streak: aggregate.user.streak || 0,
      lastRunAt: aggregate.lastRunAt,
      location: {
        city: aggregate.user.location?.city || null,
        district: aggregate.user.location?.district || null,
        state: aggregate.user.location?.state || null,
        country: aggregate.user.location?.country || null
      }
    };
  }

  static validateLevel(level) {
    if (!VALID_LEVELS.has(level)) {
      throw ApiError.badRequest('Invalid leaderboard level');
    }
    return level;
  }

  static validateTimePeriod(timePeriod) {
    if (!VALID_PERIODS.has(timePeriod)) {
      throw ApiError.badRequest('Invalid timePeriod. Use today, weekly, or monthly.');
    }
    return timePeriod;
  }

  static validateLimit(limit) {
    return Math.min(Math.max(parseInt(limit, 10) || 100, 1), 100);
  }

  static getCacheKey(level, userLocation, timePeriod, limit, dateRange) {
    return [
      'leaderboard',
      level,
      this.getLocationKey(level, userLocation),
      timePeriod,
      limit,
      dateRange.startKey,
      dateRange.endKey
    ].join(':');
  }

  static getLocationKey(level, userLocation) {
    if (level === 'local') {
      return `${userLocation.latitude || 'na'}:${userLocation.longitude || 'na'}`;
    }
    if (level === 'city') {
      return normalizeLocationName(userLocation.city) || 'unknown';
    }
    if (level === 'district') {
      return normalizeLocationName(userLocation.district) || 'unknown';
    }
    if (level === 'state') {
      return normalizeLocationName(userLocation.state) || 'unknown';
    }
    if (level === 'country') {
      return normalizeLocationName(userLocation.country) || 'worldwide';
    }
    return 'unknown';
  }
}

module.exports = LeaderboardService;
