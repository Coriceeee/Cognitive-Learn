# CP42 — Focused Workspaces (19/11/2026)
Base: CLA_FULL_SOURCE_CP42_HOLISTIC_TEMPORAL_20261118.zip.

## Changes
- Render only the selected workspace at React level, rather than mounting all sections and hiding them via CSS. Module overview retains introduction/summary, navigation and relevant warnings.
- Seed: `/student` dashboard, profile, transcript, `/student/exams`, storage. Existing Cognitive panels now in Lumen; the subject panel is in transcript. Calendar data/storage logic is unchanged.
- Lumen: overview, indices, `/lumen/state`, history, insights, `/lumen/advanced`, `/lumen/roadmap`, `/lumen/evidence`, assistant. Split signal/temporal visualizations by destination.
- Atlas: overview, Vietnam admissions, recommendations, `/atlas/subjects`, `/atlas/compare`, joint, study abroad, sources. National three-year source search has its own source tab and shortcuts from admissions/recommendations. Admin import/library moves to `/atlas/library` with admin guard. Admission data and algorithms unchanged.
- Orion: inputs, scenarios (compare/optimize/commit shared state), roadmap; link to Pulse check-in. Existing eligibility restriction stays at commit. Save pending input before leaving route; temporary optimization settings and unsaved local forms may reset when navigating.
- Pulse: overview, `/pulse/inputs`, progress, reports, actions, `/pulse/checkin`; Admin-only `/pulse/audit`.
- Haven: overview, scholarship, finance (budget simulation, financial inputs), plan. Study abroad: destination, programs, requirements, sources with country query retained.
- Navigation uses concise links and aria-current. Keep legacy anchors mapped to canonical paths; preserve query/hash. Add SPA rewrites and student route allowlist, retain Admin-only guards. No Firestore rule or data migration.
- Four previous route-layout test files have been updated to reflect intentional navigation change; ten new route contract tests added. No claim of visual equivalence or scientific validation.

## Verification
- `npm test`: 1153/1153 TAP cases passed (full invocation, exit 0); new focused workspace tests 10/10.
- `npm run demo:final`: 11/11 offline technical demo.
- Atlas lookup: 1382/1382 deterministic local cases; no new source data.
- TypeScript parser: 85 TSX files, no parse diagnostics; focused route module strict typecheck passed. Full build attempted, exit 1 due to missing React/Firebase dependencies and associated diagnostics. Actual browser E2E/visual validation not run.
- Logs: `reports/verification/cp42_focused_workspaces/`.

## Run locally
Extract full source in a separate directory, preserve your existing private configuration separately. Use `npm ci`, `npm run dev`, then verify every tab with a student account; test admin routes with their appropriate role. Do not deploy candidate rules or overwrite production data automatically. `npm run test:cp42:focused-workspaces` runs the new contracts.
