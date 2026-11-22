# CLA CP62 — Student action / evidence rail

**Date:** 2026-11-21  
**Base:** CP61 release, itself based on CRC-verified CP60; no changes to Firebase Rules or production settings.

## Motivation and change

Student home already had the exam horizon, three authentic analytic visualizations, and six-module learning circuit. However, a pair of boxed dashboard panes still split actions and evidence across unrelated tiles. CP62 merges those panes into one connected action path + binary data-source visualization, retaining existing source data and route destinations. The visual is **not a score**. Empty data is never plotted as 0. Inconsistent downstream booleans cannot show Cognitive or Growth if the Seed profile is missing.

Changes:
- `src/lib/studentSignalRail.ts` new pure data-source availability model.
- `src/page/seed/components/StudentActionSignalRail.tsx` new accessible combined component.
- `src/page/seed/StudentPage.tsx` replaces twin tiles with one visualization, preserving exam → scientific charts → actions → network order.
- `src/styles/41-cla-action-signal-rail.css`, imported from `src/styles.css`: desktop, narrow, mobile, dark mode, reduced-motion and keyboard focus.
- `tests/cp62-student-action-rail.test.mjs`, package script and CI integration.
- Synthetic artifact regeneration and CP31 source-fingerprint sync.

## Evidence

| Check | Result |
|---|---|
| CP62 dedicated tests | PASS 9/9 |
| All offline `npm test` | PASS exit=0; 1245 root-level `ok`, 0 `not ok` |
| Rules static | PASS 15/15 |
| Layout contract | PASS |
| Packaging tests | PASS 3/3 |
| Demo offline synthetic | PASS 11/11 |
| TypeScript transpile syntax | PASS, 3 files, 0 syntax diagnostics |
| CSS parsing | PASS |
| Chromium standalone component CSS preview | PASS, desktop light, desktop dark, mobile; no horizontal overflow |
| Dependencies | BLOCKED, 19 missing |
| Production build | NOT ACCEPTED; dependency gate blocked |
| Firestore Emulator / real browser E2E | NOT RUN |
| Production deploy & scientific efficacy | NOT RUN / NOT CLAIMED |

`preview-*-isolated.png` are **CSS/DOM isolated QA artifacts only**, not screenshots of a running CLA website. Content in previews is illustrative and unrelated to any learner.

Source fingerprint: `6325e920f3f456da2cf37488c3404222d830808c7e87e3ba2076ca3832c8e255`.

## Release decision

Deliver CP62 source and offline evidence. Production acceptance requires installation of project dependencies, running build, Emulator Rules tests, and mobile/desktop browser E2E with safe QA accounts. 164-item formal acceptance baseline is unchanged.
