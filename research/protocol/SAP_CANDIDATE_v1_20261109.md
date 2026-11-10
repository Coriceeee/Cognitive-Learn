# Statistical Analysis Plan (SAP) — Candidate v1

**Project:** Cognitive Learn (CLA)  
**Version:** 0.1-candidate  
**Prepared:** 2026-11-09  
**Status:** DRAFT — NOT FROZEN, NOT APPROVED FOR HUMAN-PARTICIPANT ANALYSIS  
**Protocol basis:** `COGNITIVE_LEARN_RESEARCH_VALIDATION_MASTER_PROTOCOL.docx`; `COGNITIVE_LEARN_FINAL_SUPPLEMENT_SPEC.docx`; `CLA_EXECUTION_MASTER_V3_WEBSITE_RESEARCH_HF.docx`.

> This document is a pre-analysis proposal. It must be reviewed with the supervising teacher/research lead and frozen before inspecting final outcomes. It does not authorize collection or use of student records. No new survey or interview is assumed.

## 1. Research objective and scope

Evaluate whether CLA can technically and empirically support an evidence-traceable learning-guidance loop: student profile and measurements → interpretation → prediction/scenario → recommendation → intervention plan → check-in → observed outcome → reassessment → adaptation.

The study separates four evidence classes:

- **T — Technical:** unit, integration, rules, deterministic and replay tests.
- **S — Synthetic/demo:** generated or simulated records used only to verify software behavior.
- **O — Observational:** eligible, consented/pseudonymized learner records collected for an approved purpose.
- **E — External:** public or licensed secondary datasets used for method development, not as a proxy for Vietnamese CLA users.

Technical or synthetic evidence cannot be reported as learner effectiveness.

## 2. Research questions and candidate hypotheses

| RQ | Question | Candidate null hypothesis (H0) | Candidate alternative (H1) | Current evaluability |
|---|---|---|---|---|
| RQ1 | Are SCI/MAS/CSL deterministic, traceable and interpretable as exploratory behavioral composites? | The implementation fails one or more prespecified invariants/provenance requirements. | The implementation passes deterministic, boundary, missingness, sensitivity and provenance checks; psychometric validity remains a separate question. | Technical checks partly evaluable; psychometric validity not evaluable. |
| RQ2 | Do pre-outcome academic/behavioral features improve prediction over a simple prior-score baseline? | Incremental model error is not lower than the baseline (ΔMAE ≥ 0). | Incremental model error is lower (ΔMAE < 0) on a participant-disjoint holdout. | Not evaluable on CLA data; external feasibility baseline may be run separately. |
| RQ3 | Do Orion scenario outputs agree with subsequently observed changes? | Scenario prediction error is not lower than the prespecified naïve comparator. | Scenario prediction error is lower than the comparator on eligible observed outcomes. | Technical deterministic behavior partly evaluable; observed agreement not evaluable. |
| RQ4 | Does an adaptive plan improve weekly plan completion compared with a static plan? | Mean change in weekly plan completion is not higher for Adaptive than Static. | Mean change is higher for Adaptive than Static under the approved comparison design. | Not evaluable; no eligible cohort or comparison group. |
| RQ5 | Does the assistant produce evidence-grounded, safe and appropriately abstaining explanations? | Factual-field traceability is below the internal 95% target or safety/abstention criteria fail. | At least 95% of factual fields are traceable and prespecified safety/abstention checks pass. | 120-case inventory exists; gold review and model runs not completed. |

## 3. Outcomes and estimands

### Primary outcome candidate

**Weekly intervention-plan completion rate** over a prespecified measurement window, calculated as completed eligible actions divided by all eligible actions assigned during that window. The denominator, handling of cancelled actions, late completion, and minimum observation window must be frozen before data collection.

### Primary estimand candidate for RQ4

Difference between Adaptive and Static groups in mean change in weekly plan-completion rate from baseline (T0) to the prespecified follow-up (T2):

`E[(Y_T2 - Y_T0) | Adaptive] - E[(Y_T2 - Y_T0) | Static]`.

Use intention-to-treat if assignment is randomized and all assigned participants can be followed. If randomization is not feasible, report an observational contrast with confounding and selection-bias limitations; do not describe it as causal.

### Secondary / exploratory outcomes

- Recommendation accepted/rejected and reason, where explicitly recorded.
- Intervention adherence/fidelity and check-in completion.
- Next-period subject score or GPA, only if the score is observed after the prediction time.
- Prediction MAE/RMSE (regression) or AUC/Brier/PR-AUC (classification), selected according to the frozen target.
- Index distributions and change over repeated, version-compatible measurements.
- LLM evidence-field traceability, unsupported claims, abstention and repeated-run consistency.

## 4. Data eligibility and exclusions

A record is eligible for human-participant research only when all of the following are verified: lawful research basis; consent/assent appropriate to participant age and purpose; pseudonymous participant ID; approved source and retention policy; valid timestamps; known data scope; required outcome and feature availability; and no prohibited identifiers in the analysis extract.

Exclude `demo`, `synthetic`, `test`, unknown scope, unconsented records, records with invalid time order, duplicate participant-window records, and outcomes recorded before the prediction/intervention window. Keep missing values distinct from observed zero.

External datasets must have their own source, license, revision and provenance record. External data are not evidence of CLA effectiveness in Vietnamese students.

## 5. Prediction analysis (RQ2)

- Define the target, prediction horizon and information cutoff before creating features.
- Compare a naïve last-observed-score/mean baseline with academic-only, behavior-only and combined feature sets.
- Split by participant, or by time where repeated temporal data exist. Do not randomly split rows from the same participant across train and test.
- Fit imputation, encoding, scaling and feature selection on training data only.
- Freeze seed, dataset hash, code version and feature version.
- Report MAE/RMSE/R² for regression or AUC/Brier/PR-AUC for classification, with uncertainty intervals and error analysis.
- Include negative results and a leakage audit. Do not display calibrated probabilities unless calibration has been evaluated.

## 6. Simulation and adaptation analysis (RQ3–RQ4)

Orion's Balanced, Focused and Breakthrough scenarios are deterministic planning simulations under stated assumptions, not causal counterfactuals. Save the T0 prediction/simulation before observing outcomes. Compare predicted and observed changes only when time windows, formula versions and outcome definitions match. Record adherence separately so that non-adherence is not misclassified as pure model error.

For Adaptive vs Static, define identical starting information and differ only in the adaptive policy. Freeze triggers, thresholds, action taxonomy, dose, override rules, follow-up windows and primary estimand before analysis. If no valid comparator or outcome exists, report `NOT EVALUABLE`.

## 7. LLM evaluation (RQ5)

The 120-case inventory is a draft test manifest, not an evaluated benchmark. Before running models:

1. Review and freeze gold criteria for all cases.
2. Pin model, prompt, system instruction, retrieval corpus and evidence-record versions.
3. Run the same cases under the same evidence snapshot; retain all outputs and timestamps.
4. Score factual fields for evidence traceability, unsupported details, correct abstention, numerical fidelity, safety, privacy and prompt-injection resistance.
5. Repeat runs using a prespecified repetition count and report consistency, not only average quality.
6. Human-review consequential admission, scholarship, score and safety statements.

Internal target: at least 95% of factual fields traceable to evidence on the reviewed benchmark. This is a target, not a current result or a guarantee of zero hallucination.

## 8. Missing data, multiplicity and sensitivity

Report missingness by variable, source and timepoint. Never convert missing to zero. Do not impute outcomes for the primary analysis without a prespecified justification. If a suitable repeated-measures design exists, select a model consistent with its assumptions and report complete-case and sensitivity analyses. Keep one primary outcome; label secondary analyses exploratory and control multiplicity where confirmatory claims are made.

## 9. Sample size and stopping

No sample-size claim is made at this checkpoint. A prospective power calculation requires a defensible minimum effect, variance, allocation ratio, repeated-measure correlation and expected attrition. If these are unavailable, the study remains a feasibility/pilot analysis and must not claim confirmatory effectiveness.

## 10. Reporting and reproducibility

Every table/figure must include source ID, dataset version/hash, analysis script version, seed and evidence class (T/S/O/E). Report exclusions and cohort flow. Publish model/data cards and limitations. Do not mix external, synthetic and CLA observational records in one performance estimate.

## 11. Current status and freeze gate

- Approved real CLA research records: **0 verified at this checkpoint**.
- Synthetic scope-gate rows: excluded correctly; they are not participants.
- LLM benchmark: 120 draft cases; gold review and model runs not done.
- UCI Student Performance via Hugging Face: candidate external method dataset; allowed only for external-domain feasibility analysis after file/revision/hash verification.
- VNHSGE via Hugging Face: candidate Vietnamese LLM knowledge benchmark; exact license is ambiguous (`cc` metadata) and must be resolved before redistribution or use beyond local review.

**Freeze gate:** supervisor review, approved data inventory, source/license review, final outcome definition, final split/seed, and signed protocol version. Until then this SAP remains `DRAFT_NOT_FROZEN`.
