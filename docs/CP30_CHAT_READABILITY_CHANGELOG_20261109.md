# CP30 — CLA Assistant Readability

**Date:** 2026-11-09  
**Base:** `CLA9_CP29_QA_RESEARCH_TRANSITION_20261109.zip`  
**Scope:** Floating CLA Assistant presentation only; no LLM policy, admissions data, Firebase Rules, permissions or ML behavior changed.

## Change list

1. Added `src/styles/22-cla-chat-readability.css` as the final CLA Assistant-specific style layer after CP28's global design system in `src/styles.css`.
2. Strengthened the CLA light palette: dark ink `#102a43` on pale-blue/white surfaces, secondary dark blue `#294968`, white-on-brand-blue user messages. The styling remains restricted to `.cla-chat-root`.
3. Increased type size/weight: 18px assistant header; 14px subtitle, helper introduction and suggestion buttons; 15px message bodies and chat input; 12–13px auxiliary labels/footer (formerly some 9–11px).
4. Improved paragraph line-height, message padding and borders to aid legibility.
5. Increased close and send-button hit areas, improved hover/focus rings and disabled-state contrast; retained responsive constraints and reduced-motion support.
6. Kept the circular CLA mascot launcher, route-aware help, and helper-only policy. No new admissions/scholarship answer capability was introduced.
7. Added `tests/cp30-chat-readability.test.cjs`, including a WCAG AA 4.5:1 normal-text contrast test on key solid foreground/background color pairs; registered it in `npm test`.

## Not changed

- `FloatingAdvisorChat.tsx` chat logic and page policy.
- API Gemini, admissions / study-abroad / scholarship data.
- Firebase Rules, database, permissions and production deployment.
- Other modules' CSS.

## Limitations

- Automatic contrast checks cover stated color pairs in the CP30 stylesheet. They do not prove every live browser state or all OS font/rendering combinations meet WCAG AA.
- Full Vite build, Browser E2E, Firebase Emulator, visual screenshot review of the running application and production smoke remain unverified due to missing dependency/runtime integration in this environment.
- The 164-line backlog represents **open acceptance conditions**, not 164 features needing brand-new implementation.
