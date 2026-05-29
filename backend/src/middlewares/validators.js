const ApiError = require('../utils/ApiError');
const RUN_POLICY = require('../config/runPolicy');

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
const RESET_TOKEN_REGEX = /^[a-f\d]{64}$/i;
const COMMUNITY_POST_MAX_LENGTH = 500;
const COMMUNITY_COMMENT_MAX_LENGTH = 280;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const failIfInvalid = (errors, next) => {
  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed', errors));
  }
  return next();
};

const parseClampedInteger = (value, fallback, min, max) => {
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
};

const normalizeText = (value) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';

const isValidObjectId = (value) =>
  typeof value === 'string' && OBJECT_ID_REGEX.test(value);

const validateObjectIdParams = (...paramNames) => (req, res, next) => {
  const errors = [];
  const namesToValidate =
    paramNames.length > 0
      ? paramNames
      : Object.keys(req.params || {}).filter((key) => /(^id$|id$)/i.test(key));

  namesToValidate.forEach((name) => {
    const value = req.params?.[name];
    if (!isValidObjectId(value)) {
      errors.push(`${name} must be a valid MongoDB ObjectId`);
    }
  });

  return failIfInvalid(errors, next);
};

const validatePagination = (req, res, next) => {
  req.query.page = parseClampedInteger(req.query.page, DEFAULT_PAGE, 1, 100000);
  req.query.limit = parseClampedInteger(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
  return next();
};

const validateCommunityPost = (req, res, next) => {
  req.body = req.body || {};
  const errors = [];
  const text = normalizeText(req.body?.text);

  if (!text) {
    errors.push('Post text is required');
  } else if (text.length > COMMUNITY_POST_MAX_LENGTH) {
    errors.push(`Post text cannot exceed ${COMMUNITY_POST_MAX_LENGTH} characters`);
  }

  if (req.body?.runId !== undefined && req.body.runId !== null && req.body.runId !== '') {
    if (!isValidObjectId(req.body.runId)) {
      errors.push('runId must be a valid MongoDB ObjectId');
    } else {
      req.body.runId = String(req.body.runId);
    }
  } else {
    req.body.runId = null;
  }

  req.body.text = text;
  return failIfInvalid(errors, next);
};

const validateCommunityComment = (req, res, next) => {
  req.body = req.body || {};
  const errors = [];
  const text = normalizeText(req.body?.text);

  if (!text) {
    errors.push('Comment text is required');
  } else if (text.length > COMMUNITY_COMMENT_MAX_LENGTH) {
    errors.push(`Comment text cannot exceed ${COMMUNITY_COMMENT_MAX_LENGTH} characters`);
  }

  req.body.text = text;
  return failIfInvalid(errors, next);
};

const validateRunningEventsQuery = (req, res, next) => {
  const errors = [];
  const countryCode = normalizeText(req.query.countryCode || 'IN').toUpperCase();
  const keyword = normalizeText(req.query.keyword || 'running');
  const latitude = req.query.latitude;
  const longitude = req.query.longitude;
  const radiusKm = req.query.radiusKm;

  if (!/^[A-Z]{2}$/.test(countryCode)) {
    errors.push('countryCode must be a two-letter country code');
  }

  if (!keyword || keyword.length > 50) {
    errors.push('keyword must be between 1 and 50 characters');
  }

  req.query.countryCode = countryCode;
  req.query.keyword = keyword;
  req.query.limit = parseClampedInteger(req.query.limit, 10, 1, MAX_LIMIT);

  if (latitude !== undefined || longitude !== undefined) {
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (
      !Number.isFinite(parsedLatitude) ||
      parsedLatitude < -90 ||
      parsedLatitude > 90
    ) {
      errors.push('latitude must be between -90 and 90');
    }

    if (
      !Number.isFinite(parsedLongitude) ||
      parsedLongitude < -180 ||
      parsedLongitude > 180
    ) {
      errors.push('longitude must be between -180 and 180');
    }

    req.query.latitude = parsedLatitude;
    req.query.longitude = parsedLongitude;
  }

  if (radiusKm !== undefined) {
    const parsedRadius = Number(radiusKm);
    if (!Number.isFinite(parsedRadius) || parsedRadius <= 0 || parsedRadius > 250) {
      errors.push('radiusKm must be greater than 0 and no more than 250');
    }
    req.query.radiusKm = parsedRadius;
  }

  return failIfInvalid(errors, next);
};

const validateSignup = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;
  const errors = [];

  if (!name || name.trim() === '') {
    errors.push('Name is required');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!password || password.length < 10) {
    errors.push('Password must be at least 10 characters');
  } else if (!isStrongPassword(password)) {
    errors.push('Password must include uppercase, lowercase, number, and symbol characters');
  } else if (isCommonPassword(password)) {
    errors.push('Password is too common');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  return failIfInvalid(errors, next);
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  return failIfInvalid(errors, next);
};

const validateForgotPassword = (req, res, next) => {
  req.body = req.body || {};
  const { email } = req.body;
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  } else {
    req.body.email = String(email).trim().toLowerCase();
  }

  return failIfInvalid(errors, next);
};

const validateResetPassword = (req, res, next) => {
  req.body = req.body || {};
  const { token, password, confirmPassword } = req.body;
  const errors = [];

  if (!token || typeof token !== 'string' || !RESET_TOKEN_REGEX.test(token)) {
    errors.push('Valid password reset token is required');
  }

  if (!password || password.length < 10) {
    errors.push('Password must be at least 10 characters');
  } else if (!isStrongPassword(password)) {
    errors.push('Password must include uppercase, lowercase, number, and symbol characters');
  } else if (isCommonPassword(password)) {
    errors.push('Password is too common');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (typeof token === 'string') {
    req.body.token = token.trim();
  }

  return failIfInvalid(errors, next);
};

const validateRunSubmission = (req, res, next) => {
  const { coordinates, clientRunId } = req.body;
  const errors = [];

  if (!clientRunId || String(clientRunId).trim().length < 8) {
    errors.push('clientRunId is required and must be stable for retry safety');
  }

  if (!Array.isArray(coordinates) || coordinates.length < RUN_POLICY.MIN_SAVE_COORDINATES) {
    errors.push(`Coordinates array must include at least ${RUN_POLICY.MIN_SAVE_COORDINATES} GPS samples`);
  } else if (coordinates.length > 10000) {
    errors.push('Coordinates array cannot exceed 10000 samples');
  } else if (!coordinates.every(isValidCoordinateShape)) {
    errors.push('Each coordinate must include valid latitude, longitude, and timestamp');
  }

  return failIfInvalid(errors, next);
};

const validateLocationUpdate = (req, res, next) => {
  const { latitude, longitude } = req.body;
  const errors = [];

  if (latitude === undefined || latitude === null) {
    errors.push('Latitude is required');
  } else if (isNaN(latitude) || latitude < -90 || latitude > 90) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (longitude === undefined || longitude === null) {
    errors.push('Longitude is required');
  } else if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    errors.push('Longitude must be between -180 and 180');
  }

  return failIfInvalid(errors, next);
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email || '').trim().toLowerCase());
};

const isStrongPassword = (password) =>
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

const isCommonPassword = (password) => {
  const normalized = String(password || '').toLowerCase();
  return [
    'password',
    'password123',
    'qwerty123',
    'admin123',
    'milesaway',
    '1234567890'
  ].includes(normalized);
};

const isValidCoordinateShape = (coordinate) => {
  if (!coordinate) {
    return false;
  }

  const latitude = Number(coordinate.latitude);
  const longitude = Number(coordinate.longitude);
  const timestamp = coordinate.timestamp ? new Date(coordinate.timestamp) : null;

  return (
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    timestamp instanceof Date &&
    !Number.isNaN(timestamp.getTime())
  );
};

module.exports = {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateRunSubmission,
  validateLocationUpdate,
  validateObjectIdParams,
  validatePagination,
  validateCommunityPost,
  validateCommunityComment,
  validateRunningEventsQuery,
  isValidObjectId
};
