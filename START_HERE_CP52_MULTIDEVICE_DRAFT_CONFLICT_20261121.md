# CP52 — Firestore multi-device draft conflict protection

## Scope (preserves CP51)
A student may open the same Orion/Pulse/Haven draft on two devices. CP51's FIFO queue only serialized writes **within one mounted hook**. CP52 adds optimistic compare-and-swap on the current Firestore document version, with `runTransaction`, and explicitly surfaces a conflict rather than silently overwriting the last saved data from another device.

## What changed
1. `src/lib/draftRevision.ts` defines deterministic document-version comparison. Versioned documents use `revision`; legacy documents (revision 0) also compare canonical payload and precise server timestamp. The timestamp is a concurrency token, not evidence of educational outcomes.
2. `src/lib/useModuleDraft.ts` snapshots and freezes the acknowledged version when the user begins editing. Saves use a Firestore transaction to read-before-write and increment the revision. Concurrent changes trigger `DraftConflictError`; previous edits remain in the local form. Writes are still FIFO per hook, with a second auth/session guard during the transaction.
3. Orion autosave stops after a conflict and displays an explicit server-reload button. Pulse and Haven now track local edits too, so remote snapshots don't overwrite their currently edited fields. All three clear previous-owner form data on an auth switch.
4. `acceptRemote()` fetches the latest draft **from the server**; the UI clearly labels this as discarding changes on the current device. It never performs an implicit overwrite.
5. Two `firestore.rules.CANDIDATE*` files contain revision-monotonic draft-update guards. A revisioned record cannot be overwritten by an old revision-less writer. **Do not publish without emulator tests and production Rules reconciliation.** `firebase.json` does not automatically deploy these candidates.
6. 9 new offline CP52 tests and one new Firestore Emulator test (`M04`) cover conflicts/version monotonicity. The emulator test is present but **NOT RUN** here.

## Verified in this environment
- CP52 unit/contract tests: 9/9 PASS.
- Focused CP47/CP50/CP51/CP52 tests: 21/21 PASS (separate commands).
- `npm run test:rules:static`: 15/15 PASS — static contracts, NOT Firebase permissions verification.
- `npm run check:layout`: PASS.
- `npm run demo:final`: 11/11 offline technical gates PASS (synthetic only).
- TS/TSX syntax transpile check of 5 changed files: PARSE_OK; **not** semantic typechecking.
- The long `npm test` chain was interrupted by the execution time limit at the CP42 institution discovery command, without earlier observed failures. That command and the seven subsequent commands were run independently and PASS. A single uninterrupted full-suite PASS is **not** claimed.

## Blocked / NOT RUN
- Dependency readiness FAIL (missing local React, Firebase, Vite, TypeScript dependency tree); `typecheck:api` fails due to missing `@types/node`. `npm ci` requires a connected build machine.
- `npm run build`: NOT VERIFIED.
- Firebase Emulator Rules tests, real two-device browser session, cross-UID integration, and deployment: NOT RUN.
- Production Rules and database contents were not accessed or modified.
- No empirical ML, psychometric or educational-effect claim is made by this change.

## Production gate (do this before deployment)
1. On a safe branch, install dependencies using `npm ci` with network access. Run `npm run build` and `npm test` uninterrupted.
2. Start local Firebase Emulator configured with `firebase.emulator.cp21.json` and execute `npm run test:rules`. Inspect the new `M04 CP52` test and the whole role matrix.
3. Diff candidate Rules with the currently deployed Rules and test all owner + consent cases before **any** publish. Never deploy a candidate blindly.
4. In a staging Firebase project, exercise two separate authenticated browsers: stale writes must fail without losing local changes; explicitly loading the server version must refresh the form; reconnect and account switching must not leak old data.
5. Release only after verifying rollback, state migrations, deep links, and an authorized Rules publication process.

## Backlog interpretation
CP52 is a targeted safeguard for an existing cross-device data-integrity risk. It does not close an entire item of the 164-item acceptance catalogue because emulator and production evidence are still missing.
