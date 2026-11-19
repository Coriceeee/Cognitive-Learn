# CP31 Batch 17 — DEMO BACKUP / 48-HOUR RELEASE TRIAGE

Base: **CP31 Batch 16 FULL SOURCE** ONLY. Back up your Windows project before applying PATCH. Keep your `.env*`, `.git`, Firebase config and local user data; do not overwrite them with an archive. Do not deploy Firestore Rules automatically.

## Fastest safe run on Windows

Open PowerShell in the project root (after applying PATCH on exactly Batch 16):

```powershell
cd 'C:\Gạo\Cognitive-Learn'
npm run demo:final
if ($LASTEXITCODE -ne 0) { throw 'SYNTHETIC DEMO FINAL FAILED' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'PRODUCTION BUILD FAILED' }
```

The first command runs **11 offline core gates** and creates/byte-verifies `reports\demo\CLA_DEMO_BACKUP_SYNTHETIC.html` from **three synthetic Evidence Bundles**, using source-tree fingerprint and three engine replay validators. Open this HTML via a double click, **even when Firebase or the Internet is unavailable**. It is a distinct backup viewer, **not the CLA web app** and **not verified school research**.

If the web app is accessible, show the actual modules and use the backup only if login, network, or live backend fails. DO NOT use the backup HTML to claim real-person efficacy.

## Extra gates before claiming website demo ready

```powershell
npm run test:cp31:batch17
npm test
npm run test:rules:emulator
```

Record exit codes and retain terminal output. Firestore Emulator runs locally; do **not** deploy candidate Rules to production for a demo. Browser E2E 72 cases remain a **separate** unverified gate, even if all commands above pass. Rehearse mobile/desktop refresh, back navigation, consent and account switching manually only in a controlled non-production account.

## 4-minute fallback talk track

1. 00:00-00:45: research motivation, closed-loop architecture; separate heuristics from validated ML.
2. 00:45-01:45: explain the 7 synthetic engine stages.
3. 01:45-02:45: demonstrate T0/T1/T2 descriptive data, zero scores and measurement-source warnings.
4. 02:45-04:00: show evidence trail and limitations (self-report, no independent outcomes, no causal effect).

## Unclosed blockers (do not mark PASS without logs)

- Production `npm run build` on Windows with dependencies installed.
- `npm run test:rules:emulator` using local Emulator and evidence export.
- 72 actual browser E2E cases; nothing in this batch runs them.
- Human reviewer validation and empirical Vietnamese upper-secondary data.
- Automated Chromium rendering could not be confirmed in the packaging container due to browser startup timeout. Rehearse HTML open on the presentation laptop.

Batch 17 does not change Firestore Rules, browser auth, existing student records or scientific scores. The 164 checklist stays **21 / 126 / 17**; B17 extends evidence for `I4` and `R9.6` only. See `docs/CP31/CP31_BATCH17_DEMO_BACKUP_REPORT_20261116.md`.
