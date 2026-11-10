# CLA CP34 — Execution and verification report

**Date:** 10/11/2026  
**Base:** User-provided `CLA_CP32_FLAT_START_HERE_20261109` package containing CP32/CP33 artifacts.  
**Purpose:** Correct actual source integration gaps and make the scientific visual suite part of the default test command.

## 1. Findings before changes

The supplied CP33 report described six visual groups as integrated, but source inspection found the visual component files were not imported/rendered in their corresponding pages. The dedicated stylesheet `src/styles/23-scientific-visuals.css` was also absent from `src/styles.css`. Thus the visual files and contracts existed, but the normal user journey would not display the intended visual layer.

The scientific visual test file was not included in the original `npm test` script. Running it separately exposed the missing stylesheet import and an outdated synthetic-demo contract. This was corrected in CP34.

## 2. CP34 changes

| Area | Change | Scope |
|---|---|---|
| Seed | Integrated `TranscriptResearchView` into the saved transcript page | Reads saved transcript data only |
| Lumen | Integrated `LumenSignalAtlas` | Uses available cognitive dimensions and comparable growth snapshots |
| Orion | Integrated `OrionScenarioTradeoff` | Uses current rule-engine scenarios |
| Atlas | Integrated `AtlasCutoffField` | Uses verified PTIT BVH 2024–2025 subset only |
| Haven | Integrated `HavenPressureTopology` | Uses four self-reported inputs and Haven rule output |
| Pulse | Integrated `PulseMetricOrbit` and Admin-only `PulseEvidenceCircuit` | Uses Pulse metrics and current-UID pipeline metadata |
| CSS | Imported `23-scientific-visuals.css` globally | Makes scientific visuals styled in actual app pages |
| Seed demo | Added Admin-only 3-year synthetic preset | Local form prefill; manual save only; demo scope retained |
| Haven claims | Clarified generic support policy archetypes | Not represented as verified scholarships |
| Test runner | Added scientific visual contracts to `npm test` | 13 source-contract tests |

## 3. Test results in this execution environment

| Check | Result | Interpretation |
|---|---|---|
| `npm test` | **PASS — 104 aggregate checks/contracts** | Includes 13 scientific visual contracts; all TAP and source-contract suites pass |
| `npm run test:rules:static` | **15/15 PASS** | Static rules contract only; not Firebase Emulator proof |
| `npm run check:layout` | **PASS** | 22 required files and 19 legacy misplacements absent |
| TypeScript TSX syntax transpile | **7/7 PASS** | Syntax only for seven changed page files; not a project typecheck |
| `python -m unittest research.tests.test_uci_baseline -v` | **4/4 PASS** | Baseline source/data guard tests only; no model metrics on external dataset |
| `npm ci` | **BLOCKED** | Registry requests failed with `EAI_AGAIN` DNS resolution; npm ended with `Exit handler never called!` |
| `npm run typecheck:api` | **BLOCKED** | `@types/node` unavailable because dependency install did not complete |
| `npm run build` | **BLOCKED** | React, Node and D3 type packages unavailable because dependency install did not complete |
| Browser E2E | **NOT RUN** | Requires installed dependencies and browser environment |
| Firestore Emulator | **NOT RUN** | Requires local Firebase CLI/emulator and configured project environment |
| Staging/production | **NOT RUN** | No staging credentials or release approval in the package |

The npm registry error is an environment/network dependency issue in this runner. It is not evidence that the application build passes or fails after a complete installation. Re-run the install/build sequence on the project machine with working npm registry access.

## 4. Checklist status — no inflated percentage

The active checklist still contains 164 items:

| Workstream | Items | Recorded mean |
|---|---:|---:|
| Website MVP | 76 | 45.4% |
| Research | 69 | 23.2% |
| CP25 admissions/chat/scholarship | 18 | 34.7% |
| UI/mascot | 1 | 75.0% |
| **Total** | **164** | **35.1%** |

Distribution: 37 at 0%, 53 at 25%, 45 at 50%, 29 at 75%, 0 at 100%. No checklist item is formally closed at 100% under the original evidence requirements. CP34 source integration and contract tests improve implementation evidence, but they do not close runtime/E2E/Emulator criteria. The 80–90% target is therefore only an aspiration for a narrowly scoped demo MVP after its gates pass, not the verified whole-project percentage.

## 5. Remaining critical gates for the project machine

1. Complete `npm ci` from the committed lockfile.
2. Run `npm test`, `npm run test:rules:static`, `npm run check:layout`, Python baseline guards, `npm run typecheck:api` and `npm run build`.
3. Browser smoke/E2E the student flow on desktop and mobile, including refresh/deep-link for `/student`, `/student/profile`, `/student/transcript`, `/lumen`, `/orion`, `/atlas`, `/atlas/study-abroad`, `/haven` and `/pulse`.
4. Run Firestore Emulator allow/deny tests by role and UID; verify cross-UID access is denied.
5. Demo the full synthetic profile journey; verify save → reload → read consistency under Admin's own UID and `dataScope=demo`.
6. Capture screenshots, console/network logs, timestamps and test outputs for the report.
7. If any environment gate is unavailable, record `BLOCKED`/`NOT RUN`; do not call it PASS and do not deploy production.

## 6. Report-ready claims

Can report now: architecture and module responsibilities; implemented rule-based engines; deterministic synthetic demo workflow; visual component design and source integration; automated test outcomes above; historical PTIT BVH 2024–2025 subset and its official source endpoints.

Must remain limitations: no eligible learner dataset metrics, no validated psychometrics, no LLM groundedness score from gold review, no observed longitudinal effect, no causal claim, incomplete scholarship inventory, no full national three-year admissions coverage, and no production/E2E/Emulator acceptance yet.
