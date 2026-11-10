# Model Card — Ridge External Baseline (Candidate)

- **Status:** code implemented; not run on the real external dataset at CP31.
- **Implementation:** `research/src/baseline_uci_student_performance.py`.
- **Data:** UCI Student Performance via Hugging Face mirror, CC BY 4.0, subject files analyzed separately.
- **Task:** predict final-period G3 score from (a) context/behavior features, (b) context/behavior + G1, and (c) context/behavior + G1 + G2.
- **Model:** Ridge regression with fixed alpha=1.0; preprocessing fitted within training pipeline; mean and last-score comparators.
- **Split:** fixed-seed 80/20 row holdout; public file has no participant identifier, so repeated-person identity cannot be audited within file. Do not merge Math and Portuguese.
- **Metrics planned:** MAE with bootstrap 95% CI, RMSE, R².
- **Intended use:** external-domain method feasibility only.
- **Not intended for:** Vietnamese student prediction, CLA user scoring, admission/scholarship probability, or intervention effect.
- **Limitations:** two Portuguese schools, small cohort, external context, no CLA-specific cognitive/behavior/outcome data; UCI warns G3 is strongly correlated with G1/G2.
- **Run gate:** require exact source revision, license confirmation and file SHA-256 before analysis.
