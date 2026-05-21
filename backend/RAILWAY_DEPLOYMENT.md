# Railway Deployment

This backend is ready to deploy as a Railway service from the `backend` directory.

## Railway service settings

When creating the service from GitHub with the current root-level `Dockerfile`, set:

```text
Root Directory: /
Builder: Dockerfile
Dockerfile Path: Dockerfile
Build Command: leave empty
Start Command: leave empty
Healthcheck Path: /api/health
```

The root `railway.json` includes these settings. If Railway still logs `using build driver nixpacks`, open the service settings and change the builder from Nixpacks/Railpack to Dockerfile, then redeploy the latest Git commit.

If you prefer to deploy with the root directory set to `backend`, remove the root Dockerfile setup and use:

```text
Root Directory: backend
Build Command: npm ci
Start Command: npm start
Healthcheck Path: /api/health
```

## Environment variables

Add these in Railway > your backend service > Variables:

```env
NODE_ENV=production
DATABASE_URL=your_mongodb_atlas_connection_string
JWT_SECRET=generate_a_random_secret_with_at_least_32_characters
JWT_EXPIRE=7d
TIMEZONE=Asia/Kolkata
CORS_ORIGINS=https://your-frontend-domain.example
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
LOCAL_LEADERBOARD_RADIUS_KM=8
```

Do not add `PORT` on Railway. Railway provides it automatically and the server already reads `process.env.PORT`.

For `CORS_ORIGINS`, use a comma-separated list if you have more than one allowed origin:

```env
CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

For a React Native mobile app, requests often do not include a browser `Origin` header. The backend allows no-origin requests. If `CORS_ORIGINS` is empty in production, browser clients with an `Origin` header are blocked, but mobile/server requests can still work.

## MongoDB Atlas checklist

1. Create or open your Atlas cluster.
2. Add a database user and password.
3. In Network Access, allow Railway to connect. The simplest setting is `0.0.0.0/0`; use tighter network controls if your Atlas plan supports them.
4. Copy the connection string into `DATABASE_URL`.
5. Make sure the URI includes your database name, for example `/milesaway`.

## Deploy procedure

1. Push this repo to GitHub.
2. In Railway, click **New Project**.
3. Choose **Deploy from GitHub repo** and select this repository.
4. Open the created service settings.
5. Set **Root Directory** to `backend`.
6. Confirm the commands:
   - Build Command: `npm ci`
   - Start Command: `npm start`
7. Add the environment variables listed above.
8. Deploy the service.
9. Open the Railway-generated domain and test:

```text
https://your-service.up.railway.app/api/health
```

The response should show `status: "OK"`.

## Mobile app API URL

After Railway gives you the public URL, configure the mobile app with:

```env
MILESAWAY_API_URL=https://your-service.up.railway.app/api
```
