# CP28 — 100-task kickoff from V5

**Start:** read `docs/CP28_KICKOFF_100_RELEASE_20261115.md`. The original CP27 source is preserved; this release adds backlog crosswalk candidates and consent-sharing cleanup. No Rules production deployment.

```powershell
npm run verify:cp28:static
npm run test:rules:emulator
npm run verify:cp37
```

Gate: `test:rules:emulator` **must pass 75 tests** on Windows for CP28. Baseline V5 passed 74/74 before the new L14 test. Treat source coverage (100 new candidate paths) as evidence indexing **not completed work**.

Tracker: `docs/CP28/CLA_CP28_100_TASKS_KICKOFF_20261115.xlsx`.
