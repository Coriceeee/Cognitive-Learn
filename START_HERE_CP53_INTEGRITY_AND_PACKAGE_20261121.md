# Cognitive Learn AI — CP53 — START HERE

**Base**: CP52, no source tree reset. This ZIP includes the entire source workspace, historical reports, scripts, tests, and four safe `.env.example` templates.

**Verified**: `npm test` 1,179/1,179 PASS; `npm run test:rules:static` 15/15 PASS; `npm run demo:final` 11/11 offline synthetic PASS; safe packaging tests 3/3 PASS. Details: [`reports/cp53/CP53_ACCEPTANCE_REPORT.md`](reports/cp53/CP53_ACCEPTANCE_REPORT.md).

**Unverified**: The production build and Firebase Emulator were not run successfully here because package registry resolution failed (`EAI_AGAIN`) and required packages are unavailable. No deployment or real student research validation occurred.

**Priority when online**: `npm ci`, `npm run build`, `npm run test:rules:emulator`, then browser E2E using two student-owned sessions on a staging project. Do not deploy the candidate Rules without the Emulator + role matrix tests.

**Packaging**: Safe `.env.example` templates remain included; real secrets and private datasets remain excluded. Source archive != production build.
