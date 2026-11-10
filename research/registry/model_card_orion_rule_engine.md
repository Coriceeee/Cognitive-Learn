# Model Card — Orion Strategy Rule Engine

- **Artifact type:** deterministic rule-based strategy/scenario engine; not a trained ML model.
- **Implementation:** `src/lib/orionStrategyEngine.ts`.
- **Versioning:** source SHA-256 recorded in the synthetic replay evidence file; update the hash when the implementation changes.
- **Inputs:** current and target subject scores, subject importance, weeks remaining, optional target major.
- **Outputs:** score gap, readiness score, risk level, three candidate scenarios, selected scenario, milestones and warnings.
- **Intended use:** planning support and scenario comparison for a student; human review/override required.
- **Not intended for:** guaranteed score improvement, admission probability, scholarship probability, psychological diagnosis, or causal treatment-effect claims.
- **Known limitations:** hand-specified thresholds and assumptions; no empirical calibration or prospective validation; target score and weeks remaining can materially affect output; no counterfactual identification.
- **Evidence at CP31:** deterministic synthetic replay traverses eight architecture stages; outcome is simulated, not observed; no live Student UI/Firestore closed-loop acceptance.
- **Monitoring required:** input validity/missingness, scenario selection distribution, human override, action adherence, observed outcomes and drift, once lawful data are available.
