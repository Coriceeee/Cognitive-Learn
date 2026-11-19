# CP30 Batch 3 — Independent GPA Consistency Audit

**Date:** 2026-11-15. **Parent release:** `CLA_FULL_SOURCE_CP30_BATCH2_PROFILE_REALTIME_20261115.zip`.

## What changed

- `src/page/seed/services/academicGpaIntegrity.ts`: pure, **read-only** verifier. Recomputes six semester coverage summaries, three year GPAs and the average of completed years from `student_transcripts/{uid}.transcript`. Compares the derived results with `gpaSummary` in **both** `learning_profiles/{uid}` and `student_transcripts/{uid}`. Checks UID, dataScope, schemaVersion, 4-elective and foreign-language identity, nine graded subjects, score syntax/bounds and calculation version.
- `src/page/seed/hooks/useAcademicGpaIntegrity.ts`: subscribes independently to both documents with `includeMetadataChanges:true`, rejects cached/pending results, clears results on auth change / permission failure and invalidates A→B→A listeners. Does not write or migrate user records.
- `src/page/seed/StudentTranscriptPage.tsx`: shows VERIFIED / MISMATCH / LEGACY / INCOMPLETE / syncing status alongside the original persisted grades. VERIFIED means **document consistency only**, not school validation. Legacy data remain labelled as legacy.
- `src/page/seed/StudentPage.tsx`: warns when source GPA differs, or when two-doc verification is incomplete. Existing student-facing metrics are **not** promoted to school-certified results.
- `tests/cp30-gpa-integrity.test.cjs`: 18 pure-audit, fail-closed tests.
- `tests/cp30-gpa-listener.test.cjs`: 10 lifecycle tests for dual listeners, offline cache, pending writes, owner mismatch, logout and session switching.
- `package.json`: `test:cp30:gpa`, `verify:cp30:batch3`; adds new tests to `npm test`.

## Verification performed in this environment

| Gate | Result |
|---|---|
| `npm run test:cp30:gpa` | **28/28 PASS** |
| `npm run verify:cp30:batch3` | **PASS, exit 0** (includes CP30 B1/B2, CP29 regression, static rules and layout) |
| `tsc -p tsconfig.json --noEmit` | **Not PASS** — missing type definitions (`react`, `node`, `d3-*`, etc.) in the reused incomplete `node_modules` directory |
| `npm test` | **Not PASS here** — stops at existing `CONTRACT-01` TypeScript test due to the same missing dependencies; not evidence that the new GPA tests failed |
| Firestore Emulator / browser E2E | **Not run here** |
| Production build | **Not confirmed here** |

## Security, data integrity and limitations

- No changes to Firestore candidate or production rules, Firebase deployment configuration, Admin Functions or privacy-cleanup Functions.
- No automatic correction or overwrite of GPA. A mismatch should lead to a user-reviewed correction or authorized migration, not silent arithmetic normalization.
- Missing GPA remains `null`; an **observed score of zero** remains 0. Partial or missing semesters can still be *consistent*; `VERIFIED` **does not mean every semester is complete**.
- Historical GPA versions are never silently reinterpreted as v2; they receive a `LEGACY` or mismatch indication.
- Two realtime server-confirmed reads are not a server-side atomic multi-document snapshot. A brief inconsistency may appear while listeners converge after a transaction, and the UI should not make a final decision on a transient mismatch. Cross-document consistency is not proof of authentic school grades or a causal research outcome.
- Other unverified GPA consumers and full schema migration remain outside this batch. Do not treat CP30 or the full 164-task reviewer checklist as accepted PASS merely from these tests.

## Windows verification

1. Back up files that will be overwritten. Apply `CLA_CP30_BATCH3_GPA_INTEGRITY_PATCH_20261115.zip` to **CP30 Batch 2 source**, or use `CLA_FULL_SOURCE_CP30_BATCH3_GPA_INTEGRITY_20261115.zip`.
2. Run in a complete, isolated npm installation:

```powershell
npm ci
npm run test:cp30:gpa
npm run verify:cp30:batch3
npm test
npm run test:rules:emulator
npm run verify:cp37
"FINAL_EXIT_CODE=$LASTEXITCODE"
```

**Expected** from existing test suite: the current 83 Firestore authorization scenarios remain passing; this **has not been rerun for Batch 3**. Validate both tabs and two accounts in a real browser, including offline/online transitions and consent revocation, before reviewer approval.
