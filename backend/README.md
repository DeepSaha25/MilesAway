# MilesAway Backend - Production Ready Setup

A robust, scalable Node.js/Express backend for **MilesAway**, a community-based running and fitness tracking application with multi-level geographic leaderboards.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Architecture](#architecture)
- [Testing](#testing)
- [Error Handling](#error-handling)
- [Security](#security)

---

## ✨ Features

- ✅ **User Authentication** - JWT-based signup/login with password hashing
- ✅ **GPS Run Tracking** - Full coordinate path storage with anti-cheat validation
- ✅ **Multi-Level Leaderboards** - City, District, State, Country rankings
- ✅ **Time-Period Leaderboards** - Today, Weekly, Monthly rankings
- ✅ **User Profiles** - Location tracking via Google Maps Geocoding API
- ✅ **Streak System** - Consecutive day tracking with IST timezone support
- ✅ **Anti-Cheat Validation** - Speed limit enforcement (25 km/h max)
- ✅ **Aggregated Statistics** - Daily, weekly, monthly user stats
- ✅ **Redis-Ready Caching** - Leaderboard cache structure prepared for Phase 2
- ✅ **Production Error Handling** - Comprehensive middleware & error handlers

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 16+ |
| **Framework** | Express.js 5.x |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (JSON Web Tokens) |
| **Password Hashing** | bcryptjs |
| **Timezone Handling** | moment-timezone (IST: GMT+5:30) |
| **API Testing** | Thunder Client / Postman |
| **Dev Tools** | nodemon (auto-reload) |

---

## 📦 Prerequisites

Before starting, ensure you have:

1. **Node.js** v16 or higher
   ```bash
   node --version  # Should be v16+
   npm --version   # Should be 7+
   ```

2. **MongoDB Atlas Account** (free tier)
   - Create cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Generate connection string with your credentials

3. **Google Maps API Key**
   - You already have this (as confirmed)
   - Ensure Geocoding API is enabled in Google Cloud Console

4. **Git** (optional, for version control)

---

## 🚀 Installation

### Step 1: Clone/Navigate to Project

```bash
cd c:\Users\Deep Saha\Desktop\MilesAway\backend
```

### Step 2: Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

Verify installation:

```bash
npm list --depth=0
```

Expected output should show:
- express
- mongoose
- dotenv
- cors
- jsonwebtoken
- bcryptjs
- moment-timezone
- nodemon (dev)

---

## 🔑 Configuration

### Step 1: Setup Environment Variables

Copy `.env.example` to `.env` (already created):

```bash
copy .env.example .env
```

### Step 2: Update `.env` with Your Credentials

Edit `.env` file:

```env
# Database - REQUIRED: Paste the full MongoDB Atlas URI copied from Atlas
# Example format intentionally omitted to avoid committing credential-shaped strings
DATABASE_URL=PASTE_YOUR_MONGODB_ATLAS_URI_HERE

# JWT - Change these in production
JWT_SECRET=change_this_to_a_strong_secret_key_in_production
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# Google Maps API - Use your provided API key
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key

# Timezone
TIMEZONE=Asia/Kolkata
```

### Step 3: Verify MongoDB Connection

Test database connection:

```bash
node -e "require('./src/config/database').on('connected', () => { console.log('✅ Connected'); process.exit(0); })"
```

---

## ▶️ Running the Server

### Development Mode (Auto-reload with Nodemon)

```bash
npm run dev
```

Expected output:
```
📍 [timestamp] | GET /api/health
✅ MongoDB connected successfully
✅ MilesAway backend running on port 5000
📍 Timezone: Asia/Kolkata
🔧 Environment: development
```

### Production Mode

```bash
npm start
```

### Test Server is Running

In another terminal:

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "OK",
  "message": "MilesAway backend is running",
  "timestamp": "2026-04-13T10:30:00.000Z"
}
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All protected endpoints require JWT token in header:

```
Authorization: Bearer <your_jwt_token>
```

---

### 1. **Authentication Endpoints**

#### POST `/auth/signup`

Register a new user.

**Request:**
```json
{
  "name": "John Runner",
  "email": "john@example.com",
  "password": "securePass123",
  "confirmPassword": "securePass123"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "User registered successfully. Please login.",
  "user": {
    "_id": "663a1b2c3d4e5f6g7h8i9j0k",
    "name": "John Runner",
    "email": "john@example.com",
    "totalDistance": 0,
    "streak": 0,
    "timezone": "Asia/Kolkata",
    "createdAt": "2026-04-13T10:30:00.000Z"
  }
}
```

#### POST `/auth/login`

Login and get JWT token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePass123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "663a1b2c3d4e5f6g7h8i9j0k",
    "name": "John Runner",
    "email": "john@example.com",
    "totalDistance": 15.5,
    "streak": 3
  }
}
```

---

### 2. **User Endpoints**

#### GET `/user/profile`

Get user profile (requires auth).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "663a1b2c3d4e5f6g7h8i9j0k",
    "name": "John Runner",
    "email": "john@example.com",
    "location": {
      "latitude": 28.7041,
      "longitude": 77.1025,
      "city": "Delhi",
      "district": "New Delhi",
      "state": "Delhi",
      "country": "India"
    },
    "totalDistance": 15.5,
    "streak": 3,
    "lastRunDate": "2026-04-13T08:00:00.000Z"
  }
}
```

#### PUT `/user/location`

Update user location (requires auth).

**Request:**
```json
{
  "latitude": 28.7041,
  "longitude": 77.1025
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Location updated successfully",
  "data": {
    "_id": "663a1b2c3d4e5f6g7h8i9j0k",
    "location": {
      "latitude": 28.7041,
      "longitude": 77.1025,
      "city": "Delhi",
      "district": "New Delhi",
      "state": "Delhi",
      "country": "India"
    }
  }
}
```

#### GET `/user/stats`

Get user statistics (requires auth).

**Response (200):**
```json
{
  "status": "success",
  "message": "Stats retrieved successfully",
  "data": {
    "userId": "663a1b2c3d4e5f6g7h8i9j0k",
    "name": "John Runner",
    "totalDistance": 15.5,
    "streak": 3,
    "lastRunDate": "2026-04-13T08:00:00.000Z"
  }
}
```

---

### 3. **Run Tracking Endpoints**

#### POST `/run/add`

Submit a new run (requires auth).

**Request:**
```json
{
  "distance": 5.2,
  "duration": 1860,
  "coordinates": [
    { "latitude": 28.7041, "longitude": 77.1025, "timestamp": "2026-04-13T06:00:00Z" },
    { "latitude": 28.7050, "longitude": 77.1030, "timestamp": "2026-04-13T06:05:00Z" },
    { "latitude": 28.7060, "longitude": 77.1035, "timestamp": "2026-04-13T06:10:00Z" }
  ],
  "date": "2026-04-13T06:00:00Z"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Run submitted successfully",
  "data": {
    "_id": "663a1b2c3d4e5f6g7h8i9j0k",
    "userId": "663a1b2c3d4e5f6g7h8i9j0k",
    "distance": 5.2,
    "duration": 1860,
    "avgSpeed": 10.06,
    "coordinates": [...],
    "date": "2026-04-13T06:00:00Z",
    "createdAt": "2026-04-13T06:30:00Z"
  }
}
```

**Error - Speed Too High (400):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Invalid run: Average speed (50.00 km/h) exceeds 25 km/h limit"
}
```

#### GET `/run/history`

Get user run history (requires auth).

**Query Params:**
```
?limit=50&startDate=2026-04-01&endDate=2026-04-13
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Run history retrieved successfully",
  "count": 3,
  "data": [
    {
      "_id": "663a1b2c3d4e5f6g7h8i9j0k",
      "distance": 5.2,
      "duration": 1860,
      "avgSpeed": 10.06,
      "date": "2026-04-13T06:00:00Z"
    },
    ...
  ]
}
```

#### GET `/run/stats`

Get aggregated run statistics (requires auth).

**Response (200):**
```json
{
  "status": "success",
  "message": "Stats retrieved successfully",
  "data": {
    "totalDistance": 15.5,
    "totalDuration": 5400,
    "totalRuns": 3,
    "avgSpeed": 10.35
  }
}
```

#### GET `/run/weekly-stats`

Get stats for last 7 days (requires auth).

#### GET `/run/daily-stats`

Get stats for a specific day (requires auth).

**Query Params:**
```
?date=2026-04-13
```

---

### 4. **Leaderboard Endpoints**

#### GET `/leaderboard/local`

Get city-level leaderboard (requires auth & location set).

**Query Params:**
```
?timePeriod=today|weekly|monthly&limit=100
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Local leaderboard retrieved successfully",
  "timePeriod": "today",
  "level": "city",
  "location": "Delhi",
  "count": 25,
  "yourRank": 5,
  "data": [
    {
      "rank": 1,
      "userId": "663a1b2c3d4e5f6g7h8i9j0k",
      "name": "Alice Runner",
      "totalDistance": 25.3,
      "totalRuns": 5,
      "avgSpeed": 10.5,
      "streak": 5,
      "location": { "city": "Delhi", "district": "New Delhi", "state": "Delhi" }
    },
    {
      "rank": 2,
      "userId": "663a1b2c3d4e5f6g7h8i9j0k",
      "name": "Bob Jogger",
      "totalDistance": 18.7,
      "totalRuns": 3,
      "avgSpeed": 9.8,
      "streak": 2
    },
    ...
  ]
}
```

#### GET `/leaderboard/city`

Get city-level leaderboard (same as `/local`).

#### GET `/leaderboard/district`

Get district-level leaderboard.

**Query Params:**
```
?timePeriod=today|weekly|monthly&limit=100
```

#### GET `/leaderboard/state`

Get state-level leaderboard.

#### GET `/leaderboard/country`

Get country-level leaderboard.

---

## 💾 Database Schema

### User Collection

```javascript
{
  _id: ObjectId,
  name: String (required, max 100),
  email: String (required, unique),
  password: String (hashed, required),
  location: {
    latitude: Number,
    longitude: Number,
    city: String,
    district: String,
    state: String,
    country: String
  },
  totalDistance: Number (default: 0),
  streak: Number (default: 0),
  lastRunDate: Date,
  timezone: String (default: 'Asia/Kolkata'),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- email (unique)
- location.city
- location.district
- location.state

### Run Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (reference to User),
  distance: Number (required, >0),
  duration: Number (required, >0),
  coordinates: [
    {
      latitude: Number,
      longitude: Number,
      timestamp: Date
    }
  ],
  date: Date,
  avgSpeed: Number,
  caloriesBurned: Number,
  createdAt: Date
}
```

**Indexes:**
- userId + date (for leaderboard queries)
- date
- createdAt

---

## 🏗️ Architecture

### Folder Structure

```
/backend
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── User.js              # User schema & methods
│   │   └── Run.js               # Run schema & validation
│   ├── services/
│   │   ├── authService.js       # Auth logic (signup, login, JWT)
│   │   ├── userService.js       # User profile & location updates
│   │   ├── runService.js        # Run submission & stats
│   │   └── leaderboardService.js # Leaderboard aggregation (CRITICAL)
│   ├── controllers/
│   │   ├── authController.js    # Auth route handlers
│   │   ├── userController.js    # User route handlers
│   │   ├── runController.js     # Run route handlers
│   │   └── leaderboardController.js # Leaderboard handlers
│   ├── routes/
│   │   ├── index.js             # Main router
│   │   ├── auth.js              # Auth routes
│   │   ├── user.js              # User routes
│   │   ├── run.js               # Run routes
│   │   └── leaderboard.js       # Leaderboard routes
│   ├── middlewares/
│   │   ├── auth.js              # JWT verification
│   │   ├── errorHandler.js      # Global error handler
│   │   ├── logger.js            # Request logging
│   │   └── validators.js        # Request validation
│   └── utils/
│       ├── asyncWrapper.js      # Async error wrapper
│       └── geocoding.js         # Google Maps API integration
├── app.js                        # Express app setup
├── server.js                     # Entry point
├── package.json                  # Dependencies
├── .env                          # Environment variables (git ignored)
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

### Data Flow

```
Client Request
  ↓
Authentication Middleware (JWT verification)
  ↓
Request Logging Middleware
  ↓
Route Handler (Controller)
  ↓
Business Logic (Service)
  ↓
Database Operation (Model)
  ↓
Response or Error
  ↓
Error Handler Middleware
  ↓
Client Response
```

---

## 🧪 Testing

### Using Thunder Client

1. **Import Collection** (when available):
   - File → Import → Select `thunder-collection.json`

2. **Manual Testing Steps**:

   **Step 1: Signup**
   ```
   POST http://localhost:5000/api/auth/signup
   Content-Type: application/json

   {
     "name": "Test User",
     "email": "test@example.com",
     "password": "Test@123456",
     "confirmPassword": "Test@123456"
   }
   ```

   **Step 2: Login** (save token)
   ```
   POST http://localhost:5000/api/auth/login
   Content-Type: application/json

   {
     "email": "test@example.com",
     "password": "Test@123456"
   }
   
   → Copy token from response
   ```

   **Step 3: Update Location**
   ```
   PUT http://localhost:5000/api/user/location
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "latitude": 28.7041,
     "longitude": 77.1025
   }
   ```

   **Step 4: Submit Run**
   ```
   POST http://localhost:5000/api/run/add
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "distance": 5.2,
     "duration": 1860,
     "coordinates": [
       { "latitude": 28.7041, "longitude": 77.1025 },
       { "latitude": 28.7050, "longitude": 77.1030 },
       { "latitude": 28.7060, "longitude": 77.1035 }
     ]
   }
   ```

   **Step 5: Get Leaderboard**
   ```
   GET http://localhost:5000/api/leaderboard/city?timePeriod=today
   Authorization: Bearer <token>
   ```

### Testing Anti-Cheat

```
POST http://localhost:5000/api/run/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "distance": 50,
  "duration": 60,
  "coordinates": [
    { "latitude": 28.7041, "longitude": 77.1025 },
    { "latitude": 28.7050, "longitude": 77.1030 }
  ]
}

→ Expected: 400 error (3000 km/h average speed)
```

---

## 🐛 Error Handling

### Standard Error Response

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Error description"
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request (validation failed) |
| 401 | Unauthorized (missing/invalid token) |
| 404 | Not Found |
| 409 | Conflict (duplicate email, etc.) |
| 500 | Internal Server Error |

### Examples

**Missing Token:**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "No token provided. Use Bearer token in Authorization header"
}
```

**Invalid Email:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["Valid email is required"]
}
```

**Anti-Cheat Triggered:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Invalid run: Average speed (50.00 km/h) exceeds 25 km/h limit"
}
```

---

## 🔒 Security

- ✅ **Password Hashing**: bcryptjs with salt rounds = 10
- ✅ **JWT Secrets**: Store in `.env` (never commit)
- ✅ **CORS Enabled**: Restrict to frontend domain in production
- ✅ **Input Validation**: All endpoints validate inputs
- ✅ **Rate Limiting**: Ready for Phase 2 implementation
- ✅ **SQL Injection Protection**: Mongoose ODM prevents injection
- ✅ **Error Messages**: Don't expose sensitive info in production

### Production Checklist

- [ ] Update `JWT_SECRET` to strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS only
- [ ] Restrict CORS to trusted domains
- [ ] Setup MongoDB Atlas IP whitelist
- [ ] Enable rate limiting
- [ ] Setup monitoring & logging (Sentry, ELK)
- [ ] Backup database regularly

---

## 📝 Next Steps

### Phase 2 (Planned Enhancements)

- [ ] Redis integration for leaderboard caching
- [ ] GPS path validation (teleportation detection)
- [ ] Timezone-aware streak logic enhancement
- [ ] Social features (friends, challenges)
- [ ] Notifications (milestone achievements)
- [ ] Rate limiting on endpoints
- [ ] Advanced analytics & heatmaps
- [ ] Admin dashboard

### Connecting React Native Frontend

After backend is running:

1. Install React Native CLI
2. Create React Native project
3. Setup API base URL in frontend `.env`
4. Implement auth flow (signup → login → get token)
5. Create screens for home, leaderboard, run tracking
6. Connect endpoints to React Native screens

---

## 📞 Troubleshooting

### MongoDB Connection Error

**Error**: `MongoServerSelectionError`

**Solution**:
1. Check MongoDB Atlas IP whitelist (add your IP)
2. Verify `DATABASE_URL` in `.env`
3. Ensure `retryWrites=true` in connection string

### JWT Token Issues

**Error**: `Invalid or expired token`

**Solution**:
1. Ensure token is in `Authorization: Bearer <token>` format
2. Login again to get fresh token
3. Check `JWT_SECRET` matches in `.env`

### Google Maps API Error

**Error**: `API_KEY_INVALID` or `ZERO_RESULTS`

**Solution**:
1. Verify API key in Google Cloud Console
2. Enable Geocoding API
3. Check coordinate validity (India coordinates only)
4. API key will work with fallback to raw lat/lng

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or use different port
PORT=5001 npm run dev
```

---

## 📄 License

ISC

---

## ✏️ Comments & Support

For issues or feature requests, create a ticket in the project repository.

---

**Last Updated**: April 13, 2026  
**Backend Version**: 1.0.0  
**Node Version**: 16+ recommended
