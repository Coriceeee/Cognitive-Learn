# CLA CP31 BATCH 14 — Measurement source declarations (2026-11-16)

## Base and safety

- PATCH is ONLY for the exact FULL SOURCE CP31 Batch 13 (measurement audit). Back up your current Windows project first. Do not overwrite `.env`, `.env.local`, or Firebase production files.
- FULL SOURCE may be extracted to an empty directory; source fingerprint in `src/lib/nexusEvidenceBaseline.ts` covers 294 files.
- No Firebase deployment, data migration, role changes or production writes were performed during packaging.
- `firestore.rules.CANDIDATE_CP21` is ONLY a candidate, NOT configured for production deployment.

## What changed

- One immutable student declaration per score at a T0/T1 timepoint under `learning_journeys/{uid}/measurement_declarations/{cycleId}~{subjectKey}~{timepoint}`.
- Input fields: instrument ID, version, form, scoring protocol, scale; score and linkedAt are derived from a trusted current journey document, not entered a second time.
- `declaredAt = serverTimestamp()` records the declaration write time; it does not independently authenticate exam time. T0 metadata entered after T1 is RETROSPECTIVE.
- Rules candidate requires student account + product consent, matches exact cycle/subject/index/observed score/time, rejects update/delete and extra fields.
- Pulse now provides an explicit one-time confirmation form, owner-scoped Firestore listener and absent/invalid declaration warnings.
- B13 measurement audit consumes declared metadata, but output remains `DECLARED_ALIGNED_ONLY`; never a psychometric, causal or verified source claim.
- When metadata are absent or mismatched, the UI does NOT render the joined T0/T1/T2 trend.
- Legacy cycles without valid T0 or technical evidence remain readable where allowed but do not receive evidence promotion.

## Run on Windows (after backup and PATCH to Batch 13)

```powershell
cd 'C:\Gạo\Cognitive-Learn'
npm run test:cp31:batch14
if ($LASTEXITCODE -ne 0) { throw 'BATCH14 TEST FAILED' }
npm run verify:cp31:batch14
if ($LASTEXITCODE -ne 0) { throw 'BATCH14 VERIFY FAILED' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'BUILD FAILED' }
npm run test:rules:emulator
if ($LASTEXITCODE -ne 0) { throw 'EMULATOR FAILED' }
'CP31_BATCH14_LOCAL_PASS'
```

Emulator suite includes J16–J20. Do not deploy candidate Rules before tests and review. If current deployed Rules do not support `measurement_declarations`, the UI will show permission-denied and existing journeys still work; this is expected.

## Local evidence, 2026-11-16

- 41/41 new Node tests PASS.
- `npm run verify:cp31:batch14` PASS (includes preceding offline gates and static rules/layout).
- Pure measurement declaration TypeScript check PASS with global compiler.
- Full production build, Firestore Emulator runtime J16–J20, and browser E2E: NOT TESTED in packaging environment.
- `npm ci` could not complete due environment timeout, NOT a verified install/build FAIL.

Progress: 21 local technical / 126 partial / 17 lacking evidence, no independent acceptance; 164 rows unchanged in classification.
