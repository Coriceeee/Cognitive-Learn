# CLA CP23 — Lumen Research Evidence Integration

## Scope
Started from full source `CLA_FULL_SOURCE_CP22_SCIENTIFIC_AUDIT_20261115.zip`. Preserves existing seven modules, Firebase Rules, Shadow Policy and existing application behavior. Adds an independent OULAD **aggregate research evidence** panel to Lumen; this is not student-level inference and does not replace current Lumen engines.

## Changes
- `research/oulad/export_public_evidence.py`: re-audits current input features, dataset manifest, original archive checksum and research results. Export is blocked if audit fails or CI / essential metrics are absent, and writes an aggregate-only `public/research/oulad-evidence.json`.
- `src/page/lumen/components/LumenResearchEvidence.tsx`: displays two holdout-model ROC-AUC and Brier scores, Brier difference, learner bootstrap confidence interval, dataset provenance, and scientific limitations. If no approved export exists, shows clear unavailable state and invents no metrics.
- `src/page/lumen/LumenPage.tsx`: adds research card alongside existing panels, independent of student profile data.
- NPM scripts `research:oulad:publish-evidence` and `test:oulad:export`.
- `research/oulad/tests/test_public_evidence.py`: no participant-level information, reject failed audit, missing CI and nonfinite metrics.

## Verification
- Python OULAD tests: **13/13 PASS** (existing nine plus four new tests).
- Web build: **NOT VERIFIED** in the packaging environment (npm dependencies unavailable; npm ci could not complete). Run `npm ci`, then `npm run build` on the authorized Windows machine.
- The user's actual research data (`OULAD.zip`, `features.csv`, `metrics.json`) was not uploaded here. The package intentionally contains **no actual exported study metrics**, and the panel will show a waiting/unavailable state until audited local data is published.

## Windows PowerShell (root of unpacked CP23 project)
1. Preserve/copy from the previous working directory: `research/oulad/data/OULAD.zip`, and `research/oulad/work/` (do not place these research records in `public/`).
2. Run `npm run research:oulad:audit`. Inspect `research/oulad/work/results/scientific_audit/audit.json`; it must show `audit_status: PASS`.
3. Run `npm run research:oulad:publish-evidence`. This explicitly exports **only aggregate metrics** to `public/research/oulad-evidence.json`. Re-run after any new evaluation; old published summaries must not be mistaken for current analyses.
4. Run `npm run test:oulad`, `npm run build`, `npm run dev`, and open Lumen. If publishing fails, inspect error rather than bypassing audit.

## Scientific claim boundary
OULAD: UK higher-education online learner outcomes at day 30. The holdout result may support an incremental **predictive** benefit of behavior features *on this dataset*, subject to the reported confidence interval and audit checks. It **does not** validate SCI/MAS/CSL, student grade prediction in Vietnam, causal effects or CLA Static versus Adaptive interventions. CP24/CP25 remain outstanding.

## Scorecard handling
No automatic PASS for psychometrics, intervention effectiveness, deployment, or security. Rebaseline 164 tasks only after CP25 with individual acceptance evidence.
