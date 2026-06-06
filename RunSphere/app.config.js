const app = require('./app.json');

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

module.exports = {
  ...app.expo,
  android: {
    ...app.expo.android,
    config: googleMapsApiKey
      ? {
          ...(app.expo.android?.config || {}),
          googleMaps: {
            ...(app.expo.android?.config?.googleMaps || {}),
            apiKey: googleMapsApiKey,
          },
        }
      : app.expo.android?.config,
  },
};
