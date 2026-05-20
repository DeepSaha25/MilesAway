# Frontend architecture

Overview

The RunSphere frontend is a React Native TypeScript application located in the `RunSphere/` folder. It is structured to be modular and testable with clear separation between presentation, navigation, and business logic.

Key folders

- `src/components` — reusable UI components (buttons, avatars, chips).
- `src/screens` — top-level screens (Login, Signup, Feed, RunTracker, Profile, Leaderboard).
- `src/navigation` — navigation stacks and deep-linking config.
- `src/services` — API client and helpers that call backend endpoints.
- `src/store` — app state (Redux / Context) for user, runs and feed state.
- `src/hooks` — shared React hooks (useAuth, useRuns, useLocation).

Data flow

- UI dispatches user actions (start run, create post) to screens/components.
- Screens call `src/services` which expose functions that call backend REST endpoints defined in `src/config/api.ts`.
- Responses update `src/store` and UI re-renders. Optimistic updates are used where it improves UX.

Important files

- App entry: [RunSphere/App.tsx](../../RunSphere/App.tsx)
- API config: [RunSphere/src/config/api.ts](../../RunSphere/src/config/api.ts)
- Example component: [RunSphere/src/components/Avatar.tsx](../../RunSphere/src/components/Avatar.tsx)

Offline and location

The app collects location data during run tracking; location handling and permission flows are implemented in `src/hooks` and the Run tracking screen. Consider batching GPS points and using background location strategies when required by platform restrictions.

Testing and CI

Unit tests live under `RunSphere/__tests__` and use Jest. Native integration can be validated via platform tooling or CI pipelines that include Android/iOS emulators or Expo.
