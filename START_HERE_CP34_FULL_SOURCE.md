# CLA CP34 — FULL SOURCE PACKAGE

This ZIP is flattened intentionally: `package.json`, `package-lock.json`, `index.html`,
`vite.config.ts`, `src/`, `api/`, `tests/`, `research/`, and the CP34 verification
script are at the ZIP root. Do not copy `index.html` over `package.json`.

## Recommended use (safest)
1. Extract the ZIP into a NEW folder, e.g. `C:\Gạo\CLA-CP34`.
2. Open PowerShell in that folder.
3. Confirm the project manifest:
   ```powershell
   node -e "const p=require('./package.json'); console.log(p.name,p.scripts.dev,p.devDependencies.vite)"
   ```
   Expected: `cognitive-learn-ai vite --open 8.3.5` (Vite version may show with a range).
4. Install and run:
   ```powershell
   npm ci
   npm run dev
   ```
5. Verify:
   ```powershell
   npm test
   npm run test:rules:static
   npm run check:layout
   npm run build
   ```

## If merging into an existing project folder
Back up the existing folder first. Copy the ZIP contents into the project root and replace
matching files. Verify `package.json` starts with `{` and `index.html` starts with `<!doctype html>`.
Never rename `index.html` to `package.json`.

## Important
- `.env`, `node_modules`, `.git`, and build output are intentionally excluded.
- Configure local environment variables from your own approved values; do not share secrets.
- Static Firestore Rules tests do not replace Firebase Emulator tests.
- Do not mark production build, Browser E2E, Emulator, or staging PASS until actually run.
