const UserService = require('../services/userService');

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  const userId = req.userId;
  const profile = await UserService.getUserProfile(userId);

  res.status(200).json({
    status: 'success',
    message: 'Profile retrieved successfully',
    data: profile
  });
};

/**
 * Update user location
 */
const updateLocation = async (req, res) => {
  const userId = req.userId;
  const { latitude, longitude } = req.body;
  const user = await UserService.updateUserLocation(userId, latitude, longitude);

  res.status(200).json({
    status: 'success',
    message: 'Location updated successfully',
    data: user
  });
};

/**
 * Get user stats
 */
const getStats = async (req, res) => {
  const userId = req.userId;
  const stats = await UserService.getUserStats(userId);

  res.status(200).json({
    status: 'success',
    message: 'Stats retrieved successfully',
    data: stats
  });
};

const deleteAccount = async (req, res) => {
  const userId = req.userId;
  const { currentPassword } = req.body;
  await UserService.deleteAccount(userId, currentPassword);

  res.status(200).json({
    status: 'success',
    message: 'Account deleted successfully'
  });
};

module.exports = {
  getProfile,
  updateLocation,
  getStats,
  deleteAccount
};
