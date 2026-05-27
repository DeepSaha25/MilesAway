const Run = require('../models/Run');
const User = require('../models/User');
const DailyAggregate = require('../models/DailyAggregate');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const { getLocationFromCoordinates } = require('../utils/geocoding');
const LeaderboardService = require('./leaderboardService');
const ApiError = require('../utils/ApiError');

const MIN_RUN_DISTANCE_KM = 0.01;
const MIN_RUN_DURATION_SECONDS = 30;
const MAX_AVERAGE_SPEED_KMH = 25;
const MAX_SEGMENT_SPEED_KMH = 30;
const MAX_ACCEPTED_ACCURACY_METERS = 80;
const MAX_FUTURE_SKEW_MS = 2 * 60 * 1000;
const MAX_BACKDATE_DAYS = 7;
const JITTER_DISTANCE_METERS = 3;
const ROUTE_SIMPLIFY_DISTANCE_METERS = 20;
const EARTH_RADIUS_METERS = 6371e3;

class RunService {
  static async submitRun(userId, { clientRunId, coordinates, startedAt, finishedAt, elapsedSeconds }) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const existingRun = await Run.findOne({ userId, clientRunId });
    if (existingRun) {
      await this.rebuildUserDerivedStats(userId);
      return { run: existingRun, created: false };
    }

    const normalizedCoordinates = this.normalizeCoordinates(coordinates);
    const trustedMetrics = this.calculateTrustedMetrics(normalizedCoordinates, {
      startedAt,
      finishedAt,
      elapsedSeconds
    });
    const lastCoordinate = trustedMetrics.coordinates[trustedMetrics.coordinates.length - 1];
    const locationData = await getLocationFromCoordinates(lastCoordinate.latitude, lastCoordinate.longitude);
    const caloriesBurned = this.calculateCalories(trustedMetrics.distanceKm, user.weightKg);

    const run = new Run({
      userId,
      clientRunId,
      distance: trustedMetrics.distanceKm,
      duration: trustedMetrics.durationSeconds,
      coordinates: trustedMetrics.coordinates,
      route: this.simplifyRoute(trustedMetrics.coordinates),
      startTime: trustedMetrics.startTime,
      endTime: trustedMetrics.endTime,
      date: trustedMetrics.endTime,
      elevationGain: trustedMetrics.elevationGain,
      caloriesBurned,
      location: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        city: locationData.city,
        district: locationData.district,
        state: locationData.state,
        country: locationData.country,
        point: {
          type: 'Point',
          coordinates: [locationData.longitude, locationData.latitude]
        }
      }
    });

    try {
      await run.save();
    } catch (error) {
      if (error.code === 11000) {
        const duplicate = await Run.findOne({ userId, clientRunId });
        if (duplicate) {
          return { run: duplicate, created: false };
        }
      }
      throw error;
    }

    await User.findByIdAndUpdate(userId, {
      'location.latitude': locationData.latitude,
      'location.longitude': locationData.longitude,
      'location.city': locationData.city,
      'location.district': locationData.district,
      'location.state': locationData.state,
      'location.country': locationData.country,
      'location.point.type': 'Point',
      'location.point.coordinates': [locationData.longitude, locationData.latitude]
    });

    await this.rebuildUserDerivedStats(userId, run.endTime);
    LeaderboardService.clearCache();

    return { run, created: true };
  }

  static async rebuildUserDerivedStats(userId, runDate = new Date()) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await DailyAggregate.deleteMany({ userId });

    const runs = await Run.find({ userId }).sort({ date: 1 });
    for (const run of runs) {
      await this.upsertDailyAggregate(user, run);
    }

    const latestRun = runs[runs.length - 1];
    await this.updateUserStats(
      userId,
      latestRun?.endTime || latestRun?.date || runDate
    );
    LeaderboardService.clearCache();
  }

  static async updateUserStats(userId, runDate = new Date()) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const tz = user.timezone || 'Asia/Kolkata';
    const totalStats = await Run.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$userId',
          totalDistance: { $sum: '$distance' }
        }
      }
    ]);

    user.totalDistance = totalStats[0]?.totalDistance || 0;
    user.streak = await this.calculateCurrentStreak(userId, tz);
    user.lastRunDate = runDate;
    await user.save();

    return user;
  }

  static async getUserRunHistory(userId, limit = 50, startDate = null, endDate = null) {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const query = { userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    return Run.find(query).sort({ date: -1 }).limit(safeLimit);
  }

  static async getUserAggregatedStats(userId) {
    await this.rebuildUserDerivedStats(userId);

    const totalRunsStats = await Run.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$userId',
          totalDistance: { $sum: '$distance' },
          totalDuration: { $sum: '$duration' },
          totalRuns: { $sum: 1 },
          avgSpeed: { $avg: '$avgSpeed' },
          averagePace: { $avg: '$averagePace' },
          caloriesBurned: { $sum: '$caloriesBurned' },
          elevationGain: { $sum: '$elevationGain' }
        }
      }
    ]);

    if (totalRunsStats.length === 0) {
      return this.emptyTotalStats();
    }

    return totalRunsStats[0];
  }

  static async getWeeklyStats(userId) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyStats = await Run.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalDistance: { $sum: '$distance' },
          totalRuns: { $sum: 1 },
          avgSpeed: { $avg: '$avgSpeed' },
          averagePace: { $avg: '$averagePace' }
        }
      }
    ]);

    return weeklyStats[0] || this.emptyPeriodStats();
  }

  static async getDailyStats(userId, date = new Date()) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dailyStats = await Run.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: dayStart, $lte: dayEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalDistance: { $sum: '$distance' },
          totalRuns: { $sum: 1 },
          avgSpeed: { $avg: '$avgSpeed' },
          averagePace: { $avg: '$averagePace' }
        }
      }
    ]);

    return dailyStats[0] || this.emptyPeriodStats();
  }

  static normalizeCoordinates(coordinates = []) {
    return coordinates
      .map((coordinate) => ({
        latitude: Number(coordinate.latitude),
        longitude: Number(coordinate.longitude),
        altitude: coordinate.altitude === undefined || coordinate.altitude === null
          ? null
          : Number(coordinate.altitude),
        accuracy: coordinate.accuracy === undefined || coordinate.accuracy === null
          ? null
          : Number(coordinate.accuracy),
        speed: coordinate.speed === undefined || coordinate.speed === null
          ? null
          : Number(coordinate.speed),
        heading: coordinate.heading === undefined || coordinate.heading === null
          ? null
          : Number(coordinate.heading),
        timestamp: coordinate.timestamp ? new Date(coordinate.timestamp) : null
      }))
      .filter((coordinate) =>
        Number.isFinite(coordinate.latitude) &&
        Number.isFinite(coordinate.longitude) &&
        coordinate.timestamp instanceof Date &&
        !Number.isNaN(coordinate.timestamp.getTime())
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  static calculateTrustedMetrics(coordinates, timing = {}) {
    if (coordinates.length < 2) {
      throw ApiError.badRequest('At least two valid GPS samples are required');
    }

    const now = Date.now();
    const firstTime = coordinates[0].timestamp.getTime();
    const lastTime = coordinates[coordinates.length - 1].timestamp.getTime();

    if (firstTime < moment().subtract(MAX_BACKDATE_DAYS, 'days').valueOf()) {
      throw ApiError.badRequest(`Runs older than ${MAX_BACKDATE_DAYS} days cannot be submitted`);
    }

    if (lastTime > now + MAX_FUTURE_SKEW_MS) {
      throw ApiError.badRequest('Run timestamps cannot be in the future');
    }

    const usableCoordinates = coordinates.filter((coordinate) =>
      coordinate.accuracy === null ||
      (Number.isFinite(coordinate.accuracy) && coordinate.accuracy <= MAX_ACCEPTED_ACCURACY_METERS)
    );

    if (usableCoordinates.length < 2) {
      throw ApiError.badRequest('GPS accuracy is too low to save this run');
    }

    const duplicateTimestamps = new Set();
    for (const coordinate of usableCoordinates) {
      const key = coordinate.timestamp.toISOString();
      if (duplicateTimestamps.has(key)) {
        throw ApiError.badRequest('Duplicate GPS timestamps detected');
      }
      duplicateTimestamps.add(key);
    }

    let totalMeters = 0;
    let elevationGain = 0;
    const acceptedCoordinates = [usableCoordinates[0]];

    for (let index = 1; index < usableCoordinates.length; index += 1) {
      const previous = acceptedCoordinates[acceptedCoordinates.length - 1];
      const current = usableCoordinates[index];
      const deltaSeconds = (current.timestamp.getTime() - previous.timestamp.getTime()) / 1000;

      if (deltaSeconds <= 0) {
        throw ApiError.badRequest('GPS timestamps must be strictly increasing');
      }

      const segmentMeters = this.haversineMeters(previous, current);
      if (segmentMeters < JITTER_DISTANCE_METERS) {
        continue;
      }

      const segmentSpeedKmh = (segmentMeters / 1000) / (deltaSeconds / 3600);
      if (segmentSpeedKmh > MAX_SEGMENT_SPEED_KMH) {
        throw ApiError.badRequest(`GPS jump detected (${segmentSpeedKmh.toFixed(2)} km/h segment)`);
      }

      if (
        Number.isFinite(previous.altitude) &&
        Number.isFinite(current.altitude) &&
        current.altitude > previous.altitude
      ) {
        elevationGain += current.altitude - previous.altitude;
      }

      totalMeters += segmentMeters;
      acceptedCoordinates.push(current);
    }

    if (acceptedCoordinates.length < 2) {
      throw ApiError.badRequest('Not enough movement after GPS drift filtering');
    }

    const coordinateStartTime = acceptedCoordinates[0].timestamp;
    const coordinateEndTime = acceptedCoordinates[acceptedCoordinates.length - 1].timestamp;
    const clientStartTime = timing.startedAt ? new Date(timing.startedAt) : null;
    const clientEndTime = timing.finishedAt ? new Date(timing.finishedAt) : null;
    const clientElapsedSeconds = Number(timing.elapsedSeconds);
    const hasClientTiming =
      clientStartTime instanceof Date &&
      !Number.isNaN(clientStartTime.getTime()) &&
      clientEndTime instanceof Date &&
      !Number.isNaN(clientEndTime.getTime()) &&
      clientStartTime.getTime() >= moment().subtract(MAX_BACKDATE_DAYS, 'days').valueOf() &&
      clientEndTime.getTime() <= now + MAX_FUTURE_SKEW_MS &&
      clientEndTime.getTime() >= clientStartTime.getTime();
    const clientWindowSeconds = hasClientTiming
      ? Math.round((clientEndTime.getTime() - clientStartTime.getTime()) / 1000)
      : 0;
    const durationSeconds =
      Number.isFinite(clientElapsedSeconds) && clientElapsedSeconds > 0
        ? Math.round(clientElapsedSeconds)
        : clientWindowSeconds || Math.round((coordinateEndTime.getTime() - coordinateStartTime.getTime()) / 1000);
    const startTime = hasClientTiming ? clientStartTime : coordinateStartTime;
    const endTime = hasClientTiming ? clientEndTime : coordinateEndTime;
    const distanceKm = Math.round((totalMeters / 1000) * 100) / 100;

    if (durationSeconds < MIN_RUN_DURATION_SECONDS) {
      throw ApiError.badRequest(`Run duration must be at least ${MIN_RUN_DURATION_SECONDS} seconds`);
    }

    if (distanceKm < MIN_RUN_DISTANCE_KM) {
      throw ApiError.badRequest(`Run distance must be at least ${MIN_RUN_DISTANCE_KM} km`);
    }

    const avgSpeed = distanceKm / (durationSeconds / 3600);
    if (avgSpeed > MAX_AVERAGE_SPEED_KMH) {
      throw ApiError.badRequest(`Average speed (${avgSpeed.toFixed(2)} km/h) exceeds ${MAX_AVERAGE_SPEED_KMH} km/h limit`);
    }

    return {
      coordinates: acceptedCoordinates,
      distanceKm,
      durationSeconds,
      elevationGain: Math.round(elevationGain * 100) / 100,
      startTime,
      endTime
    };
  }

  static simplifyRoute(coordinates) {
    if (coordinates.length <= 2) {
      return coordinates.map(this.toRoutePoint);
    }

    const simplified = [coordinates[0]];
    let lastAccepted = coordinates[0];

    for (let index = 1; index < coordinates.length - 1; index += 1) {
      if (this.haversineMeters(lastAccepted, coordinates[index]) >= ROUTE_SIMPLIFY_DISTANCE_METERS) {
        simplified.push(coordinates[index]);
        lastAccepted = coordinates[index];
      }
    }

    simplified.push(coordinates[coordinates.length - 1]);
    return simplified.map(this.toRoutePoint);
  }

  static toRoutePoint(coordinate) {
    return {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      timestamp: coordinate.timestamp
    };
  }

  static async upsertDailyAggregate(user, run) {
    const timezone = user.timezone || 'Asia/Kolkata';
    const runEndTime = run.endTime || run.date || run.createdAt || new Date();
    const dateKey = moment.tz(runEndTime, timezone).format('YYYY-MM-DD');
    const locationKey = this.getLocationKey(run.location);

    await DailyAggregate.updateOne(
      {
        userId: run.userId,
        dateKey,
        locationKey
      },
      {
        $setOnInsert: {
          userId: run.userId,
          dateKey,
          locationKey,
          location: run.location
        },
        $inc: {
          totalDistance: run.distance,
          totalDuration: run.duration,
          totalRuns: 1,
          caloriesBurned: run.caloriesBurned,
          elevationGain: run.elevationGain
        },
        $max: {
          lastRunAt: runEndTime
        }
      },
      { upsert: true }
    );
  }

  static getLocationKey(location = {}) {
    return [
      location.country || 'unknown',
      location.state || 'unknown',
      location.district || 'unknown',
      location.city || 'unknown'
    ].join('|');
  }

  static calculateCalories(distance, weightKg) {
    const effectiveWeight = Number.isFinite(weightKg) ? Number(weightKg) : 70;
    return Math.round(distance * effectiveWeight * 1.036 * 100) / 100;
  }

  static haversineMeters(from, to) {
    const phi1 = this.toRadians(from.latitude);
    const phi2 = this.toRadians(to.latitude);
    const deltaPhi = this.toRadians(to.latitude - from.latitude);
    const deltaLambda = this.toRadians(to.longitude - from.longitude);

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METERS * c;
  }

  static toRadians(value) {
    return (value * Math.PI) / 180;
  }

  static async calculateCurrentStreak(userId, timezone = 'Asia/Kolkata') {
    const qualifyingDays = await Run.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date',
              timezone
            }
          },
          totalDistance: { $sum: '$distance' }
        }
      },
      { $match: { totalDistance: { $gte: 2 } } },
      { $sort: { _id: -1 } }
    ]);

    if (qualifyingDays.length === 0) {
      return 0;
    }

    const dayKeys = new Set(qualifyingDays.map((entry) => entry._id));
    const today = moment.tz(timezone).startOf('day');
    const yesterday = today.clone().subtract(1, 'day');
    const startingPoint = dayKeys.has(today.format('YYYY-MM-DD'))
      ? today
      : dayKeys.has(yesterday.format('YYYY-MM-DD'))
        ? yesterday
        : null;

    if (!startingPoint) {
      return 0;
    }

    let streak = 0;
    const cursor = startingPoint.clone();

    while (dayKeys.has(cursor.format('YYYY-MM-DD'))) {
      streak += 1;
      cursor.subtract(1, 'day');
    }

    return streak;
  }

  static emptyTotalStats() {
    return {
      totalDistance: 0,
      totalDuration: 0,
      totalRuns: 0,
      avgSpeed: 0,
      averagePace: 0,
      caloriesBurned: 0,
      elevationGain: 0
    };
  }

  static emptyPeriodStats() {
    return {
      totalDistance: 0,
      totalRuns: 0,
      avgSpeed: 0,
      averagePace: 0
    };
  }
}

module.exports = RunService;
