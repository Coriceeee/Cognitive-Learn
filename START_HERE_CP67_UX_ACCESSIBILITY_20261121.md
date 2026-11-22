# CP67 — Cognitive Learn AI UX-first source package

**Primary outcome:** fix SPA scroll/focus/keyboard usability across the student journey while preserving CP66 data-source/status safeguards.

See `reports/cp67/CP67_UX_REPORT_WRITING_KIT.md` for ready-to-adapt report language and real-screenshot plan. See `reports/cp67/CP67_ACCEPTANCE_REPORT.md` for verifiable vs blocked steps.

Quick checks with Node 22: `npm run test:cp67:route-experience`, `npm run test:cp66:unified-states`, `npm run demo:final`, `npm run check:layout`.

On a development computer with npm access: `npm ci --no-audit --no-fund`, `npm run check:dependencies`, `npm run build`, then run and inspect the actual site; server rules and E2E need their configured environment. Do not use real student data in browser QA.

This is a complete source ZIP, **not a deployed/production-verified website**. The UX report may be drafted, but a final formal UX freeze awaits real-app validation.
