# COGNITIVE LEARN AI — CP29 batch 2: C4/D3 academic subject lock

**Date:** 2026-11-15  
**Base:** CP29 batch 1 full source (`CLA_FULL_SOURCE_CP29_BATCH1_LIVE_AUTH_20261115.zip`).  
**Deployment:** none. This change modifies **candidate** Firestore Rules only, not production `firestore.rules.CANDIDATE` / Firebase production configuration.

## Root cause and changes

| Problem | Fix | Evidence |
|---|---|---|
| First atomic batch could create `learning_profiles/{uid}` and `student_transcripts/{uid}` with **different** subject identities because Rules read the prior state (`get/exists`) | Both cross-document checks now use `getAfter/existsAfter`, so first creation and updates must agree in the final batch state | New Emulator test **S27**, original S08 must still allow a valid batch |
| Changing Foreign Language 1 could silently change the nine graded subjects despite the elective array being locked | After first save, lock **four electives + Foreign Language 1 + curriculum program** in Rules and UI | S20, S21, S24 and CP29 behavior/contract tests |
| Transcript could include unapproved subjects in grade 10/11/12, or unexpected grade/term keys | Rules require all six optional term maps to contain only names from the nine canonical subjects; unknown grade/term rejected. Missing terms are still allowed. | S22, S23, S25; behavior tests |
| Legacy academic document missing curriculum could be self-overwritten into an arbitrary subject identity | Fail closed. UI detects missing/contradictory academic identities and refuses save. | S26 and UI tests |
| UI still exposed editable foreign-language picker on locked profile | Disable it on locked account, add submit guard and visible explanation | `StudentProfilePage.tsx`, contract tests |

## What this does not establish

- **Not yet a PASS for server authorization:** The eight S20–S27 cases must execute inside a real Firestore Emulator on Windows. CP28 baseline was 75 cases; this full suite should now contain **83** cases. An existing pass 75/75 is not a rerun of the new Rules.
- No audited **authorized exception** has been implemented. If a school formally changes the curriculum, the existing client intentionally cannot override the lock. A future privileged correction service must require documented grounds, independent approval, immutable audit records, and a three-year transcript reconciliation plan. Until then **D3 remains PARTIAL**, never claim full implementation.
- Existing legacy transcripts whose historical subject keys conflict with current locked identity will be refused, not silently rewritten. Migration policy and a safe dry-run are required before production release.
- This is a *subject-identity* and year/term-key check, not external verification of grades or a complete nested score validation schema.
- Build and real browser E2E not run here due absent `node_modules` / Firebase Emulator runtime. The user must rerun under their Windows environment.

## Local verifications

- `npm run test:cp29:academic`: **14/14 PASS** (7 behavioral + 7 static/contract).
- `npm run verify:cp29:batch2`: **PASS** (all inherited CP29/CP28 verification tasks and 15 Rules static tests).
- `npm test`: **PASS** (project's full JavaScript test chain, now includes the 14 tests above).
- Firebase Emulator S20–S27: **NOT RUN** here. Browser and production: **NOT RUN**.

## Commands to run on Windows

From `C:\Gạo\Cognitive-Learn`, with a backed-up CP29 batch 1 source plus this patch:

```powershell
npm run test:cp29:academic
npm run verify:cp29:batch2
npm run test:rules:emulator
Get-Content .\reports\security\firestore_emulator_gate.json -Raw
npm run verify:cp37
"CP29_BATCH2_EXIT_CODE=$LASTEXITCODE"
```

Expected **83/83 Emulator** and `overall: PASS` for candidate Rules. The final `verify:cp37` command must exit 0. The host may use ASCII staging and port 18080 from earlier fixes.

## CP29 work-item status

- **C4:** Rules+UI improved; candidate tests 83 are pending actual Emulator rerun. **PARTIAL until verified**.
- **D3:** Three-year invariant and fail-closed legacy handling implemented; audited exception and data reconciliation still absent. **PARTIAL**.
- **A4, B2:** CP29 batch 1 unchanged; browser E2E remains pending.
- **Remaining CP29 B1/B3/B4/C1/C5/F4/K15:** not handled by this batch.

**Do not deploy candidate Firestore Rules to production automatically.**
