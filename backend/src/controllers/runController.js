const RunService = require('../services/runService');

/**
 * Submit a new run
 */
const submitRun = async (req, res) => {
  const userId = req.userId;
  const { clientRunId, coordinates, startedAt, finishedAt, elapsedSeconds } = req.body;

  const result = await RunService.submitRun(userId, {
    clientRunId,
    coordinates,
    startedAt,
    finishedAt,
    elapsedSeconds,
  });

  res.status(result.created ? 201 : 200).json({
    status: 'success',
    message: result.created ? 'Run submitted successfully' : 'Run already submitted',
    data: result.run,
    idempotent: !result.created
  });
};

/**
 * Get user run history
 */
const getHistory = async (req, res) => {
  const userId = req.userId;
  const { limit = 50, startDate, endDate } = req.query;
  const runs = await RunService.getUserRunHistory(userId, parseInt(limit, 10), startDate, endDate);

  res.status(200).json({
    status: 'success',
    message: 'Run history retrieved successfully',
    count: runs.length,
    data: runs
  });
};

/**
 * Get user aggregated stats
 */
const getStats = async (req, res) => {
  const userId = req.userId;
  const stats = await RunService.getUserAggregatedStats(userId);

  res.status(200).json({
    status: 'success',
    message: 'Stats retrieved successfully',
    data: stats
  });
};

/**
 * Get weekly stats
 */
const getWeeklyStats = async (req, res) => {
  const userId = req.userId;
  const stats = await RunService.getWeeklyStats(userId);

  res.status(200).json({
    status: 'success',
    message: 'Weekly stats retrieved successfully',
    data: stats
  });
};

/**
 * Get daily stats
 */
const getDailyStats = async (req, res) => {
  const userId = req.userId;
  const { date } = req.query;
  const stats = await RunService.getDailyStats(userId, date ? new Date(date) : new Date());

  res.status(200).json({
    status: 'success',
    message: 'Daily stats retrieved successfully',
    data: stats
  });
};

module.exports = {
  submitRun,
  getHistory,
  getStats,
  getWeeklyStats,
  getDailyStats
};
