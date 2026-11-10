# CLA Claim–Evidence Matrix — CP31 (2026-11-09)

| Claim | Evidence class | Evidence ID / artifact | Status | Allowed wording | Missing evidence |
|---|---|---|---|---|---|
| CP30 automated application tests pass | T | `npm test` CP31 log; 87 test cases (14 academic + 4 cognitive + 69 TAP) after CP31 additions | PASS | Automated source tests passed in this environment | Browser E2E and runtime acceptance |
| Firestore Rules static contract passes | T | `npm run test:rules:static`; 15/15 | PASS | Static Rules tests passed | Firebase Emulator and deployed project verification |
| CLA source layout contract passes | T | `npm run check:layout`; 22 required files present, 19 legacy misplacements absent | PASS | Static layout contract passed | Browser rendering and route E2E |
| Orion closed-loop path can be replayed | S/T | `research/evidence/closed_loop_demo_trace.json`; 8 stages, 4 replay tests | LIMITED | Synthetic technical replay of snapshot→adaptation passed | Live Student UI/Firestore integration and real observed outcome |
| Synthetic rows are excluded from research gate | S/T | `research/evidence/DATA_SCOPE_GATE_SMOKE_RESULT.json` | PASS | 40 synthetic rows excluded; eligible research n=0 | Approved real cohort and consent evidence |
| LLM benchmark has 120 unique draft cases | T | `research/evidence/benchmark_manifest_validation.json` | LIMITED | 120-case inventory validated across 7 modules | Gold review, pinned model/prompt, model runs and human scoring |
| UCI external baseline pipeline is guarded | T | `research/src/baseline_uci_student_performance.py`; 4 synthetic-fixture tests | LIMITED | Script blocks unverified source and separates feature cutoffs | Actual HF files, full revision/hash and real external run |
| HF UCI Student Performance can support an external baseline | E | HF card + official UCI record; CC BY 4.0, two Portuguese schools, 649 instances | LIMITED | Candidate external-domain feasibility dataset with attribution | Download, revision/hash and full schema audit |
| VNHSGE supports Vietnamese exam QA benchmark | E | HF dataset card/viewer; 6,663 MCQ rows, 8 subjects | LIMITED / HOLD | Candidate LLM exam-QA content source | Exact license variant and source-rights review |
| Current CP30 source package excludes obvious secrets/artifacts | T | `docs/CP31_SOURCE_RELEASE_SCAN_20261109.json` | PASS WITH LIMITS | No `.env`, `.git`, `node_modules`, private-key pattern or common token pattern in current package | CI secret scan and release signing |
| Historical Git secret exposure is absent | T | `docs/CP31_GIT_HISTORY_AUDIT_20261109.json` | NOT SUPPORTED | Do not claim historical cleanliness; Firebase Web API key existed in old `.env`/client build | Cloud API restrictions/quota review; archive history remediation decision |
| Production build passes | T | `npm run build` CP31 log | BLOCKED | Build not verified in this environment | Connected CI with dependencies installed |
| Production deployment/staging is accepted | T | No staging evidence | NOT TESTED | Do not claim production readiness | Staging, smoke, backup/rollback and signed acceptance |
| SCI/MAS/CSL are psychometrically validated | O | No eligible measurement cohort | NOT EVALUABLE | Exploratory behavioral proxies only | Approved repeated measures and validity/reliability analysis |
| CLA ML predicts Vietnamese student outcomes | O | No eligible CLA outcome data | NOT EVALUABLE | No predictive performance claim | Approved longitudinal labelled cohort and holdout |
| Adaptive improves learning over Static | O | No eligible comparator/outcomes | NOT EVALUABLE | No effectiveness claim | Comparator, adherence and observed outcomes |
| CLA causes grade improvement | O | No causal design | UNSUPPORTED | No causal wording | Appropriate causal design and assumptions |
| Award probability targets are measured probabilities | O | No calibrated award outcome dataset | UNSUPPORTED | Aspirational targets only | Calibrated external/official award outcomes |

## Claim rule

A pass on a T or S item cannot be promoted to an O claim. External dataset evidence (E) cannot be described as validation on Vietnamese CLA users. Any new claim must cite an evidence ID and preserve its evidence class.
