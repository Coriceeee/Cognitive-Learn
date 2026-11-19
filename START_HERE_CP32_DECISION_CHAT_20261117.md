# CLA CP32 – Decision comparison & source-backed chat (17/11/2026)

Base: `CLA_FULL_SOURCE_CP32_33_ACCELERATED_20261117.zip`. Additive candidate; not CP36 release or an independent sign-off. No Firebase production deployment, no personal data import, no change to Rules, no removal of the 100-work-item or 164-item audit scope.

## Changes
- Atlas page: new comparison panel for 2–3 individual options within the existing PTIT BVH 10-program pilot. Each option accepts a score in its own native method scale (9 methods); resets the score if method changes; shows numeric gap, year, source and tie-break notes. Unknown eligibility, null probability, no cross-method ranking, no automatic preference ordering; no use of school GPA as exam score. Values are entered by the user and are not automatically saved or imported from Seed. Existing Seed→Atlas bridge and all prior panels are retained.
- Floating assistant and authenticated API: exact lookup of pre-existing source-linked historical records, without Gemini for matched queries. Example: `Điểm chuẩn PTIT BVH CNTT 2026 THPT` or `Điểm chuẩn PTIT BVH 7480201 2025`. The 2026 method is mandatory. Unknown or ambiguous requests follow the existing specialist-routing policy; no unrestricted retrieval, no personal-data transmission in this new lookup. Only registry URLs are accepted as source links. General navigation and Gemini fallback are unchanged.
- `npm run research:atlas:lookup` outputs 120 deterministic cases (90 method-specific, 20 historical, 10 abstentions) plus source fingerprint. It compares against the *same* pre-existing curated registry, so it measures lookup fidelity, not independent source accuracy, general natural-language comprehension, Gemini performance, psychometric validity or empirical effects. The separate 120-case Gemini benchmark is still a draft and unexecuted.
- Release fingerprint coverage expanded to include `api`, package lock and TypeScript configuration. Regenerated existing synthetic bundles and offline demo; no change to empirical evidence. Backend/UI build still requires installed dependencies.

## Actual checks on candidate
- `npm test`: PASS 928/928 (923 prior + 5 new).
- `npm run research:atlas:lookup`: PASS 120/120 same-registry deterministic cases.
- `npm run demo:final`: PASS 11/11 offline gates.
- `npm run test:rules:static`: PASS 15/15 (static only).
- `npm run check:layout`: PASS 22 required files, 19 legacy misplacements absent.
- `python -m unittest discover -s research/tests -v`: PASS 8/8.
- Isolated TypeScript type check of `atlasDecisionComparison.ts`: PASS.
- `npm run audit:cp31:evidence`: 314 tracked files match; live evidence NOT TESTED.
- `python research/src/validate_benchmark.py`: 120 distinct draft templates; LLM evaluation NOT RUN.
- `npm run build`: FAILED/BLOCKED by missing npm dependencies (React/Firebase types absent); no full frontend/API typecheck or browser acceptance in this environment. Firebase CLI not available; live Emulator, Browser E2E, real HF retrieval/training, actual Gemini evaluation, empirical outcomes and release sign-off remain open.

## Apply safely on Windows
Use a fresh staging directory or back up your repository and compare the base before overlaying the patch; do not overwrite local uncommitted work. Do not deploy Rules or copy secrets. If node_modules already matches the lock, reuse it; otherwise install using `npm ci`.

```powershell
npm run test:cp32:decision
npm run research:atlas:lookup
npm test
npm run demo:final
npm run build
npm run dev
```

Manual UI: `/atlas/recommendations`, compare THPT 25.50 for CNTT vs An toàn thông tin, then change one to HSA (input must clear, no cross-method ranking). Open floating chatbot and ask `Điểm chuẩn PTIT BVH CNTT 2026 THPT`; expect `23.00/30`, official source link and no probability. Unknown method/year or campus must not yield a fabricated fact. Confirm on real browser; static/contract tests alone do not certify this.

Remaining work: broaden verified program coverage with independently reviewed sources; deepen personalized career/school fit across the catalog, du học/scholarship grounded answers, research data and model/LLM validation. All CP28–36 gates remain unchanged. No new completion percentage assigned from test count.
