# CP45 — Seamless Navigation (2026-11-20)

**Base:** `CLA_CP44_DAYLIGHT_CONTRAST_SOURCE_20261120.zip` (CP44 daylight). This checkpoint changes **navigation, JavaScript loading and lifecycle**, **not** the scientific/ML engines, access policy, visual theme or student data semantics.

## Why CP44 still felt like a page reload

1. `App.tsx` previously used `useSyncExternalStore` for the route. This produces synchronous updates, so a cold `React.lazy()` module can replace the entire protected app with `AppLoading` / `Suspense` fallback. It looks like a hard reload even when `history.pushState()` is already in use.
2. Each Seed and Lumen route mounted its own `useStudentProfile()` hook. Unmounting a module destroyed its Firebase Auth listener, server-confirmed profile watcher and pending history request; navigating back rebuilt them and temporarily displayed module loading UI. This was particularly visible between Seed and Lumen.
3. Route chunks had no hover/focus prefetch and no limited idle warm-up for touch navigation. First visit to a module required downloading and parsing its code at click time.
4. `navigateTo()` scrolled immediately after `pushState`, sometimes moving the **old** page before the transition committed.

## Implemented changes

- A transition-backed React route state in `src/App.tsx` keeps the previous rendered page visible until the new `React.lazy` module resolves. A 3 px, unobtrusive progress line conveys pending navigation; it honors `prefers-reduced-motion`.
- `src/lib/routeModules.ts` centralizes all lazy import entrypoints. `clientNavigation.ts` prefetches *code only* on same-origin link hover, focus and touch pointer-down. For authenticated student module routes, at most two likely next chunks are requested while the browser is idle and only on connections without a data-saving/slow-network signal.
- `src/page/seed/hooks/StudentProfileProvider.tsx` mounts a **single** verified `useStudentProfile()` subscription for the student workspace. Seed and Lumen consume the same provider. It is **not mounted** on the consent management route or the admin workspace and is destroyed when `AccessGate` stops rendering authorized content. **No offline/cache snapshots are promoted to verified data.** No persistence of personal information was added.
- Scroll-to-top occurs after the route commits, while browser Back/Forward can restore scroll natively.
- No full-document reload for ordinary internal `a[href]` module navigation. Modified click, external links, downloads, native same-page anchors and opt-out full reload links retain native browser behavior.
- Sign-in and sign-out still reload deliberately: they cross authentication/session boundaries. Manual AccessGate “Try again” also reloads as a recovery action.

## Installation

**Full source:** extract the `CLA/` folder from the CP45 source archive, then run locally:

```bash
npm ci
npm run dev
npm run build
npm run check:layout
node --test tests/cp45-seamless-navigation.test.cjs
```

**Patch:** unpack the CP45 patch ZIP **over the root of CP44**. The patch contains only modified/new source files and this changelog. Do not apply it to unrelated older checkpoints.

## Verification actually performed

- `tsc --noEmit -p tsconfig.json`: PASS, no diagnostics.
- `tsc -p tsconfig.api.json`: PASS, no diagnostics.
- `npm run check:layout`: PASS.
- 155 selected regression tests (`CLA_CP45_REGRESSION_TESTS.txt`): PASS (including auth, role/consent, profile live read policy, history, focused routes, chart-first and new navigation interactions).
- `npm run build`: **not completed** because the shared `node_modules` directory contains Windows native Rolldown bindings while the test environment is Linux; `@rolldown/binding-linux-x64-gnu` is missing. This is an environment/platform dependency issue, not a TS compilation error.
- **No live Firebase login, deployed browser measurement, or full runtime performance profiling** was performed. Real-world latency still depends on network, Firebase server confirmation and CPU-heavy module-specific panels.

## Manual acceptance checklist on your machine

1. Run `npm ci` on the **target operating system** to install correct native bindings. Start `npm run dev`.
2. Sign in and use DevTools > Network with filter `Doc`: navigate Seed → Lumen → Atlas → Orion → Pulse → Haven → Seed. After sign-in, ordinary in-app navigation should create **no new document requests**.
3. On a new session, open each module and observe the slim pending progress line rather than a full-screen `Đang tải...` fallback caused by a cold module chunk. Module-specific Firebase verified-loading states may still appear while data is unavailable.
4. Navigate Seed → Lumen → Seed. Check that Seed/Lumen no longer restart the `learning_profiles/{uid}` subscription on each module switch (React DevTools / Firebase network inspection).
5. Test browser Back/Forward, Ctrl/Cmd+click, same-page anchors, downloads, mobile touch. Confirm accessibility and scroll behavior.
6. Withdraw consent, log out, or trigger an account lock. Verify sensitive profile values disappear immediately and no profile provider remains mounted after authorization is revoked.

## Boundaries and next actions

A true **zero-wait** experience cannot be guaranteed while private data requires fresh, server-confirmed Firestore snapshots or while module-specific panels run expensive computations. Do not hide authorization/loading states by presenting cached data as verified. To diagnose any remaining delay, record Network/Performance traces for the specific route and distinguish JS chunk load, React render/commit, Firestore round trip and visualization processing before further optimization.

Source ZIP intentionally excludes `.env` private credentials, `node_modules` and local runtime/private research outputs.
