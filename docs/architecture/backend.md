# Backend architecture

Overview

The backend is a Node.js Express application located in the `backend/` folder. It follows a layered pattern: `routes -> controllers -> services -> models` to keep HTTP routing thin and business logic testable.

Key folders

- `src/routes` — HTTP route definitions (auth, run, user, community, leaderboard).
- `src/controllers` — request handlers that validate input and call services.
- `src/services` — core business logic, orchestrates models and external APIs.
- `src/models` — data models (Mongoose schemas or similar) for `User`, `Run`, `Post`, `DailyAggregate`.
- `src/middlewares` — auth, rate limiting, error handling and logging.
- `src/utils` — API error helpers, async wrappers, geocoding helpers.

Data model highlights

- `User` — profile, authentication metadata and settings.
- `Run` — per-run telemetry, route (polyline), timestamps, distance/duration.
- `Post` — social feed items referencing `User` and optionally `Run`.
- `DailyAggregate` — aggregated metrics used to produce leaderboards and analytics quickly.

Auth and security

Authentication is token-based (JWT). Middlewares guard sensitive endpoints and rate-limiters protect expensive routes. Validate and sanitize inputs in controllers and use services for permission checks.

Important files

- App entry: [backend/app.js](../../backend/app.js)
- Server launcher: [backend/server.js](../../backend/server.js)
- Database config: [backend/src/config/database.js](../../backend/src/config/database.js)

Operational notes

- Run aggregation jobs periodically (see `backend/scripts/rebuildDailyAggregates.js`).
- Ensure environment variables for DB, JWT secret, and third-party API keys are present in your deployment.
- Add logging and metrics (request latency, error rates) for production readiness.
