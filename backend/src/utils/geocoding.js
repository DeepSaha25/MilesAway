const GEOCODE_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const geocodeCache = new Map();

const buildFallbackLocation = (latitude, longitude) => ({
  latitude,
  longitude,
  city: null,
  district: null,
  state: null,
  country: null
});

const normalizeGoogleResponse = (latitude, longitude, result) => {
  const addressComponents = result?.results?.[0]?.address_components || [];
  const location = buildFallbackLocation(latitude, longitude);

  addressComponents.forEach((component) => {
    const types = component.types || [];

    if (!location.city && (types.includes('locality') || types.includes('postal_town'))) {
      location.city = component.long_name;
    }

    if (!location.city && types.includes('sublocality_level_1')) {
      location.city = component.long_name;
    }

    if (!location.district && types.includes('administrative_area_level_2')) {
      location.district = component.long_name;
    }

    if (!location.state && types.includes('administrative_area_level_1')) {
      location.state = component.long_name;
    }

    if (!location.country && types.includes('country')) {
      location.country = component.long_name;
    }
  });

  return location;
};

const normalizeNominatimResponse = (latitude, longitude, result) => {
  const address = result?.address || {};

  return {
    latitude,
    longitude,
    city: address.city || address.town || address.village || address.municipality || address.suburb || null,
    district: address.county || address.state_district || address.region || null,
    state: address.state || address.region || null,
    country: address.country || null
  };
};

const fetchGoogleGeocode = async (latitude, longitude, apiKey) => {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('latlng', `${latitude},${longitude}`);
  url.searchParams.set('key', apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google geocoding failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload.status !== 'OK') {
    throw new Error(`Google geocoding returned status ${payload.status}`);
  }

  return normalizeGoogleResponse(latitude, longitude, payload);
};

const fetchNominatimGeocode = async (latitude, longitude) => {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', latitude);
  url.searchParams.set('lon', longitude);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('zoom', '12');
  url.searchParams.set('addressdetails', '1');

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MilesAway/1.0 (contact: local-dev)',
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Nominatim geocoding failed with status ${response.status}`);
  }

  const payload = await response.json();
  return normalizeNominatimResponse(latitude, longitude, payload);
};

/**
 * Get location (city, district, state) from latitude and longitude.
 * Prefer Google if configured, otherwise fall back to OpenStreetMap/Nominatim.
 */
const getLocationFromCoordinates = async (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return buildFallbackLocation(latitude, longitude);
  }

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = geocodeCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let value = buildFallbackLocation(lat, lng);

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    value = apiKey
      ? await fetchGoogleGeocode(lat, lng, apiKey)
      : await fetchNominatimGeocode(lat, lng);
  } catch (error) {
    value = buildFallbackLocation(lat, lng);
  }

  geocodeCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS
  });

  return value;
};

module.exports = {
  getLocationFromCoordinates
};
