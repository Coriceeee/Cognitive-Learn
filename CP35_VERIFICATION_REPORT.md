# CLA CP35 — Verification report

| Gate | Result | Evidence |
|---|---|---|
| `npm test` | PASS | 105 TAP subtests; 14 academic checks, 4 cognitive-observation checks and static contracts passed |
| `npm run test:rules:static` | PASS | 15/15 Firestore Rules static contracts |
| `npm run check:layout` | PASS | 22 required files present; 19 legacy misplacements absent |
| TS/TSX syntax transpile | PASS | 147 source files transpiled without syntax diagnostics |
| `npm ci` in authoring sandbox | BLOCKED | npm registry request timed out |
| `npm ci --offline` | BLOCKED | package cache does not contain `yargs-parser@21.1.1` |
| `tsc -b` | BLOCKED | React, Node and D3 type packages missing because install did not complete |
| `npm run build` | NOT RUN / NOT VERIFIED | Requires successful dependency install |
| Firebase Emulator | NOT RUN | Requires Firebase CLI/emulator environment and project configuration |
| Browser E2E | NOT RUN | Requires installed browser/runtime and local environment configuration |
| Staging/production | NOT RUN | Requires deployment credentials and target environment |

A PASS above applies only to the named gate. Do not infer build, emulator, browser or production readiness from the static test results.
