const User = require('../models/User');
const Run = require('../models/Run');
const Post = require('../models/Post');
const DailyAggregate = require('../models/DailyAggregate');
const LeaderboardService = require('./leaderboardService');
const mongoose = require('mongoose');
const { getLocationFromCoordinates } = require('../utils/geocoding');
const ApiError = require('../utils/ApiError');

const isLikelyEmulatorDefaultLocation = (latitude, longitude) =>
  Math.abs(Number(latitude) - 37.4219983) < 0.01 &&
  Math.abs(Number(longitude) - -122.084) < 0.01;

class UserService {
  /**
   * Get user profile
   */
  static async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  /**
   * Update user location from coordinates
   */
  static async updateUserLocation(userId, latitude, longitude) {
    try {
      if (isLikelyEmulatorDefaultLocation(latitude, longitude)) {
        throw ApiError.badRequest('Default emulator location cannot be saved as profile location');
      }

      // Get location details from Google Maps API
      const locationData = await getLocationFromCoordinates(latitude, longitude);

      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        {
          'location.latitude': latitude,
          'location.longitude': longitude,
          'location.city': locationData.city,
          'location.district': locationData.district,
          'location.state': locationData.state,
          'location.country': locationData.country,
          'location.point.type': 'Point',
          'location.point.coordinates': [longitude, latitude]
        },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      return user;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Get aggregated user stats
   */
  static async getUserStats(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      location: user.location,
      totalDistance: user.totalDistance,
      streak: user.streak,
      lastRunDate: user.lastRunDate,
      createdAt: user.createdAt
    };
  }

  static async deleteAccount(userId, currentPassword) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const user = await User.findById(userId).select('+password').session(session);
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      const passwordMatches = await user.comparePassword(currentPassword);
      if (!passwordMatches) {
        throw ApiError.unauthorized('Current password is incorrect');
      }

      await Run.deleteMany({ userId }).session(session);
      await DailyAggregate.deleteMany({ userId }).session(session);
      await Post.deleteMany({ userId }).session(session);

      await Post.updateMany(
        { userId: { $ne: user._id } },
        {
          $pull: {
            likes: user._id,
            comments: { userId: user._id }
          }
        },
        { session }
      );

      const deletedUser = await User.deleteOne({ _id: user._id }).session(session);
      if (deletedUser.deletedCount !== 1) {
        throw ApiError.notFound('User not found');
      }

      await session.commitTransaction();
      LeaderboardService.clearCache();

      return {
        deleted: true
      };
    } catch (error) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error('[MilesAway] Failed to abort account deletion transaction', {
          userId: String(userId),
          error: abortError?.message || 'Unknown transaction abort error'
        });
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }
}

module.exports = UserService;
