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

## v0.2.30 - 2026-06-04

### Summary
- Added a pure telemetry diagnostics selector for raw, preview, verified, speed, confidence, and save eligibility state.
- Replaced per-packet run GPS debug output with throttled development-only telemetry diagnostics.
- Expanded regression coverage around diagnostics and preview-vs-verified tracking behavior.

### Files Changed
- `RunSphere/src/store/runStore.ts`: added `selectTelemetryDiagnostics(...)` with point counts, latest GPS accuracy, native speed, segment speed, confidence state, save eligibility, and save-block reason.
- `RunSphere/src/screens/RunTrackingScreen.tsx`: logs `[MilesAway][telemetry]` diagnostics in development only, throttled by time or confidence-state changes.
- `RunSphere/__tests__/runStore.test.ts`: added diagnostics coverage for raw, preview, verified, speed, confidence, and save state.
- `RunSphere/src/config/appVersion.ts`: bumped the visible changelog version marker.
- `CHANGELOG.md`: documented the telemetry diagnostics and regression coverage pass.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand __tests__/runStore.test.ts`
- `cd RunSphere && npm test -- --runInBand __tests__/LiveRunMap.test.tsx`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- Diagnostics are read-only, development-only in the UI path, and are not sent to the backend.
- Save integrity remains verified-only.

## v0.2.29 - 2026-06-04

### Summary
- Locked run persistence to verified-only coordinates and distance.
- Added a clear save-blocking reason when live preview movement exists but verified running distance is too low.
- Added hook coverage proving preview-only telemetry never reaches guest storage, backend submission, dashboard refresh, or rank refresh.

### Files Changed
- `RunSphere/src/store/runStore.ts`: added save-block reason constants and `selectSaveBlockReason(...)` while keeping `selectCanSaveRun(...)` as the hard save authority.
- `RunSphere/src/hooks/useRunSummary.ts`: builds save payloads from explicit verified selectors and surfaces the selector-derived save-block reason.
- `RunSphere/src/screens/RunTrackingScreen.tsx`: reuses the same save-block reason for early Finish attempts.
- `RunSphere/__tests__/runStore.test.ts`: added save-block reason coverage for preview-only and verified-saveable runs.
- `RunSphere/__tests__/useRunSummary.test.tsx`: verifies preview-only movement is not persisted and successful backend saves submit verified coordinates only.
- `RunSphere/src/config/appVersion.ts`: bumped the visible changelog version marker.
- `CHANGELOG.md`: documented the final save-integrity cleanup.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand __tests__/runStore.test.ts __tests__/useRunSummary.test.tsx`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- Preview telemetry remains live-screen-only and is never submitted as a saved run.
- Backend validation remains strict and unchanged.

## v0.2.28 - 2026-06-04

### Summary
- Wired the live tracking screen to explicit preview telemetry fields for map route and live distance.
- Added user-friendly confidence status copy, including `Ready to save` only after verified save gates pass.
- Preserved strict verified Finish/save gating while keeping preview movement visible during live tracking.

### Files Changed
- `RunSphere/src/store/runStore.ts`: exposes `previewCoordinates` and `previewDistanceKm` on derived run metrics while keeping `live*` compatibility aliases.
- `RunSphere/src/screens/RunTrackingScreen.tsx`: passes preview route and preview distance to the live map, with `selectCanSaveRun(...)` still controlling Finish eligibility.
- `RunSphere/src/components/LiveRunMap.tsx`: maps confidence state and save eligibility into user-facing status text and hides pace for unreliable states.
- `RunSphere/__tests__/runStore.test.ts`: verifies preview metric fields remain distinct from verified save metrics.
- `RunSphere/__tests__/LiveRunMap.test.tsx`: verifies confidence messages, ready-to-save behavior, hidden unreliable pace, and removal of generic settling text.
- `RunSphere/src/config/appVersion.ts`: bumped the visible changelog version marker.
- `CHANGELOG.md`: documented the user-friendly live tracking screen wiring.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand __tests__/runStore.test.ts __tests__/LiveRunMap.test.tsx`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- The visible distance remains a clean `km` value; confidence status communicates when movement is preview-only.
- Pressing Finish early still explains the save requirement, but the save action itself remains verified-gated.

## v0.2.27 - 2026-06-04

### Summary
- Replaced the old three-state movement model with a richer live confidence engine.
- Added recent telemetry issue memory so rejected weak GPS and GPS jumps can be explained in the live UI.
- Removed generic `GPS Settling...` feedback in favor of specific confidence messages.

### Files Changed
- `RunSphere/src/store/runStore.ts`: added `ACQUIRING_GPS`, `LIVE_ESTIMATE`, `GOOD_GPS`, `WEAK_GPS`, `GPS_JUMPING`, `STATIONARY`, and `TOO_FAST_FOR_RUN` confidence states with recent telemetry issue metadata.
- `RunSphere/src/components/LiveRunMap.tsx`: maps confidence states to specific live messages and hides pace for unreliable states.
- `RunSphere/__tests__/runStore.test.ts`: added selector coverage for each confidence state and verified save gates remain strict.
- `RunSphere/__tests__/LiveRunMap.test.tsx`: added confidence message and pace-hiding coverage.
- `RunSphere/src/config/appVersion.ts`: bumped the visible changelog version marker.
- `CHANGELOG.md`: documented the live confidence state engine.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand __tests__/runStore.test.ts __tests__/LiveRunMap.test.tsx`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- Save, summary, backend validation, dashboard, history, and rank behavior remain verified-only.
- No accelerometer, step sensor, or map-matching API was added in this phase.

## v0.2.26 - 2026-06-04

### Summary
- Converted active run coordinates into a raw/provisional live session ledger.
- Added explicit preview and verified selector names so live map/distance can update without weakening saved-run math.
- Kept final save, summary, backend submission, dashboard, history, and rank updates on verified-only distance and route data.

### Files Changed
- `RunSphere/src/store/runStore.ts`: stores live-sane GPS packets without jitter-gating, adds preview/verified selector aliases, and keeps save gates on strict verified selectors.
- `RunSphere/__tests__/runStore.test.ts`: added coverage for weak live-acceptable GPS, sub-jitter packets, preview/verified alias behavior, fast provisional movement, and impossible jump storage rejection.
- `RunSphere/src/config/appVersion.ts`: bumped the visible changelog version marker.
- `CHANGELOG.md`: documented the raw/provisional GPS layer.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand __tests__/runStore.test.ts`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- `coordinates` is now the raw/provisional session ledger; no separate raw coordinate field or persisted-state migration was added.
- Live preview can show provisional movement, but summary/save still use verified coordinates and distance only.
- Richer confidence labels remain deferred to Phase 3.

## v0.2.25 - 2026-06-04

### Summary
- Restored strict compatibility defaults for shared run policy values.
- Split live preview movement tolerances into explicit live-only policy fields.
- Replaced risky high-speed tracking language with provisional live preview wording for the next telemetry architecture pass.

### Files Changed
- `RunSphere/src/config/appVersion.ts`: bumped the visible changelog version for this policy cleanup.
- `RunSphere/src/config/runPolicy.ts`: maps legacy `RUN_POLICY` fields back to strict ledger values and exposes live-only jitter/speed aliases.
- `RunSphere/src/store/runStore.ts`, `RunSphere/src/screens/RunTrackingScreen.tsx`: consume the explicit live-only policy fields for preview movement and GPS diagnostics.
- `RunSphere/__tests__/runStore.test.ts`: added policy regression coverage for strict compatibility defaults and live preview tolerances.
- `RunSphere/__tests__/appVersion.test.ts`: updated the version label expectation to the ASCII footer label.
- `CHANGELOG.md`: documented the Phase 1 telemetry policy cleanup.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand __tests__/runStore.test.ts`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- This phase is a safety cleanup only; the full UX fix starts when raw/provisional coordinates stop being starved by strict save filters.
- Save thresholds, backend validation, summaries, dashboard stats, and history remain strict.

## v0.2.24 - 2026-06-04

### Summary
- Split live tracking display from strict saved-run calculations.
- Live distance, route, motion, and pace now accept broader provisional movement while final summaries remain ledger-filtered.
- Added development GPS diagnostics for accepted samples and rejection reasons.

### Files Changed
- `RunSphere/src/config/appVersion.ts`: bumped the visible changelog version for this tracking update.
- `RunSphere/src/config/runPolicy.ts`: widened live movement speed tolerance and made live jitter more responsive while keeping strict ledger thresholds unchanged.
- `RunSphere/src/utils/runMetrics.ts`: lets coordinate acceptance choose the relevant speed cap.
- `RunSphere/src/store/runStore.ts`: added live distance/route metrics, kept saved coordinates/distance/elevation strict, and moved live motion/current pace to the live policy.
- `RunSphere/src/screens/RunTrackingScreen.tsx`: renders live approximate metrics on the running page and logs development GPS diagnostics.
- `RunSphere/__tests__/runStore.test.ts`: added live fast-movement and impossible-jump coverage.
- `RunSphere/__tests__/LiveRunMap.test.tsx`: verifies active movement hides settling feedback and shows live pace.
- `CHANGELOG.md`: documented the live-approximate/final-strict tracking split.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand __tests__/runStore.test.ts __tests__/LiveRunMap.test.tsx`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- The running page now prioritizes fast approximate feedback; saved run summaries remain strict and do not use live-only provisional distance.
- `npm run lint` still reports only the existing unused `no-console` disable warnings in `LoginScreen.tsx` and `SignupScreen.tsx`.

## v0.2.23 - 2026-06-04

### Summary
- Moved the Home version label into a fixed lower-screen badge so it remains visible without scrolling to the deepest dashboard content.
- Bumped the visible changelog version marker to verify the latest OTA update is loaded in installed APKs.

### Files Changed
- `RunSphere/src/config/appVersion.ts`: updated the visible app changelog version to `v0.2.23`.
- `RunSphere/src/screens/HomeScreen.tsx`: renders the version badge above the bottom navigation area instead of burying it in scroll content.
- `CHANGELOG.md`: documented the version badge visibility fix.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- The badge is pointer-disabled so it never blocks Home interactions or the tab bar.

## v0.2.22 - 2026-06-03

### Summary
- Added a Home screen footer version label so the running app visibly reports the shipped changelog version.
- Added a bundled app version config and test coverage to keep it aligned with the latest changelog entry.

### Files Changed
- `RunSphere/src/config/appVersion.ts`: added the changelog-backed app version label used by the mobile UI.
- `RunSphere/src/screens/HomeScreen.tsx`: renders the current version at the bottom of the Home dashboard.
- `RunSphere/__tests__/appVersion.test.ts`: verifies the bundled app version matches the newest `CHANGELOG.md` entry.
- `CHANGELOG.md`: documented the Home version footer.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- React Native bundles cannot directly read markdown at runtime without extra Metro plumbing, so the app uses a tiny version config guarded by a changelog sync test.

## v0.2.21 - 2026-06-03

### Summary
- Added native hardware speed support for live current pace once motion confidence is `MOVING`.
- Smooths `coords.speed` over the latest three samples for instant, stable live pace feedback.
- Keeps stationary protection and strict saved-run ledger calculations unchanged, with rolling Haversine pace as fallback.

### Files Changed
- `RunSphere/src/store/runStore.ts`: `selectCurrentPace` now prefers averaged native speed samples and falls back to the existing live rolling window when speed is unavailable or invalid.
- `RunSphere/__tests__/runStore.test.ts`: added native-speed, stationary guard, invalid-speed fallback, and rolling fallback coverage.
- `CHANGELOG.md`: documented the hybrid native-speed current pace selector.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- Native speed affects only live `currentPace`; final saved run distance, duration, and summary remain ledger-derived.
- `npm run lint` still reports only the existing unused `no-console` disable warnings in `LoginScreen.tsx` and `SignupScreen.tsx`.

## v0.2.20 - 2026-06-03

### Summary
- Increased foreground GPS tracking density for active run sessions.
- Switched the native watcher to `BestForNavigation` accuracy with 1.5-second and 1.5-meter update thresholds.
- Added regression coverage for the high-density Expo Location watch configuration.

### Files Changed
- `RunSphere/src/utils/location.ts`: updated `Location.watchPositionAsync` options for denser sports telemetry updates.
- `RunSphere/jest.setup.js`: added `BestForNavigation` to the Expo Location test mock.
- `RunSphere/__tests__/location.test.ts`: verifies the foreground watch uses the high-density GPS profile and returns a removable watch handle.
- `CHANGELOG.md`: documented the hardware position density update.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- Backend save validation and strict ledger filtering remain unchanged.
- `npm run lint` still reports only the existing unused `no-console` disable warnings in `LoginScreen.tsx` and `SignupScreen.tsx`.

## v0.2.19 - 2026-06-03

### Summary
- Split frontend run telemetry policy into strict ledger/save rules and relaxed live-display rules.
- Let live motion and current pace use up to 55m GPS accuracy while keeping save eligibility strict at 30m.
- Reduced the live rolling pace window from 45 seconds to 12 seconds for more responsive in-run feedback.

### Files Changed
- `RunSphere/src/config/runPolicy.ts`: added `RUN_LEDGER_POLICY`, `RUN_LIVE_POLICY`, compatibility `RUN_POLICY`, and explicit accuracy/window aliases.
- `RunSphere/src/utils/runMetrics.ts`: widened GPS accuracy helpers so callers can choose ledger or live accuracy limits.
- `RunSphere/src/store/runStore.ts`: uses live accuracy/window for motion/current pace and ledger accuracy for saved distance/save gates.
- `RunSphere/__tests__/runStore.test.ts`: added coverage for relaxed live accuracy, strict save rejection, and the 12-second current pace window.
- `CHANGELOG.md`: documented the dual-track frontend telemetry policy split.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- Backend save policy remains unchanged and strict.
- `npm run lint` still reports only the existing unused `no-console` disable warnings in `LoginScreen.tsx` and `SignupScreen.tsx`.

## v0.2.18 - 2026-05-29

### Summary
- Wired live run tracking UI to selector-derived motion confidence and rolling current pace.
- Shows `GPS Settling...` or `Waiting for movement...` feedback when telemetry is not ready for reliable pacing.
- Blocks early Finish attempts from saving junk runs and surfaces a gentle 100-meter minimum alert.

### Files Changed
- `RunSphere/src/store/runStore.ts`: made `selectCanSaveRun` explicitly evaluate trusted coordinate count, accumulated distance, and active duration against production policy limits.
- `RunSphere/src/screens/RunTrackingScreen.tsx`: passes selector-derived current pace, motion state, and save eligibility to the live map; early finish attempts now show a non-destructive alert instead of discarding the run.
- `RunSphere/src/components/LiveRunMap.tsx`: renders motion-state banners, uses rolling current pace instead of full-run average pace, and visually/accessibly marks Finish controls disabled until save gates pass.
- `RunSphere/__tests__/LiveRunMap.test.tsx`: added coverage for stationary feedback, hidden pace, and disabled finish controls.
- `CHANGELOG.md`: documented the run tracking UI wiring and save-gate hardening.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- `npm run lint` still reports only the existing unused `no-console` disable warnings in `LoginScreen.tsx` and `SignupScreen.tsx`.
- Finish controls remain pressable enough to explain why saving is blocked, but the save action itself is gated by `selectCanSaveRun` immediately before completion.

## v0.2.17 - 2026-05-29

### Summary
- Added typed frontend motion confidence states for GPS acquisition, stationary drift, and confident movement.
- Added a 45-second rolling current pace selector that returns `null` while stationary or still acquiring GPS.
- Made live distance selectors defensively ignore poor-accuracy points, jitter segments, high-speed jumps, and stationary drift blocks.

### Files Changed
- `RunSphere/src/store/runStore.ts`: added `MotionState`, `selectMotionState`, `selectCurrentPace`, trusted movement distance accumulation, and selector-derived `currentPace` / `motionState` metrics.
- `RunSphere/src/utils/runMetrics.ts`: added reusable timestamp, accuracy, and segment-speed helpers backed by the centralized run policy.
- `RunSphere/__tests__/runStore.test.ts`: added coverage for defensive distance accumulation, motion confidence states, stationary pace hiding, and rolling pace calculation.
- `CHANGELOG.md`: documented the movement confidence and rolling pace selector pass.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- `npm run lint` still reports only the existing unused `no-console` disable warnings in `LoginScreen.tsx` and `SignupScreen.tsx`.
- Step 17 should wire `motionState` and `currentPace` into `RunTrackingScreen` / `LiveRunMap` so the UI stops rendering full-run average pace during stationary periods.

## v0.2.16 - 2026-05-29

### Summary
- Centralized running telemetry thresholds into shared frontend and backend policy modules.
- Unified GPS acceptance rules for save distance, duration, sample count, accuracy, jitter distance, and segment speed.
- Tightened production save gates to require 0.10 km, 60 seconds, and 6 accepted GPS samples before a run can be saved.

### Files Changed
- `RunSphere/src/config/runPolicy.ts`: added immutable frontend telemetry policy constants.
- `backend/src/config/runPolicy.js`: added matching CommonJS telemetry policy constants for backend validation.
- `RunSphere/src/utils/runMetrics.ts`: reads GPS jitter, accuracy, and max segment speed from the shared policy.
- `RunSphere/src/store/runStore.ts`: reads save-gate distance, duration, and coordinate-count thresholds from the shared policy.
- `RunSphere/src/hooks/useRunSummary.ts`, `RunSphere/src/screens/RunTrackingScreen.tsx`: updated save-rejection copy to reflect production thresholds.
- `backend/src/services/runService.js`, `backend/src/models/Run.js`, `backend/src/middlewares/validators.js`: consume shared policy values for run submission validation and trusted metric calculation.
- `backend/test/runService.test.js`, `RunSphere/__tests__/runStore.test.ts`: updated regression coverage for the stricter production thresholds.
- `CHANGELOG.md`: documented telemetry policy unification.

### Verification
- `cd backend && npm test`
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- `npm run lint` still reports only the existing unused `no-console` disable warnings in `LoginScreen.tsx` and `SignupScreen.tsx`.
- Phase 4 follow-up work can now build movement confidence and rolling pace selectors on top of one shared policy contract.

## v0.2.15 - 2026-05-29

### Summary
- Replaced legacy centered loading spinners on Home and Community with shimmer-based screen skeletons.
- Kept stale dashboard/feed content visible during pull-to-refresh and background refreshes.
- Preserved existing domain hook ownership while making screens consume the new loading presentation components.
- Replaced the Reanimated shimmer implementation with React Native core `Animated` to keep Expo Go and OTA testing compatible without a new native binary.
- Renamed the SecureStore token key to a device-safe identifier to prevent Expo Go auth session write failures.
- Aligned Home and post-save summary rank display with the global weekly leaderboard period used by the Leaderboard screen.
- Tightened the Leaderboard screen vertical rhythm, reduced oversized heading text, lifted the scope tabs/podium, and improved podium avatar/badge fit.
- Reduced the Leaderboard screen and bottom navigation glow/white opacity for a darker glass-style presentation without adding native blur dependencies.
- Replaced the Ranks screen cold-load circular spinner with a leaderboard-shaped shimmer skeleton.
- Tightened the Profile header layout by shrinking the avatar/name area, removing the lightning badge, and replacing the large refresh-location button with a compact clickable refresh icon.

### Files Changed
- `RunSphere/src/screens/HomeScreen.tsx`: mounts `HomeSkeleton` for cold dashboard loads and removes the old `ActivityIndicator` fallback.
- `RunSphere/src/screens/CommunityFeedScreen.tsx`: mounts `CommunitySkeleton` for cold feed loads while preserving refresh-visible content.
- `RunSphere/src/hooks/useDashboard.ts`: loads and displays the global weekly rank instead of the global daily rank.
- `RunSphere/src/hooks/useRunSummary.ts`: refreshes and displays the global weekly rank after saving a run.
- `RunSphere/src/screens/LeaderboardScreen.tsx`: reduced header height, moved the tab/podium area upward, resized podium avatar rings, and improved winner rank badge contrast.
- `RunSphere/src/screens/ProfileScreen.tsx`: compressed the profile identity section, removed the photo lightning badge, and moved location refresh into a small icon beside the location label.
- `RunSphere/src/components/LeaderboardSkeleton.tsx`: added a Ranks-shaped shimmer loading frame for cold leaderboard loads.
- `RunSphere/__tests__/Skeletons.test.tsx`: added render coverage for the leaderboard skeleton.
- `RunSphere/src/navigation/BottomTabNavigator.tsx`: softened the bottom navigation translucent layer and active glow opacity.
- `RunSphere/src/components/ShimmerPlaceholder.tsx`: now uses core `Animated` for the shimmer sweep instead of loading native Worklets.
- `RunSphere/src/services/apiClient.ts`: uses `milesaway_token` as the SecureStore token key instead of the legacy `@milesaway_token` key.
- `RunSphere/package.json`, `RunSphere/package-lock.json`: removed `react-native-reanimated` after Expo Go Worklets runtime incompatibility.
- `RunSphere/babel.config.js`, `RunSphere/jest.setup.js`: removed Reanimated-specific setup.
- `CHANGELOG.md`: documented the skeleton mounting pass.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- Skeletons only render for clean initial loads; refresh controls continue to operate over already-rendered content.
- This keeps the loading UI eligible for Expo Go and EAS Update testing without requiring a fresh native build.

## v0.2.14 - 2026-05-29

### Summary
- Added dedicated Home dashboard and Community feed skeleton layouts using the reusable shimmer placeholder.
- Mirrored production screen gutters, card radii, vertical spacing, and feed/card proportions to reduce loading-to-content layout shift.
- Added render coverage for both skeleton frames.

### Files Changed
- `RunSphere/src/components/HomeSkeleton.tsx`: added a full-screen dashboard loading skeleton with header avatar, metric blocks, cards, and chart placeholder.
- `RunSphere/src/components/CommunitySkeleton.tsx`: added a full-screen community loading skeleton with event panel and repeated feed card placeholders.
- `RunSphere/__tests__/Skeletons.test.tsx`: added render coverage for the new skeleton components.
- `CHANGELOG.md`: documented the isolated screen skeleton layouts.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- Skeletons are not connected to screen loading branches yet; Step 14 will wire them into `HomeScreen.tsx` and `CommunityFeedScreen.tsx`.

## v0.2.13 - 2026-05-29

### Summary
- Added a reusable native-driven shimmer placeholder component for loading skeletons.
- Installed and configured `react-native-reanimated` for UI-thread placeholder animation.
- Added smoke coverage for the shimmer placeholder render path.

### Files Changed
- `RunSphere/src/components/ShimmerPlaceholder.tsx`: added typed shimmer placeholder with native Reanimated opacity loop.
- `RunSphere/package.json`, `RunSphere/package-lock.json`: added Expo-compatible `react-native-reanimated`.
- `RunSphere/babel.config.js`: added the Reanimated Babel plugin.
- `RunSphere/jest.setup.js`: initialized Reanimated test setup.
- `RunSphere/__tests__/ShimmerPlaceholder.test.tsx`: added render coverage.
- `CHANGELOG.md`: documented the reusable shimmer layer.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- The component uses a soft `#E1E9EE` placeholder base with a repeating opacity sheen.

## v0.2.12 - 2026-05-29

### Summary
- Moved backend async error forwarding to route-level `asyncWrapper(...)` usage.
- Removed repeated `try/catch(next)` boilerplate from auth, community, run, user, and leaderboard controllers.
- Added regression coverage for async wrapper success and rejection forwarding behavior.

### Files Changed
- `backend/src/routes/auth.js`, `backend/src/routes/community.js`, `backend/src/routes/run.js`, `backend/src/routes/user.js`, `backend/src/routes/leaderboard.js`: wrapped async controller handlers at route definitions.
- `backend/src/controllers/authController.js`, `backend/src/controllers/communityController.js`, `backend/src/controllers/runController.js`, `backend/src/controllers/userController.js`, `backend/src/controllers/leaderboardController.js`: simplified controller bodies to direct async logic without local error forwarding.
- `backend/test/asyncWrapper.test.js`: added coverage for async wrapper error forwarding and successful completion.
- `CHANGELOG.md`: documented the backend async exception consolidation.

### Verification
- `cd backend && npm test`

### Notes
- Route middleware and validators remain explicit; only async controller handlers are wrapped.

## v0.2.11 - 2026-05-29

### Summary
- Added a global React Native error boundary around the root navigator.
- Added a friendly recovery screen for uncaught render/layout crashes.
- Added a tap-to-reload recovery action that resets boundary state and remounts the app navigator.

### Files Changed
- `RunSphere/src/components/AppErrorBoundary.tsx`: added class-based error boundary using `getDerivedStateFromError` and `componentDidCatch`.
- `RunSphere/App.tsx`: wrapped `AppNavigator` in `AppErrorBoundary` and remounts it with a reset key.
- `RunSphere/__tests__/AppErrorBoundary.test.tsx`: added fallback rendering and reset behavior coverage.
- `CHANGELOG.md`: documented the global mobile error boundary.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- The boundary logs sanitized crash metadata only in development.
- The recovery button remounts the navigator shell without forcing a physical app restart.

## v0.2.10 - 2026-05-29

### Summary
- Extracted dense frontend screen orchestration into domain hooks for dashboard, community feed, profile location, and run summary save flows.
- Slimmed core screens so they consume hook-provided state and callbacks instead of directly owning store wiring, lifecycle effects, service calls, and permission checks.
- Preserved existing user-facing layouts and save/refresh behavior while moving business logic out of JSX-heavy components.

### Files Changed
- `RunSphere/src/hooks/useDashboard.ts`: centralizes Home dashboard loading, refresh state, leaderboard loading, goal controls, and display mappers.
- `RunSphere/src/hooks/useCommunityFeed.ts`: centralizes community feed/events loading, location permission lookup, likes, refresh, external event links, and date formatting.
- `RunSphere/src/hooks/useProfileLocation.ts`: centralizes profile dashboard refresh, location permission/update flow, and profile statistics mapping.
- `RunSphere/src/hooks/useRunSummary.ts`: centralizes run summary auto-save, save-first navigation guards, Android back handling, and saved-run result mapping.
- `RunSphere/src/screens/HomeScreen.tsx`, `RunSphere/src/screens/CommunityFeedScreen.tsx`, `RunSphere/src/screens/ProfileScreen.tsx`, `RunSphere/src/screens/RunSummaryScreen.tsx`: refactored to presentation-focused hook consumers.
- `CHANGELOG.md`: documented the domain hook extraction.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- `npm run lint` still reports only the existing unused `no-console` disable warnings in `LoginScreen.tsx` and `SignupScreen.tsx`.
- Screen layouts were intentionally preserved; this step only moved orchestration out of the screen components.

## v0.2.9 - 2026-05-29

### Summary
- Added a shared frontend `buildQuery` helper for safe URL query construction.
- Replaced manual query string concatenation in run, leaderboard, and community services.
- Added query helper coverage for nullish filtering and URL encoding.

### Files Changed
- `RunSphere/src/utils/url.ts`: added `buildQuery(params)` using native `URLSearchParams`.
- `RunSphere/src/services/runService.ts`: refactored history and daily stats query construction.
- `RunSphere/src/services/leaderboardService.ts`: refactored leaderboard query construction.
- `RunSphere/src/services/communityService.ts`: refactored feed and running-events query construction.
- `RunSphere/__tests__/url.test.ts`: added query helper regression coverage.
- `CHANGELOG.md`: documented the shared frontend query builder refactor.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- Service method signatures remain unchanged.

## v0.2.8 - 2026-05-29

### Summary
- Centralized backend community/auth input validation for MongoDB ObjectIds, pagination, text bodies, and password reset flows.
- Wired community routes through reusable validators so controllers trust normalized request data.
- Added password reset validators to auth routes to cover forgot-password and reset-password inputs before controllers run.

### Files Changed
- `backend/src/middlewares/validators.js`: added ObjectId, pagination, community post/comment, running-events query, forgot-password, and reset-password validators.
- `backend/src/routes/community.js`: attached validators to feed, events, post, like, and comment routes.
- `backend/src/routes/auth.js`: attached forgot-password and reset-password validation middleware.
- `backend/src/controllers/communityController.js`: removed local validation/parsing and now consumes middleware-normalized request values.
- `backend/test/validators.test.js`: added regression coverage for ObjectId rejection, pagination clamping, text trimming/limits, email normalization, and reset token/password validation.
- `CHANGELOG.md`: documented the backend validator consolidation.

### Verification
- `cd backend && npm test`

### Notes
- Community post text is limited to 500 characters and comments to 280 characters.
- Community pagination limits are clamped to a maximum of 50 records.

## v0.2.7 - 2026-05-29

### Summary
- Sanitized API client logging so development diagnostics never include authorization headers, request bodies, or raw network objects.
- Added typed `ApiResponse<T>` and `ApiError<TError>` metadata for clean API failure handling.
- Exposed SecureStore/AsyncStorage auth persistence failures through `storageFailureError` instead of silently dropping sessions.

### Files Changed
- `RunSphere/src/services/apiClient.ts`: added dev-only sanitized logging, typed API errors, and explicit storage failure propagation.
- `RunSphere/src/store/authStore.ts`: added `storageFailureError` and surfaced storage failures during bootstrap, auth actions, logout, and user persistence.
- `RunSphere/__tests__/apiClient.test.ts`: added coverage for log redaction, typed API errors, storage failure propagation, and production logging silence.
- `RunSphere/__tests__/authStore.test.ts`: added coverage for bootstrap, login, logout, setUser storage failures, and clearing storage errors after success.
- `CHANGELOG.md`: documented the mobile security infrastructure hardening.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- Existing service methods still receive raw response data to avoid a broad API shape migration.
- UI rendering for `storageFailureError` is exposed for a later shell-level handling pass.

## v0.2.6 - 2026-05-28

### Summary
- Locked backend dashboard/stat responses to one explicit numeric aggregation contract including total duration, calories, and elevation.
- Added frontend stats normalization and a dashboard network state machine with `IDLE`, `LOADING`, `SUCCESS`, and `ERROR`.
- Preserved stale dashboard data on refresh failure and surfaced an actionable retry banner on Home.

### Files Changed
- `backend/src/services/runService.js`: expanded weekly/daily stats pipelines to output the full stats contract and derive speed/pace from summed facts.
- `backend/test/runService.test.js`: added contract coverage for period stats defaults and aggregation output stages.
- `RunSphere/src/store/userStore.ts`: added strict stats/status types, normalization helpers, fail-fast dashboard refresh, stale-data preservation, and error metadata.
- `RunSphere/src/screens/HomeScreen.tsx`: renders dashboard refresh failures with a retry banner while keeping cached stats visible.
- `RunSphere/src/screens/ProfileScreen.tsx`, `RunSphere/src/screens/HistoryScreen.tsx`: switched loading checks to the new dashboard status field.
- `RunSphere/__tests__/userStore.test.ts`: added normalization, success, error-preservation, and reset coverage.
- `CHANGELOG.md`: documented the aggregation contract and network state cleanup.

### Verification
- `cd backend && npm test`
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- Dashboard refresh failures no longer merge partial authenticated responses into cached state.
- Leaderboard refresh remains isolated from dashboard stats refresh behavior.

## v0.2.5 - 2026-05-28

### Summary
- Refactored active run tracking into a fact-only frontend state machine with explicit `IDLE`, `TRACKING`, `PAUSED`, and `COMPLETED` transitions.
- Removed mutable live metric counters from the run store; duration, distance, pace, calories, elevation, and API coordinates are now derived through pure selectors.
- Made pause-safe duration calculations subtract closed and active pause intervals, preventing timer drift when the JS thread pauses or the app backgrounds.

### Files Changed
- `RunSphere/src/store/runStore.ts`: replaced derived counter storage with raw timestamps, pause intervals, GPS points, guarded state actions, selector-derived metrics, and persisted-state migration.
- `RunSphere/src/screens/RunTrackingScreen.tsx`: removed the store-mutating timer, derives live UI metrics from selectors, and completes runs through the guarded state machine.
- `RunSphere/src/screens/RunSummaryScreen.tsx`: derives save payloads and summary metrics from selectors, preserving save-first navigation behavior.
- `RunSphere/__tests__/runStore.test.ts`: added selector, transition guard, completion, save-threshold, and migration coverage.
- `CHANGELOG.md`: documented the fact-only run ledger refactor.

### Verification
- `cd RunSphere && npx tsc --noEmit`
- `cd RunSphere && npm test -- --runInBand`
- `cd RunSphere && npm run lint`

### Notes
- Backend run validation remains the final authority for persisted run submissions.
- The ledger preserves optional raw GPS facts such as altitude, speed, and heading, but keeps all calculated metrics out of persisted state.

## v0.2.4 - 2026-05-28

### Summary
- Wrapped new run creation and user location updates in a single Mongoose transaction.
- Preserved idempotent duplicate run submissions before and during transactional creation.
- Kept aggregate rebuilds outside the transaction so post-save repair failures remain non-fatal.

### Files Changed
- `backend/src/services/runService.js`: replaced sequential run/user writes with `mongoose.startSession()`, `Run.create(..., { session })`, `User.updateOne(..., { session })`, explicit commit/abort handling, and post-commit aggregate rebuild.
- `backend/test/runService.test.js`: added transaction coverage for successful commits, aborts on user update failure, duplicate-key idempotency, and duplicate pre-check behavior.
- `CHANGELOG.md`: documented the transactional run submission hardening.

### Verification
- `cd backend && npm test`
- `rg -n "startSession|startTransaction|commitTransaction|abortTransaction|Run\\.create|User\\.updateOne|run\\.save|findByIdAndUpdate" backend/src/services/runService.js`

### Notes
- MongoDB transactions require production MongoDB to run as a replica set or sharded cluster.
- Dashboard/stat reads remain passive from `v0.2.3`; this entry only hardens the write path.

## v0.2.3 - 2026-05-28

### Summary
- Made backend dashboard/stat reads passive by removing aggregate rebuilds from the GET stats path.
- Kept user aggregate rebuilds write-triggered after new run submissions, with non-fatal logging if rebuild fails after the run is saved.
- Preserved idempotent duplicate run submissions without forcing expensive aggregate recalculation.

### Files Changed
- `backend/src/services/runService.js`: removed `rebuildUserDerivedStats()` from read and duplicate-submit paths, wrapped post-save aggregate rebuilds in a safe `try/catch`, and kept leaderboard cache invalidation write-driven.
- `backend/test/runService.test.js`: added regression coverage for passive stats reads, empty stats defaults, and duplicate run submission idempotency.
- `CHANGELOG.md`: documented the backend destructive dashboard read fix.

### Verification
- `cd backend && npm test`
- `rg -n "rebuildUserDerivedStats\\(" backend/src/services/runService.js`
- `rg -n "deleteMany\\(\\{ userId \\}\\)" backend/src/services/runService.js`

### Notes
- Dashboard/stat GET requests no longer execute `DailyAggregate.deleteMany({ userId })`.
- Transactional consistency for the write path remains deferred to the next roadmap step.

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
