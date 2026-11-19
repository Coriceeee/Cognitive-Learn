# CP34 — Evidence-backed local knowledge & cognitive XAI | 18/11/2026

Base: `CLA_FULL_SOURCE_CP33_34_MEASUREMENT_ADAPTIVE_20261118.zip`. Additive patch; no files removed. No deployment, Firebase change, secret, or personal data added.

## Changes
- `src/lib/claKnowledgeRetrieval.ts`: 10 versioned public knowledge cards with CLA source references, narrow Vietnamese accent-insensitive lexical retrieval, fixed answer rendering; explicit null on unsupported/ambiguous queries within this path. The floating chat and authenticated API reuse this module. Verified admission lookup still takes precedence. Legacy specialist routing and Gemini fallback are retained; no new direct Gemini call activated. This narrow filter is NOT an end-to-end PII or prompt-injection protection.
- `src/lib/cognitiveCompositeFormula.ts` extracts the unchanged production composite equation (SCI .30, MAS .25, CSL .20, CRI .25), shared by cognitive engine and XAI. `src/lib/cognitiveExplanation.ts` checks mapping, dimension availability, matching values and composite score; it does not show contributions when inconsistent or incomplete. Lumen displays a local explanation when the user expands the relevant detail. Not an immutable persisted Evidence Record, causal attribution, psychological validity or confidence estimate; CRI may overlap the other factors. Existing scoring is not revalidated.
- `research/benchmarks/cla_knowledge_120_v1.jsonl`: 120 concrete public synthetic knowledge queries, author-labelled, not independently reviewed. 100 single category, 10 multi/dual intent, 10 unsupported. The existing full CLA 120-case LLM draft is preserved; this is a narrower complementary benchmark, not a replacement.
- `tools/cla_knowledge_benchmark.mjs`: offline exact evidence-ID set matching, per-case status and SHA-256. Initial run 119/120; Vietnamese accent folding conflated “thước đo” with “thuốc”; revised the narrow matcher to distinguish that phrase. Re-run 120/120 on the same development set; not independent validation or accuracy on real users.
- `tools/cla_knowledge_local_llm.mjs`: optional 2-run/120-case research evaluator for a user-provided OpenAI-compatible local endpoint; accepts only literal loopback IP, fixed public cases, no credentials, no profile data, model outputs only evidence IDs validated against an allowlist. Model identity/revision not verified, free-text faithfulness not measured. No production integration, no remote model access. Current status BLOCKED/NOT RUN because no local model configured.

## Local commands (PowerShell)
Apply only to the exact base or use the full source; first back up existing work, keep local environment configuration private. Do not overwrite newer edits unreviewed or deploy untested rules.

```powershell
npm ci
npm run test:cp34:knowledge-xai
npm run research:cla:knowledge
npm test
npm run demo:final
npm run build
```

Optional local model comparison, only if an approved compatible model server is already running; replace example placeholder with the actual installed model identifier:

```powershell
$env:CLA_LOCAL_LLM_MODEL = '<installed-model-id>'
$env:CLA_LOCAL_LLM_URL = 'http://127.0.0.1:11434/v1/chat/completions'
npm run research:cla:local-llm
```

Report output: `research/reports/private/llm/cla_knowledge_local_eval.json` (gitignored). A live model is not shipped. The default loopback URL assumes a compatible server is installed and configured; if absent, the evaluator exits BLOCKED rather than emitting fabricated results. No Gemini key is required by the new offline layer. Existing provider eligibility and terms must be resolved before enabling new external services for students.

## Verification on the extracted integrated source
- Node TAP regression 973/973 PASS: initial npm test ran through `test:cp30:realtime` (535 TAP cases); execution timed out before remaining steps. Remaining commands starting `test:cp30:profile` replayed individually, 438/438 PASS. Earlier legacy non-TAP scripts also exited successfully as execution progressed. These are invocations, not deduplicated independent case counts; `npm test` did not itself finish in one invocation.
- New unit/contract tests 10/10 included in 973. Standalone strict TypeScript check for new modules + cognitive engine PASS using global tsc. No full UI/API typecheck available.
- Local knowledge benchmark 120/120; Atlas lookup benchmark 848/848; offline demo 11/11 and backup verify PASS; static Firestore rules 15/15 PASS. These are synthetic/static/technical results only.
- Full build attempted, exit 1 (missing React/Firebase and other dependency types; no installed node_modules). A clean npm ci + build on standard environment is required; other compile issues cannot be ruled out until then. Browser, Firebase Emulator, live Gemini, live local LLM, empirical ML, independent review and psychometric/causal validation remain unverified. No global progress rescore.

Next checkpoint priorities: actual live/approved LLM benchmark, Career Fit evidence-first scoring (including missing values and normalization audit), decision comparison, complete empirical gates where suitable data exists, and CP35–36 defense and production tests. No acceptance criteria removed.
