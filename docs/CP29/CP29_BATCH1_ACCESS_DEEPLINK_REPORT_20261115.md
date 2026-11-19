# COGNITIVE LEARN AI — CP29 batch 1: live authorization + route contracts

Date: 2026-11-15. Base: **CP28 batch 3** (consent cleanup verification). This is a source-level update, **not** production deployment approval.

## Scope of the 11-item CP29 plan

| ID | Change | Evidence | Reviewer status |
|---|---|---|---|
| B2 | Added server-backed Firestore `onSnapshot` subscriptions for `users/{uid}` and — only when product-consent rollout is enabled — `student_consents/{uid}` inside `AccessGate`. Deactivation, role change, withdrawal, cached data, pending local writes and listener failure unmount protected children. Cleanup on sign-out/path change. | `src/components/common/AccessGate.tsx`; 10 behavioral tests | PARTIAL — real Firebase/browser E2E pending |
| A4 | Added 22 critical deep-link contract checks against `App.tsx`, Vercel SPA rewrites, Firebase Hosting SPA fallback and student route allowlist. | `tests/cp29-route-deeplink-contract.test.cjs`; 5 tests | PARTIAL — desktop/mobile browser E2E pending |
| B1, B3, B4, C1, C4, C5, D3, F4, K15 | **No functionality implemented by this batch**. Existing source/tests preserved. | Prior CP28 evidence only | PENDING reacceptance |

## Behavioral change

1. The initial role continues to require `getDocFromServer` and strictly `active === true`.
2. **No protected children are mounted** until the live role listener has delivered a server-backed snapshot (`fromCache === false`, `hasPendingWrites === false`).
3. Changes to `active` or `role` during the page session revoke UI access. A changed role cannot silently elevate current access.
4. When `VITE_CLA_STUDENT_CONSENT_GATE=true`, student-data pages similarly require a live, server-backed consent snapshot. Withdrawal blocks mounting without refreshing the page. The `/student/consent` decision page stays reachable.
5. Listener failure, lost verification or account switching fail closed; subscriptions are disposed on unmount and auth switch.
6. Firestore Rules are not changed. **Client guards do not replace server-side authorization**. Accounts may observe a temporary verification screen during offline/cache transition; this is intentional fail-closed behavior.

## Local tests and limitations

- `npm run test:cp29:access`: **10/10 PASS** (behavioral TSX harness; Firebase and React stubbed).
- `npm run test:cp29:routes`: **5/5 PASS** (source/hosting contract, not real browser navigation).
- `npm run verify:cp29:static`: PASS — also includes existing CP28 static, Admin login and layout tests.
- `npm test`: PASS in local source environment after changes. Python research and actual cloud services are not included in this npm command.
- **Not run in this environment**: production TypeScript/Vite build (`node_modules` absent), Firestore Emulator 75 tests, Firebase Functions Emulator, real multi-account browser E2E or production Rules validation. The user's reported full CP28 PASS is baseline evidence, not a CP29 retest.

## Exact Windows commands

Apply the patch at the root of the existing CP28 batch 3 source after backup (preserve directory hierarchy).

```powershell
npm run verify:cp29:static
npm run test:rules:emulator
npm run verify:cp37
"CP29_VERIFY_EXIT_CODE=$LASTEXITCODE"
```

Use separate Student, Teacher, Parent and Admin test accounts to check: student active then disabled in server; student active role changed; product consent withdrawal (only where rollout is actually enabled); unavailable internet; browser deep-link refresh in mobile and desktop. Verify that Teacher/Parent linked metadata after withdrawal remains covered by the **separate CP28 unresolved privacy gate**. Do not deploy candidate Rules/Functions in this step.

## Completion accounting

This release only *advances two of the eleven CP29 tasks*. No newly reviewer-accepted PASS task is claimed. The 164-item tracker is unchanged pending full acceptance.
