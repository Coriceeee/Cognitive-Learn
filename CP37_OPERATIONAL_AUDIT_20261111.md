# CLA CP37 — Operational audit and user workflow

Date: 2026-11-11  
Base: CLA CP36 P1 source  
Scope: clarify current runtime behavior and add a student-facing operating guide. This checkpoint does not claim that every module is integrated or that the research target is validated.

## 1. Why a fresh account looks empty

The Student Dashboard reads the signed-in account's saved learning profile and transcript. It does not automatically seed a student's account with sample grades. This is intentional: mock/synthetic data must not be mistaken for student evidence.

A synthetic three-year preset exists only in the Admin demo path. It fills the Seed form but does not save automatically. Admin must review and explicitly save it. The saved record remains under the Admin's own UID and is marked `dataScope=demo`; it does not impersonate or write to a student's account.

## 2. Current module operation (source audit)

| Module | Current input | Current output | Current limitation |
|---|---|---|---|
| Seed Profile | Identity/goal fields, 4 elective subjects, 6 semesters of grades, behavior indicators, optional finance/study-abroad fields | Profile, GPA summary, transcript and a Cognitive snapshot on explicit save | No data appears until the user saves a profile; Growth needs multiple valid observations over time |
| Lumen | Reads the saved profile, behavior indicators and Cognitive history | SCI/MAS/CSL and proxy GVI/BDI/FRI/CRI, insight/strategy rules; optional Gemini explanation | Current scores are rule-based proxies, not validated psychometric scales; Gemini explains but does not calculate the score; no production ML model is integrated |
| Orion | Prefills current grades from the saved transcript where available; user enters target scores, target major and weeks left | Three rule-based scenarios, focus subjects and milestones | Target scores remain manual; expected gains/feasibility are fixed heuristic values, not observed effects or calibrated predictions |
| Atlas | Official source registry; program data stored separately in the signed-in user's Atlas workspace; admission engine asks for eight subject scores | Source lookup and, when program records exist, method/combination matching and aspiration ordering | The source registry is not the program Knowledge Base. Ten universities/24 year records are only current source coverage, not nationwide program coverage. Admin must curate program records. |
| Haven | Seven scholarship source records; GPA/English may prefill from transcript; financial-pressure indicators are manual | Official-source cards, conditions, document checklist and heuristic support summary | The checklist is session-only; seven source records are not a personalized eligibility engine; no award probability or current open-cycle confirmation is asserted |
| Pulse | Eight report indicators are currently entered manually and saved as a draft | Rule-based summary, metrics and action suggestions | Pulse does not yet auto-aggregate all Seed/Lumen/Atlas/Orion outputs. Admin Data Lineage checks source-document presence; it is not a full product E2E or outcome evaluation |
| CLA floating assistant | User asks for help using the website | General assistance and navigation guidance | It is secondary help only; it is not the authoritative admissions information channel |

## 3. Recommended demonstration sequence

### Admin synthetic demo

1. Sign in with an account whose `users/{uid}` record has `role=admin` and `active=true`.
2. Open `/student/profile?from=admin`.
3. In the Admin demo section, click **Nạp hồ sơ demo 3 năm**.
4. Review the populated profile, six semesters and selected electives.
5. Click **Lưu hồ sơ học tập**. This is an explicit write to the Admin's own account with `dataScope=demo`.
6. Return to `/student?from=admin` and open Lumen to inspect the current rule-based Cognitive outputs.
7. Open Orion; check current grades prefilling, enter target scores for the subjects you want to model and the number of weeks remaining; save the draft.
8. Open Atlas. First show the official source registry. To run the Admission Engine, the Admin must have curated program records in the Atlas Knowledge Base; the registry alone does not supply all programs/cutoffs.
9. Open Haven to search the seven scholarship source records and inspect conditions/documents. Do not present a session checklist as a saved application.
10. Open Pulse. Enter the requested indicators manually; label this as a formula-based report demo. Admin may separately run the read-only Data Lineage check.

### Real student use

1. Sign in with an active Student account.
2. Open `/student/guide`, then Seed Profile.
3. Enter real profile details, choose exactly four elective subjects, enter available grades, and enter behavior indicators based on the stated scale. Leave unknown grades blank; do not replace missing data with zero.
4. Enter finance/study-abroad interests only if relevant; those fields are optional.
5. Save and confirm the success message; then return to Dashboard.
6. Open Lumen, then Orion and Atlas/Haven as needed. Check each module's input notes and evidence status.
7. Use Pulse as a manual report draft until its automatic cross-module integration is completed.

## 4. Important distinctions

- `npm test`, TypeScript and Vite build PASS are engineering gates. They do not prove a real student's data has been entered, that all modules are connected, or that outputs are scientifically valid.
- The `research/` scripts and benchmark records are research assets, not a trained prediction model deployed in the student app.
- Current prediction/scenario/readiness values generated by rules are exploratory formula outputs. They must not be described as calibrated probability, causal effect or validated intervention effectiveness.
- Source registry counts measure the contents of the current registry, not the completeness of all universities or all countries.
- The intended research closed loop remains: Profile → Cognitive State → Prediction → Simulation → Decision → Intervention → Student Action → Outcome → Re-measurement → Adaptation. CP36/CP37 only implement parts of this sequence.

## 5. CP37 code changes

- Added `/student/guide` as a student-accessible route.
- Added a visible entry from the Student Dashboard and task finder.
- Documented real-student vs Admin synthetic-demo operation, input/output for each module, and the known integration gaps.
- Added regression tests for route access, entry links, honest limitations and stylesheet ordering.
- Added a Vercel SPA rewrite for `/student/guide`.

## 6. Verification performed in this authoring environment

- CP37 guide contract: 4/4 PASS.
- TS/TSX syntax transpilation: 150 source files, 0 syntax diagnostics.
- `npm test`, full dependency typecheck and Vite production build were not rerun in this authoring environment because this work copy has no `node_modules`. The user's prior CP36 full-pass report is not reused as proof for CP37.
- Browser E2E, Firebase Emulator and staging remain NOT RUN in this authoring environment.
