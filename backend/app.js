const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./src/config/env');
require('./src/config/database');

// ==================== MIDDLEWARE & UTILITIES ====================
const logger = require('./src/middlewares/logger');
const errorHandler = require('./src/middlewares/errorHandler');
const apiRoutes = require('./src/routes');
const { renderDeleteAccountPage } = require('./src/utils/deleteAccountPage');

const app = express();

// ==================== GLOBAL MIDDLEWARE ====================

// Request logging
app.use(logger);

// Security headers and explicit cross-origin policy.
app.use(helmet());
app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin || config.CORS_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin not allowed'));
  }
}));

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// ==================== ROUTES ====================

app.get('/delete-account-milesaway', (req, res) => {
  res.status(200).type('html').send(renderDeleteAccountPage());
});

app.use('/api', apiRoutes);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
