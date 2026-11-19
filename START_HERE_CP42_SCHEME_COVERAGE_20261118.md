# CP42 — scheme catalogue and national coverage audit (2026-11-18)

Base: CLA_FULL_SOURCE_CP42_ALL_SOURCES_20261118.zip. Student-only, chart-first; no change to Firebase rules or live AI provider. This increment expands domestic admission sources, not empirical validation.

## What changed
- Separate programme discovery from historical cutoff availability: source-backed 2026 schemes can be discovered, selected and matched without a numeric cutoff. No grade predictions or eligibility claims are inferred from a scheme.
- Added 20 HTU (HHT) and 53 QNU (DQN) application codes with published planned quotas, subject combinations and method labels. Source-specific programme codes are retained, no invented national combination codes for named QNU triples. Ambiguous technology/aptitude/legacy subjects remain unresolved. Source-listed quota totals are 790 and 5,173 respectively; these describe the transcribed publication, not current available places/final revised quotas. HTU later published an overall 770 figure, not reconciled to the original table.
- Local catalogue grows 448 -> 521; programmes with combination information 243 -> 316; institutions with programme records 16 -> 18; source registry 29 -> 31; numeric cutoff observations remain 838.
- Source coverage audit shows independently counted schools by year, missing data work queue (85 of 93 local school-year slots). Past programme catalogue not inventoried, represented as null. No national denominator or completeness percentage.
- Search by published school code now includes HHT and DQN. Official source links, not automatic live AI extraction.

## Sources
- HTU 2026: https://tuyensinh.htu.edu.vn/ts-dh/tuyen-sinh-dh-2026
- QNU 2026: https://tuyensinh.qnu.edu.vn/vi/tuyen-sinh-dai-hoc-chinh-quy-2027/tb-1906-thong-tin-tuyen-sinh-dai-hoc-nam-2026-cap-nhat-hinh-thuc-dao-tao-chinh-quy-1208
- Cổng Bộ: https://tuyensinh.moet.gov.vn/ts/thong-tin (directory returned HTTP 403 in retrieval environment).
- Historical pages linked in officialAdmissionSources.ts. Numeric cutoffs from these new schools not imported; no guessing method or scale.

## Coverage workflow
`npm run research:atlas:coverage` writes `reports/evidence/cla_atlas_national_coverage.json`.
`npm run research:atlas:coverage -- --inventory path/to/reviewed.json` compares a manually reviewed Ministry inventory to the local registry. JSON shape (illustrative partial inventory only):
```json
{"schema":"cla-moet-directory-review-v1","source":"https://tuyensinh.moet.gov.vn/ts/thong-tin","asOf":"2026-11-18","complete":false,"entries":[{"code":"HHT","name":"Trường Đại học Hà Tĩnh","localId":"htu"},{"code":"DQN","name":"Trường Đại học Quy Nhơn","localId":"qnu"}]}
```
Unknown mapping uses null; duplicates and unknown local IDs rejected. Import does not independently prove inventory authenticity, does not update programme data or production, and never calculates national coverage even for operator-declared complete input. National inventory and mapping are still required. The remaining workflow is to obtain a lawful authoritative inventory, resolve units/campuses, then prioritize missing school-year methods/programmes/cutoffs. Live provider remains unconfigured. Build, Firebase emulator and browser E2E remain unverified in this environment.

## Verification in this environment
- `npm test` exit 0, 1,098/1,098 Node TAP tests; includes eight new scheme/coverage cases. Existing fixed registry-count expectations updated from 29 to 31. Offline demo 11/11; deterministic Atlas lookup 848/848. Standalone engine TypeScript check exit 0. Inventory CLI smoke: partial two-unit mapping accepted (no national percentage), duplicate rejected.
- `npm run build` exit 1, missing dependency/type declarations. This does not establish full UI type correctness. No live Firebase rules/Browser E2E/provider test. No new scientific effectiveness evidence.
