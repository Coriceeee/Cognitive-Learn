# CP51 — Serialized Firestore draft writes

## Change summary
- Shared `useModuleDraft` now serializes writes in the order they are requested per mounted hook, so a slower older save cannot finish after a newer save from that hook.
- A failed write no longer poisons the subsequent queue.
- Rechecks Firebase user ownership when a queued write actually runs; an intervening account change blocks that write.
- Adds four executable queue/security tests and updates the CP47 source-level contract to the renamed `ownerUid` variable.
- Recomputes the source fingerprint and refreshes synthetic technical demo evidence after code changes; synthetic demo is NOT scientific/production verification.

## Verified here
- `npm test`: PASS (full script; see `reports/cp51/npm-test.log`)
- `npm run test:rules:static`: 15/15 PASS (static contracts only)
- `npm run check:layout`: PASS
- CP47/CP50/CP51 focused tests: 12/12 PASS

## Not verified
- `npm ci` / TypeScript + Vite production build: no complete dependencies in this execution environment.
- Firebase Emulator authorization, browser E2E, deployed production data synchronization: NOT RUN.
- Cross-device write ordering: this FIFO serializes only writes from the *same hook instance*, not two devices. Server version checks/transactions would be needed to prevent cross-device last-write-wins.

## Modified files
- `src/lib/serializedDraftWrites.ts` (new)
- `src/lib/useModuleDraft.ts`
- `tests/cp51-draft-write-queue.test.mjs` (new)
- `tests/cp47-orion-autosave.test.mjs`
- `package.json`
- `src/lib/nexusEvidenceBaseline.ts` (generated fingerprint)
- Technical synthetic evidence outputs under reports/

No claims about improved student outcomes or real validation follow from these tests.
