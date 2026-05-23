const AuthService = require('../services/authService');
const config = require('../config/env');

/**
 * Signup endpoint handler
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, and password are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Passwords do not match'
      });
    }

    const user = await AuthService.register({ name, email, password });
    const token = AuthService.generateToken(user._id);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Login endpoint handler
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    // Login user
    const { token, user } = await AuthService.login({ email, password });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user
    });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }

    const resetToken = await AuthService.createPasswordReset({ email });
    const response = {
      status: 'success',
      message: 'If an account exists, password reset instructions are ready.'
    };

    if ((!config.isProduction || config.ALLOW_RESET_TOKEN_RESPONSE) && resetToken) {
      response.resetToken = resetToken;
    }

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Token and password are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Passwords do not match'
      });
    }

    const { token: authToken, user } = await AuthService.resetPassword({
      token,
      password
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully',
      token: authToken,
      user
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword
};
