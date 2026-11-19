# START HERE — CP31 Batch 13 | Measurement provenance and scale audit

**Baseline:** CP31 Batch 12. Patch on top of Batch 12 only; use the full source ZIP in a clean folder otherwise.

**New:** Per-subject T0/T1 metadata audit for declared instrument/version/form/scale/scoring method and exact score/timestamp correspondence. For legacy or normal browser records without measurement context, the UI now warns that longitudinal self-reports have **UNVERIFIED measurement comparability**. No automatic test-source assumptions; no changes to production Firebase Rules.

**Quick commands** (run after a folder backup):

```powershell
cd 'C:\Gạo\Cognitive-Learn'
npm run test:cp31:batch13
npm run verify:cp31:batch13
npm run build
npm run test:rules:emulator
```

If a command fails, do not report Batch 13 PASS. The offline research replay is optional:

```powershell
npm run research:measurement
npm run research:measurement:verify
```

**Limits:** Test metadata is still a *synthetic offline declaration*, not captured or verified in student Firestore. Matching declarations do not prove psychometric equivalence, reliability or educational effectiveness. Actual browser E2E, Emulator runtime and research-grade data remain separate gates.

See `docs/CP31/CP31_BATCH13_MEASUREMENT_AUDIT_REPORT_20261116.md` and updated `docs/CP31/CLA_REAUDIT_164_CP31_BATCH13_20261116.csv`.
