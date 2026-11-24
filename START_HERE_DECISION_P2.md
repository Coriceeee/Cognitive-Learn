# CLA Decision P2 — integrated source candidate

Base: user-provided CLA_DECISION_P1_FULL_20261124.zip. Preserve original source tree, visual theme, routes, auth, Firebase Rules and backend configuration. No deployment performed.

## Changes
- `studentDecisionSnapshot.ts`: session-local dependency revisions, per-owner and per-input invalidation, unavailable state, ABA guard and explicit handoff pins. Seed profile/transcript observers feed the ledger using server-confirmed data. Lumen → Atlas projection and Atlas → Orion goal acceptance recheck their pinned input versions. Pulse history is not erased. No new Firestore collections or storage schema.
- `goalGapOptimizer.ts`: deterministic arithmetic gap for exactly three distinct subjects, equal marginal allocation up to 10 per subject, no bonus, no admission probability. Orion's existing input workspace contains a collapsed optional control with explicit confirmation before replacing target marks. Current Orion supports six subjects, not all 11. Target total is user-specified, not a verified cutoff. Model is arithmetic, not validated learning prediction.
- The ledger only tracks observed versions in the current browser session. Atlas source changes are observed while Atlas is mounted. It does not guarantee stale-data invalidation after applied handoffs, across tabs/devices, or during disconnected routes. Chatbot personalized context and full adaptive lifecycle remain P3/P4. No scientific validation claimed.

## Local run (Node compatible with existing Vite/package requirements)
1. Extract into a separate folder or back up your current project. Restore your existing local environment files separately; no secret values supplied.
2. `npm ci`
3. `npm run verify:focused`
4. `npm test`
5. `npm run build -- --mode live`
6. `npm run dev`

Windows: `BUILD_CLA_FOCUSED.cmd` executes verify, regression and build. No Firebase deployment. Never overwrite live environment files or publish untested rules.

## Verification performed in packaging environment
- Decision P2: 29/29 passed (pure algorithm/ledger tests, including additional edge cases).
- Focused P1: 11/11 passed, using available global TypeScript compiler.
- Handoff / journey / admissions-chat tests: 51/51 passed.
- Pure module strict TS typecheck and changed TS/TSX transpilation syntax checks passed with available TypeScript 5.8.3.
- `npm ci --offline` failed ENOTCACHED (missing yargs-parser archive). Full dependency install, full project typecheck/build, full regression, browser E2E, live Firebase and multi-device verification NOT RUN. This is an integrated source candidate, not a verified production build.
- Logs: reports/decision-p2/.
