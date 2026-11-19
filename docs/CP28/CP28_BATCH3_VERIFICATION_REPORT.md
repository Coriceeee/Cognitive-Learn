# CP28 — Batch 3: Post-cleanup verification gate

Date: 2026-11-15. Base: CP28 Batch 2. Target: B5 / F1 / F2 / R2.4.

## Change

- After an accepted → withdrawn consent trigger runs `cleanupWithdrawnStudentLinks`, the function performs an **independent, read-only second scan** (`verifyWithdrawnLinkCleanup`) of student-linked metadata.
- It counts links whose creation timestamp precedes or equals the withdrawal event (and timestamp-less legacy links); valid links created after the event are excluded.
- If old links remain, the function throws `CP28_REVOCATION_INCOMPLETE` and relies on configured trigger retry; no successful log is emitted.
- Verification traverses pagination with fixed bounds and fails closed on invalid cursor, malformed ownership, or exhausted pagination.
- Successful logs are counts only and explicitly say `verified-at-check-time`. This does not certify Firebase production, deleted offline copies, backup retention or later concurrent writes.
- No changes to candidate Rules, default firebase.json, collection schema, client features or source dependencies.

## Tests and evidence

- 8 new tests CS18–CS25 for verification, legacy timestamp, new grant preservation, bounds, no deletion, malformed entries and integration wiring.
- Existing 17 server cleanup tests retained (25/25 PASS).
- `npm run verify:cp28:static` PASS locally.
- 42/42 closed-loop + client revocation tests PASS; 51/51 Rules static contract tests PASS; 25/25 server unit tests PASS. **118/118 local tests PASS**.
- Emulator 75-case tests, Firebase Functions Emulator event integration, npm build and browser E2E **not executed here**. Last known 74/74 candidate Rules PASS was CP27 V5 on Windows; not proof of CP28.

## Important outstanding blockers

1. Rules candidate currently allows teacher/parent `student_links` metadata listing for owner/query-scoped links until cleanup occurs. Thus **immediate withdrawal privacy is NOT guaranteed**. A verified-at-check-time scan is not a replacement for immediate server-side authorization denial.
2. Cloud Function remains disabled / undeployed; it requires authorized rollout and real Functions Emulator trigger verification.
3. Reports exported/downloaded by recipients, client cache and backups are not recalled by this feature.
4. Full legal/ethics and retention evidence for R2.4 remains open.

## Apply to CP28 Batch 2

Copy the three code/test files from patch ZIP into matching paths in `C:\Gạo\Cognitive-Learn` after backing them up.

```powershell
npm run verify:cp28:static
npm run test:rules:emulator
npm run verify:cp37
Get-Content .\reports\security\firestore_emulator_gate.json -Raw
```

Emulator CP28 expected **75/75** if source includes L14 and no regressions. Do not treat this as guaranteed. Do not deploy candidate Rules or Cloud Functions to production from this package.

Reviewer status B5/F1/F2/R2.4: PENDING until integration/permissions/privacy checks are completed.
