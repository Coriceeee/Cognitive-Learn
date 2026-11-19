# CP31 Batch 12 — Multi-cycle T0/T1/T2

**Base for PATCH:** CP31 Batch 11 T0/T1 Comparison, 16/11/2026.

**Deliverables:** source changes + 48 new automated tests; audited 8-cycle read-only history; two synthetic fixtures; CLI replay; updated 164-task Excel and CSV. No Firebase Production writes or E2E credentials required.

Run from `C:\Gạo\Cognitive-Learn` after making a backup and extracting the PATCH onto Batch 11:

```powershell
npm run test:cp31:batch12
if ($LASTEXITCODE -ne 0) { throw 'B12 TEST FAILED' }
npm run verify:cp31:batch12
if ($LASTEXITCODE -ne 0) { throw 'B12 VERIFY FAILED' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'BUILD FAILED' }
npm run test:rules:emulator
if ($LASTEXITCODE -ne 0) { throw 'EMULATOR FAILED' }
'CP31_BATCH12_LOCAL_PASS'
```

Optional demo:

```powershell
npm run research:multi-cycle
npm run research:multi-cycle:verify
```

**Important:** T2 is the second cycle's new observed (self-reported) reassessment, not its T0 entry value. Unmatched baselines or subjects block stitching. An eight-cycle Firestore window can be incomplete. Synthetic replay proves neither longitudinal efficacy nor prediction calibration.

**Evidence:** `docs/CP31/CP31_BATCH12_MULTI_CYCLE_TREND_REPORT_20261116.md` and `docs/CP31/CLA_REAUDIT_164_CP31_BATCH12_20261116.csv`. Reviewer acceptance and 72 browser cases remain NOT TESTED.
