# START HERE — CLA CP30 Batch 3

- **Parent:** CP30 Batch 2 (profile realtime), not CP29 or CP30 Batch 1.
- **Patch:** `CLA_CP30_BATCH3_GPA_INTEGRITY_PATCH_20261115.zip`, extraction at project root after backup.
- **Alternative:** complete source archive `CLA_FULL_SOURCE_CP30_BATCH3_GPA_INTEGRITY_20261115.zip`.
- **New tests:** `npm run test:cp30:gpa` (28 cases).
- **Regression:** `npm run verify:cp30:batch3`, then `npm test`, `npm run test:rules:emulator`, `npm run verify:cp37` after `npm ci`.
- **Detailed report:** `docs/CP30/CP30_BATCH3_GPA_INTEGRITY_REPORT_20261115.md`.
- **Important:** local tests do NOT mean production Firebase, full TypeScript build, or user acceptance have passed. No Rules deployment or data migration is included.
