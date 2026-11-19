# CP31 Batch 14 — Owner-scoped Measurement Provenance Collection

**Date:** 2026-11-16  
**Base:** FULL SOURCE CP31 Batch 13, no production deployment  
**Scope:** partial technical evidence on C3, R7.1, R7.4, R7.7, R9.6. No change of their acceptance status.

## Problem and root cause

Previous B13 verified consistency against an *offline optional manifest*, while the website always passed `null`: users could not record per-measurement metadata through the real journey UI. T0/T1/T2 numbers were self-reports whose source, scale and scoring rules were not stored. Declaring equality of numeric scores alone does not establish comparable instruments.

## Technical changes

1. `src/lib/journeyMeasurementDeclarations.ts`: strict structured inputs; creates bounded T0/T1 points only from audited cycle, immutable per-cycle/timepoint IDs; 0 is valid; no default instruments or extra PII; parser rejects owner mismatch, wrong score and stale timestamps; strips all wrapper fields for the B13 audit manifest.
2. `src/lib/useJourneyMeasurementDeclarations.ts`: one owner-scoped subscription for the currently visible <=8 cycles (`in` query, limit 96); reject invalid rows instead of filtering; transaction re-reads journey and declaration and creates once; role + product-consent security remains enforced in Rules.
3. `firestore.rules.CANDIDATE_CP21`: validMeasurementDeclaration checks schema, document ID, owner, consent, T0 plan baseline or T1 reviewed observation, instrument metadata, `declaredAt == request.time`; rejects updates and deletes. This file is a candidate; `firebase.json` is NOT altered.
4. `src/components/journey/ClosedLoopPanel.tsx`: Pulse form with explicit confirmation, clear provenance caveat, immutable write and read-back; Lumen/Orion/Pulse use B13 audit of stored metadata, and do not concatenate trend when source declarations are missing/mismatched.
5. `tests/cp31-batch14-measurement-persistence.test.mjs`: 41 Node tests including corruption/PII/owner/late-timepoint guards and B13 compatibility. `tests/firestore.rules.cp21.test.mjs`: five additional Emulator scenarios J16–J20 (not executed locally).

## Limits / threats

- `declaredAt` is the server's write timestamp, **not** independently verified exam administration time. A student can retrospectively add T0 metadata. No human verification, test-equating, reliability coefficient, ICC or causal effect is claimed.
- Rules candidate must pass real Emulator tests and security review before any deployment. Existing Firestore production Rules do not necessarily support this write path. The UI handles permission-denied as a blocked feature, without silent overwrite.
- It is not a model prediction, recommender-effect evaluation or participant research study. This does not remove requirements for ethics, guardian consent, data minimization and regulated data governance.
- A maximum of eight cycles and 96 observations limits the UI window. Server enforcement does not establish a complete longitudinal record or retrospective missing-data correction.
- No cryptographic signing of the source evidence or independent attestation is provided.

## Actual testing in this packaging environment

| Gate | Observed result |
|---|---|
| New B14 pure Node tests | PASS 41/41 |
| `verify:cp31:batch14` | PASS, inherited offline regressions |
| Rules static / layout | PASS |
| TypeScript check of pure declaration module | PASS |
| Full application `npm run build` | NOT TESTED: dependencies unavailable |
| Firestore Emulator including J16–J20 | NOT TESTED: dependencies unavailable |
| Browser E2E 72 cases | NOT TESTED: QA not configured |

The local dependency install was attempted but timed out. Do not interpret its timeout as a source-code regression, and do not claim a successful production build.

## Progress evidence

The 164-item audit retains **21 local technical / 126 partial / 17 insufficient-evidence** and zero reviewer acceptances. Updated evidence/remaining constraints for **C3, R7.1, R7.4, R7.7, R9.6** in the separately attached Batch 14 CSV/XLSX.
