# CLA • Prediction/Orion rule semantics v2.1.0 (13/11/2026)

**Status:** prototype/heuristic, **NOT_CALIBRATED**. This is a code/formula governance record, not an empirical validation report.

## Contract of output

| Field | Range / meaning | NOT a claim of |
|---|---|---|
| `predictedScore` | 0–10 model-implied scenario score under input assumptions; calculation is capped at 10 | a measured future grade, a validated ML prediction, or causal effect |
| `improvement` | formula-implied score difference (not an observed change) | an intervention impact |
| `cognitiveStrengthIndex` | weighted score of SCI, MAS, CSL, CRI (prototype) | probability of success |
| `goalGapReadinessIndex` | bounded 0–100 transformation of remaining difference between `targetScore` and `predictedScore` | percentage chance of achieving a goal |
| `stabilityCompletionIndex` | arithmetic mean of rule-derived stability and the provided completion-rate input | statistical confidence/calibration |
| `stability`, `growthPotential` | experimental proxy indices | validated measures |
| `risk` | HIGH / MEDIUM / LOW by unvalidated heuristics | validated risk or diagnostic outcome |
| `resultKind` | always `RULE_BASED_SCENARIO` for this engine | ML model provenance |
| `calibrationStatus` | always `NOT_CALIBRATED` | outcome probability calibration |
| `limitations` | explanation of evidence boundaries | substantiated accuracy |

No `probability`, `achievementProbability`, or `confidence` is emitted in **this PredictionResult**. Orion `SimulationResult` likewise replaces `probability` with `goalGapReadinessIndex` and carries `resultKind: HEURISTIC_SCENARIO` plus limitations. This intentionally changes the internal TypeScript result shape; the application call sites are updated together. Firestore schema and persisted student input are unchanged.

## Formula trace

- `cognitiveStrengthIndex` = round(0.25 SCI + 0.20 MAS + 0.25 CSL + 0.30 CRI).
- `learningMomentum` = round((SCI + MAS + CSL) / 3).
- `growthPotential` = round(0.40 CRI + 0.30 CSL + 0.30 MAS), lower-bounded at 0.
- `learningStability` = clamp(0,100,CRI − 0.30 BDI − 0.20 FRI).
- `improvement` (underlying, before rounding) = (0.35 cognitiveStrength + 0.25 learningMomentum + 0.25 growthPotential + 0.15 completionRate) / 100 × 2.
- `predictedScore` = min(10, currentScore + improvement).
- `goalGapReadinessIndex` = round(clamp(0,100,100 − 20 max(0,targetScore − predictedScore))).
- `stabilityCompletionIndex` = round((learningStability + completionRate) / 2).
- `riskScore` = 0.30 GVI + 0.35 BDI + 0.35 FRI, HIGH at ≥70; MEDIUM at ≥40, else LOW.
- Orion relative utility = round((predictedScore − currentScore) × 20 + cognitiveStrengthIndex × 0.4 + stability × 0.3 − riskPenalty), where riskPenalty = 20 (HIGH), 10 (MEDIUM), 0 (LOW).

All coefficients and risk thresholds are **prototype assumptions**, not fitted/validated empirical parameters. This version changes the field names, disclosures, and terminology; the nominal formulas remain unchanged. `modelVersion` = `Prediction Rule Engine v2.1.0-heuristic`. For validation: register hypotheses, collect consented observed outcomes, compare baselines, split at student/time levels, report errors and uncertainty, and calibrate before enabling real probability claims.

## Known limitations / future gated work

1. `studyHoursPerWeek` is collected but does **not** enter the current improvement formula. Do not claim its causal or predictive influence; separately design and validate that relationship.
2. `calculateLumenIntelligence()` still uses `targetScore: 9` as a prototype fixed target. A student's true target and relevant evaluation type should be provided explicitly in a future step.
3. Scores and indicators outside their valid ranges can produce unsupported output; input validation/abstention is not completed by this patch.
4. `confidence` in other CLA domains (career, AI reasoning, scraped-source drafts, historical trend) is **not** addressed here; audit each meaning separately rather than globally renaming unrelated values.
5. Neither the student-facing rule outputs nor simulation outcomes have holdout/temporal validation, confidence intervals, or observed intervention-effect evidence.

This record documents a semantic safety change; it is not a product/ML research acceptance gate.
