
const config = require('../config/env');

const CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_RADIUS_KM = 75;
const RUNNING_EVENT_PATTERN =
  /\b(run|running|runner|race|marathon|half marathon|ultra|trail|cross country|5k|10k|15k|relay)\b/i;

let cache = {
  key: '',
  expiresAt: 0,
  data: []
};

const formatLocation = (venue = {}) => {
  const parts = [
    venue.name,
    venue.city?.name,
    venue.state?.stateCode || venue.state?.name,
    venue.country?.countryCode
  ].filter(Boolean);

  return parts.join(', ');
};

const normalizeTicketmasterEvent = (event) => {
  const venue = event._embedded?.venues?.[0] || {};
  const start = event.dates?.start || {};

  return {
    id: event.id,
    title: event.name,
    date: start.dateTime || start.localDate || null,
    status: event.dates?.status?.code || 'scheduled',
    location: formatLocation(venue),
    city: venue.city?.name || '',
    country: venue.country?.countryCode || '',
    image: event.images?.find((img) => img.ratio === '16_9')?.url || event.images?.[0]?.url || '',
    detailsUrl: event.url,
    url: event.url,
    source: 'Ticketmaster'
  };
};

class RunningEventService {
  static async getLiveEvents({
    countryCode = 'IN',
    keyword = 'running',
    limit = 10,
    latitude,
    longitude,
    radiusKm = DEFAULT_RADIUS_KM
  } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);
    const lat = Number(latitude);
    const lon = Number(longitude);
    const hasGeo = Number.isFinite(lat) && Number.isFinite(lon);
    const safeRadiusKm = Math.min(Math.max(Number(radiusKm) || DEFAULT_RADIUS_KM, 1), 250);
    const normalizedCountryCode = String(countryCode || 'IN').trim().toUpperCase().slice(0, 2);
    const cacheKey = [
      hasGeo ? `${lat.toFixed(3)},${lon.toFixed(3)},${safeRadiusKm}` : normalizedCountryCode,
      keyword,
      safeLimit
    ].join(':');
    const now = Date.now();

    if (cache.key === cacheKey && cache.expiresAt > now) {
      return cache.data;
    }

    if (!config.TICKETMASTER_API_KEY) {
      return [];
    }

    const params = new URLSearchParams({
      apikey: config.TICKETMASTER_API_KEY,
      keyword,
      size: String(safeLimit),
      sort: 'date,asc',
      startDateTime: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    });

    if (hasGeo) {
      params.set('latlong', `${lat},${lon}`);
      params.set('radius', String(safeRadiusKm));
      params.set('unit', 'km');
    } else {
      params.set('countryCode', normalizedCountryCode);
    }

    const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
    if (!response.ok) {
      throw new Error(`Ticketmaster events request failed with ${response.status}`);
    }

    const payload = await response.json();
    const events = (payload._embedded?.events || [])
      .map(normalizeTicketmasterEvent)
      .filter((event) => event.title && event.date)
      .filter((event) => RUNNING_EVENT_PATTERN.test(`${event.title} ${event.location}`))
      .filter((event) => new Date(event.date).getTime() >= now);

    cache = {
      key: cacheKey,
      expiresAt: now + CACHE_TTL_MS,
      data: events
    };

    return events;
  }
}

module.exports = RunningEventService;
