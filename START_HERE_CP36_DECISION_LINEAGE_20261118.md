# CLA CP36 — Decision Lineage & Release Candidate (18/11/2026)

Apply only to exact CP35 Adaptive Release base. Full source retains previous files. Back up any newer local changes before applying a patch. No deployment was performed, and `firestore.rules.CANDIDATE_CP21` is an unapproved candidate only.

- Adds optional immutable `decisionTrace` on next-cycle creation: prior source review/snapshot, policy version, recommended scenario/hours, offered hours and explicit accepted/declined choice. Manual plan is NOT an implicit rejection.
- The existing start transaction rereads the source and checks the source review server timestamp equals the pre-write lock timestamp. Stale or missing proof blocks traced writes; no silent manual fallback. Legacy records are readable without traces.
- Rules enforce shape, owner, previous reviewed source and timestamp match, and forbid editing trace on updates. They do NOT attest arithmetic or self-report authenticity. Replay is internal consistency and does not establish experimental assignment, exposure or effect.
- Added 10 deterministic tests including stale timestamp mismatch and 3 unexecuted live Emulator cases J21–J23. Fixed older T0 declaration fixture: default score matches baseline 7; separate J16 fixture verifies valid 0.
- No modifications to academic scoring formulas, existing research data, Gemini policy or database production rules.

## Actual results from this environment
`npm test`: 1,012/1,012 TAP pass; `demo:final`: 11/11 pass and backup verified; 49/49 Python research tests pass; Atlas 848/848 and Knowledge 120/120 deterministic lookups pass; static Rules 15/15 pass; engine-only strict typecheck with available TypeScript 5.8.3 pass. Source fingerprint 364 tracked files.

`verify:cp36:local-build`: 9/10 groups pass, build failed (missing React/Firebase dependencies; complete TS6/API/Vite verification still required). `test:rules:emulator`: BLOCKED, missing Firebase dependencies and CLI. J21–J23 not executed. Browser E2E, production, live LLM, actual external ML reports and empirical research validation not verified. No new empirical claims.

See `reports/verification/cp36_local/manifest.json`, `reports/security/firestore_emulator_gate.json` and `research/evidence/CLAIM_EVIDENCE_CP36_20261118.md` for detailed scope, rationale, remaining gates and limitations.

## Local Windows acceptance (no production deploy)
```powershell
npm ci --include=dev
npm run verify:cp36:local-build
npm run test:rules:emulator
```
Use the project's compatible Node/npm and Firebase CLI/Java installations. Stop on failed gates. Run authorized isolated browser QA before a production rollout; do not publish candidate Rules until independently validated. Keep baseline and rollback path. Research analysis remains independent, using eligible datasets only.
