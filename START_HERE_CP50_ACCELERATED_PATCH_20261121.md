# CP50 — Orion data-loss prevention and test integration

Source: CP49 ZIP received 2026-11-21. This is a patched source archive, NOT a tested production deployment.

## Actual code changes
- `src/page/orion/OrionPage.tsx`: Firestore snapshot is no longer applied while local edits are unsaved. This protects against reverting newer in-progress form input when an older cloud snapshot arrives.
- Orion autosave now validates the 1–104-week range and 0–10 subject score ranges before writing a draft, matching manual save restrictions.
- Manual save now tracks edit revision; an older in-flight save cannot mark newly typed edits as saved. It explicitly reports that newer edits await autosave.
- Added `tests/cp50-orion-race-safety.test.cjs`, wired to `npm run test:cp50:orion-race` and main `npm test`.
- Refreshed source fingerprint and SYNTHETIC-only replay evidence to reflect source change. No validation claims about real students.

## Verification performed
- CP50 tests: 3/3 PASS (source-level regression contracts).
- CP47 Orion tests: 5/5 PASS.
- Rules static: PASS; layout check: PASS.
- Golden-path, multicycle, measurement SYNTHETIC replay: PASS.
- npm test: prior invocation before test-script integration PASS; integrated re-run reached CP42 robust-decision tests but the outer runner timed out after 200 seconds; **full integrated suite not verified**.

## Not verified
- Vite/TypeScript production build: blocked by missing npm registry dependencies; do not call build PASS.
- Firebase Emulator, actual concurrent browser sessions, E2E, live services, production: NOT RUN.

## Safety & limitations
This mitigates a specific Firestore snapshot race but is not a substitute for a true two-browser concurrency and account-switch E2E test. Backend last-write-wins semantics and per-UID ownership still require Firebase Emulator and browser verification. No production Rules were deployed.

## Next commands after installing dependencies
`npm ci --no-audit --no-fund && npm run build && npm run test:rules:emulator && npm test`
