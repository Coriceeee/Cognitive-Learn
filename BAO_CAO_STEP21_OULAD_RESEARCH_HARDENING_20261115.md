# CLA Checkpoint 21 — OULAD Research Hardening

Date: 2026-11-15
Baseline: CLA_FULL_SOURCE_OULAD_RESEARCH_STEP20_20261115.zip

## Changes

- Modified only `research/oulad/pipeline.py`, `research/oulad/tests/test_pipeline.py`, and `research/oulad/README.md`, plus this report.
- Exclude learners already unregistered on/before the day-30 prediction cutoff. Previously, a known withdrawal at the cutoff could be counted as a future target.
- Record that exclusion in `dataset_manifest.json`.
- Compare Academic-only vs Academic+Behavior using holdout Brier difference and participant-cluster bootstrap percentile CI (300 replicates by default). Positive delta means behavior model lower Brier score.
- Add 10-bin empirical calibration data and per-course audit when sample size permits.
- Add regression tests for early withdrawals, late withdrawals, bootstrap and calibration.

## Verification performed

- `python -m unittest discover -s research/oulad/tests -v`: **5/5 PASS**, synthetic fixtures only.
- Source ZIP structure retained. No React, Firebase, routes, modules, security rules or package dependencies were changed.
- Full website build was NOT executed in this environment (node_modules not present in extracted package).
- Real OULAD download, training, and metrics were NOT run here. Do not quote synthetic test metrics as scientific evidence.

## Next research gate

On the project Windows machine, run `npm run research:oulad:fetch`, `npm run research:oulad:prepare`, `npm run research:oulad:evaluate`, followed by `npm run test:oulad`. Preserve `research/oulad/work/dataset_manifest.json` and `research/oulad/work/results/metrics.json`. Inspect Brier difference and 95% CI, calibration, split integrity and subgroup errors before deciding whether behavior features contribute meaningful predictive value.
