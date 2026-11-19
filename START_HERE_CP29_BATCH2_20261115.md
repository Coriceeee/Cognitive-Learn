# START HERE — CLA CP29 batch 2 (C4 / D3)

**Patch base:** CP29 batch 1, not CP28 directly. Back up changed files before extracting.

## Safe workflow

1. Unpack CP29 batch 2 patch preserving relative directory structure into the CP29 batch 1 working tree.
2. Run:

```powershell
npm run test:cp29:academic
npm run verify:cp29:batch2
npm run test:rules:emulator
Get-Content .\reports\security\firestore_emulator_gate.json -Raw
npm run verify:cp37
"EXIT_CODE=$LASTEXITCODE"
```

3. **Target** 83/83 Firestore Emulator cases, plus final `EXIT_CODE=0`. Do not claim PASS if new Emulator tests fail or are skipped.
4. Review `docs/CP29/CP29_BATCH2_ACADEMIC_LOCK_REPORT_20261115.md` for limitations: school-authorized exception path and legacy migration not yet built.

**Production:** untouched, no deployment authorized. Rules under test: `firestore.rules.CANDIDATE_CP21` only.
