# CP29 batch 1 — Start here

Base: CP28 batch 3. Update only `src/components/common/AccessGate.tsx`, `package.json`, the two new `tests/cp29-*` files and `docs/CP29/` report.

```powershell
npm run verify:cp29:static
npm run test:rules:emulator
npm run verify:cp37
```

The new 15 tests are local mocked/contract tests (10 live AccessGate behavior + 5 deep-link contracts). The existing 75-case Emulator suite and full build need to be rerun in your Windows project; browser E2E is still missing. Source package does NOT deploy Firebase production.
