# CP32 — Scientific Visual Layer Release Note

**Date:** 10/11/2026  
**Base:** `CLA_CP32_FLAT_START_HERE_20261109`  
**Purpose:** Make existing analytical outputs easier to inspect without fabricating observations or changing the underlying engine calculations.

## 1. Visualizations added

### 1.0 Admin-only demo preset

File: `src/page/seed/StudentProfilePage.tsx`

- Added a visible preset button only when the signed-in account is an active Admin and the current UID's profile has loaded.
- Generates a clearly synthetic three-year, six-semester, nine-subject form fixture plus behavior/finance inputs.
- Uses the existing locked elective selection if one already exists; it does not bypass the three-year lock.
- Requires explicit confirmation, fills the form only, and does not write Firestore until the Admin deliberately submits the existing save form.
- Existing persistence code labels the saved documents `dataScope: "demo"` under the Admin's own UID.


### 1.1 Lumen — Signal Atlas

File: `src/page/lumen/components/LumenSignalAtlas.tsx`

- Cognitive fingerprint radar for the core SCI/MAS/CSL/CRI dimensions.
- Data-coverage ring showing observed dimensions out of seven and the existing coverage score.
- Separate GVI/BDI/FRI proxy bars. Higher values are explicitly described as signals for review, not diagnosis.
- Diverging change field, shown only when two compatible snapshots exist.
- Evidence-lineage path: profile → measurement → reassessment → validation.

Data contract:
- Radar and proxy bars use dimensions whose `available` flag is true.
- Missing dimensions are not plotted as zero.
- Growth deltas require a previous snapshot and comparable dimensions.
- Mapping version is displayed where available.
- The UI states that these indices are exploratory proxies and that observed change does not establish causal impact.

### 1.2 Orion — Strategy Trade-off Map

File: `src/page/orion/OrionScenarioTradeoff.tsx`

- Scatter/bubble map of the existing three strategy scenarios.
- X-axis: rule-based feasibility score.
- Y-axis: rule-based expected gain.
- Bubble size: weekly study-hour demand.
- Scenario labels and risk bands are sourced from `runOrionStrategy` output.

The chart is explicitly labeled as a rule-based model. Expected gain and feasibility are not calibrated probabilities, observed outcomes, or causal effects.

### 1.3 Seed — Academic Observatory

File: `src/page/seed/components/TranscriptResearchView.tsx`

- Six-semester GPA trajectory, with a continuous line only across adjacent semesters that contain values.
- Filled points represent complete semester averages; hollow points represent provisional averages.
- Nine-subject × six-semester heatmap sourced from the current account's saved transcript.
- Coverage count reports how many subject/semester cells contain observed or provisional scores.

The chart distinguishes complete from provisional scores and leaves missing cells blank. It does not fill missing terms or label provisional grades as official.

### 1.4 Atlas — Admission Cutoff Field

File: `src/page/atlas/components/AtlasCutoffField.tsx`

- Slope/lollipop comparison of 2024 and 2025 THPT cutoffs for ten PTIT BVH programmes.
- Shows exact year-to-year delta and the 22–27 range on the 30-point scale.
- Links to the official 2024 and 2025 PTIT cutoff pages.

Scope guard:
- The chart does not invent a 2026 cutoff. The 2026 admission methods and scheme are separate from historical cutoff data.
- It is a PTIT BVH subset, not a national comparison or admission probability.

## 2. Design implementation

- Added `src/styles/23-scientific-visuals.css`.
- Added responsive layouts for mobile and desktop.
- Uses native SVG to avoid adding another runtime dependency.
- Existing CLA color system is retained; chart elements have distinct axes, legends, evidence notes and empty states.

## 3. Automated checks

Seven new contract tests were added in `tests/scientific-visuals.test.cjs` and appended to `npm test`:

1. Admin demo preset is restricted to the loaded Admin account, confirmation-gated and demo-scoped.
2. Lumen radar only plots available dimensions.
3. Longitudinal chart abstains without comparable snapshots.
4. Orion chart uses strategy-engine output and disclaims heuristic values.
5. Atlas chart uses verified PTIT 2024–2025 records and does not invent 2026 cutoffs.
6. Transcript trajectory and heatmap use the saved term/subject rows.
7. Components and responsive stylesheet are connected to their pages.

## 4. Validation status at release

- `npm test`: 94 checks/subtests PASS (previous 87 + 7 new contract tests).
- `npm run test:rules:static`: 15/15 PASS.
- `npm run check:layout`: PASS.
- UCI baseline guard tests: 4/4 PASS.
- TypeScript syntax transpilation: PASS for the four new components, the Admin demo profile page and the four changed pages.
- Strict TypeScript check: PASS for the four new visualization components using a minimal JSX type shim.
- Full `npm run build`: BLOCKED before project compilation because this clean environment does not have a complete dependency/type package installation. `npm ci` did not finish in the available environment. Re-run on the project machine after a successful `npm ci`.
- Browser screenshot/E2E, Firebase Emulator, staging and production smoke remain NOT RUN.

## 5. What this release does not claim

- No new real learner observations were created.
- No psychometric validation was performed.
- No ML accuracy or calibration metric was generated.
- No admission probability or scholarship probability was added.
- No causal effect of CLA was established.
