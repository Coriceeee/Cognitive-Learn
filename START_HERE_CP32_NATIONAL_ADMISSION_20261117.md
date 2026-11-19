# CP32 — National Admission Source Expansion (2026-11-17)

Base: CLA_FULL_SOURCE_CP32_DECISION_CHAT_20261117.zip. This is an additive source expansion, not an acceptance of nationwide coverage or a production release. No Firebase deployment, no new secrets, no student-level records.

## Data coverage
- 17 institutional source entries, 36 school-year source records, 9 entries with links covering 2024–2026. A link is not equivalent to a fully ingested cutoff table.
- 392 numerical values: PTIT 110 existing (90 2026 + 20 historic), CTU 127, AGU 43, HUST 24 (12 programs × 2 equivalent score methods, partial faculty coverage), NEU 88. Newly imported: 282, all from 2026 announcements. NEU Vietnamese display labels normalized from the faculty's English table; codes are the authoritative lookup keys. CTU and AGU main rounds; no claim of all admissions rounds or complete source fields.
- Links with inaccessible/unprocessed tables remain link-only, not numeric records. Source dates, method, scale and campus displayed; unknown scale disables comparison. No probabilities inferred. No automatic conversion between methods. No claim of national completeness.
- Programmatic source fidelity checks use the same registry, not independent ground truth or Gemini evaluation.

## Local verification
- `npm test`: exit 0, 933/933 TAP assertions; additional legacy manual checks also pass.
- `npm run test:cp32:national`: 5/5 (included in npm test).
- `npm run research:atlas:lookup`: 402/402 deterministic cases.
- `npm run demo:final`: 11/11 offline gates, regenerated synthetic backup.
- `npm run test:rules:static`: 15/15; not Emulator verification.
- `npm run check:layout`: PASS.
- Isolated strict TypeScript check of the three admission registry/engine files: PASS. Full build NOT RUN (dependencies absent); browser E2E, Firebase Emulator, live Gemini, external scientific validation NOT RUN in this environment.

## Apply
Back up local work first. Use full ZIP in a separate folder, or overlay the patch only on the exact base above. Keep local environment and credentials outside archive. Do not publish rules from this artifact. On Windows PowerShell run `npm ci` if dependencies are not installed; then:

```powershell
npm run demo:final
npm run research:atlas:lookup
npm run test:cp32:national
npm test
npm run build
npm run dev
```

## Next gates
Ingest official numeric tables for all remaining institutions and missing years. Enumerate nationwide institutions with official MOET directory (direct retrieval was not available in this environment), verify school/campus IDs, deduplicate, expand official source records, verify each table/method/scale, and add independent spot checks. Continue school/program personalization and study-abroad/scholarship coverage; no scope reduction. Complete production and scientific gates separately.
