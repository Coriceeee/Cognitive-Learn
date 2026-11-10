# CLA — One-day MVP triage and audit

**Audit date:** 10/11/2026  
**Baseline package:** `CLA_CP32_FLAT_START_HERE_20261109`  
**Checklist source:** `docs/CP31_UPDATED_CHECKLIST_164_20261109.md`

## 1. Checklist arithmetic

The active checklist contains 164 unique work items:

| Workstream | Items | Recorded mean progress |
|---|---:|---:|
| Website MVP | 76 | 45.1% |
| Research | 69 | 23.2% |
| CP25 admissions/chat/scholarship | 18 | 34.7% |
| UI/mascot | 1 | 75.0% |
| **Total** | **164** | **34.9%** |

Recorded progress distribution:

| Recorded progress | Items |
|---:|---:|
| 0% | 37 |
| 25% | 54 |
| 50% | 44 |
| 75% | 29 |
| 100% | 0 |

Interpretation: no active checklist item is formally closed at 100%; 37 items are recorded as untouched and 127 have partial progress. Two retired CP25 chatbot requirements are checked separately and are excluded from the 164 active items.

The 14-item P0 shortlist has a recorded mean of 41.1%; four items are at 0%: I4 browser E2E, K15 admin-user-management scope, C25-14 scholarship inventory and C25-18 staging/release sign-off. This is a planning baseline, not a new acceptance result.

## 2. Retest results

| Check | Result | Meaning |
|---|---|---|
| Automated app tests | 94 PASS | 87 previous checks plus seven CP32 demo/visualization contracts |
| Firestore Rules static | 15/15 PASS | Static source contract only; not Emulator proof |
| Layout contract | PASS | 22 required files; 19 legacy misplacements absent |
| UCI baseline guard tests | 4/4 PASS | Guards only; no real dataset metrics |
| Synthetic dataset scope gate | 0 eligible of 40 | Correctly excludes demo/synthetic rows from research |
| LLM benchmark | 120 case IDs | Inventory only; no model scoring/gold review |
| Closed-loop replay | 4/4 tests | Eight-stage synthetic replay; outcome not observed |
| Production build | BLOCKED | Dependency/type packages incomplete in this runner |
| Browser E2E / Emulator / staging | NOT RUN | Must be run in a provisioned project environment |

## 3. One-day scope decision

Do not attempt to close all 164 items in one day. Research validation, psychometrics, longitudinal effectiveness, LLM gold scoring and causal inference require eligible data, consent, timepoints and review. A one-day deadline cannot manufacture that evidence.

The practical target is a narrow, defensible **technical MVP demo** with one end-to-end student journey and explicit limitations.

### Gate A — Build and runtime (first priority)

1. On the project machine, run `npm ci` from the lockfile.
2. Run `npm test`, `npm run test:rules:static`, `npm run check:layout`, `npm run typecheck:api` and `npm run build`.
3. Fix compile/build failures before adding further features.
4. Smoke-test `/student`, `/student/profile`, `/student/transcript`, `/lumen`, `/orion`, `/atlas`, `/pulse`, `/haven` and the relevant Admin routes; refresh deep links.

### Gate B — One student journey

1. Use a dedicated synthetic demo account and visibly label its scope `DEMO`.
2. In the Admin-only demo profile form, use “Nạp hồ sơ demo 3 năm”; inspect the generated synthetic profile and transcript, then explicitly save under the Admin UID with `dataScope=demo`. Verify save → reload → read consistency.
3. Open `/student/transcript` to inspect the six-semester trajectory and nine-subject heatmap; complete and provisional grades must remain visually distinct.
4. Run Lumen assessment and verify missing dimensions stay missing.
5. Run Orion's deterministic scenario engine and inspect all three strategies.
6. Open Atlas official sources and the 2024–2025 PTIT historical cutoff comparison; do not invent 2026 cutoffs.
7. Open Haven and show only support-fit/rule outputs; do not claim an official scholarship catalogue exists until each scholarship has a checked source, criteria, intake year and deadline.
8. Run Pulse evidence checks and show the evidence record's source status. Do not relabel source checks as learner outcomes.

### Gate C — Security and release

1. Run Firebase Emulator allow/deny tests by role and UID. Static Rules tests are not enough.
2. Verify Student/Teacher/Parent/Admin access and cross-UID denial.
3. Verify the four-elective lock and the authorized exception/audit path.
4. Run browser E2E on desktop and mobile for the chosen journey.
5. Only if environment, Rules and smoke tests pass: deploy staging, test backup/rollback and record sign-off. Otherwise record `BLOCKED`; do not deploy production.

### Gate D — Report handoff

Prepare the report using evidence classes:
- **Implemented:** source code and module contracts.
- **Technically tested:** automated tests and deterministic outputs.
- **Synthetic demonstration:** demo profile and synthetic closed-loop replay.
- **External source data:** official admissions links and the explicitly scoped PTIT 2024–2025 cutoff records.
- **Not evaluated:** ML metrics, psychometric validity, LLM groundedness, Adaptive-vs-Static effectiveness and causal impact.

## 4. Definition of a defensible MVP for the deadline

A defensible MVP is achieved when the chosen student journey works from input to persisted data to engine output to visible explanation, with access controls and repeatable tests. It is not necessary or honest to claim that all 164 engineering and research items are complete.

Recommended acceptance gates:

- Clean install, type checks and production build pass.
- Core routes and role access pass smoke/E2E checks.
- Profile/transcript persist and reload correctly.
- Lumen, Orion, Atlas and Haven show real inputs, source/assumption labels and correct empty states.
- Synthetic demo is isolated from research records.
- Every visualized metric is traceable to a source or engine output.
- No uncalibrated probability, causal claim or unsupported scholarship/admission fact is displayed.

## 5. Known hard blockers

- The current runner could not complete `npm ci`; the full build is therefore not yet verified.
- Firebase Emulator and browser automation were not available in the retest.
- No eligible approved CLA learner research records were verified.
- External UCI data was not downloaded/pinned; the VNHSGE licence variant remains unresolved.
- Scholarship inventory with official deadlines and criteria remains incomplete.
- Staging/production credentials and release approval are not included in the ZIP and must be supplied through a secure local environment.
