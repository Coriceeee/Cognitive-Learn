# CLA CP46 — Exam Horizon & Learning Network

Base: `CLA_CP45_SEAMLESS_NAVIGATION_SOURCE_20261120.zip`. This is a UI/interaction change only; it does not redefine admission sources, exam dates, educational scoring, or Firebase security.

## Product changes

- `/student` shows a read-only **Exam Horizon** directly after the greeting and before the intelligence canvas: the next student-entered registration/exam milestone, remaining calendar days, up to three upcoming milestones, and a clear action to configure the schedule.
- `/student/exams` is the **calendar settings** workspace. It retains create/edit/delete, date validation, registration status, official portal links, and local storage recovery. It no longer duplicates the large overview countdown/alert display; notification logic remains intact.
- The old static 2x3 module tile grid on `/student` is replaced by the **Learning Network**: an interactive six-stop closed-loop diagram (desktop) and an accessible connected list (mobile). Every destination is an already implemented route; no fabricated scores.
- Account isolation, manual date provenance and existing SPA navigation remain intact. The exam calendar stays **local to the current browser/account** under the existing storage key; it does not sync across devices or send background push notifications.

## Key paths

- `src/components/student/ExamHorizon.tsx` (new)
- `src/lib/examCalendarStorage.ts` (new, shared storage namespace)
- `src/page/seed/components/LearningCircuit.tsx` (new)
- `src/page/seed/StudentPage.tsx`
- `src/components/student/ExamReminderBoard.tsx`
- `src/data/moduleSubmodules.ts`
- `src/styles/40-cla-exam-horizon-learning-circuit.css` (new, scoped)
- `src/styles.css`
- `tests/step17-exam-reminders.test.mjs`
- `tests/cp46-horizon-circuit.test.cjs` (new)

## Apply

Full source: extract ZIP and work in the `CLA/` directory. Run `npm ci`, `npm run dev` (or the project's normal Firebase setup). Never commit `.env` or credentials. Existing account data is not included in the ZIP.

Patch: extract the patch into the **root directory of a CP45 checkout**, allowing the listed relative paths to overwrite the originals. The patch does not target CP42–CP44 or arbitrary GitHub versions.

## Verification performed

- `tsc --noEmit -p tsconfig.json`: PASS.
- Combined CP39 chart, CP42 focused workspaces, CP44 contrast, CP45 navigation, step17 exams, CP46 tests: **66/66 PASS**.
- `npm run check:layout`: PASS.
- Chromium fixture screenshot at 1440 and 390; responsive overflow check at widths 360, 390, 768, 1024, 1440: PASS. Desktop hover selection displays the matching module description.
- `npm run build`: BLOCKED in this Linux environment by a missing Rolldown native dependency from the supplied pre-installed node_modules. Frontend TypeScript stage passes but Vite fails before bundling. Reinstall project dependencies on the target machine and rerun build.
- No integrated Firebase/real-user browser E2E test was performed. Preview uses synthetic **illustrative** exam dates and is NOT live admission data.

## Known limitations

The first page visit must still verify sign-in and student records, and service modules may independently load data. CP46 does not modify these APIs or claim improvements to their runtime performance. The diagram is presentation/navigation only.
