> **CẬP NHẬT SAU:** Quyết định sở hữu Du học trong Haven ở bản này đã được thay bằng [kiến trúc V4](specifications/CLA_MODULE_HIERARCHY_V4_20261108.md): **Atlas sở hữu Du học quốc tế, Haven sở hữu học bổng và tài chính.** Nội dung bên dưới chỉ còn giá trị như lịch sử thực thi tại thời điểm phát hành.

# COGNITIVE LEARN AI — ROUND-SCHOOL HARDENING ON CP25

**Date:** 2026-11-08 · **Input:** `COGNITIVE_LEARN_AI_CP25_FULL_20261108(1).zip` (untouched)

## Scope completed in this patch

1. Floating assistant is a **supplementary website help tool**. Admission/scholarship/study-abroad questions deterministically route users to Atlas/Haven/Study Abroad. Guard applies in client and on authenticated API, with a safe destination allowlist; specialist replies from Gemini are also rejected by a post-response guard.
2. Chat introduction, starters and link controls match the new scope. No personal transcript or profile is sent to Gemini.
3. Cognitive SCI/MAS/CSL display names brought into alignment with the research specification, explicitly flagged as **experimental proxy indices**. Current raw mapping is not psychometrically validated.
4. Removed uncalibrated "Achievement probability" display on Student dashboard; clarified interpretation of career fit/readiness/confidence scores.
5. Extended official 2024–2026 institution directory from 3 to **4 schools**, adding TDTU, with scale-change caveats (2024 /40; 2026 /100 or /1200 depending on method). These are source-directory entries, not verified programme-level acceptance predictions.
6. Expanded Study Abroad from 6 routes to **8 routes**, adding United States and international joint programmes in Viet Nam. School links were consulted on the official sites. Eligibility/deadline/fees remain programme-specific and must be rechecked before submission.
7. Added six deterministic regression tests for scope, destinations, display integrity, international paths and TDTU source continuity.

## Existing features preserved

Seed, Lumen, Atlas, Orion, Pulse, Haven, Nexus Console, Teacher/Parent views, Firebase Rules candidate and research artefacts were not replaced. No Firebase production rules or deployment were published. No secret or new personal dataset was added.

## Test evidence from this environment

- `npm test`: **PASS** — 14 academic + 4 cognitive observations + 8 Admin deep-link contracts + 27 pipeline/evidence + 18 admissions/chat = **71 checks**.
- `npm run test:rules:static`: **PASS** — 15 **static source contracts only**.
- `npm run check:layout`: **PASS** — 22 required files, no legacy misplaced files.
- `python -m unittest discover -s tests -p 'test_research_scope.py' -v`: **PASS** — 4 scoped technical checks.
- Global TypeScript `transpileModule`: **PASS syntactic parse** on 8 edited TS/TSX files (not typechecking).
- `npm ci --offline`: **FAIL (missing cached dependency)**; non-offline install stalled in sandbox. `npm run build`: **BLOCKED (missing type definition packages)**. These failures are environmental and do **not** establish that a clean install/build would pass.
- Firestore Emulator, live Firebase role tests, actual Gemini endpoint, and production browser E2E: **NOT RUN**.

## Mandatory next validation steps on user's machine — do not deploy to production first

```bash
# On a working branch after verifying the target repository SHA:
npm ci
npm test
npm run test:rules:static
npm run check:layout
npm run build
npm run test:rules:emulator
npm run verify:cp25
```

Check a staging deployment with Student, Teacher, Parent and Admin accounts; direct refresh of `/student/storage`, `/student/modules`, `/atlas`, `/study-abroad`; unauthorized cross-UID reads; chatbot redirects (not generated admission data); mobile keyboard; Atlas Firestore save/reload; and the Seed→Lumen→Orion→Pulse demo.

## Suggested 8-stop round-school demonstration (not evidence of real learning efficacy)

1. Student Login → Seed profile for one demo-identified account.
2. Enter grades (including missing vs real zero); save/reload; show selected subjects lock.
3. Open Lumen; explain the `SCI/MAS/CSL` **proxy** and which indicators are missing.
4. In Orion, compare 3 scenarios under stated assumptions; select a plan.
5. Check in an action, save outcome and later snapshot; show Pulse only infers change from actual distinct observations.
6. Open Evidence Record: input snapshot, rule/model version, explanation, uncertainty and limitations.
7. In Atlas: browse four universities by 2024/25/26, show a source link, explain scale change; in Study Abroad show US and Vietnam joint programme sources.
8. Ask floating chatbot "Điểm chuẩn trường này bao nhiêu?" and demonstrate that it **opens Atlas**, not invents a score. Show a network/API fallback case.

## Remaining substantive blockers before 100% targets

- Full Atlas nationwide program/year/method data, eligibility, conversions, school matching and preference strategy.
- Haven programme-specific scholarship deadlines, coverage, certificate thresholds and current tuition/living costs, with dated official provenance.
- Complete versioned intervention/measurement outcome replay, comprehensive auth/security/e2e testing and production deploy with rollback.
- Research: legitimate data permissions/outcomes, holdout ML evaluation, psychometric gates, Static–Adaptive comparator, LLM 120-case multi-run evaluation. Hugging Face datasets are **not** verified to substitute for Vietnamese student outcomes.
- No contest-win percentages are asserted as statistical forecasts. Strategic targets remain unchanged: province ≥95%, national selection ≥80%, national top-3 ≥50%.

**Status:** Technical patch for immediate staging; not a claim of full MVP/research completion. Preserve existing work when merging into the current repo.
