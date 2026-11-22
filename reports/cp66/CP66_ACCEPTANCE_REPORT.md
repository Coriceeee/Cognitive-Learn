# CP66 — UX-first shared states across six student modules

Date: 2026-11-21. Source predecessor: CP65.

## Delivered in application source

- `src/lib/moduleUiStatus.ts`: deterministic display-state resolver, no Firestore writes, no invented outcome or scientific measurement.
- `src/components/common/ModuleStateNotice.tsx`: accessible title, message and optional action. Error state uses `role="alert"`; other states use `role="status"`. Text labels supplement color.
- `src/components/common/ModuleDraftFeedback.tsx`: shared status for Orion, Pulse, Haven while retaining existing `useModuleDraft` verification and compare-and-swap guards.
- Orion: clear previous manual-save notices on new user edits; distinguish active autosave from confirmed autosave.
- Pulse and Haven: clear stale “saved” notices on each field edit; track the in-flight edit revision so a successful earlier save does not falsely acknowledge a newer edit.
- Seed transcript, Lumen and Atlas: common state language for loading, syncing, empty, error, source warnings, and relevant actions.
- `src/styles/45-cla-module-state-system.css`: consistent light/dark palette, responsive/print styling, keyboard focus indicators, reduced-motion support.
- Legacy static tests updated to follow the relocated source of truth (CP47, CP59); the underlying security gates were **not** loosened.

## Verification

| Check | Result | Evidence |
|---|---|---|
| CP66 new unit and static-integration checks | **18/18 PASS** | `cp66-tests.log` |
| CP47–CP66 regression run | **PASS** | `regression-cp47-cp66.log` |
| Full `npm test` | **exit code 0**, 1,260 TAP lines starting with `ok`, 0 `not ok` | `npm-test.log`, `npm-test.exit` |
| Firestore security rules static | **15/15 PASS** | `rules-static.log` |
| CLA layout contract | **PASS** | `layout.log` |
| Package safety unit tests | **3/3 PASS** | `packaging-tests.log` |
| Offline demo / synthetic evidence | **11/11 PASS** | `evidence-generation.log` |
| Chromium isolated responsive preview | **4/4 PASS**, no horizontal overflow at 1,160px and 390px | `chromium-preview.log`, `preview-*.png` |
| Syntax transpilation (modified TS/TSX) | **PASS** | Compiler diagnostic inspection |
| Production TypeScript/Vite build | **BLOCKED — NOT VERIFIED** | `build.log`, `dependency-preflight.log` |
| Firebase Emulator/browser integrated E2E | **NOT RUN** | Needs installed dependencies/configured emulator |

`npm test` is a chain of scripts. The 1,260 TAP `ok` lines include nested subtests; they are **not** 1,260 independent scientific validation samples. The isolated Chromium preview renders actual CP66 TSX component through a minimal HTML renderer and uses sample UI states, **not** a running React/Firebase website. All demonstrated measurements/datasets remain subject to separate research validation.

## User-facing UX acceptance criteria

- A newly edited Pulse/Haven field must switch away from a previously successful save message.
- A save that began before a subsequent user edit cannot acknowledge the later revision.
- Offline/cache-only drafts cannot be labeled verified or saved.
- Warning, error, in-progress and success information use visible text, not color alone.
- Mobile status content is not horizontally clipped and action buttons remain accessible.

## Outstanding for CP67

- Restore package installation, production build, Firebase Emulator, and browser-based E2E with real navigation and account states.
- Full-page UX review in the running React application including 6 module paths, focus and contrast, responsive layouts and dark mode; capture **real** screenshots for the research report.
- Only then freeze UX for report figures; do not mistake standalone QA screenshots for production evidence.
