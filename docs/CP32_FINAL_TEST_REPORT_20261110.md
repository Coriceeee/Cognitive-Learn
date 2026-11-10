# CLA CP32 — Final local test report

**Date:** 10/11/2026  
**Source:** `CLA_CP32_FLAT_START_HERE_20261109` plus CP32 demo/visual release changes  
**Runtime:** Linux container, Node v22.16.0, npm 10.9.2

## Passed

| Check | Result | Scope |
|---|---:|---|
| `npm test` | **94/94 PASS** | 14 academic + 4 cognitive + 76 TAP tests/subtests, including 7 CP32 contracts |
| `npm run test:rules:static` | **15/15 PASS** | Static Firestore Rules source contracts only |
| `npm run check:layout` | **PASS** | 22 required files present; 19 legacy misplacements absent |
| UCI baseline guard tests | **4/4 PASS** | Source/license/feature-cutoff/underpowered-data guards only |
| TypeScript syntax transpilation | **9/9 files PASS** | Four new visual components, Admin demo profile page, transcript page and three changed module pages |
| Strict TypeScript component check | **PASS** | Four new visualization components checked with a minimal JSX shim and imported domain types |

## Blocked / not run

- `npm ci` did not complete in this runner. `npm run build` stops on missing type packages (`react`, `node`, D3 types and others) before project compilation; this is an incomplete dependency-install environment, not a successful build.
- Browser E2E and screenshot review across Student/Teacher/Parent/Admin were not run.
- Firebase Emulator allow/deny matrix was not run.
- Staging/production smoke, backup/rollback and release sign-off were not run.
- Gemini API live calls and 120-case model scoring/gold review were not run.
- ML model evaluation, calibration, psychometric validation and Adaptive-vs-Static effectiveness were not run.

## Research data interpretation

- The supplied scope-gate fixture has 40 synthetic rows and 0 eligible research rows. This is the intended exclusion behavior.
- The 120-case LLM manifest is an inventory, not an evaluated model benchmark.
- The Orion closed-loop replay remains synthetic and its outcome is `SIMULATED_NOT_OBSERVED`.
- No real learner cohort with verified research consent/assent was confirmed in this package.

## Release decision

The CP32 source changes are ready for a provisioned local retest. They are **not a production release**. Before staging, install dependencies from `package-lock.json`, run the full build, browser E2E and Firebase Emulator matrix, and record the exact environment and results. Do not publish candidate Firestore Rules or deploy production based only on static tests.
