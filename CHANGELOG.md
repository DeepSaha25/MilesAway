# Changelog

This file records project changes in a simple, AI-friendly format. Every AI-assisted change should add a new entry at the top.

## Entry Template

```md
## vX.Y.Z - YYYY-MM-DD

### Summary
- Short description of the change.

### Files Changed
- `path/to/file`: what changed and why.

### Verification
- Command or manual check performed.

### Notes
- Risks, follow-ups, or decisions worth remembering.
```

## v0.2.2 - 2026-05-27

### Summary
- Made the Run Summary close/back flow save-first so a valid finished run cannot be discarded by tapping X, pressing Android back, or leaving the summary before save completes.
- Preserved pending summary runs if the tracking screen is reopened, redirecting users back to the unsaved summary instead of resetting route data.
- Temporarily lowered saved-run validation to at least 0.01 km, 30 seconds, and two GPS samples for easier testing.
- Fixed backend run save middleware compatibility with the current Mongoose version, resolving the `next is not a function` save failure.
- Made saved-run metrics recover from MongoDB on dashboard/stat reads by rebuilding per-user derived totals and leaderboard aggregates from permanent run records.
- Updated distance displays to preserve decimal precision for very short saved runs instead of showing them as 0.0 km.
- Sent app timer metadata with run submissions so short runs use the displayed elapsed duration instead of only the accepted GPS point span.
- Preserved three-decimal live run distance so short test walks visibly progress before reaching 0.01 km.

### Files Changed
- `RunSphere/src/screens/RunSummaryScreen.tsx`: added a visible X close action, duplicate-save protection, navigation/back guards, and retry-on-close behavior that only leaves after a successful save.
- `RunSphere/src/screens/RunTrackingScreen.tsx`: prevents summary-state runs from being reset and updates Finish validation/copy for the auto-save flow.
- `backend/src/services/runService.js`: lowered server-side minimum saved-run distance and duration, and rebuilds user totals/daily aggregates from saved MongoDB runs on save and stats refresh.
- `backend/src/controllers/runController.js`: forwards client run timing metadata for server-side duration validation.
- `RunSphere/src/services/runService.ts`: includes started time, finished time, and elapsed seconds in run submissions.
- `backend/src/models/Run.js`: updated model validation helper messages for the temporary saved-run threshold and converted save middleware away from callback-style `next`.
- `backend/test/runService.test.js`: added coverage for the temporary short-run validation threshold and app-timer duration handling.
- `RunSphere/src/utils/runMetrics.ts`: added decimal-preserving distance formatting for short runs.
- `RunSphere/src/store/runStore.ts`: keeps live run distance at three-decimal precision instead of rounding each GPS segment to two decimals.
- `RunSphere/src/components/LiveRunMap.tsx`: displays live distance with the shared decimal-preserving formatter.
- `RunSphere/src/store/userStore.ts`: derives a temporary UI fallback from MongoDB-backed run history if aggregate endpoints briefly return zero.
- `RunSphere/src/screens/HomeScreen.tsx`, `RunSphere/src/screens/ProfileScreen.tsx`, `RunSphere/src/screens/LeaderboardScreen.tsx`, `RunSphere/src/screens/HistoryScreen.tsx`, `RunSphere/src/screens/CommunityFeedScreen.tsx`: switched distance display to the decimal-preserving formatter.
- `CHANGELOG.md`: documented the run summary save-first safety fix.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- `npm run lint` passed with existing warnings only for unused `no-console` disable comments in unrelated files.
- A fresh Expo/EAS update or app rebuild is needed before installed devices receive this fix.

## v0.2.1 - 2026-05-26

### Summary
- Restricted Ticketmaster running event discovery to the user's nearby location when GPS is available, with India as the country fallback instead of global/US-biased results.
- Reworked the Community running events board into large photo-backed event blocks with event name, date/status, and location.
- Changed completed valid runs to auto-save after the user confirms Finish, with retry behavior if saving fails.
- Added recent saved runs to the Profile dashboard and renamed Weekly Volume to This Week's Distance.
- Labeled external running event links as Event Details instead of ticket-buying actions.

### Files Changed
- `backend/src/services/runningEventService.js`: added location radius support, future-event filtering, running-event filtering, India fallback, and Ticketmaster image/location normalization.
- `backend/src/controllers/communityController.js`: accepts latitude, longitude, radius, and India country fallback for running event queries.
- `RunSphere/src/services/communityService.ts`: sends structured event query parameters, including optional device coordinates and radius.
- `RunSphere/src/screens/CommunityFeedScreen.tsx`: requests current location for the race board, falls back to the saved user country or India, and renders larger image event cards.
- `RunSphere/src/screens/RunSummaryScreen.tsx`: replaced manual post-run saving with automatic saving, saved confirmation, and retry state that preserves route data on failure.
- `RunSphere/src/screens/ProfileScreen.tsx`: added recent run cards with route previews and clarified the weekly distance section wording.
- `backend/src/services/runningEventService.js`: exposes Ticketmaster links as event detail URLs so the app can treat them as information pages rather than ticket purchase actions.
- `CHANGELOG.md`: documented the Ticketmaster event location and UI update.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd backend && npm test`

### Notes
- Device GPS takes priority over country fallback. If location permission is denied or unavailable, the app uses the saved user country, then `IN`.
- A valid run now saves after Finish confirmation; users no longer need to find a separate Save Run button on the summary screen.
- Existing unrelated generated/dist worktree changes were left untouched.

## v0.2.0 - 2026-05-26

### Summary
- Added a Global leaderboard that includes newly joined users before their first run.
- Updated the Ranks screen to default to Global, removed Local from the app tabs, and refined leaderboard row sizing.
- Added a lightweight MilesAway signature section to the bottom of the Home screen.

### Files Changed
- `backend/src/services/leaderboardService.js`: added global leaderboard support, switched ranking to include zero-run users from MongoDB users, and made rank calculation work without the previous aggregate-only requirement.
- `backend/src/controllers/leaderboardController.js`: exposed the global leaderboard response payload.
- `backend/src/routes/leaderboard.js`: added the `/api/leaderboard/global` route.
- `RunSphere/src/config/api.ts`: added Expo public environment variable support for local Expo Go testing.
- `RunSphere/src/services/leaderboardService.ts`: added the `global` leaderboard level on the app client.
- `RunSphere/src/screens/LeaderboardScreen.tsx`: defaulted ranks to Global, removed Local from the visible tabs, and tightened row/podium sizing.
- `RunSphere/src/screens/HomeScreen.tsx`: switched dashboard rank loading to Global and added the bottom MilesAway signature copy.
- `RunSphere/src/screens/RunSummaryScreen.tsx`: switched post-run rank display to Global.
- `CHANGELOG.md`: documented the leaderboard and Home footer feature work.
- `VERSION.md`: bumped the current project version to `0.2.0`.

### Verification
- `cd backend && npm test`
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm run lint`
- Manual Expo Go testing with local backend and deployed backend after Railway deployment.

### Notes
- Backend deployment must happen before publishing app updates because the app calls `/api/leaderboard/global`.
- `npm run lint` currently reports existing warnings only for unused `no-console` disable comments.

## v0.1.1 - 2026-05-26

### Summary
- Fixed app startup auth recovery so reopening the installed app can reuse the persisted token instead of forcing login when SecureStore or Zustand hydration is unavailable.

### Files Changed
- `CHANGELOG.md`: split the auth persistence fix into its own patch version entry.
- `VERSION.md`: bumped the current project version to `0.1.1`.
- `RunSphere/src/store/authStore.ts`: reads the persisted auth token directly from AsyncStorage during bootstrap and restores it into `ApiClient` before validating the user profile.

### Verification
- `cd RunSphere && npm run lint`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && eas update --channel preview --message "Fix auth persistence on app restart"`

### Notes
- This is a JS-only app fix, so the existing APK can receive it through EAS Update. No APK rebuild is required.

## v0.1.0 - 2026-05-26

### Summary
- Added project change tracking, AI planning guidance, and CI/CD workflow configuration.
- Updated deployment flow so backend deploy runs automatically only after `CI` succeeds on `main`, while app EAS builds remain manual.

### Files Changed
- `CHANGELOG.md`: added a repeatable format for documenting AI-assisted changes.
- `VERSION.md`: added current version metadata and rules for future updates.
- `docs/AI_PROMPT_PLAN.md`: added a planning template to use before AI-assisted coding.
- `.github/workflows/ci.yml`: added app and backend CI checks.
- `.github/workflows/deploy.yml`: added Railway backend deploy after successful CI on `main`, checked out the exact commit that passed CI, kept manual backend deploy override, and kept Expo EAS app builds manual.
- `RunSphere/src/components/LiveRunMap.tsx`: moved the bearing helper outside the component and fixed the effect dependency list so app lint can pass in CI.

### Verification
- `cd RunSphere && npm test -- --runInBand`
- `cd backend && npm test`
- `cd RunSphere && npm run lint`

### Notes
- Deployment jobs require repository secrets before they can be used.
