# CP40 — Chart-first / Student-only verification (2026-11-18)

Baseline: CP39 Chart-first. User-approved scope change: student product only; administrative operations retained. The old viewer roles are denied, not silently converted. No live account/data modified; only candidate rules/backend and application source changed.

- `npm test`: 1060/1060 Node TAP cases, exit 0, final source rerun. Additional non-TAP assertions in same command pass. The suite updates prior role-specific contracts to enforce retirement and denial; historical suite counts are not strictly comparable.
- `test:cp40:allocation`: 9/9 (included in npm test).
- `test:cp40:student-only`: 7/7 (included in npm test).
- `test:rules:static`: 15/15; candidate text only, not emulator authorization evidence.
- `python -m unittest discover -s tests_cp31 -v`: 27/27 QA/E2E configuration/contract cases, not live browser tests.
- `demo:final`: 11/11 synthetic gates and backup verified; no empirical outcome claims.
- `check:layout`: PASS.
- `npm run build`: FAIL; missing React/Firebase dependencies. Browser rendering and deployed access control not verified.
- `test:rules:preflight`: BLOCKED, missing SDK + Firebase CLI; new runtime denial/legacy deletion tests NOT RUN. Rules candidate and optional backend not deployed. Legacy shares are retained until an authorized cleanup; no production migration performed.
- ML scientific validation, Gemini live, and production E2E remain open. Pareto and allocation objectives are heuristic, not evidence of improved scores.

The user-approved scope mapping is in `docs/CLA_STUDENT_ONLY_SCOPE_V5_20261118.md`; dated audit history and original scientific protocol are retained. Do not count removed requirements as automatically passed.
