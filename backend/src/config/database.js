const mongoose = require('mongoose');
const config = require('./env');

mongoose
  .connect(config.DATABASE_URL)
  .then(() => {
    console.log('[MilesAway] MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('[MilesAway] MongoDB connection failed:', err.message);
    process.exit(1);
  });

mongoose.connection.on('disconnected', () => {
  console.warn('[MilesAway] MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('[MilesAway] MongoDB error:', err.message);
});

module.exports = mongoose.connection;
