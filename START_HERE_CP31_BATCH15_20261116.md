# START HERE — CLA CP31 Batch 15 (2026-11-16)

## Safety and base

- Apply the PATCH **only to the exact CP31 Batch 14 FULL SOURCE**. Back up `C:\Gạo\Cognitive-Learn` before applying.
- If your working copy differs, unpack Batch 15 FULL SOURCE in an **empty, separate** directory and compare. Do not overwrite `.env`, user data, git config or Firebase production files.
- No production Firebase writes or Rules deployment were performed. Firebase candidate Rules are NOT the deployed Rules.

## Windows validation

```powershell
cd 'C:\Gạo\Cognitive-Learn'
npm run test:cp31:batch15
if ($LASTEXITCODE -ne 0) { throw 'BATCH15 UNIT FAIL' }
npm run verify:cp31:batch15
if ($LASTEXITCODE -ne 0) { throw 'BATCH15 REGRESSION FAIL' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'BATCH15 BUILD FAIL' }
npm run test:rules:emulator
if ($LASTEXITCODE -ne 0) { throw 'BATCH15 FIRESTORE EMULATOR FAIL' }
'CP31_BATCH15_LOCAL_PASS'
```

If dependencies are missing, use the project's lockfile and `npm ci` in an isolated backed-up copy, then rerun the gates. Do not turn on production Rules or run Browser QA against the main Firebase project.

## Scope

- Adds rigorous, bounded, owner-scoped Firestore measurement snapshot audit, including legacy/partial distinction.
- Rejects truncated (>96) declaration windows using a 97th query sentinel, missing source metadata, malicious or stale points.
- Withholds evidence when Firestore snapshot is cache-only or contains pending local writes.
- Transaction rechecks all immutable point fields against live cycle, not only score/time.
- UI describes `COMPLETE_UNVERIFIED`, `PARTIAL_UNVERIFIED`, `LEGACY_READ_ONLY` without inventing psychometric or educational efficacy claims.
- 40/40 new tests + `verify:cp31:batch15` PASS locally; production build and Emulator runtime must be verified on Windows with dependencies.

## Reports

`docs/CP31/CP31_BATCH15_MEASUREMENT_SNAPSHOT_REPORT_20261116.md`.
