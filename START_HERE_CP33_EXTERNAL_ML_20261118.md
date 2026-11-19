# CLA CP33 — External ML comparison & uncertainty
Base: `CLA_FULL_SOURCE_CP32_HYBRID_PUBLIC_SEARCH_20261117.zip`. Patch is additive/minimal; no production deployment or changes to Firebase rules, student profiles, live Gemini/public-search configuration, Atlas sources, or existing OULAD/Ridge pipeline.

## What is implemented
- Research-only comparative regression on HF UCI Student Performance (two subject files, 395 math/649 Portuguese **records**, not unique people). Source: https://huggingface.co/datasets/DElmazi/Student_Performance revision `85a4fba73197d748e4cfd445a5e9c2ed35ca4a21`; original https://archive.ics.uci.edu/dataset/320/student+performance, Cortez (2008), DOI 10.24432/C5TG7T, CC BY 4.0. No raw data included.
- Prespecified candidate design before actual evaluation here: G3 final grade target 0–20; compare last G2, Ridge (academic / academic + behavior), Random Forest (academic / academic + behavior). Academic = G1/G2/failures, behavior = studytime/activities. No absences, demographics or sensitive attributes. No use of G3 as a feature. Hyperparameters fixed; no test-set selection. Not a formally approved preregistration.
- Same approximately 60/20/20 train/calibration/test partition per subject; identical *full allowed predictor signatures* grouped to avoid those exact overlaps, **not** participant-level or temporal validation. No cross-subject pooling. No timestamps for the context indicators. Split hash, source digest, code hash, package versions and seed recorded.
- MAE, RMSE, nominal 90% residual-based prediction intervals (calibration only), test coverage and mean width. Exchangeability and group dependence limit coverage interpretation. Paired MAE reduction for adding behavior and signature-cluster bootstrap 95% CI (not participant-cluster CI). Retain negative results. No claim of improvement if unsupported.
- Lumen aggregate panel accepts only the specified report structure and consistent counts/metric bounds. No student-level rows, personal predictions, model deployment, or made-up metrics. JSON schema checks are not an independent scientific audit; public file must be reviewed before release.

## Run on Windows, from the project root
Review source terms and acknowledge only if appropriate. Do not send raw rows or secrets in chat.
```powershell
python -m pip install numpy pandas scikit-learn
npm run test:cp33:external-ml
python research/huggingface/uci_student_performance/fetch_eval.py --accept-cc-by-4.0
npm run research:hf:ml-comparison -- --acknowledge-source-rights
```
`research/data/raw_private/uci_hf/ml_comparison_aggregate.json` is the aggregate output. Check counts, hashes, negative results, limitations and data rights. Only after review, to publish the aggregate panel explicitly:
```powershell
npm run research:hf:ml-comparison -- --acknowledge-source-rights --publish-reviewed
npm run build
npm run dev
```
Publication recomputes from the same pinned inputs; it is not an independent review or deployment. Never publish raw_private. If download fails, do not invent a report; retry on a connected machine. If an old published result exists, remove it before release unless its source/review is current. Existing live API authorization and production gates remain unchanged.

## Local verification 2026-11-18
- New Python tests 5/5; UCI baseline/fetch + comparison combined 13/13 PASS (fixtures only).
- Regression `npm test`: first 42 command segments 575/575 PASS before runner timeout; remaining segments 42–59 run separately 384/384 PASS. Combined 959/959 completed TAP cases; not a single uninterrupted run.
- New TypeScript evidence contract strict targeted check PASS; full build FAIL due missing React/Firebase dependencies; browser UI not run.
- Offline demo 11/11, Atlas deterministic lookup 848/848, rules static 15/15 PASS; no claim of emulator or production E2E pass.
- HF/UCI data retrieval not available (DNS failure; direct source access also failed). No real CSV files available, comparison CLI exits 2 `CP33_ML_BLOCKED`, no empirical metrics were generated. No SCI/MAS/CSL validity, CLA prediction utility or Adaptive efficacy claim. Keep R4/R5/R7 empirical gates open. No score rebaseline.
