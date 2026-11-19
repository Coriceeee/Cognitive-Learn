# CLA CP42 — Robust Decision Intelligence

Base: CLA_FULL_SOURCE_CP42_INSTITUTION_DISCOVERY_20261118.zip. Student-only, chart-first, all national admission discovery and prior features retained.

## Changes
- `src/lib/robustScenarioPolicy.ts`: exact minimax regret across a convex set of student-defined weights, given the same Orion hard constraints. Nominal utility, possible utility range, worst regret and ties. Pareto-dominated options excluded from the advisory best set. No probability, causal effect, policy assignment, training or persistence.
- `src/page/orion/OrionRobustPolicy.tsx`: sliders for three priorities and preference variation, interval/dot chart plus worst-regret bars. Student must choose manually. Equal nominal weights and r=.25 are illustrative UI defaults, not validated preference measures.
- `OrionPage.tsx` now passes the filtered option set to existing `ClosedLoopPanel`. A scenario excluded by the time/risk filter cannot be selected in the existing local cycle start UI; the underlying server security boundary is unchanged. The adaptive policy receives the same option set and retains its no-increase rule. A later filter change invalidates stale choices. The legacy Orion summary/roadmap is labeled as a preliminary reference, not the selected or persisted plan.
- `orionStrategyEngine.ts`: shorten/merge milestones to stay within the entered horizon, including 1–3 weeks.

## Mathematical scope
Criteria g=expectedGain/2.4, f=feasibility/100, t=1-weeklyHours/18 (anchors of current Orion scenario family, not empirical estimates). U(a,w)=w·(g,f,t). W(r)={(1-r)w0+r v: v in simplex}. Worst regret R(a)=max_w[max_b U(b,w)-U(a,w)]. Finite linear pairwise differences attain their extrema at one of the three vertices of W. Smaller regret means less utility loss within those assumptions only. Fixed anchors avoid changes from filtering; new scale versions required for broader options. Radius is a preference uncertainty parameter, not a confidence interval. No automatic recommendation acceptance, no new persistence, no new ML predictions. At r=0 all vertices coincide.

## Reproduce
`npm run test:cp42:robust-decision`, `npm test`, `npm run demo:final`, `npm run test:rules:static`. Logs in reports/verification/cp42_robust_decision. Full build blocked by missing React/Firebase dependencies; run in development environment before deploying. No rules changes. No new scientific evidence or admission records; no new target score assigned. CP40 items 40.07/40.08 have stronger partial technical evidence; CP42 strategic adaptation strengthened but broader adaptation/validated self-learning remain open. AI-assisted engineering change; student should review, understand, independently validate and disclose assistance before research competition use.
