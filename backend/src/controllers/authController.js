const AuthService = require('../services/authService');
const config = require('../config/env');

/**
 * Signup endpoint handler
 */
const signup = async (req, res) => {
  const { name, email, password } = req.body;
  const user = await AuthService.register({ name, email, password });
  const token = AuthService.generateToken(user._id);

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    token,
    user: user.toJSON()
  });
};

/**
 * Login endpoint handler
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  const { token, user } = await AuthService.login({ email, password });

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    token,
    user
  });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const resetToken = await AuthService.createPasswordReset({ email });
  const response = {
    status: 'success',
    message: 'If an account exists, password reset instructions are ready.'
  };

  if ((!config.isProduction || config.ALLOW_RESET_TOKEN_RESPONSE) && resetToken) {
    response.resetToken = resetToken;
  }

  res.status(200).json(response);
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
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
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword
};
