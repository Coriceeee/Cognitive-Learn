# CLA CP37 — Operating guide checkpoint

## User-facing change
- Added `/student/guide` with a practical, current-state explanation of how CLA is operated.
- Linked it from Student Dashboard and the task finder.
- Explained the separate Admin synthetic demo path and real Student data path.
- Added input/output and limitation notes for Seed, Lumen, Orion, Atlas, Haven, Pulse and the floating assistant.

## Why this matters
CP36 had passed several engineering gates, but a new account could still appear empty because student data is not auto-seeded. The Admin demo preset was present but difficult to discover. The new guide explains how to populate a demo safely and what each module actually does.

## Explicitly not claimed complete
- Pulse is not yet an automatic aggregation of all module outputs.
- Atlas source registry is not the same as a fully populated program Knowledge Base.
- Haven's scholarship library is not a personalized eligibility/award-probability engine.
- Lumen and Orion use rule-based/proxy calculations; no production ML model is integrated.
- Full closed-loop intervention/outcome/re-measurement remains incomplete.

## Verification
- CP37 guide contract: 4/4 PASS.
- TS/TSX syntax transpilation: 150 files, 0 syntax diagnostics.
- Full `npm test`, fresh dependency install, full typecheck, Vite build, Browser E2E, Firebase Emulator and staging were not rerun in this authoring environment. User must run the commands in `START_HERE_CP37.md` on the Windows project copy.
