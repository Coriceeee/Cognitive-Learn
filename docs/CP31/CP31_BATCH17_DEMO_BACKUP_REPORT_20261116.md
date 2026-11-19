# CP31 Batch 17 — Offline Evidence Backup & Freeze Gate

Date: 2026-11-16. Base: CP31 Batch 16.

## Motivation

The app's existing offline gate passes, but relying exclusively on Firebase login, network and browser rendering puts a 48-hour council demo at risk. Implement a **separate standalone fallback**, with no script loading, network, Firestore or real learner records. Not a substitute for the React app.

## Changed source

- `tools/cla_demo_backup.mjs` (new): strict source/evidence preflight, replay validators, allowlisted output projection, HTML escaping, static SVG longitudinal chart, 7-stage replay overview and 4-minute speaking script. Deterministic HTML; verify mode fails if modified.
- `tests/cp31-batch17-demo-backup.test.mjs` (new): eight tests incl. tampered output, malicious markup, invalid score, absent artifact and actual-engine replay.
- `package.json`: `demo:backup`, `demo:final`, `test:cp31:batch17`, `verify:cp31:batch17`; include new tests in `npm test`.
- `src/lib/nexusEvidenceBaseline.ts`: update tracked source fingerprint to match new source; not a production signature.
- Three `reports/evidence/*SYNTHETIC.json` regenerated from unchanged fixtures and actual engines with new fingerprint.
- `docs/CP31/` and root instructions, 164-item CSV/XLSX: metadata/communication only.

## Verified this turn

- `npm run test:cp31:batch17`: **8/8 PASS**.
- `npm run verify:cp31:batch17`: **PASS**.
- `npm run demo:gate`: **11/11 PASS**, synthetic/static only.
- `npm run demo:backup`: **PASS** generation and byte-for-byte verification.
- `npm test`: **PASS**, includes B17.
- `npm run check:layout`: **PASS**.
- `npm run audit:cp31:evidence`: **PASS source fingerprint**, **NOT TESTED** for missing production/research evidence.
- Source fingerprint: **301 tracked files**.
- HTML SHA-256 of generated backup: `3e469be1615d734a185ea828a496ebebbcf10eac4117d3a698bc0093c0ba9cd5`.

## NOT verified

- Actual Chromium/browser rendering: container Chromium startup timed out.
- `npm run build` on Windows (this runtime has no project `node_modules`).
- Firestore Emulator runtime and 72 browser E2E cases.
- Scientific efficacy, psychometric validity, source authenticity or calibrated prediction.

## Scientific claim policy

Only synthetic fixtures, metadata declared by mock learner, engine replay, and local digests are supported. No real personal data, no human outcome study, no valid causal inference. The HTML is explicitly labeled `SYNTHETIC · OFFLINE` and should never be shown as a live application screenshot.

## 48-hour triage priorities

P0: 1) run on presentation laptop; 2) preserve source, complete demo:final; 3) build; 4) test login/account role and most important route/deeplink; 5) rehearse offline HTML fallback. P1: run local Emulator and archive logs. Defer unneeded UI expansion, new ML experiments and irreversible production changes.

## Audit impact

`I4` gets an offline fallback to make presentations resilient, **not browser E2E PASS**. `R9.6` gets additional claim boundary assertions and reproducible local evidence, **not independent scientific review**. All 164 assessment categories remain 21/126/17.
