# CP34 Adaptive Decision → CP35 local acceptance (18/11/2026)

Base: CLA_FULL_SOURCE_CP34_CAREER_DECISION_20261118.zip. Preserve all existing files, 7 modules, Hybrid AI and existing shadow comparator. This is a candidate, not a production release.

## Adaptive policy v1
- Orion reads the most recent owner-bound, server-confirmed cycle window (up to 8). Current cycle must be reviewed, with frozen T0 and consistent review evidence; at least two distinct reported weeks and complete reassessment. Missing/corrupt/cached data abstain.
- Engineering thresholds, selected for conservative workload advice, **not** validated cutoffs: completed/planned actions < 60% or mean actual hours < 75% of prior planned weekly hours triggers lower workload. Low-adherence cap = min(previous hours - 1, floor(mean actual hours)); otherwise cap = previous hours. Pick highest existing option <= cap, prefer prior strategy on tie, then deterministic strategy order. If none: manual review. No automatic workload increase and no score-change trigger. A new cycle has a separately frozen T0; old scores are not modified.
- The advice is computed in Orion, selection only updates the draft dropdown; user must separately press Start. Student may instead select any existing scenario. Previous review's snapshot ID, review result ID, check-in refs, reasons, policy version and factors are replayable against current source. This is not a signature or persistent acceptance/override/assignment record. No change to Firestore rules or schema.
- Firestore metadata events enabled so cache-only results do not masquerade as server confirmation. Browser and rules behavior still require verification.
- Scope limits: self-reported actions and grades, no score-equivalence or causal claim, no calibrated prediction. Product advice differs from the earlier shadow study comparator; does not retrospectively change study protocol.

## Automated evidence (actual current run)
Evidence directory: `reports/verification/cp35_local/` (manifest + individual logs).
- Node TAP 1002/1002; 17 new adaptive decision cases included. Additional non-TAP scripts within npm test also exit 0.
- Python: Cognitive 18/18, Adaptive 18/18, UCI 13/13 (49 total; fixtures/technical tests).
- Atlas 848/848 and Knowledge 120/120 deterministic lookup (not independent LLM benchmark).
- Offline demo 11/11, static Rules 15/15, layout PASS, source fingerprint matches (363 tracked files).
- Whole `npm run build` FAIL: missing React/Firebase dependencies, subsequent type errors cannot yet be adjudicated. New engine standalone TypeScript check PASS (global TS 5.8.3, not project's TS6).
- Actual ML on external real data and CLA cohort, live LLM, Firebase Emulator, 72-case browser E2E, staging and independent acceptance NOT RUN. No real learner data used.

## Owner instructions (PowerShell, exact current version)
Back up source and keep local `.env*` files private. Apply patch on CP34 Career Decision or extract full source to a separate folder. Do not copy development data into production. Use project-compatible Node >=22.16 and Python ML dependencies already documented.

```powershell
npm ci
npm run verify:cp35:local-build
npm run test:rules:emulator
npm run qa:cp31:preflight
npm run qa:cp31:browser
npm run audit:cp31:browser
```

`verify:cp35:local-build` refreshes synthetic bundles first, runs independent local tests, and retains **all** gate outcomes even if an individual step fails. Without `--build` (script `verify:cp35:local`) build is not run. Browser QA only on explicit approved test/staging accounts. Never run deploy or publish Rules on the basis of static PASS.

For real-data evaluation run the pinned source ingest **only after** confirming the license and intended external-research scope; do not share private rows or API tokens:

```powershell
python research/huggingface/uci_student_performance/fetch_eval.py --accept-cc-by-4.0 --evaluate
npm run research:hf:ml-comparison
```

See `python research/src/uci_ml_comparison.py --help` for explicit public aggregate export; never publish raw data or automatically promote a model. Gemini live requires an authorized service and terms appropriate to intended audience; preserve provider policy. Research outcomes must be separately validated. The evaluation report cannot be used to claim Vietnamese THPT accuracy or effectiveness.

## Open acceptance: no hidden scope reduction
1. Existing live API/data retrieval provider and supported LLM benchmark. 2. Real external ML + data quality + domain shift. 3. SCI/MAS/CSL reliability/validity on eligible data. 4. Persistent decision acceptance/rejection + cross-cycle provenance and actual treatment comparison. 5. Build, emulator, browser, staging, backup/rollback and reviewer sign-off. 6. Final scientific report and defense QA.

`CLA_164_EVIDENCE_DELTA_CP35_20261118.csv` preserves all 164 baseline rows and marks targeted new evidence. Old evidence scores are left intact; the delta is not a complete independent re-audit or official 100-point weighted acceptance score.
