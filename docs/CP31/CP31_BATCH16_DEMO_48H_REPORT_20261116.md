# CLA CP31 Batch 16 — 48-hour Demo Readiness & Bounded History Archive

**Date:** 2026-11-16. **Base:** FULL SOURCE Batch 15. **Scope:** app code, offline tests, packaging, checkpoint tracker. **No changes to deployed Rules or production.**

## What was implemented

1. **Read-only server-backed archive:** `useClosedLoopJourney` retains the active eight-cycle live listener so it stays within Firestore candidate Rules (`request.query.limit <= 8`). An explicit “Tải 8 chu kỳ cũ hơn” action uses a server-only cursor (`startAfter`) with the same `limit(8)`. A full page means **possibly more**; a short/empty page is an end-of-result indication for that request. A window change, signout, mismatched owner or invalid record clears cached older results; pagination maxes out at 80 displayed cycles.
2. **Fail-closed audit:** `journeyHistoryArchive.ts` rejects foreign-owner records, unknown fields, forged document IDs, duplicated IDs, wrong cursor order, invalid evidence, local cache masquerading as server results, and oversized pages. Old pages remain **read-only** and separate from the eight-cycle T0/T1/T2 and measurement-source analysis; no empirical effect claims.
3. **Single offline demo gate:** `npm run demo:gate` executes the core Node regression (B8–B16), Seed, Atlas/chatbot, three synthetic generate/verify replays, layout and source fingerprint. It emits `reports/demo/cla_batch16_offline_readiness.json`. **This is only an offline demo-core gate.**
4. **One-command Windows pre-release technical gate:** `npm run demo:windows:full` additionally requires `npm run build` and `npm run test:rules:emulator`. It does **not** waive browser E2E, production deployment validation, THPT real-data/psychometric studies, or authorization review.

## Verified in packaging environment

- Batch 16 new tests: **22/22 PASS**.
- Local offline demo gate: **11/11 steps PASS** after the pre-release candidate was updated and fingerprint regenerated.
- Full offline regressions: `verify:cp31:batch16` and `npm test` PASS.
- No Firestore Emulator, browser E2E, or production build success claimed by this report. Full TypeScript project compile depends on installed React/Firebase packages and needs the Windows gate.

## 48-hour execution priorities (no new feature expansion)

| Time box | What to do | Hard acceptance criterion |
| --- | --- | --- |
| 0–12 h | Apply Batch 16 in a backed-up clone. Run `npm run demo:gate`, `npm run build`. | No build errors and synthetic replay reproducible. |
| 12–24 h | Manually rehearse Orion → Pulse → Lumen, Seed, Atlas/Haven, Nexus. Check links, refresh, mobile viewport, warning banners. | Every demo transition has a recorded screenshot or manual result; fix any blocker before adding features. |
| 24–36 h | Run `npm run test:rules:emulator` without touching production. Run negative cross-account/consent/owner checks in Emulator. | PASS evidence file, no unauthorized cross-UID read/write; otherwise Blocked. |
| 36–48 h | Freeze source, prepare offline synthetic fallback, review one-page Claim–Evidence limits, rehearse presentation. | Source sha, demo credentials/secrets separated, known blockers disclosed. |

**Demo-only boundary:** if dedicated Firebase QA and four role accounts are not available, do NOT call 72 browser E2E PASS, do NOT use the main Firebase project for QA, and do NOT claim production readiness. The offline synthetic walkthrough is an explicit fallback, not a replacement for live validation.

## Outstanding risks

- Firestore paged reads are not atomic complete-history snapshots. Concurrent writes may move records between pages; this gate detects duplicate/order drift within results, not every possible historical omission.
- The live listener still displays at most eight cycles and may start from cache. Archive reads require server response; none is counted as authenticated outcome validation.
- Candidate Firestore Rules are **not deployed** here. Any actual Rules changes require independent Emulator and QA review.
- Psychometric reliability, causal treatment effect and calibrated ML predictions remain NOT TESTED.
- 164 checklist classifications remain: **21 local-technical, 126 partial, 17 insufficient-evidence**, zero independent acceptance recorded.
