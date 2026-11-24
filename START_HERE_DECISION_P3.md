# CLA Decision P3 — context-aware admissions assistant (source candidate)
Base: CLA_DECISION_P2_FULL_20261124.zip. P1/P2 are preserved. No deployment or GitHub changes.

## What changed
- The floating assistant can answer explicit personal questions locally from accepted Lumen scenarios (Atlas Subjects), selected admission goals (Orion Inputs), and confirmed three-subject goal gap allocations (Orion Inputs). It uses deterministic answers, never asks Gemini to create personal scores or eligibility. Public facts retain the existing evidence lookup and general questions may use the existing Gemini API.
- Context is opt-in (existing apply/confirm buttons), in memory, limited to the active input route, owner UID, observed P2 revisions and five minutes. Changing input, leaving the relevant page, losing readiness, or changing account prevents use; stale/unavailable results require reconfirmation. Goal is only a preference, not a source-verified admission decision. The gap uses a self-set total; no priority points or forecast. Projection is the existing two-mock mean, not a validated ML prediction.
- Private local chat turns and previous remote segments are excluded from Gemini history. In-flight remote results are dropped after logout/account change/clear. The free text explicitly entered by users for general remote questions can still be transmitted; the local intent regex is not comprehensive PII detection. No raw profile or decision context is automatically added to API calls. Old local messages describe the time of asking, not live status.
- No CSS/layout, new route, Firestore rules, secret or API handler changes. No persistent chat data; no cross-device source verification. Scope is deliberately conservative because P2 is session-local. If source updates occur while Atlas is unmounted, this is not a live source verification mechanism.

## Try it after local build
1. Lumen → transfer mock scenario → Atlas Subjects → confirm “Dùng kịch bản Lumen”. Ask “Điểm kịch bản của tôi?”. Edit scores and ask again; it should abstain.
2. Atlas draft aspiration → Orion Inputs → confirm “Dùng mục tiêu này”. Ask “Nguyện vọng của tôi?”. Change the target and ask again.
3. Orion Inputs → select three supported subjects, enter scores and self-set target, confirm “Dùng phân bổ này”. Ask “Còn thiếu bao nhiêu điểm?”. Change an input and ask again.
4. Switch accounts / clear chat while a Gemini request is pending; old results should not enter the new conversation. Check general public admissions answers separately.

## Evidence
23 P3 tests (pure logic and source integration contracts); 80 P2/handoff/journey/admissions tests; 17 focused/UI contract tests = 120/120 targeted checks passed. Pure module strict TS typecheck and changed file syntax checks passed using global TypeScript. Full npm dependency installation, project-wide typecheck/build, browser E2E, live Firebase/Gemini and multi-device verification NOT RUN; inherited environment lacks local npm dependencies. The initial direct Node ESM test attempt failed on a pre-existing extensionless import; the final P3 test uses the existing focused-test TypeScript transpile loader pattern and passes. No empirical research validation is implied.

Run `npm ci`, `npm run verify:focused`, `npm test`, `npm run build -- --mode live`, `npm run dev` in a clean copy, restoring your own local environment files separately. Never overwrite production secrets or deploy rules. P4/P5 remain open.
