# COGNITIVE LEARN AI — CP29 Changelog

Date: 2026-11-09  
Base: `CLA9_CP28_ROLE_RESTORE_CLA_THEME_20261109.zip`  
Scope: QA hardening and release reproducibility. No LLM/ML model or research outcome changes.

## Changes

### 1. Role visibility follows the same active-account gate
- Updated the Admin navigation visibility check in `src/components/common/UserMenu.tsx` to require `profile.active === true`.
- This now matches the strict active-account requirement enforced by `AccessGate.tsx`.
- The account role label remains sourced from `users/{uid}`; the browser menu does not change the authenticated role.
- Added a regression assertion to `tests/ux-v7.test.cjs`.

### 2. Dependency manifest is reproducible
- Replaced all direct dependency `latest` tags in `package.json` with the exact versions already recorded in `package-lock.json`.
- Updated the lockfile root dependency declarations to match.
- Added `tests/cp29-release-contract.test.cjs` and included it in `npm test`.
- Existing semver ranges were retained where they were already constrained; `npm ci` remains the release installation command.

## Verification

- `npm test`: PASS — 82 test cases across the academic, cognitive observation, role/navigation, pipeline evidence, admissions/chat, mascot and CP29 release-contract suites.
- `npm run test:rules:static`: PASS — 15/15.
- `npm run check:layout`: PASS — 22 required files present; 19 legacy misplacements absent.
- PostCSS parse: PASS — 24/24 CSS files.
- Secret-like file scan of the source tree: no `.env`, `.env.*`, PEM/P12/PFX or service-account JSON files found. `.gitignore` excludes local environment files, credentials and `node_modules`.

## Blocked / not run

- `npm ci`: attempted but could not complete because registry requests failed with `EAI_AGAIN` DNS resolution errors; the attempt timed out. Partial `node_modules` was removed from the checkpoint package.
- TypeScript frontend/API checks and Vite production build: not verifiable in this environment because dependencies could not be installed. A global TypeScript invocation only reported missing React/Firebase/Node type packages; this is not recorded as a source-code PASS or as a confirmed source-code defect.
- Browser E2E and visual screenshot review: not run; the Vite app could not be started without installed dependencies.
- Firebase Emulator and production/staging smoke: not run; Firebase CLI is not available in this environment.
- No deployment, Firestore Rules change, or production data change was performed.

## Next gates

1. Run `npm ci` in a network-enabled Linux CI environment.
2. Run `npx tsc -b --pretty false`, `npx tsc -p tsconfig.api.json --pretty false`, and `npm run build`.
3. Run browser E2E for the 4 roles, 6 student modules, Nexus admin-only directory, chat assistant, desktop/mobile layouts and deep-link refresh.
4. Run Firebase Emulator authorization tests and cross-UID deny matrix.
5. Complete visual review before declaring the UX/UI freeze.
6. Only after these product gates, resume the LLM/ML research sequence.
