# CP30 Batch 4 — Start here

**Base:** CLA full source CP30 Batch 3.

**What changed:** guarded legacy transcript parsing, explicit retry/offline recovery in the transcript screen, and three two-session Firestore Emulator regression cases. No Firebase production deployment or Rules change.

**Read:** `docs/CP30/CP30_BATCH4_LEGACY_OFFLINE_MULTISESSION_REPORT_20261115.md`.

**Windows verification:**

```powershell
npm ci
npm run test:cp30:batch4
npm run verify:cp30:batch4
npm test
npm run test:rules:emulator
npm run verify:cp37
"FINAL_EXIT_CODE=$LASTEXITCODE"
```

**Expected Emulator cases:** 86 (83 previous + 3 new). **Not run here.**
