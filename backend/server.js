const config = require('./src/config/env');
const app = require('./app');

app.listen(config.PORT, () => {
  console.log(`[MilesAway] Backend running on port ${config.PORT}`);
  console.log(`[MilesAway] Timezone: ${config.TIMEZONE}`);
  console.log(`[MilesAway] Environment: ${config.NODE_ENV}`);
});
