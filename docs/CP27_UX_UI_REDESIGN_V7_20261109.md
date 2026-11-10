# COGNITIVE LEARN AI — CP27 / UX-UI Redesign V7

Date: 2026-11-09  
Base: `CLA9_CP26_ADMIN_ONLY_CONSOLE_20261108.zip`  
Scope: Student experience, module navigation, and CLA Assistant usability. No LLM/ML model or research-engine changes in this checkpoint.

## 1. Student dashboard
- Replaced the four prominent destinations plus secondary links with six equally visible student modules: Seed, Lumen, Atlas, Orion, Pulse, Haven.
- Added each module's existing visual identity, student-facing description, category and direct destination.
- Preserved the existing profile, data-readiness, next-action, transcript, cognitive-analysis and sharing flows.
- Kept Nexus/Admin out of student-facing navigation.
- Added responsive 3-column / 2-column / 1-column layouts and focus-visible states.

## 2. Cognitive Path / module navigator
- Retained the six student modules and their independently curated student-only submodule directory.
- Added search/filter within the selected module.
- Added per-module function counts, task grouping, and explicit available / partial / planned states.
- Replaced JavaScript navigation buttons with semantic links for destinations; unimplemented items remain non-clickable.
- Added empty search state, result count announcement, and concise limitations note.
- Admin's Nexus Console remains a separate route and catalog.

## 3. CLA Assistant
- Updated chat identity and header using the existing CLA mascot asset.
- Added allowlisted page context for the current route (e.g. Seed, Lumen, Atlas, Orion, Pulse, Haven, Nexus).
- Added page-specific quick prompts and a visible current-page indicator.
- Sent only a fixed page-context enum to the API; no student profile, transcript, score or personal data is sent.
- API validates the context against a fixed allowlist and uses it only for thao tác guidance.
- Preserved the helper-only policy: the floating assistant explains website operation and navigation; it does not supply admissions, scholarship, cost, certificate or programme-specific facts. Atlas/Haven remain the authoritative specialist modules.
- Added a sign-in notice instead of showing unusable quick prompts to unauthenticated visitors.

## 4. Validation
- `npm test`: PASS (existing suite plus 4 UX-V7 contract tests and page-context test).
- `npm run test:rules:static`: PASS (15/15).
- `npm run check:layout`: PASS (22 required files, 19 legacy misplacements absent).
- `tsc -b`: PASS.
- `tsc -p tsconfig.api.json`: PASS.
- PostCSS parse of `src/styles.css` and `src/styles/20-ux-v7.css`: PASS.
- Vite production build: BLOCKED because the supplied dependency tree only contains Windows Rolldown native bindings; Linux binding `@rolldown/binding-linux-x64-gnu` is absent. An `npm ci` attempt could not fetch it because registry DNS/network was unavailable (`EAI_AGAIN`). This is an environment/dependency limitation, not a reported build pass.
- Browser E2E / visual screenshot verification: NOT RUN.
- Firebase Emulator / production smoke test: NOT RUN.

## 5. Next sequence
1. Run the project on a supported local/CI environment and complete browser E2E for Student dashboard, six module navigation, mobile breakpoints and CLA Assistant.
2. Collect quick usability feedback from 5–10 students and one teacher; measure task completion and navigation errors.
3. Freeze UX/UI checkpoint after fixes.
4. Resume LLM and ML research work: baseline, dataset provenance and consent, missingness/leakage audit, train/validation/test split, model evaluation, calibration and evidence-backed integration.
