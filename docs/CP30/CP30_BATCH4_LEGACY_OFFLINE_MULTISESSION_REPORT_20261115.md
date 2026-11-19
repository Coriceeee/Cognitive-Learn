# CLA CP30 Batch 4 — Legacy transcript safety, reconnection, and two-session Emulator regression

**Date:** 2026-11-15. **Parent:** `CLA_FULL_SOURCE_CP30_BATCH3_GPA_INTEGRITY_20261115.zip`. **Scope:** read-only legacy guard; transcript retry; Firestore Emulator security/regression tests. **Production deployment:** NOT performed.

## Shipped source changes

1. New `src/page/seed/services/legacyTranscriptPolicy.ts`: checks the UID-scoped legacy document, academic identity against the locked nine subjects, valid grades/semesters, grade rows and valid zero/missing/decimal marks **before** rendering any legacy data. An invalid legacy record is quarantined with an error; no write-back, auto-migration or silent score correction occurs. Legacy documents without `userId` remain readable only at their own Firestore UID-scoped path if the remaining curriculum/rows are well formed. This is a limited, read-side compatibility policy; it does not verify that the school issued the grades.
2. `useStudentTranscript`: owner/session guards remain in place, `assessLegacyTranscript` is called only on server-confirmed legacy snapshots, and a `retry` function forces listener re-subscription after errors/offline. Cached/pending data are still cleared and must be reconfirmed by Firestore before rendering. Changing accounts or retrying invalidates old subscriptions.
3. `StudentTranscriptPage`: explicit reconnection actions for syncing and error states and a historical/legacy disclosure. Primary student transcript display and GPA verifier remain read-only.
4. Three added tests in `tests/firestore.rules.cp21.test.mjs`, named N01–N03, exercise two authenticated Firestore Emulator client contexts, transaction conflict detection, and a previously active session after account suspension. These tests only run inside the existing fail-closed demo-project localhost Security Gate; they cannot connect to production.
5. New legacy behavior tests plus updates to the older transpile-only test harnesses so they correctly resolve `.ts`-suffixed source imports. `npm run test:cp30:batch4` and `npm run verify:cp30:batch4` scripts added.

## Executed here

| Gate | Result | Meaning |
|---|---|---|
| `npm run test:cp30:batch4` | **32/32 PASS** | 12 new legacy checks + 10 existing realtime + 10 GPA listener checks |
| `npm run verify:cp30:batch4` | **PASS, exit 0** | Includes Batch 1–3 regressions, CP29, candidate Rules static tests, layout check |
| `node --check tests/firestore.rules.cp21.test.mjs` | **PASS** | Syntax only; **not** Emulator execution |
| `npm test` | **BLOCKED/FAIL HERE** | Existing TypeScript contract test cannot resolve installed type definitions (`d3-*`, Node, React) from incomplete reused `node_modules` |
| `npm run test:rules:emulator` | **NOT RUN HERE** | N01–N03 must be tested in a real local Firestore Emulator; expected suite increases from 83 to **86** tests |
| `npm run verify:cp37` / build | **NOT VERIFIED HERE** | Requires a complete dependency install (`npm ci`) |
| Browser E2E / Firebase production | **NOT RUN** | No deployment or true browser multi-session test in this batch |

**Do not conclude:** 32 passing local tests and 86 planned Emulator cases do not constitute production validation, actual school-confirmed GPA or completion of the 164-task reviewer checklist.

## How to apply on Windows

- Back up your current project source. Extract the **patch** over CP30 Batch 3, or use the CP30 Batch 4 full source. Do not layer the full-source archive on top of another deployed version without a backup.
- From `C:\Gạo\Cognitive-Learn`, run:

```powershell
npm ci
npm run test:cp30:batch4
npm run verify:cp30:batch4
npm test
npm run test:rules:emulator
npm run verify:cp37
"FINAL_EXIT_CODE=$LASTEXITCODE"
```

- The Firestore gate reports the overall status in `reports/security/firestore_emulator_gate.json`; verify exact number of `N01–N03` cases and the existing 83. Browser-check with two real accounts, two tabs, offline/online switching and a malformed legacy transcript after the Emulator gate is green.

## Release limitations and next work

- This release does **not** alter `firebase.json`, production `firestore.rules`, candidate Rules, Cloud Functions or Google/Firebase data.
- No automatic migration of legacy data is included. Unrecognized historical curricula are deliberately quarantined and require a separately reviewed migration plan with backup, provenance and explicit authorization.
- UI/SDK listener behavior in a real browser with offline cache, token expiry and two signed-in users still needs E2E evidence.
- Reviewer approval for CP30 and its checklist items remains `PENDING` until the full acceptance criteria and release SHA are checked.
