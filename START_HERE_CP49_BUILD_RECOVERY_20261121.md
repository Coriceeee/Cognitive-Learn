# CP49 — Build dependency readiness and CI hardening

Date: 2026-11-21. Source: CP48 provided ZIP. This is a **local code patch**, not a production release.

## Source changes
- Added `tools/check-dependencies.cjs` and `npm run check:dependencies` to detect missing or incomplete installs and lockfile divergence **without accessing the network**.
- Updated `.github/workflows/cla-cp21-verify.yml`: use one reproducible `npm ci --no-audit --no-fund` (instead of an unnecessary `npm install` followed by `npm ci`), enable npm cache, run dependency preflight. Security audit stays separate.
- Regenerated CP31 packaged-source fingerprint baseline because source files changed; regenerated dependent **SYNTHETIC-only** replay artifacts. No real-student claims.

## Verified on this machine
- `npm test`: PASS after synthetic evidence regeneration (`/mnt/data/cp49_npm_test_final3.log`).
- `npm run test:rules:static`: PASS (15/15).
- `npm run check:layout`: PASS (22 required files; 19 old locations absent).
- `npm run check:dependencies`: BLOCKED as intended by missing node_modules packages; it correctly exits 1.
- `npm ci --no-audit --no-fund --fetch-retries=0 --fetch-timeout=12000`: FAILED (registry DNS EAI_AGAIN; npm additionally emits 'Exit handler never called!'). This is an environment/dependency failure, **not evidence of successful or failed TypeScript build**.

## NOT RUN / NOT VERIFIED
- `npm run build`, `npm run typecheck:api` with complete dependencies, Firebase Emulator, browser E2E, live Gemini endpoints and production smoke checks.

## On a machine with npm registry access
```bash
npm ci --no-audit --no-fund
npm run check:dependencies
npm run build
npm run test:rules:emulator
npm test
```
No Firebase production rules should be deployed before Emulator allow/deny tests. Never commit `.env` or service credentials.

## Backlog accounting
The 164-row CP48 backlog is retained. No newly completed technical gate has been inflated to a fully accepted website/research task: CI modifications are only source-level until a remote CI run is observed.
