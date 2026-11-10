# COGNITIVE LEARN AI — CP34 WORKING RELEASE

## 1. What changed in CP34

CP34 is a corrective integration checkpoint based on the supplied CP32/CP33 source package.

- Integrated the scientific visual components into their actual student module pages: Seed transcript, Lumen, Orion, Atlas, Haven and Pulse.
- Imported `23-scientific-visuals.css` in the global stylesheet entrypoint. Without this import, the visual component files existed but their dedicated styles were not loaded.
- Added an Admin-only synthetic 3-year demo preset to Seed Profile. It fills local form state only; the user must inspect the form and explicitly save. It is disabled when the elective set is already locked. Saved records retain `dataScope: "demo"`.
- Clarified Haven's generated scholarship cards as generic policy archetypes, not a verified scholarship catalogue.
- Added the scientific visual contract suite to `npm test` (13 contracts), plus `test:visuals` and `verify:cp34` scripts.

## 2. Install and run on Windows PowerShell

Run from the folder containing `package.json` and `package-lock.json`:

```powershell
Get-Location
Test-Path .\package.json
node -v
npm ci
```

Only after `npm ci` finishes with exit code 0:

```powershell
npm run dev
```

Do not run `npm install` to repair a partial installation and do not delete `package-lock.json`. If registry access fails, check the network/DNS and then run:

```powershell
npm config get registry
npm ping
```

The expected registry is `https://registry.npmjs.org/`. Retry `npm ci` only after `npm ping` succeeds.

## 3. Verification sequence

```powershell
npm test
npm run test:rules:static
npm run check:layout
python -m unittest research.tests.test_uci_baseline -v
npm run typecheck:api
npm run build
```

`npm run verify:cp34` runs the same sequence in one command. On Windows, `./RUN_CP34_VERIFY.ps1` performs the full local sequence; add `-StartDev` to start Vite only after all local gates pass. A successful `npm test` does not replace typecheck, build, Firestore Emulator, or browser E2E.

## 4. Demo journey

1. Sign in with an activated Admin account provisioned in your Firebase project.
2. Open `/student/profile?from=admin`.
3. In the Admin demo panel, click **Nạp hồ sơ demo 3 năm** and confirm. This fills the form only; no Firestore write occurs at this point.
4. Inspect the synthetic profile and 6-semester transcript. If appropriate, click **Lưu hồ sơ học tập** explicitly. It is written only under the currently authenticated Admin UID and tagged `dataScope=demo`.
5. Open `/student/transcript` and inspect the 6-semester trajectory and subject heatmap.
6. Open `/lumen` and inspect the signal radar, coverage and history status.
7. Open `/orion`, enter a valid target and weeks remaining, then inspect the three strategy scenarios and trade-off plot.
8. Open `/atlas` and inspect the official admissions explorer plus the historical PTIT BVH 2024–2025 slopegraph.
9. Open `/haven`, fill GPA, English and four self-reported pressure inputs; inspect Pressure Topology. The scholarship cards are generic rule archetypes, not confirmed awards.
10. Open `/pulse`, enter all required metrics and inspect the six-dimensional Metric Orbit. Admin can run the lineage check and inspect Evidence Circuit.

## 5. Acceptance boundaries

- Synthetic data is for technical demonstration only and is not research data.
- SCI/MAS/CSL remain exploratory/proxy indicators, not psychometrically validated scales.
- Orion feasibility/gain are heuristic, not admission probability or calibrated ML predictions.
- Haven fit/readiness is rule-based and does not predict scholarship awards.
- Atlas historical slopegraph covers only the specified PTIT BVH 2024–2025 records; it is not a national admissions dataset or 2026 cutoff.
- Pulse Evidence Circuit is a lineage metadata check, not an end-to-end outcome evaluation.
- Do not deploy production until build, Firestore Emulator role matrix, browser E2E, staging smoke and rollback checks pass.
