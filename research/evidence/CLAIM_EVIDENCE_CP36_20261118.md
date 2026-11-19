# CP36 decision lineage candidate — scope and claim boundaries

Base: CP35 Adaptive Release (18/11/2026). Read with the Execution Master V3 and Research Validation Master Protocol. This is a candidate implementation, not a production or scientific release approval.

## Root problem and design decision
The CP35 recommendation can be replayed, but the persisted next cycle did not retain a link to the previous review or an explicit acceptance/decline. Simply recording a new advice ID would still permit stale decisions on competing devices and mistake a user choice for experimental assignment. The CP36 change stores a bounded optional `decisionTrace` in the new cycle, freezes the offered scenario hours and recommendation, reads the owner-bound prior review in the existing atomic start transaction, and requires the prior review's `updatedAt` to equal the mutex's pre-write `updatedAt`. Both were written with `serverTimestamp()` in the review transaction. The current lock and new cycle are still created atomically. A stale or unverifiable selection fails closed. No migration or automatic fallback write. Manual plans remain available and are not treated as rejections.

Rules candidate checks shape, owner, source review reference and co-commit timestamp. Update whitelist forbids changing the trace. A correct-looking trace can still be authored by a modified client; the source and check-ins are self-reported. Replay checks arithmetic consistency, not authenticity, experimental assignment or intervention exposure. The stamp assumes reviews and mutex releases went through the current atomic protocol; records lacking that association cannot start a traced cycle. Server-side versioned policy execution with trusted authorization would be needed for stronger attestation; not added in this patch.

## Claim–evidence status
| Claim | Evidence | Scope / remaining gate |
|---|---|---|
| Explicit selection and owner-bound replay | `tests/cp36-adaptive-lineage.test.mjs` | Local deterministic tests only |
| Stale source vs last server review | `sameReviewCommit`, transaction, candidate Rules; J22 | Local timestamp check; emulator negative tests NOT RUN |
| Immutable trace | Rules update whitelist; J21 | Static contract; emulator NOT RUN |
| Revocation isolation | Existing consent gate and J23 | Emulator NOT RUN |
| Frontend uses trace in Orion/Pulse | `ClosedLoopPanel.tsx`, `useClosedLoopJourney.ts` | Code integration; full build and browser E2E not verified |
| Scientific effect | No eligible comparator/outcomes | NOT EVALUABLE; no efficacy, calibrated probability or causal claim |

## Red-team review / residual risks
1. Client can forge internally consistent self-reports or options; label client-reported and do not market as server attestation. Restrict stronger claims to trusted backend policy evaluation or independently verified records.
2. Cache and concurrency: re-read source inside mutex transaction; review commit equality blocks stale current-state decisions. Legacy records without matching stamps abstain. Test two sessions and offline recovery in Emulator/browser.
3. Explicit decline is not randomized assignment. Storing a decline only records a self-reported alternative choice started in a cycle; no inferred intention, exposure or causal effect. For efficacy freeze a valid comparison design and estimand before outcomes.
4. The policy thresholds and indicators are technical heuristics; time constraints and wellbeing are not fully observed. No automatic increase or forced plan; allow manual choice, abstain when input is incomplete. Do not equate compliance with learning.
5. Rules evaluation budget and runtime semantics are unverified; J21–J23 must run on candidate, including existing tests, before any deployment. Keep rollback plan; don't broaden Rules to make tests pass.
6. Rules are not arithmetic replay; valid-looking client traces can pass shape checks. No treatment or clinical interpretation. Historical audit may need a server-confirmed source beyond the visible window.
7. Test counts do not demonstrate scientific merit; independent holdout, review and production gate are separate. Source fingerprint excludes generated reports and is not a production attestation.

## Acceptance sequence (do not deploy from this document)
1. Back up local changes, commit exact candidate. Install dependencies on compatible Node/npm as in project lockfile; no secrets in artifacts.
2. Run `npm run verify:cp36:local-build`; inspect `reports/verification/cp36_local/manifest.json` and logs. A failure remains a failure.
3. Run `npm run test:rules:emulator` using the project's demo-only gate. J21–J23 must run, along with existing test cases. Do not publish candidate until reviewed.
4. In authorized isolated staging, verify two sessions, consent denial, old Rules failure, accepted/declined/manual selections, interrupted network, reload, no cross-UID, historical replay. Then run the existing 72-case browser suite; archive evidence without PII.
5. Separately execute licensed ML pipeline and approved live LLM benchmark, complete empirical measurement/comparator only if eligible data exist. No new survey required. Record NOT EVALUABLE where data absent.
6. Independent reviewer checks evidence, updates original 164-item checklist (no new denominator), then decides release/rollback. Keep original CP35 evidence as historical, not proof for CP36.
