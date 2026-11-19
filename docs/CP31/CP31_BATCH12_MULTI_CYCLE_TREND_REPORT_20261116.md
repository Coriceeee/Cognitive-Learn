# CP31 Batch 12 — Multi-cycle T0/T1/T2 Audit & Longitudinal Guard

**16/11/2026 | Base:** CP31 Batch 11 | **Scope:** technical retrospective trace, NOT a scientific longitudinal-effect estimate.

## Root cause and scope

Batch 11 compared a single reviewed cycle's frozen T0 against its student-reported T1. Firestore displays up to eight cycles, newest first. Naively calculating an average across cycles, using a later cycle's T0 as an observed T2, or mixing different subjects/learners would manufacture a trend. The scientific distinction between descriptive change, predictive performance and an intervention effect remains mandatory.

## Implemented

1. `src/lib/journeyMultiCycleTrend.ts`: deterministic, read-only `auditJourneyHistory` and `replayJourneyHistory`, with a strict maximum eight-cycle window, temporal ordering, unique cycle IDs, optional exact owner binding, forbidding mixed owners even without a supplied UID, and per-reviewed-cycle checks through `compareJourneyT0T1` (which already validates frozen T0 and Evidence Record).
2. Cross-cycle gate: require previous T1 to predate new T0, matching subject key/label, explicit observed T1 for each adjacent cycle, and exact equality between previous T1 and next T0 for a stitched subject. Missing subjects, changed labels, baseline shifts, overlaps and unsupported legacy reviews block the stitched trend rather than silently interpolating or merging cohorts. An ACTIVE latest cycle does not generate a new T point.
3. A T2 point is the **second cycle's observed reassessment**, not its entry baseline. Multiple reviewed cycles can yield sequential self-reported points, but only across audited continuous boundaries. No cross-cycle average gain, causal effect, model accuracy or treatment claim is computed. Equality of self-reported values **is not measurement-equivalence evidence**.
4. `src/lib/useClosedLoopJourney.ts`: Firestore reader now requires each record's `userId` to match the authenticated UID; otherwise it clears old on-screen results and fails closed. `uid` is passed into the history audit. No new Firestore write, deployment or Rules modification.
5. `src/components/journey/ClosedLoopPanel.tsx`: Orion/Pulse/Lumen show multi-cycle evidence state, per-subject T0/T1/T2, discontinuity details and a warning when the Firestore eight-record window may truncate older history.
6. `research/golden_path/fixture_SYNTHETIC_cycle2.v1.json` and `tools/cla_multicycle_offline.mjs`: two cycles from real domain engines but **synthetic inputs only**. Create/verify a locally reproducible integrity envelope linked to source fingerprint. Neither creates Firebase accounts nor reads real pupils. The new fixture file is fingerprint-tracked.
7. `tests/cp31-batch12-multicycle-trend.test.mjs`: 48 tests including reversal, zero vs missing, 8/9 cycles, repeat IDs, temporal overlap, missing measurements, changed baseline, key/label cohort changes, cross-owner or ownerless records, legacy, tampered Evidence Records and synthesized evidence tampering. The Batch 9 listener contract test was updated to assert the stricter cross-UID predicate rather than the old source pattern.

## Results observed in local build environment

- `npm run test:cp31:batch12`: **48/48 PASS**.
- `npm run verify:cp31:batch12`: **PASS (exit code 0)**; includes Batch 11 and older check suites, Golden Path, two-cycle generate + verify, layout and source fingerprint audits.
- `npm test`: **PASS (exit code 0)**.
- `npm run test:rules:static`: **15/15 PASS**.
- `tsc --noEmit --strict ...` for `closedLoopJourney.ts`, `journeyT0T1Comparison.ts`, `journeyMultiCycleTrend.ts`: **PASS**.
- **NOT RUN**: production build (dependencies absent in this packaging environment), Firestore Emulator runtime, browser E2E 72/72, actual longitudinal data from Vietnamese high-school students, CI/deployment, authenticated independent review.

## Scientific safeguards and remaining limitations

- These T labels are *technical, descriptive, student-self-reported points*, not validated psychometric measurements; equality of scores is an implementation continuity rule only.
- The local replay checksum is a consistency detector, not a digital signature or an attestation of true student identity/observations.
- Displaying the last eight cycles can omit earlier data, therefore no full-history or global trajectory claim is permitted.
- No new T0 calibrated forecast exists. Prediction error and intervention effects remain explicitly null.
- The Firestore listener owner check is defense-in-depth, not an alternative to server-side Firestore security Rules and independent QA.
- No empirical eligibility is claimed for the synthetic fixture, and no P0 research task is automatically closed.

## Checklist 164

Evidence entries updated for `R6.3`, `R7.1`, `R7.4`, `R7.7`, `R9.6` with explicit remaining limitations. Classification unchanged: **21 technical local / 126 partial / 17 insufficient evidence / 0 independent acceptance**. Full CSV and Excel included under `docs/CP31/` and as separate release links.

## Windows application (PATCH on top of Batch 11 only)

1. Back up `C:\Gạo\Cognitive-Learn` before extracting the PATCH; stop dev-server processes; never replace `.env` or production configuration.
2. Extract `CLA_CP31_BATCH12_MULTI_CYCLE_PATCH_20261116.zip` at `C:\Gạo\Cognitive-Learn` only if Batch 11 is present. Otherwise use the FULL SOURCE package in a separate empty directory and migrate local `.env` manually after review.
3. Verify:

```powershell
cd 'C:\Gạo\Cognitive-Learn'
npm run test:cp31:batch12
if ($LASTEXITCODE -ne 0) { throw 'BATCH12 TEST FAILED' }
npm run verify:cp31:batch12
if ($LASTEXITCODE -ne 0) { throw 'BATCH12 VERIFY FAILED' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'BUILD FAILED' }
npm run test:rules:emulator
if ($LASTEXITCODE -ne 0) { throw 'EMULATOR FAILED' }
'CP31_BATCH12_LOCAL_PASS'
```

Optional synthetic demonstration: `npm run research:multi-cycle` followed by `npm run research:multi-cycle:verify`; output `reports/evidence/cla_multicycle_SYNTHETIC.json` is local only.

No QA accounts or production deployment are required for this batch; separately verify authenticated functionality before production use.
