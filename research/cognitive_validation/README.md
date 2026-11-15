# CP24 — Cognitive indices research validity gate

This independent, standard-library-only module audits prototype SCI/MAS/CSL on *research-consented, de-identified longitudinal data*. It does not change production cognitive scoring or assert psychometric validation.

## Terminology
The foundational CLA proposal calls **MAS = Meaning Alignment Score**. Some subsequent research drafts describe motivation/action stability; these are not interchangeable validated constructs. CP24 operationalizes only **experimental indicators** (self-report motivation, persistence, abandonment); its MAS score is **not** evidence of meaning alignment. The construct definition must be frozen by researchers before further use. Likewise CSL is a behavioral stability proxy, not a direct neural or clinical measurement.

## Input contract
CSV: `participant_id`, `window` (ISO date), `event_count`, and these percentage-scale raw indicators (0..100; blank = missing):

| Index | Positive indicators | Reverse-oriented indicators |
|---|---|---|
| SCI | `plan_completion_rate`, `action_consistency`, `goal_action_alignment` | none |
| MAS | `motivation_self_report`, `task_persistence_rate` | `task_abandonment_rate` |
| CSL | `behavior_consistency` | `goal_switch_rate`, `context_switch_rate` |

These are **future research instrument fields**, not automatically observed signals already provided by CLA or OULAD. Collect with assent/consent and a documented instrument. Raw fields cannot be fabricated. The 0..100 scaling is an input requirement, not validated psychometric normalization.

`python research/cognitive_validation/validate.py --input <consented.csv> --out research/cognitive_validation/work`

`python -m unittest discover -s research/cognitive_validation/tests -v`

For missing cells, each index is withheld if fewer than 70% of its indicators are present (for 3 items, requires all 3), or fewer than 7 observed events. Output contains descriptive equal-weight composite, sensitivity to ±20% weight and leave-one-indicator-out, and exploratory repeated-window Spearman. Repeated-window correlation does **not** replace ICC/test–retest reliability; sensitivity is complete-case only. No cut-point labels, clinical risks, or confidence probabilities are produced.

## Required before using 'validated'
Researcher-confirmed construct and content validity; genuine observations across persons and dates; test–retest/ICC and uncertainty; convergent/discriminant testing with predeclared instruments; independent external sample; measurement fairness and privacy/consent review. Protocol: `docs/specifications/COGNITIVE_LEARN_RESEARCH_VALIDATION_MASTER_PROTOCOL.docx`.

The example fixture is synthetic and must not be cited as empirical validation.
