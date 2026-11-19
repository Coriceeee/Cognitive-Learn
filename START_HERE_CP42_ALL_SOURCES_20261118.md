# CP42 — National Source Discovery (18/11/2026)

Base: CLA_FULL_SOURCE_CP42_NATIONAL_PATHWAYS_20261118.zip. This release does not change the 838 cutoff rows, 448 programme records or 29 local official-source institutions. It targets nationwide *search reach*, not verified nationwide data coverage. The official Ministry directory was identified at https://tuyensinh.moet.gov.vn/ts/thong-tin but automated retrieval in this environment returned HTTP 403; a complete official snapshot was not obtained. No new institution records are fabricated.

## Student workflow
1. Open `/atlas/vietnam`, `/atlas/recommendations` or `/atlas/sources`. A previous route-visibility rule hid the public search panel; this is corrected. The Atlas hero now links to the actual recommendation route instead of an anchor in a hidden section.
2. Type any public institution name, admission code or field (including schools absent from the 29-school catalogue), select the latest year to examine, and confirm public-only input.
3. `Tra cứu nguồn 3 năm` creates four links per year: official-domain scheme, cutoffs, tuition/criteria and wider-domain search. It does not call AI or claim the links returned specific source documents. Ministry portals are also directly available. The three-year chart indicates local/uncorroborated link availability, not national coverage, verification, or admissions probabilities.
4. `Tìm tự động qua dịch vụ nguồn` calls the existing authenticated server endpoint in v2 mode. Each of the three year slots independently requests up to eight source candidates. The field `year` shows the *requested* year, not verified publication date. No fetched candidate enters the cutoff, ranking, prediction or training dataset; the results are transient and are not written to Firestore. The existing single-year panel remains available under disclosure.

## Provider configuration (server only, optional)
No provider is activated by this ZIP. All production provider arrangements, including education/age, privacy, display rights and costs, must be approved by the operator before enabling. Do not paste key into source, VITE variables or chat. For the pre-existing generic independent search provider contract:
```
CLA_PUBLIC_SEARCH_APPROVAL=approved-independent-public-source-provider-v1
CLA_PUBLIC_SEARCH_ENDPOINT=https://YOUR_APPROVED_PROVIDER
CLA_PUBLIC_SEARCH_TOKEN=<server secret>
```
It receives only `{version:1,topic,subject,year}` and returns `{results:[{title,url,snippet}]}`. Alternatively, the optional Brave Web Search adapter uses the fixed HTTPS API endpoint, strict safe search, no summarization, and display-only results:
```
CLA_PUBLIC_SEARCH_APPROVAL=approved-brave-web-display-v1
CLA_BRAVE_SEARCH_API_KEY=<server secret>
```
This requires a separate contract/key and provider approval for this student-oriented application; adding only a Gemini key does not enable either option. Use one of these provider configurations, not both. The adapter has only been exercised with mocked responses; no live Brave or independent provider request was made. Per-user in-process rate limiting is a best-effort control, not distributed production quota protection. Each batch uses up to three upstream calls; partial failures are isolated. Direct fallback searches do not incur server API costs.

## Gemini and rights boundary
Google Gemini Developer API Additional Terms, effective 23 March 2026: https://ai.google.dev/gemini-api/terms (Age Requirements and Grounding with Google Search). The standard terms prohibit use in apps directed towards or likely to be accessed by persons under 18 and impose restrictions on harvesting/caching grounding results. The existing legacy Gemini Reader/admin flow has not been modified or activated; it requires separate review before live use. Do not use Google Grounding results to build the shared national data store. A permitted arrangement with Google is needed before expanding Gemini in a student-facing app. Separate direct official-source collection/verification is necessary for actual data completeness. Brave reference and terms: https://api-dashboard.search.brave.com/api-reference/web/search/get and https://api-dashboard.search.brave.com/documentation/resources/terms-of-service. Brave output here is for transient user display only, no automated collection for database/AI, no AI training or evaluation built on it. Search queries can still contain personal data if users violate input instructions; pattern filters and confirmation are not a comprehensive privacy guarantee.

## Verification and limits
- `npm run test:cp42:source-discovery` exercises free-form school/name/field queries, strict input, year partitions, partial failures, root visibility, provider mocks and explicit non-verification labels.
- Full build was attempted but dependencies such as React/Firebase are unavailable in this environment. Browser E2E and live API remain unverified. Rules unchanged. No production deploy or Firebase writes. For actual national coverage, obtain a dated complete MOET admissions institution inventory, reconcile codes/campuses, and independently collect primary-source programme/year/method facts; report coverage against that inventory, not 29 registry schools. The UI's unrestricted search is not proof of complete indexing or actual eligibility.
