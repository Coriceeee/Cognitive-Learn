# CP53 — Build preflight, draft integrity & safe packaging

Date: 2026-11-21 (Asia/Ho_Chi_Minh). Source: uploaded `Cognitive-Learn-CP52-20261121.zip` extracted without replacing the application architecture. **Source-only checkpoint, not a production release.**

## Executed changes
1. **Pulse compile blocker** — Fixed missing `useRef` import in `src/page/pulse/PulsePage.tsx`. The `tsc` diagnostic in the CP52 source included `TS2304: Cannot find name 'useRef'`; a new offline React-hook import check now covers the whole `src` tree.
2. **Same-revision draft protection** — `draftRevision.ts` records a canonical payload signature separate from the server timestamp. `useModuleDraft.ts` preserves that signature for the acknowledged Firestore write before `serverTimestamp()` can be read back. This rejects a changed payload that keeps the same revision, even while the timestamp signature is not yet available. CP52 transaction, login, UI conflict flow remain intact. Server-side protection still depends on verified Firestore Rules; no claim of two-device E2E verification.
3. **Restore safe environment templates** — The CP52 ZIP was missing all four `.env.example` templates (the archive filtering removed them). Restored the **empty, non-secret samples** from CP47: root, `functions/`, `functions-admin/`, and `functions-privacy/`. No `.env`, credentials, private keys, or deployed configuration copied.
4. **Fail-closed ZIP packaging** — Added `tools/package_release.py`, which includes safe `.env.example` but excludes `.env.*` secrets, local dependencies, build outputs and private research folders. Three independent Python tests verify filtering, required samples and archive integrity. CI now runs these tests.
5. **Evidence maintenance** — Updated source fingerprint after reviewed changes and regenerated the three SYNTHETIC offline evidence sets and backup demo, without claiming real student outcomes.

## Test evidence — executed
| Check | Result | Evidence |
|---|---|---|
| `npm test` uninterrupted | **PASS — 1,179/1,179, 0 failures** across 81 test summaries | `reports/cp53/npm-test-final.log` |
| CP53 import/CAS tests | **PASS — 5/5** | `reports/cp53/focused-tests.log` and final test log |
| Safe-archive Python tests | **PASS — 3/3** | Running `python -m unittest discover -s tests -p 'test_cp53_safe_packaging.py' -v` |
| Static Rules contracts | **PASS — 15/15** | `reports/cp53/focused-tests.log` |
| `npm run check:layout` | **PASS** | `reports/cp53/focused-tests.log` |
| `npm run demo:final` | **PASS — 11/11 offline synthetic gates** | `reports/cp53/synthetic-regeneration.log` |
| CP29 account tests after restoring templates | **PASS — 29/29** | `reports/cp53/accounts-retest.log` |
| Source fingerprint | **MATCH** — 447 tracked files, SHA-256 `218d90ef71dd584c8fbd698b040cd7bb98ebd854630c299e8741a4cb5ef2159a` | `src/lib/nexusEvidenceBaseline.ts` |

## Not passed / not run
- `npm run build`: **BLOCKED/FAIL in current offline environment** because required React/Firebase/Vite/TypeScript dependencies are absent; `npm ping` fails with `EAI_AGAIN`. Build log errors are not evidence of a completed TypeScript or production build. A global TypeScript 5.8 compiler cannot substitute for the locked TypeScript 6 package and dependencies.
- `npm run check:dependencies`: **BLOCKED**; 19 missing package / executable checks. See `reports/cp53/dependency-readiness.log`.
- Firebase Emulator, real Firestore security allow/deny tests, staging two-device E2E, live API checks, deploy, and production smoke: **NOT RUN**.
- No Firestore Rules published; `firestore.rules.CANDIDATE` and `firestore.rules.CANDIDATE_CP21` remain proposals requiring reconciliation and Emulator acceptance.
- No psychometric validity, ML calibration on Vietnamese high-school outcomes, causal effect, or live scholarship/source freshness verified by CP53.

## How to finish the acceptance gate on a connected development/staging machine
1. Confirm source hash and review changes. Run `npm ci --no-audit --no-fund`, `npm run check:dependencies`, `npm run build`, `npm test`.
2. Run `npm run test:rules:static` and `npm run test:rules:emulator` using local test project only, **never against production**. Verify all role × collection cases, especially `M04` for stale revisions.
3. With two separate authenticated browser sessions in a safe staging Firebase project, edit/save Orion, Pulse, Haven concurrently. Check that the second stale writer gets an explicit conflict; it must not lose unsaved inputs.
4. Review source/deploy diffs, failure/rollback conditions, and browser performance; do not deploy candidate Rules before signed-off test evidence.
5. For source ZIP use `python tools/package_release.py --output ../Cognitive-Learn-CP53-20261121.zip` (destination must be outside the project). The archive should contain four `.env.example` and no `.env` secrets.

## Backlog interpretation
CP53 fixes an actual compile-time error, a narrow concurrency gap and a regression in source packaging. It **does not** close a full item in the original 164-item extended acceptance ledger without production/Emulator evidence; do not decrement that ledger by counting unit tests alone.
