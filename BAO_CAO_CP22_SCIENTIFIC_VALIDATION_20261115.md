# COGNITIVE LEARN AI — CP22: Scientific Evidence Audit

**Date:** 2026-11-15  
**Base:** CLA_FULL_SOURCE_OULAD_RESEARCH_STEP21_20261115.zip  
**Scope:** research/oulad + one npm script; website/Firebase untouched.

## What has actually changed

- Added `research/oulad/scientific_audit.py`: checks raw OULAD ZIP checksum against dataset manifest; `features.csv` checksum against actual evaluation; train/validation/test row counts; participant separation; duplicate course/presentation/participant rows; required field and value bounds; records CI, calibration and operational subgroup availability.
- Added `npm run research:oulad:audit` to generate `audit.json` and `report.md` using **the actual experiment output on your PC**.
- Added four independent audit tests, including tampered-feature detection, split leakage, raw archive checksum mismatch and successful fixture.
- Existing OULAD pipeline tests retained. `python -m unittest discover -s research/oulad/tests -v` = **9/9 PASS** in package build environment.

## Actual evidence already supplied by user (not recomputed here)

OULAD source SHA256: `f2ed1902616c1fe8d2824d872c0b7d2d72be435bf0124d077044fe4be2c6d3e4`  
Split counts: train 19,245, val 2,753, test 5,445.  
Academic-only test ROC-AUC 0.686911, Brier 0.221667. Academic+behavior test ROC-AUC 0.716291, Brier 0.212542. Brier delta = +0.009125 (rounded).

**Not established:** SCI/MAS/CSL psychometric validity; improvement for Vietnamese secondary students; causal efficacy of CLA Adaptive; award probability. CP22 evidence depends on executing the audit on actual local files, including verifying existing bootstrap CI from metrics.json.

## How to run

1. Keep original unmodified dataset and the `research/oulad/work` folder on your PC.
2. Merge this source into a separate directory or copy only `scientific_audit.py`, its test file, and the npm script.
3. From the project root: `npm run research:oulad:audit`.
4. Review `research/oulad/work/results/scientific_audit/report.md` and `audit.json`.
5. Do not raise scores until all relevant gates have proof.

## Scoring aspiration

9+/10 is the **design/verification target**, not the currently measured score. The existing project internal targets for competition (provincial >=95%, selection national >=80%, top-3 national >=50%) are ambitions, **not measured likelihoods**.
