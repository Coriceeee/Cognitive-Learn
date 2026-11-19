# CP31 Batch 13 — Measurement provenance & comparability gate

**Date:** 16 November 2026. **Baseline:** CP31 Batch 12 full source. **Scope:** measurement-metadata declarations, NOT empirical reliability/validity testing.

## Root cause

Batch 12 can replay two reviewed cycles from frozen self-reported T0 and T1. Equal numbers, exact subject keys and matching timelines cannot establish that tests share a scale, form, scoring rubric or instrument interpretation. Displaying joined T0/T1/T2 without an explicit measurement-provenance warning risks overstating progress. Recorded time in Firestore is not necessarily the test administration time.

## Changes

1. `src/lib/journeyMeasurementAudit.ts`: pure deterministic audit of an optional separate measurement manifest with point-by-point exact matching to previously audited cycles. Bounded up to 8 cycles / 6 subjects / 2 declared points. For each T0/T1: validates cycle ID, subject, score (including zero), source, linked timestamp, instrument ID/version, form, scale and scoring protocol. Unknown fields, surplus/duplicate points, malformed IDs/dates, corrupted Evidence Records, mismatching owners and altered baseline are blocked. No imputation, conversion or automatic scale inference.
2. Statuses distinguish `SOURCE_BLOCKED`, `MISSING_DECLARATIONS`, `INVALID_DECLARATIONS`, `INSTRUMENT_MISMATCH`, `SCALE_MISMATCH`, `FORM_MISMATCH`, `SCORING_PROTOCOL_MISMATCH`, and `DECLARED_ALIGNED_ONLY`. **Even when all declarations match, equivalence/reliability/independent outcome verification remain `false`; forecast error and causal effect remain `null`.**
3. `src/components/journey/ClosedLoopPanel.tsx`: Orion, Pulse and Lumen display a provenance warning for longitudinal series on existing Firestore cycles. As the current production schema does not capture instrument metadata, browser UI reports missing declarations; it continues to display self-reported numeric observations as *unverified descriptive values*, not measurement-equivalent trends.
4. `research/golden_path/measurement_declarations_SYNTHETIC.v1.json`: **independently stored** eight-point metadata declaration fixture paired with two synthetic cycles from Batch 12; no real learner information.
5. `tools/cla_measurement_offline.mjs`: generate/verify local deterministic integrity envelope, trace source fingerprint and all three input fixtures. This is not a signature, verified grading, or independent attestation. Output is under `reports/evidence` and is excluded from release ZIPs.
6. `tests/cp31-batch13-measurement-audit.test.mjs`: 52 tests including scale/form/version/protocol changes, 0 vs missing, absent declarations, surplus/duplicate inputs, altered scores/timestamps, PII-field rejection, cross-owner protection, forged verification flags, and envelope replay.
7. New npm scripts: `test:cp31:batch13`, `verify:cp31:batch13`, `research:measurement`, `research:measurement:verify`. New synthetic declaration fixture added to `tools/cp31_release_fingerprint.cjs` to ensure the shipped research example cannot drift silently.

## Actual verification

- `npm run test:cp31:batch13`: **52/52 PASS** (local Node 22 runtime).
- `npm test`: **PASS**, includes Batch 13 and prior regression checks.
- `npm run verify:cp31:batch13`: **PASS**, runs Batch 12 and all earlier chained gates, generates & replays synthetic declaration envelope.
- TypeScript strict: **PASS** for `closedLoopJourney.ts`, `journeyT0T1Comparison.ts`, `journeyMultiCycleTrend.ts`, `journeyMeasurementAudit.ts`.
- `npm run check:layout`: PASS.
- **NOT TESTED:** Vite production bundle on user's Windows host, Firebase Emulator runtime, actual Firestore QA, browser E2E 72/72, independent academic/psychometric validation, real repeated tests, external reviewer approval.

## Methodological and product limits

- All declarations are **self-declared and unverified**. Matching instrument labels and scoring scales is a *necessary technical check only*, not sufficient for psychometric equivalence. It does not estimate ICC, test–retest reliability, sensitivity/responsiveness, uncertainty, or any treatment effect.
- The current Firestore schema does **not** persist measurement-context declarations. The offline fixture demonstrates the audit API; the website must not pretend that it holds sourced assessment records. The browser receives `null` manifest deliberately and therefore warns.
- This release does not alter the server candidate Rules or perform production writes. Future collection of test provenance requires deliberate schema migrations, consent, rule changes and QA, not just a UI label.
- Source fingerprint and local SHA-256 do not prove authenticity of a test, a student's identity or scientific provenance.

## Checklist 164

Updated the evidence and remaining constraints for **R6.3, R7.1, R7.4, R7.7, R9.6**. Conservative classifications unchanged: **21 local technical, 126 partial, 17 insufficient evidence, 0 independently accepted**. Separately marking R4.5 psychometric testing as complete would be scientifically incorrect.

## Windows verification

Apply **PATCH Batch 13 to Batch 12 only** after backup, or extract FULL SOURCE in a new empty directory. Do not overwrite `.env` or deploy candidate Rules. Run:

```powershell
cd 'C:\Gạo\Cognitive-Learn'
npm run test:cp31:batch13
if ($LASTEXITCODE -ne 0) { throw 'BATCH13 TEST FAILED' }
npm run verify:cp31:batch13
if ($LASTEXITCODE -ne 0) { throw 'BATCH13 VERIFY FAILED' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'BUILD FAILED' }
npm run test:rules:emulator
if ($LASTEXITCODE -ne 0) { throw 'EMULATOR FAILED' }
'CP31_BATCH13_LOCAL_PASS'
```

Optional offline replay: `npm run research:measurement` then `npm run research:measurement:verify`. No accounts, browser QA or production network is accessed.
