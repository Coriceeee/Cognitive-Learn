# CP32 — Seed → Atlas personalization and live retrieval decision

Base: CLA_FULL_SOURCE_CP32_NATIONAL_V3_20261117.zip. This is an incremental source update, not a production release.

## Implemented
- Atlas personal discovery uses opt-in, current-account, server-confirmed Seed transcript snapshots, with nine groups of self-selected activity interests. Keyword matching is not a validated career-fit instrument.
- Same-term complete subject scores are shown only against combinations explicitly listed in the source. Academic totals are not admission scores. Unknown combinations remain unknown; no predicted admission probability or career-fit score is invented.
- Existing 838 cutoff values and 29 institution source entries retained unchanged. No claim of national completeness.

## Local verification
- npm test: 945/945 passes; new matching tests 6/6 (included in total).
- Atlas deterministic lookup benchmark: 848/848, not a live LLM evaluation.
- Static rules tests: 15/15. Offline demo: 11/11. Synthetic evidence regenerated for source fingerprint f1d0267dabebcac93047a6e142dde6a550108c5ce2b702bb238c15cdca18de65.
- Full build attempted, blocked by missing React/Firebase dependencies. Browser E2E, actual Firebase rules emulator, real LLM and production deployment not verified.

## Architecture decision — external data on demand (proposed; not implemented in this update)
1. Preserve curated data as a verified offline/benchmark corpus. Do not require manual enumeration of every university and scholarship before implementing the AI retrieval layer.
2. Use provider-independent public-source retrieval (official university, ministry, scholarship, and government sites). Search only public criteria; never transmit private learner identifiers, transcripts, or financial profiles to the public search service. Resolve and validate sources, retain exact evidence, year, method, scale and freshness. Keep missing data explicit.
3. A separately authorized source ingestion pipeline may persist facts extracted from original sources under their own rights/terms. Do not use Gemini Google Search Grounding as an automated corpus-building/scraping pipeline or auto-approve its outputs. Check applicable display and retention terms. Store only permitted data and lineage.
4. Claude/other model names are not necessary: select an LLM provider or self-hosted open-weight model after verifying license, age eligibility, data processing, safety, deployment cost and quality. The core CLA deterministic engines continue to own scoring, matching, simulations, intervention policy and EvidenceRecord generation.
5. P0 provider governance blocker: Gemini Developer API terms (effective 2026-03-23) restrict applications directed toward or likely accessed by people under 18. Google Cloud generative AI service terms also contain an age restriction; Workspace for Education's distinct product access does not automatically authorize this API use. CLA targets high school learners. Existing Gemini endpoints are retained for compatibility but are NOT approved for student-facing deployment by this update. Do not enable new Gemini Search flow until a suitable authorized arrangement is established. No live API calls or student-data transmission were made for this checkpoint.

Sources checked:
- https://ai.google.dev/gemini-api/terms
- https://ai.google.dev/gemini-api/docs/generate-content/google-search
- https://cloud.google.com/legal/archive/terms/service-terms/index-20261030
- https://workspace.google.com/terms/service-terms/

Next gate: implement provider-independent retrieval adapter and review/validation workflow; measure source coverage and factual accuracy rather than curated row count alone. Do not equate architecture change with a completed CP32/33/34 or scientific validation.
