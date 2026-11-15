# CLA OULAD Early-Warning Research — Pilot v1

An independent, **Python standard-library-only** pipeline for the public **Open University Learning Analytics Dataset (OULAD)**, not part of the website runtime. No `pandas`, `pyarrow`, or Windows security-policy changes are needed.

## Official data and scientific boundaries

- Original creators: Kuzilek, Hlosta & Zdrahal; Open University / UCI Machine Learning Repository.
- Official record: https://archive.ics.uci.edu/dataset/349/open+university+learning+analytics+dataset
- DOI: https://doi.org/10.24432/C5KK69
- License: CC BY 4.0. Attribution must accompany redistribution and derived work.
- URL used by the downloader: https://archive.ics.uci.edu/static/public/349/open+university+learning+analytics+dataset.zip
- No raw OULAD data is bundled with this repository or generated ZIP.
- This dataset describes UK online university courses, **not Vietnamese high-school students**.

## Run on Windows PowerShell (project root)

```powershell
python .\research\oulad\pipeline.py fetch --out research/oulad/data/OULAD.zip
python .\research\oulad\pipeline.py prepare --input research/oulad/data/OULAD.zip --out research/oulad/work --cutoff 30
python .\research\oulad\pipeline.py evaluate --input research/oulad/work/features.csv --out research/oulad/work/results
python -m unittest discover -s research/oulad/tests -v
```

If the official UCI download is interrupted, download the original ZIP from the UCI website in a browser and place it at `research/oulad/data/OULAD.zip`; `prepare` accepts the same local file. The dataset contains nested ZIPs on some mirrors: the reader can handle one nested archive. A full original download is ~45 MB compressed and extracts to much larger CSVs; this pipeline streams rows from ZIP without unpacking the 400+ MB studentVle CSV.

## Frozen prediction question

**At course day 30, estimate whether a learner will finish the course with `Pass` or `Distinction` versus `Fail` or `Withdrawn`.** This is an early-warning classification target, **not a future exam score prediction**. Day 30 is an exploratory design choice and should be preregistered for confirmatory analysis.

- Participant-level split: deterministic hash of `id_student` into 70% training, 10% validation, 20% test; a student never crosses groups even if taking multiple courses.
- Academic predictors known by day 30: previous attempts, registered/credits information, assessment count and average of scores submitted before/on day 30.
- Behavioral predictors known by day 30: total clicks, active days and distinct visited VLE sites over days 0–30.
- Outcomes and later events are **not** used as model features; `studentInfo.final_result` is the label only.
- Sensitive demographic categories from `studentInfo` are excluded from training.
- OULAD `sum_click` is a click count **not** time spent studying.
- Missing prior assessments are explicitly marked missing, then filled from training-only values for model fitting.
- The script compares a constant-probability baseline, academic-only logistic model, and academic+behavior logistic model; outputs ROC-AUC, Brier, log-loss and thresholded accuracy. These models are **research baselines**, not production clinical-risk or admission probabilities.

**Important limitation:** The negative class includes students who withdrew, so early engagement could be associated with future outcome; the predictor might reflect withdrawal processes, not learning gains. The first pilot does not attempt causal inference, validate SCI/MAS/CSL, or demonstrate CLA Adaptive beats Static. It only tests whether available behavior features improve out-of-sample early-warning predictions in OULAD.

## Generated artifacts (not committed to source)

- `data/OULAD.zip`: downloaded raw archive plus `.source.json` (retrieval timestamp, SHA-256)
- `work/features.csv`: only the derived, pseudonymized records (treat as research data, not public app assets)
- `work/dataset_manifest.json`: source, split, cutoff and exclusion log
- `work/results/metrics.json`: actual baseline and logistic metrics after a run

Never place student records into `src/` or expose them through Vite's `public/` directory; do not connect these datasets to a real student profile in production without additional validation.

## Checkpoint 21 — prospective eligibility & uncertainty audit (2026-11-15)

This checkpoint corrects a critical **day-30 target eligibility** issue: learners with `studentRegistration.date_unregistration <= 30` are excluded, since their withdrawal has already occurred by the prediction cutoff. Later withdrawals remain eligible. The dataset manifest records `already_unregistered_at_cutoff` and the eligibility rule. This reduces obvious outcome leakage but does not eliminate every possible cohort-selection bias; learners with ambiguous or missing registration dates are also excluded.

The `evaluate` command now exports:

- `comparison.brier_improvement_academic_vs_behavior`: positive when adding behavior reduces holdout Brier error. A participant-cluster bootstrap percentile 95% CI is reported; do not equate a CI excluding zero with external validation or causality.
- `calibration`: 10 probability-bin counts, mean predicted probabilities and empirical outcome rates for each model, for reliability plots.
- `course_audit`: metrics per course when the test subgroup contains at least 30 rows. Very small cells are not reported.

**Model selection caution:** `validation` and `test` are both shown for the three *prespecified* baseline models. Do not repeatedly tune the model against test metrics. When the actual OULAD dataset is first run, record the archive checksum, command, console output and resulting `metrics.json`; no values from the synthetic fixture are research findings. The project must separately validate outcomes in Vietnamese high-school settings before using the model for decisions about actual students.

For a Windows machine where Application Control blocks `pandas` or `pyarrow`, this script uses only Python's standard library. Place the OULAD archive in the project research directory, not in `src/` or `public/`.

## Checkpoint 22 — Scientific evidence audit (2026-11-15)

Run after evaluating on real OULAD:

```powershell
npm run research:oulad:audit
```

The command reads the existing `features.csv`, `dataset_manifest.json`, `metrics.json`, and original `OULAD.zip` without downloading or training again. It writes two artifacts to `research/oulad/work/results/scientific_audit/`: `audit.json` (machine-readable PASS/FAIL with reasons) and `report.md` (scientific findings and boundaries). Checks source and feature SHA256, split counts, learner-level isolation, feature value ranges, duplication, and coverage of CI/calibration. It does not validate whether original source labels are substantively correct; statistical significance and generalization remain limited to the actual design. Do not publish derived student-level features in website assets.

CP22 does **not** raise project scoring automatically; acceptance gates still require independent review and running this command on the user's actual OULAD files.

## CP23 — Optional aggregate Evidence publishing to Lumen

After `npm run research:oulad:audit` succeeds against **real local OULAD data**, run `npm run research:oulad:publish-evidence`. This repeats integrity checks with the source archive and writes **aggregate-only** results to `public/research/oulad-evidence.json`. The Lumen page shows a non-personal research evidence panel and explicitly distinguishes OULAD holdout performance from an individual student's own prediction. Without an approved export, the panel remains unavailable rather than inserting illustrative metrics. Do not commit or deploy this generated file without reviewing license, scientific claims, and public-release approval. It does not reveal student rows, student IDs, or model-level individual predictions.
