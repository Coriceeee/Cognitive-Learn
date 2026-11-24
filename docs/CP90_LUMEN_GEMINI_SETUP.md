# CLA CP90 – LUMEN CSS + Gemini API localhost (22/11/2026)

## What was fixed

- LUMEN profile `targetMajor` and `targetUniversity` were rendered in an unstyled `div` below the button. They are now two labelled, wrapping tags below the action row. Responsive (desktop / mobile), no changes to formulas, auth, Firestore Rules or historical research.
- The original `npm run dev` runs **Vite frontend only**. Previously `/api/gemini-*` fell through to SPA HTML, so entering `GEMINI_API_KEY` did not make Gemini work locally.
- CP90 runs only three **existing** reviewed API handlers through a localhost-only Vite middleware. The private Gemini key stays in the Node process. All calls still require the existing Firebase ID token and active user role. No Firebase production deployment or security Rules changes.

## Local Gemini setup (live accounts; NEVER run tests with real student data)

1. Create a local **untracked** `.env.gemini.local` file in the project root (ignored by `.gitignore`). Put these **three real backend variables** inside, from your own approved Gemini/Firebase projects:

    GEMINI_API_KEY=<your private Gemini API key>
    FIREBASE_WEB_API_KEY=<Firebase Web app apiKey of the live project>
    FIREBASE_PROJECT_ID=<Firebase Project ID for the two existing accounts>
    GEMINI_MODEL=gemini-2.5-flash

    **Do not** prefix GEMINI_API_KEY with `VITE_`. **Never** send the key in chat, screenshots or commit it to Git. The API model must be available to your key/project; quotas may apply.

2. Run the frontend in the *working Firebase live mode* previously used for your two real accounts (example):

    npm run dev -- --mode live --host 127.0.0.1 --port 3000 --strictPort

   The `.env.live.local` should contain your existing **valid** `VITE_FIREBASE_*` values and `VITE_USE_FIREBASE_EMULATORS=false`. Do **not** overwrite the current working config. If you launch in demo emulator mode, Gemini returns 503 by design.

3. Open `http://127.0.0.1:3000/api/cla-gemini-status` and check `configured:true`. This endpoint never reveals keys. If false, read `missing` and repair the config. It does not call Google or guarantee quota.

4. After login, try LUMEN → Gemini assistant or floating chatbot. The endpoint checks Firebase token and active account before contacting Google. Do not use QA synthetic credentials on a live backend.

5. If the status endpoint shows configured:true but a Gemini request fails, open DevTools → Network → `gemini-lumen` or `gemini-chat`, inspect **HTTP status** and safe `message` only. Typical results: 401 expired/invalid Firebase session, 403 account/CORS/Rules, 429 quota, 502 upstream/network/model, 503 missing server config.

**Production**: CP90 only fixes localhost Vite API serving. Your Vercel deployment still requires `GEMINI_API_KEY`, `FIREBASE_WEB_API_KEY`, `FIREBASE_PROJECT_ID`, `GEMINI_MODEL`, and exact `CORS_ALLOWED_ORIGINS` when frontend and API origins differ. Firebase Hosting alone does not execute `/api/*.ts`. Do not deploy Security Rules or expose the Gemini key in public Vite variables.

## Safety / limitations

- `configured:true` confirms only server configuration and matching Firebase project. It is **not** proof that an actual Gemini key is active or calls succeed. Real external validation requires a permitted request using the existing authenticated session.
- The CP86 Firebase Emulator acceptance of rules was local; live Firestore access depends on the live deployed Rules.
- Keep the CP89 manifest historical; do not rehash older research claims. The current source is versioned as CP90.

## CP90 intermittent Firebase login diagnosis

If the login page displays "Không kết nối được Firebase Authentication", this is not a wrong-password diagnosis. Click **Kiểm tra kết nối Firebase (không gửi mật khẩu)** (only visible after this network error). It categorizes live-vs-emulator misrouting, browser offline, HTTP rejection, timeout and browser/network block. This read-only probe does not submit login data.

For a complete read-only check while the **live-mode** app is running on `127.0.0.1:3000`, run `CLA_CP90_CHAN_DOAN_DANG_NHAP_GEMINI.cmd`. If the Python helper says `AUTH_NETWORK_BLOCKED`, test connectivity in the actual Chrome profile and inspect F12 Network. Do not change Firestore Rules, account roles, secrets, Auth authorized domains, or API key restrictions without the specific diagnosis. Node/probe success does not prove email/password POST succeeded.

CP90's three Gemini browser clients force **same-origin localhost API** in Vite development, ignoring any stale `VITE_API_BASE_URL` pointing to a deployed frontend. This prevents sending existing Firebase session tokens to an accidental external URL. **Production** still requires an actual deployed API and valid `VITE_API_BASE_URL`; Firebase Hosting alone cannot run `.ts` handlers.

The current patch has no live Firebase account credentials and no Gemini API key. Passing local contracts is **not** a claim that Google services are reachable from the student's machine or that deployed Firebase/Gemini work.
