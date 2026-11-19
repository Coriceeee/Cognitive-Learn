# CP42 — National admission bulk history (2026-11-18)
Base: CLA_FULL_SOURCE_CP42_SCHEME_COVERAGE_20261118.zip. Student-only; chart-first; no live deployment or rules changes.

## Actual additions
- Dong Thap University (SPD): 534 numerical cutoff values from the public institutional table, 43/51/58 university-level codes for 2024/25/26 (126/200/208 values). The college code 51140201 is intentionally excluded from the undergraduate university scope. The four method columns are not interchangeable: THPT 30, học bạ 30, V-SAT 450, ĐGNL ĐHQG-HCM 1200; values are as published, not raw scores or eligibility. Missing '-' is not zero. No V-SAT value in 2024; no inference that a method was or was not offered where the value is missing. Year-specific scoring/conversion and aptitude conditions matter.
- Official CNTT 7480201 2026 individual page provides 6 combinations A00/A01/A02/C01/D01/X02. Other 57 SPD programme codes have no locally reviewed combination details; they remain searchable but not declared compatible. Cross-page code inconsistencies for other programmes were not reconciled; cutoff table codes retained as written.
- National totals: 1,372 numerical cutoff records (838 before), 579 distinct 2026 programme/campus codes (521 before), 317 with some combination evidence (316 before), 19 institutions with 2026 programme records (18 before), 32 official-source institutions (31 before), 17 institutions with numeric cutoff records (16 before). No national denominator.
- School-code search added in official sources, programme filters and chatbot exact lookup. Existing programme comparison and three-year chart automatically consume the new records.

## Sources
- https://qao.dthu.edu.vn/tuyen-sinh/diem-trung-tuyen (2024/25/26 institutional numeric tables; manual factual transcription, not independently audited)
- https://qao.dthu.edu.vn/nganh-tuyen-sinh/cong-nghe-thong-tin-36 (2026 CNTT combinations, methods, code)
- Score scale guidance: https://qao.dthu.edu.vn/tuyen-sinh/du-lieu-xet-tuyen and https://qao.dthu.edu.vn/post/id-1419. No new raw score conversion or aptitude formula implemented.
- HTU 2024/2025 official cutoff pages found but source text did not expose numerical tables in retrieval; no guessed data imported.

## Scalable source workflow
1. Review and register the exact official school/year source.
2. Create a JSON manifest with `schema: "cla-reviewed-cutoff-batches-v1"`, `batches: [...]`. Each batch follows `ReviewedBatch` in `src/lib/reviewedCutoffBatch.ts` (universityId, university, campus, source, officialHost, year, reviewedAt, note, columns [{method,label,scale}], names {code: major}, table string of whitespace-separated code and scores, '-' for missing). `dthuBatches` is a working example.
3. `npm run research:atlas:batch-preview -- path/to/reviewed-batches.json` performs read-only structural and key comparison. Exit 2 for conflicts. Other invalid inputs throw. Review source content independently; the command cannot authenticate the source or establish code/campus mapping. It never publishes or overwrites data. Reviewed batches must still be integrated through code review.
4. Rebuild and rerun tests; `npm run research:atlas:coverage` reports missing school-year data.

## Verification
- Full npm test exit 0; regression log attached. 8 new unit cases, 62/62 targeted, deterministic lookup 1382/1382, demo 11/11. Preview replay 534 unchanged; deliberate single-value conflict detected with exit 2. Strict standalone TypeScript data modules exit 0.
- Full build exit 1 (React/Firebase dependency declarations absent); real Browser E2E, Firebase Emulator and live AI not run. Source data not independently revalidated row by row. National inventory completeness and research validation remain open. Existing admissions and source-count tests were updated only for reviewed dataset counts and new school code matching.
