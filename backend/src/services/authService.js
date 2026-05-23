const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

class AuthService {
  /**
   * Register a new user
   */
  static async register({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    // Create new user
    const user = new User({
      name,
      email: normalizedEmail,
      password
    });

    await user.save();
    return user;
  }

  /**
   * Login user and generate JWT token
   */
  static async login({ email, password }) {
    // Validate input
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    // Find user (include password field for comparison)
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user._id);

    return {
      token,
      user: user.toJSON()
    };
  }

  static async createPasswordReset({ email }) {
    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return null;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = this.hashResetToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    return resetToken;
  }

  static async resetPassword({ token, password }) {
    const user = await User.findOne({
      passwordResetToken: this.hashResetToken(token),
      passwordResetExpires: { $gt: new Date() }
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!user) {
      throw ApiError.badRequest('Password reset link is invalid or expired');
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return {
      token: this.generateToken(user._id),
      user: user.toJSON()
    };
  }

  /**
   * Generate JWT token
   */
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRE }
    );
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      return decoded;
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired token');
    }
  }

  static hashResetToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = AuthService;
