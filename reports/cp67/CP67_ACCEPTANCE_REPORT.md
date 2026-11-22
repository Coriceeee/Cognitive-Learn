# CP67 — UX accessibility / SPA transitions acceptance record

Date: 2026-11-21; predecessor: CP66.

## Changes shipped

- `src/lib/routeExperience.ts`: pure URL/pathname/hash/query transition planner; a route-name catalog for accessible document titles. No model calculation, Firestore write, or localStorage.
- `src/App.tsx`: visible-on-focus "Bỏ qua điều hướng" link, announcement for screen readers, content focus on real route change, title per page, query-only scroll preservation; route kind stored in committed snapshot rather than read after transition.
- `src/styles/46-cla-route-accessibility.css`: skip link, focus treatment, print and reduced-motion styling.
- `tests/cp67-route-experience.test.mjs` (17 regression tests), npm test script, CI job step.
- QA standalone HTML/JS runner uses actual CP67 pure logic transpiled with TypeScript and actual CP67 CSS to check browser behavior at 1160px and 390px, **not the running React application**.

## Verification summary

| Verification | Result | Evidence |
|---|---|---|
| CP67 new unit+contract | 17/17 PASS | `cp67-route-tests.log` |
| Previous UX CP63, CP66; query CP58 regression | PASS | `cp63-regression.log`, `cp66-regression.log`, `cp58-regression.log` |
| Chromium isolated functional keyboard/scroll/responsive at desktop/mobile | 2/2 PASS | `chromium-isolated.log`, `preview-skip-*.png` |
| TypeScript transpile/syntax (`App.tsx`, `routeExperience.ts`) | PASS | Source checker output |
| Demo offline synthetic | 11/11 PASS | `evidence-generation.log` |
| Layout contract | PASS | `layout.log` |
| Full npm test | See `npm-test.log` and current `npm-test.exit` (if present); do not call PASS without exit=0 | `npm-test.log` |
| Production build | BLOCKED (missing 19 dependencies/executables, including React, Firebase and Vite) | `dependency-preflight.log`, `build.log` |
| Firebase Emulator + live React browser E2E | NOT RUN | dependency preflight; no React screenshot |

## Known limitations and freeze decision

- Native dark mode remains intentionally disabled by the light-only boot script in `index.html`. A partial dark QA preview must **never** be labeled dark mode website validation.
- Chrome isolated HTML QA proves the CSS and pure URL transition plan; it does not prove React component behavior after Suspense commits or account-specific Firestore states.
- Form drafts/navigation guard is unchanged; the new route focus runs only after committed pathname changes, not query-only filters or browser Back/Forward.
- Formal UX freeze remains **CONDITIONAL / OPEN** pending production build, React responsive E2E, contrast, and a safe test account. This gate is not a completed scientific experiment.
