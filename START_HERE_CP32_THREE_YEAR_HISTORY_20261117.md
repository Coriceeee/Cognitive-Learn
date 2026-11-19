# CP32 — National Admission / Three-Year History (17/11/2026)

Base: CLA_FULL_SOURCE_CP32_NATIONAL_ADMISSION_20261117.zip. Additive update. No Firebase/production modifications or personal records. Keep all prior project scope and gates.

## Changes
- 230 new public numerical facts from CTU signed appendices: 109 THPT/PT2 2024 (15 advanced/high-quality + 94 standard) and 121 common converted cutoff 2025 (17 + 104). Source program names are normalized for display; 2024 codes, combinations and numeric values transcribed from the original, names cross-checked with the 2025 appendix; Law code 7380101 retains the distinct 2024 specialization. Source campus labels are represented as CTU/Hậu Giang/Sóc Trăng (Hòa An, H suffix). 2024 học bạ separate source not yet ingested. No automatic score conversion.
- Total registry 622 numeric values / 5 institutions (CTU 357, PTIT 110, NEU 88, AGU 43, HUST 24). This is not nationwide completion or an assertion of all methods/rounds. 19 institutional entries / 38 school-year sources. CTUMP and UFM added as link-only; numeric tables not ingested.
- Multi-year history in Atlas comparison per selected school, campus and code; explicit missing slots; no inferred trend or probability across methods.
- Chat deterministic lookup CTU 2024 THPT, 2025 and 2026 common; year/method mismatch abstains. Cổng tuyển sinh Bộ link for institutions not yet in local catalog. Ministry directory retrieval returned 403; no enumeration or national coverage claims.

## Sources
- CTU 2024 THPT PT2: https://tuyensinh.ctu.edu.vn/images/upload/TT_TS/diemchuan-ptdt.pdf (4 data pages, checked).
- CTU 2025 common: https://tuyensinh.ctu.edu.vn/images/upload/TT_TS/2025/diemchuan2025-tb.pdf (4 pages, checked).
- 2025 conversion: https://tuyensinh.ctu.edu.vn/images/upload/TT_TS/2025/TB2939_Thong-bao-bang-quy-doi-diem-Hoc-ba-nam-2025.pdf (reference; conversion tables not imported).
- CTUMP scheme: https://news.ctump.edu.vn/thong-bao-tuyen-sinh-ai-hoc-nam-2026-37329 ; cutoff link https://tuyensinh.ctump.edu.vn/thong-bao-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026.html (table retrieval unavailable).
- UFM scheme: https://dacc.ufm.edu.vn/ufm-cong-bo-thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026--148.html (source discovery only; no numeric cutoffs).
- TDTU 2026 https://admission.tdtu.edu.vn/dai-hoc/diem-trung-tuyen-va-thu-tuc-nhap-hoc-trinh-do-dai-hoc-nam-2026 : two separate appendices, by combination, scale 100 and 1200. Not yet imported; needs combination-aware schema; not simplified to one cutoff.
- CTU 2024 học bạ https://tuyensinh.ctu.edu.vn/images/upload/TT_TS/2024/diemchuanhocba.pdf : identified, not imported.

## Verification in local environment
- npm test exit 0; 935/935 TAP tests (plus legacy manual checks).
- npm run test:cp32:national 7/7 (included in npm test); targeted 28/28 (included in npm test).
- npm run research:atlas:lookup 632/632 deterministic same-registry checks; NOT independent scientific or Gemini evaluation.
- npm run demo:final 11/11 synthetic/static gates and backup verify.
- npm run test:rules:static 15/15; check:layout PASS.
- Strict isolated TS check of registry, data and source modules PASS. Browser UI render, full build (missing local npm deps), Firebase Emulator, Browser E2E, live Gemini, empirical validation NOT RUN in this environment.
- Numbers manually transcribed; spot checks performed against source, no independent exhaustive second transcription.

## Windows
Back up local work; use full ZIP in a clean folder, or overlay patch only on exact base. Do not replace local .env files or deploy Rules as part of application. Run:
```powershell
npm run test:cp32:national
npm run research:atlas:lookup
npm run demo:final
npm test
npm run build
npm run dev
```
If dependencies not installed, run `npm ci` beforehand. Continue all institutions and all available methods/years, personalized decision, international/scholarship, research CP33–36. No completion claim based on this batch.
