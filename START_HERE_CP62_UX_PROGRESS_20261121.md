# Cognitive Learn AI — CP62

**What changed:** Student home has a new connected action + data-source evidence rail (responsive, dark theme, no fake scores), replacing two dashboard tiles. All CP61 draft-listener protection is retained. The exam countdown remains on the home screen.

**Progress audit:** `reports/cp62/CP62_PROGRESS_REPORT_164.md`. Counts are from the CP48 164-item acceptance checklist; CP62 does not claim new integration gates complete.

**Local test gate:**
```bash
npm run test:cp62:student-rail
npm test
npm run test:rules:static
npm run check:layout
npm run demo:final
```

**Full deployment validation (requires project dependencies, separate Firebase QA):**
```bash
npm ci --no-audit --no-fund
npm run check:dependencies
npm run build
npm run test:rules:emulator
npm run qa:cp31:preflight
```

No secret `.env`, `node_modules`, or local/private research data included in the source release.
