# CP42 — National Pathway Intelligence / Atlas

Base: CLA_FULL_SOURCE_CP41_POLICY_SANDBOX_20261118.zip. Student-only & Chart-first remain in scope. No Firebase rules or deployment change.

## Root cause and fix
The two learner-facing selectors were still wired to a PTIT BVH pilot rather than the entire admission registry. Replace that binding with `buildNationalPathwayCatalogue` / `matchNationalPathways2026`; do not merely rename controls. All 2026 programme identities (school + campus + admission code) are selectable, including unknown combinations. All schools selector has no preset school. Explicit elective filter, school/keyword filters, coverage chart, source links, and independent per-year/per-method history. Student draft remains ordered by learner, not submitted or synced; source match recorded at add time. Reviewed current Atlas programme sources can be merged where school, official host and year agree; this is not a public admin publication pipeline (existing per-account storage). No independent verification of runtime state or admin identity inferred from client metadata. Existing same-code records with no campus metadata are not overwritten. PTIT historical records, source facts and backward-compatible functions retained; no preferential school.

## Coverage (bundled, not national census)
- 838 cutoff facts unchanged, three years 2024–2026; 16 institutions with programme-level facts; 29 official portal entries. Not all three years/methods for every institution.
- 448 distinct 2026 programme/campus identities, 243 with published combination/base-code information from six institutions. The remaining programmes are not ruled ineligible.
- 170 programme combination lists added, not new programme identities or scores. 127 CTU + 43 AGU.
- Physics + English: 172 matches (CTU 98, AGU 31, USSH 29, PTIT 10, TNUE 4). History + Geography: 58 matches across four schools, zero PTIT. Pair matches reflect the supplied source subset, not probability or official eligibility.

## Sources checked 2026-11-18
- CTU 2026 catalogue and subject-code appendix: https://tuyensinh.ctu.edu.vn/tuyensinh/chuong-trinh-dai-tra/177-thong-tin/841-danh-muc-nganh-va-chi-tieu-tuyen-sinh-dhcq.html — 127 codes aligned with existing registry. THPT list; cutoff common-method publication remains separate.
- AGU catalogue: https://tuyensinh.agu.edu.vn/nganh-dao-tao — 43 codes, composite admission combination list, not standalone THPT score. The individual CNTT programme page https://tuyensinh.agu.edu.vn/nganh-dao-tao/cong-nghe-thong-tin also lists A00, which is retained as source-specific evidence. Source-specific X code mapping used only where documented. Unknown/legacy subject codes do not become confirmed matches. Generic technology grades do not stand in for specialised elective streams.
- No additional historical cutoff values imported. Source-only schools remain browsable; existing public-source search links and manual draft entry cover gaps without claiming live retrieval or verification.

## Release limitations
Full npm build attempted: FAIL, missing React/Firebase and other installed dependencies. TSX syntax and pure TypeScript checks only; browser, real Firebase, production deployment and live AI remain NOT RUN. Full nationwide registry and ongoing automatic ingestion are NOT COMPLETE. No inference about eligibility, converted score, future cutoff or admission probability from counts. No scientific validation or 164/70 checklist rescore in this patch. CP42 42.06/42.07 advanced locally; other CP42 work remains open.

See reports/verification/cp42_national_pathways for test results. Unzip full source to a new directory, install locked dependencies in your normal configured environment, then run `npm run test:cp42:atlas`, `npm test`, `npm run build`. Do not deploy a failed build.
