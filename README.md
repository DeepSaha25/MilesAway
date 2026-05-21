# RunSphere

RunSphere is a full-stack running-social application consisting of a React Native TypeScript frontend and a Node.js/Express backend. It lets users track runs, share activity to a community feed, and view leaderboards and aggregated metrics.

## Core concepts

- **User**: registered people who sign in, have profiles and social interactions.
- **Run**: GPS-tracked activity with distance, duration, route and metadata.
- **Post / Community Feed**: users can share runs and messages; feed is powered by backend controllers and services.
- **DailyAggregate**: precomputed daily summaries for leaderboards and analytics.
- **Leaderboard**: ranking system derived from aggregates and run data.
- **Auth**: authentication using token-based (JWT) flows and session handling.

These concepts map to the backend models in `backend/src/models` and to frontend screens and services in `RunSphere/src`.

## Architecture overview

- **Frontend (mobile app)**: React Native + TypeScript. Key folders: `src/components`, `src/screens`, `src/services`, `src/store`, and `src/navigation`. API client configuration lives in `src/config/api.ts`.
- **Backend (API server)**: Node.js + Express. Organization follows `routes -> controllers -> services -> models` with helpers and middlewares under `src/middlewares` and `src/utils`. Database configuration is under `src/config`.

See detailed architecture documentation in the `docs/architecture` folder.

## Quick start

Backend (server):

```bash
cd backend
npm install
# start the server (depends on package scripts)
npm run start # or `node server.js`
```

Frontend (mobile app):

```bash
cd RunSphere
npm install
# start Expo and scan the QR code with Expo Go on your phone
npm start -- --tunnel
```

If you need a shareable build, use EAS from the `RunSphere` folder:

```bash
npm run eas:build
```

## Important files

- Backend entry: [backend/app.js](backend/app.js)
- Backend server: [backend/server.js](backend/server.js)
- Backend config: [backend/src/config/database.js](backend/src/config/database.js)
- Frontend entry: [RunSphere/index.js](RunSphere/index.js)
- Frontend app: [RunSphere/App.tsx](RunSphere/App.tsx)

## Docs

Detailed architecture docs live in `docs/architecture`:

- [docs/architecture/frontend.md](docs/architecture/frontend.md)
- [docs/architecture/backend.md](docs/architecture/backend.md)

## Contributing

If you want changes to documentation or architecture diagrams, open a PR with updated content in `docs/`.

## License

Specify your project license here.
