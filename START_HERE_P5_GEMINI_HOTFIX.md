# CLA P5 — Gemini + contrast hotfix (2026-11-24)

Base: CLA_DECISION_P5_FINAL_FULL_20261124.zip. Compared with CLA(2).zip: Gemini Lumen, Atlas, local adapter and Firebase configuration were byte-identical; Chat had P1/P3 policy differences. Reference model name matched gemini-3.5-flash-lite. No credential files were copied. Root cause of the live HTTP 502 is not confirmed: the user's direct request returned 200, but the authenticated app request response was not available. Do not describe this as verified live repair.

Changes:
- Shared bounded streaming JSON transport (512 KiB envelope), deadline and safe stage/error diagnostics; keep Lumen visible explanation cap. Chat/Lumen use higher output token budgets and 45-second generation deadline. Ignore thought parts, reject incomplete responses; preserve role, ownership, rate limit, CORS and local context rules. Atlas generation uses same transport with API key in header, preserves grounding and existing search fallback. Costs may increase for large outputs; no automatic generation retry was added to Chat/Lumen.
- Pair Atlas and shared Lumen projection surface foreground/background; use approved module palette; repair several known light hero sub-surfaces across Orion/Pulse/Haven. Static contrast tests, not a full browser audit.
- Restore five public assets from reference dist (manifest, service worker, two icons, logo). Remove exact duplicate misplaced files and archive unique historical copy; see HOTFIX_LAYOUT_MIGRATION.txt. Update two stale static tests (Daily Companion in StudentHeader, Atlas sourceRevision), restore actual Atlas exam link. No test bypass.
- No changes to Firebase Rules, account records, deployment settings, module colors, or P1-P5 decision algorithms. No production deploy. Old checkpoint manifests are historical. Use verify:focused, not old CP93 source-snapshot gate.

Validation in this environment:
- verify:focused 150/150 PASS, including 9 new hotfix tests (mocked transport and static contrast).
- Gemini legacy contract + six-gradient tests 18/18 PASS.
- Daily Companion 20/20 and Web Push 18/18 PASS; Atlas aspiration 31/31, exam reminders 30/30 PASS; layout PASS. Test counts overlap with regression; do not sum them.
- Full npm test partial: 427 completed tests PASS before 15-second execution limit; not full regression PASS.
- API typecheck attempted: missing dotenv dependency; npm ci timed out. No full build, no browser audit, no live Firebase/Gemini test. Do not run npm audit fix --force; previous moderate warnings not resolved by this release.

## Windows
Extract to a CLEAN directory (do not overlay the old source). Copy existing local .env files from your own trusted local installation only, including .env.gemini.local, .env.live.local, and .env.local if used. Never send keys or tokens. Keep local backups. Do not copy node_modules or old dist or the old mislocated folders. The working project root is the extracted CLA folder.

```powershell
npm ci --include=dev
npm run check:layout
npm run verify:focused
npm test
npm run typecheck:api
npm run build -- --mode live
npm run dev -- --mode live --host 127.0.0.1 --port 5173 --strictPort
```
Check each command exit code. For live backend build only (no deployment):
```powershell
npm ci --prefix functions-gemini --include=dev
npm --prefix functions-gemini run build
```
Use Node 22 for Functions runtime compatibility; check frontend Vite's minimum Node requirement (Node 22.12+ or a compatible Node 24 release). Test on local existing account, both Chat and Lumen. If 502 remains, provide only sanitized error message/diagnosticCode from Network Response and `[CLA API]` stage log from Vite. Never send Authorization, tokens, API keys, or full profile. `/api/cla-gemini-status` only checks configuration, not authenticated generation. Do not deploy while any gate fails.
