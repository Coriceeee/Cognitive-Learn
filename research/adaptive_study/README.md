# CP25 — Adaptive Research Feasibility Gate

## Scope
Research-only; no automatic intervention, Firebase writes, or student profiling. Evidence classification is always `DESCRIPTIVE_NOT_CAUSAL`. Its CSV and synthetic fixture are not production consent mechanisms or randomized-trial implementation.

## Commands

```powershell
npm run test:adaptive:study
npm run research:adaptive:sample
```

Real, legitimately collected data can be audited only after study approval and consent/assent as applicable:

```powershell
python research/adaptive_study/study.py --input <PRIVATE_CSV_PATH> --out <PRIVATE_OUTPUT_DIR>
```

Do not put real participant data in the Git repository or `public/`. The sample file is explicitly synthetic.

## Required CSV fields
`participant_id,cycle_id,assigned_arm,assignment_method,assignment_timestamp,baseline_timestamp,baseline_score,policy_version,recommendation_id,human_approved,exposure_timestamp,outcome_timestamp,outcome_score,outcome_scale,outcome_verified,consent_status`

Scores must share a pre-specified 0–10 interpretation and the same `outcome_scale` across groups; this validation does not establish assessment equivalence or measurement validity. `assigned_arm` is `static`/`adaptive`, `assignment_method` is `randomized`/`observational`; a randomized label alone is insufficient to prove legitimate random allocation. Consent/human-approval fields are audit metadata, not legal proof. Required ordering: baseline < assignment <= exposure < outcome.

## Scientific guardrails
- `PASS_DESCRIPTIVE_ONLY` means the **schema and observed timing** meet the narrow validation gate; it does not show randomization integrity, allocation concealment, absence of interference, causal identification or student benefit.
- Failure in any row blocks the overall gate, including unverified or missing outcomes. This is deliberately strict for a pilot; a formal intention-to-treat analysis must separately model missingness and report attrition.
- Mean change difference is unadjusted descriptive comparison, potentially confounded and sensitive to baseline imbalance.
- Full causal evaluation requires pre-registration, ethically approved protocol, actual enrollment, prospective policy exposure, assignment integrity, missing-outcome strategy, statistical power, and independent outcome adjudication.
- Multiple cycles for a participant require participant-clustered inference, and intervention contamination must be measured.
- SCI/MAS/CSL remain experimental proxies; CP25 does not validate them.

## CP34 — Participant-balanced descriptive comparison
`npm run test:cp34:adaptive-analysis` and `npm run research:adaptive:cluster:sample` exercise a separate, private aggregate pipeline. After the original strict timing/consent/outcome and cross-arm gate passes, it averages the observed cycle-change score within each participant, then equally weights participants per arm. Mixed assignment methods or multiple policy versions within an arm block the comparison. A 2,000-replicate seeded bootstrap resamples participants separately within each arm, with a 95% percentile interval only when each arm has at least 10 participants. This floor is not a sample-size/power determination. No CI is produced for the bundled six-per-arm sample. The sample and any synthetic files are explicitly non-empirical.

```
python research/adaptive_study/cluster_comparison.py --input <PRIVATE_CSV> --scope CONSENTED_RESEARCH_UNVERIFIED --out research/reports/private/adaptive
```
The estimand is the unadjusted difference in participant-level mean observed cycle change, NOT an ITT estimand; no enrollment/attrition inference, causal identification, school-level clustering or adjustment for confounding. Predeclare comparator, policy versions, measurement and analysis outside the script. No automatic publication or modification to live adaptive decisions; no claim of benefit from this analysis. Real inputs and report paths must remain private and authorized.
