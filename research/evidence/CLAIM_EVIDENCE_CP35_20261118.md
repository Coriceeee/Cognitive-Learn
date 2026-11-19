# Claim–Evidence Addendum CP35 (18/11/2026)

Read with Master Protocol and previous CP31 matrix. T = technical, D = design; S = licensed secondary, O = observed, E = valid comparative. The evidence below is local technical evidence (T) or documentation (D), not outcome validation. Do not promote T to O/E.

| Claim | Type | Evidence | Admissible conclusion | Remaining gate |
|---|---|---|---|---|
| Source regression | T | `reports/verification/cp35_local/node-regression.log` | 1002 TAP cases passed locally | Browser, CI, deployment |
| Technical loop | T | `reports/demo/cla_batch16_offline_readiness.json`, `tests/cp34-adaptive-next-cycle.test.mjs` | Synthetic review → conservative next-cycle selection reproducible | Runtime end-to-end, persistent decision link |
| Adaptive advice v1 | T/D | `src/lib/adaptiveNextCycle.ts`, `src/components/journey/ClosedLoopPanel.tsx` | Bounded rule-based suggestion, user chooses | No assignment, causal or validated gain claim |
| Cognitive composite explainability | T | `src/lib/cognitiveExplanation.ts`, `tests/cp34-knowledge-xai.test.mjs` | Local factor contributions use common formula | Construct validity, independent evidence |
| Cognitive agreement pipeline | T | `research/cognitive_validation/reliability.py`, `reports/verification/cp35_local/cognitive.log` | ICC/CI computation tested on fixtures | Eligible repeated measurements |
| External ML comparison | T | `research/src/uci_ml_comparison.py`, `reports/verification/cp35_local/uci-ml.log` | Five configurations implemented/tested | Real pinned CSVs + holdout metrics; no participant identifier/time verification |
| Static–Adaptive analysis | T | `research/adaptive_study/cluster_comparison.py`, `reports/verification/cp35_local/adaptive.log` | Participant aggregation methods tested | Observed comparative outcomes, SAP; no effect estimate |
| Atlas lookup | T | `reports/evidence/atlas_lookup_fidelity.json` | 848 fixture lookup cases consistent with integrated registry | National completeness and current source QA |
| Local knowledge retrieval | T | `reports/evidence/cla_knowledge_retrieval_SYNTHETIC.json` | 120 author-created cases passed deterministic retrieval | Independent gold review and live LLM groundedness |
| Public retrieval | T/D | `api/public-source-search.ts`, `tests/cp32-public-source-search.test.mjs` | Shared route/fallback source contract, not live | Authorized provider and verified live responses |
| Full build | T | `reports/verification/cp35_local/build.log` | FAIL in environment without dependencies | Clean build on compatible environment |
| Security | T | `reports/verification/cp35_local/rules-static.log` | 15 static contract cases PASS | Emulator + deployed authorization |
| Research effectiveness | D | No eligible evidence supplied | NOT EVALUABLE; keep hypotheses open | Eligible observational/comparative evidence |

Score, fit, confidence, risk, probability and effect are different quantities. Prohibit claims of validated psychology, causal grade gain, nationwide exhaustive coverage, or award odds from these reports. Review and sign independently before use in final paper.
