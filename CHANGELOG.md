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

## v0.1.0 - 2026-05-26

### Summary
- Added project change tracking, AI planning guidance, and CI/CD workflow configuration.

### Files Changed
- `CHANGELOG.md`: added a repeatable format for documenting AI-assisted changes.
- `VERSION.md`: added current version metadata and rules for future updates.
- `docs/AI_PROMPT_PLAN.md`: added a planning template to use before AI-assisted coding.
- `.github/workflows/ci.yml`: added app and backend CI checks.
- `.github/workflows/deploy.yml`: added manual deployment workflow for Expo EAS and Railway.
- `RunSphere/src/components/LiveRunMap.tsx`: moved the bearing helper outside the component and fixed the effect dependency list so app lint can pass in CI.

### Verification
- `cd RunSphere && npm test -- --runInBand`
- `cd backend && npm test`
- `cd RunSphere && npm run lint`

### Notes
- Deployment jobs require repository secrets before they can be used.
