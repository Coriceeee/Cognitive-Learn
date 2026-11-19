# CLA CP31 Batch 15 — Measurement Snapshot Consistency & Legacy Read-only

Date: 2026-11-16. Base: **FULL SOURCE CP31 Batch 14**. No Firebase QA or production deployment.

## Deliverables

1. `src/lib/journeyMeasurementSnapshot.ts` (NEW): pure, owner-scoped read audit for stored measurement declarations. Only accepts exact T0/T1 points extracted from a valid frozen cycle; refuses duplicate/unknown documents, cross-owner rows, malformed timestamps/score, corrupt cycle evidence and invalid window IDs. Sorts input deterministically. Exposes `expectedCount`, `storedCount`, `missingCount`, `legacyCycleIds`, and `reason` without exporting private information.
2. `src/lib/useJourneyMeasurementDeclarations.ts`: queries `limit(97)` to detect overflow above the accepted maximum of 96. Uses snapshot metadata to withhold audit results when `fromCache` or `hasPendingWrites` is true; stale/unmounted subscriptions cannot update state. Rejects invalid windows as a whole. The write transaction compares every field of the expected point against the current Firestore cycle to mitigate time-of-check/time-of-use drift.
3. `src/components/journey/ClosedLoopPanel.tsx`: Pulse explicitly distinguishes COMPLETE_UNVERIFIED, PARTIAL_UNVERIFIED, and LEGACY_READ_ONLY, states missing counts and warns that full student metadata are *still only declarations*. The older `DECLARED_ALIGNED_ONLY` guard remains intact.
4. `tests/cp31-batch15-snapshot-integrity.test.mjs`: 40 new tests including invalid scores, swapped owners, forged sources, cache policy, query overflow, legacy and missing data, plus compatibility with the B13/B14 contracts.

## Test evidence

| Gate | Result | Scope |
|---|---|---|
| `npm run test:cp31:batch15` | PASS, 40/40 | New engine, read/owner/data-invalid and UI contracts |
| B13+B14+B15 combined | PASS, 133/133 | Node tests only |
| `npm run verify:cp31:batch15` | PASS | B14 and earlier offline chain, layout, source fingerprint |
| `npm test` | PASS | Application Node regression chain |
| Isolated strict TypeScript check | PASS | `src/lib/journeyMeasurementSnapshot.ts` and imported TS engines |
| `npm run audit:cp31:evidence` | Fingerprint MATCH | 296 tracked source files; source integrity only |
| `npm run build` in packaging sandbox | BLOCKED by missing dependencies | `react`/`firebase`/JSX types not installed in extracted source; **not a verified code build failure** |
| Firestore Emulator runtime J16–J20 | NOT TESTED | Must run with dependencies on Windows |
| Browser E2E 72 cases | NOT TESTED | Requires dedicated Firebase QA and accounts |

## Limitations / scientific claim guard

- `COMPLETE_UNVERIFIED` means only that **every expected point in the loaded maximum-eight-cycle window** has a valid declaration; it does NOT mean source authentication, comparable test forms, psychometric validity, reliable grades, causality, or a complete student lifetime history.
- A server-backed Firestore SDK snapshot is not cryptographic proof of honest student data; `fromCache=false` merely avoids *cache-only* false confidence. While offline, the UI may wait for a server response rather than showing stale evidence.
- Legacy cycles lacking a T0 snapshot or Evidence Record remain readable, not silently upgraded. An illegally attached declaration to such a legacy record blocks the window.
- 97th-sentinel detection is a bounded-query integrity gate; it does not support more than 96 declaration documents in the displayed window. To support larger cohorts, redesign pagination with reproducible aggregation and stronger server-side checks.
- No changes to deployment configuration, student accounts, or production Firebase Rules. The existing `firestore.rules.CANDIDATE_CP21` remains a **candidate**, not deployed.

## Checklist 164

Updated `C3`, `R7.1`, `R7.4`, `R7.7`, `R9.6`; unchanged classifications: **21 local technical, 126 partial, 17 lacking evidence, zero independently accepted**. These improvements do not substitute real learning outcomes, human reviewers, or emulator/browser verification.
