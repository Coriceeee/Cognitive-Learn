# CP31 Batch 16 — DEMO CORE + HISTORY PAGINATION

Base: **CP31 Batch 15 FULL SOURCE** only. Back up `C:\Gạo\Cognitive-Learn` before applying patch; if base differs, extract FULL SOURCE into a separate directory. Preserve `.env*`, user-generated data, git state and Firebase settings. NEVER deploy candidate Firestore Rules automatically.

## Fast Windows checks

```powershell
cd 'C:\Gạo\Cognitive-Learn'
npm run test:cp31:batch16
if ($LASTEXITCODE -ne 0) { throw 'BATCH16 TEST FAILED' }
npm run demo:gate
if ($LASTEXITCODE -ne 0) { throw 'OFFLINE DEMO GATE FAILED' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'BATCH16 BUILD FAILED' }
npm run test:rules:emulator
if ($LASTEXITCODE -ne 0) { throw 'FIRESTORE EMULATOR FAILED' }
'CP31_BATCH16_LOCAL_PASS'
```

Or run `npm run demo:windows:full` for the combined core + build + Emulator gate. **This does not run 72 Browser E2E cases** or validate real educational impact. Keep Firebase QA for separate controlled review.

## What to show the council

- 7-module app overview; one synthetic learner Golden Path in Orion → Pulse → Lumen and audit evidence in Nexus.
- A two-cycle T0 → T1 → T2 example with explicit missing values and self-report labels.
- Source/scale/assessment metadata warnings: same numeric score does not establish equivalent tests.
- **New:** click `Tải 8 chu kỳ cũ hơn (chỉ đọc)` on the closed-loop history panel, when more than eight cycles exist and Firestore Rules allow owner-scoped listing.
- Reports: `reports/demo/cla_batch16_offline_readiness.json` and `reports/evidence/*.json` are **synthetic/static**, not student experiment or production evidence.

For the 48-hour freeze, fix demo-breaking bugs first; do not add speculative features. See `docs/CP31/CP31_BATCH16_DEMO_48H_REPORT_20261116.md`.
