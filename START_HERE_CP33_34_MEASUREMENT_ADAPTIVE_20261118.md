# CLA — CP33/34 Measurement & Adaptive research analysis

Base: `CLA_FULL_SOURCE_CP33_EXTERNAL_ML_20261118.zip`. Additive release; no file removed, no Firebase rules, API key, production deployment, student scoring formula, or live adaptation policy changed. Use this full source or apply the patch ONLY to the exact base (backup/branch first; retain local `.env` and local changes). No credentials or private research rows are included.

## Changes
- CP33 R4: `research/cognitive_validation/reliability.py` — two predeclared paired windows (7–14 days apart), declared consent and instrument-version agreement, valid integer events, missing indicator handling through existing CP24 mapping, participant-level ICC(A,1), retest bias, mean absolute difference, seeded participant bootstrap 95% CI, and sensitivity diagnostics. Output is private; no validity claim. The 10-pair floor and 2,000 bootstrap replicates are engineering choices not a sample size determination. CP24 experimental composite remains separate from production proxy v2, including the MAS terminology difference.
- CP34 R7: `research/adaptive_study/cluster_comparison.py` — existing strict audit plus participant-equal weighting, mixed assignment/policy rejection, arm-stratified participant bootstrap. An unadjusted descriptive contrast only, not intention-to-treat, not causal. Ten participants per arm is a computational reporting floor. Sample has six per arm; no interval is generated. No change in live Shadow/Adaptive policy.
- Lumen: read-only proxy availability and research limitations panel. A demonstrated zero is distinct from missing zero; inconsistent fields/unknown versions do not display a score. TS pure function typechecks; component full browser behavior not verified.
- Release integrity: extend fingerprint to cover research scripts, tests, synthetic fixture and plan; regenerate synthetic demo evidence and same-registry Atlas benchmark.

## Run from project root (PowerShell)
```powershell
npm run test:cp33:measurement
npm run test:cp34:adaptive-analysis
npm run research:cognitive:agreement:sample
npm run research:adaptive:cluster:sample
npm test
npm run demo:final
npm run research:atlas:lookup
npm run test:rules:static
npm run build
```
The sample commands write explicitly synthetic outputs into ignored `research/reports/private/`. Never copy these outputs into `public/` or report their statistics as real research. For legitimate consented data, consult the two research READMEs, use explicitly declared scope, a prospective plan, and a private storage location. The scripts cannot attest genuine consent, stable conditions, prospectively frozen plans, or data authenticity.

## Current verification (2026-11-18)
- `npm test` exit 0: 963/963 Node TAP tests, including 4 new readiness tests.
- Cognitive tests 18/18; adaptive study tests 18/18; 15 new Python cases in those suites. External ML comparison Python 5/5 rechecked separately.
- Both new synthetic CLI sample runs exit 0. The cognitive fixture has 12 paired synthetic participants; the adaptive fixture is below the reporting floor for an interval. No sample numeric ICC or treatment contrast is represented as empirical evidence.
- `npm run demo:final`: 11/11 offline gates and backup generate/verify. Atlas same-registry fidelity 848/848. Security static 15/15. Pure TS readiness module strict typecheck PASS.
- Full `npm run build`: exit 1 with missing React/Firebase imports/types; no node_modules bundled. Not a release approval. Firebase Emulator, Browser E2E, Gemini live, empirical ML/calibration on real data, psychometric validation, and comparative effectiveness are not verified. No new survey or interview required by this release.
- No new full checklist scoring performed. Master Protocol gates R4 and R7 remain open where empirical evidence is absent. R4 reliability estimate does not establish construct validity; R7 descriptive comparison does not establish efficacy. Scope unchanged.

Next: source-approved external ML run; LLM benchmark (groundedness, exact facts, consistency, abstention and safety); simulation/decision and evidence-to-adaptation evaluation; independent build, Emulator and browser E2E; defense package and re-audit.
