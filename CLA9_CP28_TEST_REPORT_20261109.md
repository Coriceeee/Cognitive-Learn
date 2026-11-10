# CP28 Test Report — 2026-11-09

## PASS
- `npm test`: all scripted suites passed.
  - Academic: 14/14
  - Cognitive observation: 4/4
  - Admin route contract: PASS
  - Module hierarchy: PASS
  - Student experience and role isolation: PASS
  - UX-V7/CP28 tests: 6/6
  - Pipeline evidence: 27/27
  - Admissions and assistant policy: 25/25
  - Chat mascot launcher: 2/2
- `npm run test:rules:static`: 15/15 passed.
- `npm run check:layout`: PASS; 22 required files present and 19 legacy misplacements absent.
- `npx tsc -b --pretty false`: PASS.
- `npx tsc -p tsconfig.api.json --pretty false`: PASS.
- PostCSS parse: 22/22 CSS files plus `src/styles.css` passed.

## BLOCKED / NOT RUN
- Vite production build: blocked because the provided dependency tree lacks the Linux Rolldown native binding `@rolldown/binding-linux-x64-gnu`. The `vite` shim also is not executable in the shared Windows-derived dependency tree; invoking Vite with Node confirms the missing native binding.
- Browser screenshot review and E2E: not run.
- Firebase Emulator and production smoke: not run.

No production deployment or Firestore Rules change was performed.
