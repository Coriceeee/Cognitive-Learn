# CLA Decision P4 — reviewed-cycle continuity (source candidate)
Base: CLA_DECISION_P3_FULL_20261124.zip. No GitHub, deployment, rules, account, secret, CSS, routing or new Firestore schema changes.

## What changed
- Existing ClosedLoopPanel receives the latest owner-bound server-confirmed reviewed cycle. Preview current Orion baseline versus Pulse T1, including zeros and decreases. Copy requires explicit confirmation; no Seed grade, target, Pulse history or forecast is overwritten. Orion's existing autosave applies to the edited draft.
- Automatic workload advice requires a complete traceable review, identical goal/subject set/target scores, and matching current T1 baselines. If mismatched, the learner can create a manual cycle; no false continuity. The existing workload policy and historical trace schema remain unchanged; a new traced cycle rechecks continuity with the prior document read in the same Firestore transaction. No change to Firebase Rules, so this new client guard is not a server security boundary.
- Advice selection binds to the entire current draft, options and reviewed source. If these change, the selection resets. Pulse links back to existing Lumen evidence and Orion commit routes; forms reset for changed account/cycle, not temporary server syncing for the same owner.
- Scope: matching T1 values are self-reports, not independent evidence of comparable tests. No automatic change to Lumen ML/cognitive indices, no model retraining, no new causal or probability claims. Changed goals or partial review deliberately require manual planning; live multi-device consistency still needs Firebase E2E. Orion draft copy is based on the current confirmed snapshot, not an atomic transaction with the review; the traced next-cycle start revalidates the source transactionally.

## Try after local build
1. Orion → scenarios → commit: start a cycle, note subject keys and targets. Pulse → check-in: record two weeks and complete actual reassessment for all subjects. Use real observed scores or clearly labeled demo data.
2. Pulse → Lumen evidence: verify historical T0/T1, source and limitations. Return to Orion commit without changing goal or target subjects. Preview differences and explicitly apply reviewed scores. Check the existing draft save indicator.
3. Select eligible adaptive workload recommendation (if available) and confirm a new cycle. Verify new T0 matches T1 and the existing decision trace links to prior review. Change target, subjects, goals, or scores and verify no stale advice is accepted. Try partial measurement and different accounts.
4. `npm ci`, `npm run verify:focused`, `npm test`, `npm run build`, `npm run dev`. Restore your own local environment separately. Do not overwrite secrets or publish rules. P5 is still open.

## Verification in packaging environment
- `verify:focused` PASS: 133/133 tests (11 focused, 51 handoff/journey/chat, 29 P2, 23 P3, 20 P4); 63 pinned source files verified. Navigation 4/4 PASS separately.
- Extended journey/workspace suite: 93/94 PASS. One inherited Atlas static-contract failure (`Atlas specialized panels have distinct React route owners` in `cp42-focused-workspaces.test.mjs`); both AtlasPage and that test are byte-identical to P3. Not changed or suppressed in P4. Some tests overlap the focused suite; do not sum as unique tests.
- Pure module strict TypeScript check (ES2020) and changed TS/TSX transpile syntax check PASS. No full project typecheck/build: `npm ci --offline` failed ENOTCACHED for yargs-parser. Full regression, browser E2E, live Firebase/Gemini and multi-device behavior NOT RUN. Synthetic replay is technical only; no empirical validation. Reports: `reports/decision-p4/`.
