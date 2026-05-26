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
