const ApiError = require('../utils/ApiError');

const failIfInvalid = (errors, next) => {
  if (errors.length > 0) {
    return next(ApiError.badRequest('Validation failed', errors));
  }
  return next();
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

const validateRunSubmission = (req, res, next) => {
  const { coordinates, clientRunId } = req.body;
  const errors = [];

  if (!clientRunId || String(clientRunId).trim().length < 8) {
    errors.push('clientRunId is required and must be stable for retry safety');
  }

  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    errors.push('Coordinates array must include at least two GPS samples');
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
  validateRunSubmission,
  validateLocationUpdate
};
