require('dotenv').config();

const PLACEHOLDER_SECRETS = new Set([
  'your_super_secret_jwt_key',
  'your_super_secret_jwt_key_change_this_in_production',
  'change_this_to_a_strong_secret_key_in_production'
]);

const parseCsv = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const requireValue = (name) => {
  const value = process.env[name];
  if (!value || String(value).trim() === '') {
    throw new Error(`${name} must be set`);
  }
  return String(value).trim();
};

const requireAnyValue = (...names) => {
  for (const name of names) {
    const value = process.env[name];
    if (value && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  throw new Error(`${names.join(' or ')} must be set`);
};

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const DATABASE_URL = requireAnyValue('DATABASE_URL', 'MONGO_URI');
const JWT_SECRET = requireValue('JWT_SECRET');

if (JWT_SECRET.length < 32 || PLACEHOLDER_SECRETS.has(JWT_SECRET)) {
  throw new Error('JWT_SECRET must be a non-placeholder secret with at least 32 characters');
}

const CORS_ORIGINS = parseCsv(process.env.CORS_ORIGINS);
if (isProduction && CORS_ORIGINS.length === 0) {
  console.warn('[MilesAway] CORS_ORIGINS is empty; browser clients with an Origin header will be blocked');
}

module.exports = {
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  PORT: Number(process.env.PORT || 5000),
  NODE_ENV,
  TIMEZONE: process.env.TIMEZONE || 'Asia/Kolkata',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  CORS_ORIGINS,
  LOCAL_LEADERBOARD_RADIUS_KM: Number(process.env.LOCAL_LEADERBOARD_RADIUS_KM || 8),
  isProduction
};
