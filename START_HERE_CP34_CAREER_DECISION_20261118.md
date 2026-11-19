# CLA CP34 — Career Exploration & Constrained Decision | 18/11/2026

Base: `CLA_FULL_SOURCE_CP34_KNOWLEDGE_XAI_20261118.zip`. No source files removed. No deployment, Firebase rule change, dependency change, secret, or student data added. Apply the patch only to that exact distribution or use the full source. Back up local edits and keep local environment configuration private.

## Actual changes
- Atlas Career Exploration: nine existing Atlas interest groups, independent self-rated 0–4 interest and subject evidence. The learner explicitly opts into existing Seed same-term completed school marks via the Atlas control. Missing scores are not zero. Two groups (education and creative) do not have a fixed school subject set; other mappings are proposed exploratory rubrics, not admissions or validated occupational requirements. Every group remains available even when evidence is missing. Optional weighting by the learner produces a transparent preference index only when both axes are available, with ties and highest-scoring groups among comparable rows; no overall rank claim. Local component state keyed to the current authenticated UID, no persistence or AI call. The user's explicit button selects a corresponding domain in existing Atlas discovery (other filters remain). No claims of ML or psychometric validation. No user survey or research data collection added.
- Legacy career rubric: previous outer weights summed to 1.15–1.20 for the shipped profiles; dividing by the total preserves relative weights and removes the inflation before rounding/clipping. Version `legacy-career-normalized-v2`. Seed dashboard now labels this legacy score as an experimental rule and links to Atlas. The legacy rubric still uses Cognitive proxies and historical missing-value heuristics; it is not validated, and should not exclude occupations. The new Atlas exploration does not use those proxies. Historical results should not be compared across versions without reconciliation.
- Orion Decision Workbench: three explicit objectives (maximize heuristic gain, maximize rule-based feasibility, minimize weekly hours); optional hard limits on weekly hours and risk category. Compute non-dominated options among eligible rows, show dominance or exclusion reasons, preserve ties, fail closed for invalid/duplicate rows. Risk is a separate constraint, not a calibrated probability. No automatic selection, no change to generated scenario values, saved plan, adaptation policy, or roadmap. Existing chart connector explicitly labeled descriptive, not a Pareto frontier. This is deterministic decision support, not causal simulation or empirical evidence.

## Commands
```powershell
npm ci
npm run test:cp34:career-decision
npm test
npm run research:atlas:lookup
npm run research:cla:knowledge
npm run demo:final
npm run build
npm run dev
```
Manual checks after clean build: Atlas → personalized discovery → enable Seed evidence → Career Fit section → rate a group → optionally set weight → select its related majors. Orion → generate strategy → compare with 10/14/18 hours and low/medium/high risk limits → verify that the current saved strategy has not changed. Verify on desktop and mobile; sign out/switch account to check session-local career preferences are not retained. These manual checks have NOT been run here.

## Verification in extracted integrated source
- `npm test` exit 0 in one invocation: **985/985 TAP invocations PASS**, 0 failed/skipped/cancelled; includes 12 new behavior/contract tests. Earlier non-TAP legacy steps also exited 0 in that chain. Counts are not deduplicated independent validation cases.
- Strict standalone TypeScript check of `careerExploration.ts`, `scenarioDecision.ts`, legacy `careerEngine.ts` PASS.
- Atlas lookup fidelity 848/848 and local knowledge retrieval 120/120 (same author-labelled development data; not independent or live LLM assessment).
- Offline demo 11/11, backup verify PASS; static Firestore rules 15/15 PASS. Fingerprint updated and synthetic replay evidence regenerated. Neither is a production or empirical gate.
- Full build attempted: exit 1, missing installed React and other dependency types (`node_modules` absent). Full UI/API compilation and browser behavior remain unconfirmed. Firebase Emulator, real-data ML, LLM live/Gemini live, psychometric reliability/validity and real Static–Adaptive efficacy remain unverified. No project-wide score updated. No release approved.

Next priorities: freeze a complete evidence/decision trace for actual student-selected strategies, improve adaptive action and measurement linkage, complete empirical gates where eligible data exists, and CP35–36 defense/production acceptance. No acceptance criteria removed.
