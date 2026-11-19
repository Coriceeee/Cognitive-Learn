# CLA — Hybrid AI architecture decision and public-source retrieval
Base: CLA_FULL_SOURCE_CP32_PERSONAL_MATCHING_20261117.zip. Incremental update; no production deployment.

## Locked architectural decision
- Atlas/Haven retrieve public admissions, tuition, scholarship and international programme information on demand. Retain the curated 838 cutoff values and 29 institution entries for offline use, independent source comparisons and deterministic tests; no national coverage claim.
- CLA engines/ML retain responsibility for academic compatibility, career fit, SCI/MAS/CSL (exploratory proxies), simulation, adaptation, uncertainty and EvidenceRecord. LLMs (including Gemini where authorized) assist retrieval/interpretation, not score generation.
- No automatic caching, corpus creation, training, or scoring from Google Search Grounding. Independent, lawfully obtained official documents can be reviewed and ingested under their own permissions. No raw search results persisted by the new flow.

## Implemented
- Shared component on Atlas (including domestic/recommendations routes), Atlas Study Abroad, and Haven (including scholarship route). Search arbitrary public subject and year, without pre-enumeration, direct public web search and relevant local source links.
- POST /api/public-source-search: optional independent provider gateway; active Firebase role verification, explicit public-only query, rate limit (per instance), bounded response/timeout, safe HTTPS candidate links, no auto-verification. Provider receives no UID/token, transcript, financial profile or chat history. Do not enter personal information; pattern checks are not comprehensive PII detection.
- Provider output is unverified; open original source and independently confirm identity, date, method and scale before separate review. No automatic numeric extraction/engine writes in this release.
- Existing Gemini endpoints and local data preserved; new direct Gemini Search integration is NOT enabled or implemented here. Standard Gemini API terms restrict applications directed to or likely accessed by under-18s, so a key alone does not resolve authorization. Existing Gemini endpoints also require an authorization review before deployment to this audience. No attempt to use, test, or transmit data through a live provider in this update.

## Optional configuration for an independently authorized search provider
Use Vercel server-only environment settings (not VITE_ variables):
- CLA_PUBLIC_SEARCH_APPROVAL=approved-independent-public-source-provider-v1 (only following actual documented provider/age/privacy/terms approval)
- CLA_PUBLIC_SEARCH_ENDPOINT=<HTTPS endpoint for your approved independent provider>
- CLA_PUBLIC_SEARCH_TOKEN=<provider token, server only>
The endpoint must accept POST JSON {version:1,topic,subject,year} plus bearer provider token; return {results:[{title,url,snippet}]} from independently permitted search results. It is NOT the Gemini API endpoint and must not proxy/harvest Google Search Grounding output. No such endpoint is bundled or deployed here. Without configuration, direct web links/local sources remain available. Existing GEMINI_API_KEY is unchanged. For future authorized direct Gemini grounding, implement its separate end-user display and suggestions requirements instead of routing through this generic contract. Review https://ai.google.dev/gemini-api/terms and https://ai.google.dev/gemini-api/docs/generate-content/google-search.

## Apply and verify
Save local changes before updating. Extract patch over exact base or use full archive in new directory; retain your local environment securely. No production rules changes. Run:
```
npm ci
npm run test:cp32:public-search
npm test
npm run research:atlas:lookup
npm run demo:final
npm run build
npm run dev
```
Browser testing of the actual web/API requires deployed or local serverless API; Vite alone does not implement /api/public-source-search. If frontend/API origins differ configure existing VITE_API_BASE_URL and CORS_ALLOWED_ORIGINS.

## Local evidence
956/956 TAP regression (includes 11 new unit/mock/contract tests), 848/848 deterministic lookup (not LLM), 15/15 static rules tests, 11/11 offline demo gates, targeted TypeScript check of the new API and core contract passed. Full build failed due to missing React/Firebase dependencies; full API typecheck blocked by missing dotenv; provider live calls, browser E2E, Firestore emulator, empirical ML/measurement validation, and production deployment not executed. No progress percentage re-scored. No student data or credentials added. Next: independent provider approval/integration and actual live verification; CP33/34 real-data ML and LLM evaluation continue in parallel.
