# AI Prompt Plan

Use this file before asking AI to make project changes. Keep the plan short, specific, and testable.

## Prompt Template

```md
# Goal
Describe exactly what should change.

# Current Context
- App area:
- Backend area:
- Known files:
- Related docs:

# Constraints
- Do not change:
- Must preserve:
- Secrets required:

# Implementation Plan
1. Inspect relevant files.
2. Make the smallest safe change.
3. Update tests or docs if needed.
4. Run verification commands.
5. Update `CHANGELOG.md`.

# Acceptance Checks
- Command:
- Manual check:
- Expected result:

# Changelog Entry
- Version:
- Summary:
- Files changed:
- Verification:
- Notes:
```

## Current Project Defaults

- Mobile app path: `RunSphere`
- Backend path: `backend`
- App checks: `npm ci`, `npm run lint`, `npm test`
- Backend checks: `npm ci`, `npm test`
- App build system: Expo EAS
- Backend deploy target: Railway
