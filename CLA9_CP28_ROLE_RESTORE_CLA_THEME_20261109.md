# CLA9 CP28 — Role Restore & Unified CLA Theme

Date: 2026-11-09
Base: CLA9 CP27 UX/UI Assistant

## Scope completed

### 1. Restore role identity
- Restored explicit role labels: Học sinh, Giáo viên, Phụ huynh, Quản trị viên.
- The signed-in user's role is read from `users/{uid}` in Firestore; it is not selected or changed in the browser account menu.
- The user menu now shows the role under the account name and in the navigation label.
- Login/register now labels the existing role selector explicitly.
- Nexus Console now has a separate `Vai trò trong hệ thống` preview area with four role workspaces.
- Role preview links are clearly marked as interface preview only. They do not impersonate a user, change the authenticated role, or grant additional data access.
- Admin functions remain in the Admin Console directory; student/teacher/parent previews are not mixed into the admin task menu.

### 2. CLA Assistant light theme
- Converted the chat panel, header, conversation area, message bubbles, suggestions, form, notice, and footer to a consistent light blue/white palette.
- Kept the existing circular CLA mascot launcher and blue brand accent.
- Improved text contrast and focus outlines.

### 3. Unified CLA CSS
- Added `src/styles/21-cla-design-system.css` as the final theme layer.
- Defined central CLA color, surface, border, shadow, and hero-gradient tokens.
- Normalized the Nexus rail to the same light workspace style.
- Standardized branded hero gradients across login, role, student, module, and admin surfaces.
- Converted the previously separate dark study-abroad/source-discovery UI to CLA light surfaces.
- Converted near-black one-off insight cards to consistent white or branded-blue surfaces.
- Reorganized global stylesheet imports and ensured cognitive-growth, Lumen, shared-report, and module-subnavigation styles are loaded globally where their components are used.
- Removed duplicate page/component-level imports for the styles now loaded from the global entrypoint.

## Verification
- `npm test`: PASS (all scripted suites).
- `npm run test:rules:static`: PASS (15/15).
- `npm run check:layout`: PASS (22 required files; 19 legacy misplacements absent).
- `npx tsc -b --pretty false`: PASS.
- `npx tsc -p tsconfig.api.json --pretty false`: PASS.
- PostCSS parse: PASS (22/22 stylesheets plus global entrypoint).

## Not verified
- Vite production build remains blocked because the supplied dependency tree has no Linux Rolldown native binding (`@rolldown/binding-linux-x64-gnu`). No network dependency installation was available.
- Browser screenshot review, Browser E2E, Firebase Emulator and production smoke tests were not run.
- No Firebase Rules or production deployment changes were made.
