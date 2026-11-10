# CP27 Test Report — 2026-11-09

## Passed
- `npm test`: all scripted suites passed, including 4 new UX-V7 contract tests and the page-context test.
- `npm run test:rules:static`: 15/15 passed.
- `npm run check:layout`: PASS; 22 required files present and 19 legacy misplacements absent.
- `npx tsc -b --pretty false`: PASS.
- `npx tsc -p tsconfig.api.json --pretty false`: PASS.
- PostCSS parse of `src/styles.css` and `src/styles/20-ux-v7.css`: PASS.

## Blocked / not run
- Vite production build: blocked because the supplied dependency tree contains Windows Rolldown binaries but not the Linux native binding. `npm ci` could not fetch the missing optional dependency because `registry.npmjs.org` resolution failed with `EAI_AGAIN`.
- Browser E2E and screenshot review: not run.
- Firebase Emulator and production smoke: not run.

No production deployment or Firebase Rules change was performed.
