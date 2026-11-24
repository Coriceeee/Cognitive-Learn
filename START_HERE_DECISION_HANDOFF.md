# CLA — Decision-centric P0 increment

- Preserves existing UI, Firebase rules and engines.
- Direct domestic admissions chatbot fixes from the preceding worktree included. Source-backed answers remain limited by actual registry coverage.
- Atlas explicit selected aspiration → Orion, in memory, same UID, 5-minute expiry, confirmation before application; no URL or persistent browser storage. No implied admission eligibility or score target. Draft aspiration worksheet remains temporary; export before leaving.
- Dashboard verified empty journey suggests Lumen first; existing cycles retain their original check-in/reassessment paths.
- Targeted tests: 93 passed. Full build, Firebase emulator, live Gemini and browser E2E not run. No deployment.

Run `npm ci`, `npm run verify:focused`, `npm run dev`. Full local build: `BUILD_CLA_FOCUSED.cmd`. Restore your local environment files separately. The existing Firebase Functions bundle must be rebuilt before any authorized deployment of the chatbot backend.

Remaining: persistent shared decision snapshots with provenance, end-to-end Lumen/Atlas forecast transfer, full subject coverage and validated exam prediction, source freshness and retrieval, Orion/Pulse outcome feedback validation, full regression and live E2E.
