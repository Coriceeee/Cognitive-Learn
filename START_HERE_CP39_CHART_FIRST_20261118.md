# CLA — Chart-first visual refinement (18/11/2026)
Base: CLA_FULL_SOURCE_CP39_41_PREDICTIVE_ADAPTIVE_20261118.zip. Apply patch only to this base, or use full source. No original files deleted. No changes to Firestore rules, APIs, policy, ML training or data schema. Changed visual presentations only; no new chart dependency.

- Lumen Dynamic State: time-scaled observed vs EMA plot, metric selector, GPA and proxy bar comparisons, original detailed observations and optional goal/finance fields preserved. EMA is descriptive; missing data remains missing.
- Lumen XAI: proxy and existing composite contributions as horizontal bars. ML: MAE/RMSE comparisons only on approved external aggregate, original coverage/CI/lineage remains available.
- Atlas career exploration: paired bars for interest and academic references; optional user-defined index, all nine groups, rating controls, domain navigation and methodological limitations retained.
- Orion: compare heuristic gain, feasibility, workload in separate scales; original constraint and dominance logic preserved. Closed-loop Bayesian shadow panel shows only counts of weeks meeting the rule, not posterior probability.
- Shared responsive SVG/CSS primitives, accessible labels, visible exact values. Chart geometry tests prevent missing-as-zero and invalid time-series plotting. Existing chart surfaces retained.

Run `npm run test:chart-first`, `npm test`, `npm run demo:final`, then `npm run build` and `npm run dev` in the configured local environment. Run mobile/desktop and keyboard checks before acceptance. No deployment or production data access.

Local evidence 18/11: Node 1043/1043 (7 new tests); Atlas 848/848; CLA knowledge 120/120; static rules 15/15; synthetic demo 11/11. Chart geometry standalone TypeScript check and TSX syntax transpilation pass. Full build attempted, blocked by missing React/Firebase dependencies/types; actual browser UI/E2E not verified. Standalone static preview generated from shared component presentation with mock values only; Chromium screenshot timed out, not production proof. No validation claims; checklist scores and research/production gates unchanged.
