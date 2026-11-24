# CLA decision continuity — 24/11/2026
Base: CLA_DECISION_P0_FULL_20261124.zip. No Firebase Rules, live services, secrets, ML weights or research evidence changed.

## Root cause and changes
- Lumen previously linked to Atlas to enter mock marks, not transfer a result. Same component now supports Lumen entry and Atlas fallback. Stage raw pairs in memory, recompute using mock-mean-v1, keep version, timestamp and complete subject observations. No academic-grade substitution or validated ML claim.
- Atlas previews snapshot, asks before replacing existing marks, consumes once, clears missing subjects/priority/seed provenance, keeps score basis projection. Manual edits relabel the scenario. Cancel, expiry, UID change, reverse clock or mismatched snapshot prevents application.
- Orion goal change previously retained old per-subject targets. Confirm before reset; keep current scores/weeks. Still requires user-provided target marks; no fabricated cutoff.
- Main auth observer clears both pending handoffs on session UID changes. Navigation cancellation clears pending data. No browser storage or Firestore writes for transfers.

## Critical review / residual risks
1. Five-minute handoff is volatile: reload/another device loses it. Intentional privacy choice; persistent verified decision snapshot needs future design and security tests.
2. Equal mean assumes comparable mock tests; no test-difficulty calibration or prediction interval. No evidence of predictive accuracy on THPT.
3. Partial marks can explore complete combinations only; subject eligibility and official admission remain separate.
4. Orion still lacks structured persistent program identity and combination-specific validated target; it transfers a label, not a verified admission record.
5. Static/source assertions and unit tests do not replace browser E2E, auth transition tests and actual Firebase security validation.
6. Existing direct Atlas mock inputs are intentionally retained as a fallback, not automatically synchronized with Lumen.
7. Chatbot source freshness and national coverage still need independent verification. No new evidence of live Gemini quality.

## Local verification
See accompanying logs; strict TypeScript check limited to pure handoff modules, TSX transpile syntax only. Full build and live integration NOT RUN. Do not claim scientific validation or production deployment.
