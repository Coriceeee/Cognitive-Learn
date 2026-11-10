# CP29 Test Report — 2026-11-09

## PASS

- `npm test`: 82 test cases passed.
  - Academic validation: 14/14
  - Cognitive observation: 4/4
  - Admin route contract: PASS
  - Module hierarchy contract: PASS
  - UX-V7/CP28 role and theme contracts: 6/6
  - Student role isolation: PASS
  - Pipeline evidence: 27/27
  - Admissions and assistant policy: 25/25
  - Chat mascot launcher: 2/2
  - CP29 dependency manifest contract: 1/1
- `npm run test:rules:static`: 15/15.
- `npm run check:layout`: PASS; 22 required files present and 19 legacy misplacements absent.
- PostCSS syntax parse: 24/24 CSS files.
- Source tree secret-like file scan: no `.env`, `.env.*`, PEM/P12/PFX or service-account JSON files found.

## Changes verified in this checkpoint

- Admin navigation now requires `users/{uid}.active === true`, matching `AccessGate`.
- Direct dependencies formerly declared as `latest` are now pinned to the versions already captured in the lockfile.
- Regression test ensures direct dependency declarations do not float on `latest` and exact pins match lockfile versions.

## BLOCKED / NOT RUN

- `npm ci` could not finish: requests to `registry.npmjs.org` failed with `EAI_AGAIN`; the attempt timed out.
- Frontend/API TypeScript and Vite production build: not verified because project dependencies were unavailable.
- Browser E2E and screenshot review: not run.
- Firebase Emulator and production/staging smoke: not run.

No production deployment or Firestore Rules change was performed.
