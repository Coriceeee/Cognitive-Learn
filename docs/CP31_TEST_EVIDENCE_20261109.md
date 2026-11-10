# CP31 Test Evidence — 2026-11-09

| Check | Result | Evidence | Interpretation |
|---|---|---|---|
| `npm test` | PASS | 14 academic + 4 cognitive + 69 TAP = 87 test cases; 0 failures | Source/unit/contract suite only; not browser E2E |
| Admin route contract | PASS | 9 Admin-only links across 7 modules | Static contract, not authenticated browser session |
| Module hierarchy contract | PASS | Seven main modules and nested anchors | Static contract |
| Student experience contract | PASS | Six student modules and student-only children | Static contract |
| Firestore Rules static | PASS | 15/15 | Emulator and deployed Rules not tested |
| CLA layout contract | PASS | 22 required files; 19 legacy misplacements absent | File/layout structure only |
| Research scope tests | PASS | 4/4 | Synthetic/demo and missing-permission rows are blocked |
| UCI baseline script tests | PASS | 4/4 on synthetic fixtures | Validates guards and feature cutoffs; no external dataset metrics |
| Dataset scope gate | BLOCKED by design | 40 synthetic rows excluded; eligible n=0 | Correct exclusion; no approved learner data |
| LLM benchmark manifest | PASS / NOT RUN | 120 unique draft cases across 7 groups | Gold review and model evaluation not performed |
| Closed-loop replay | PASS (synthetic) | 8 stages; 4 replay tests | Outcome is generated, not observed; not live UI/Firestore |
| Production build | BLOCKED | Missing `react`, `firebase/*` and type packages; no local `node_modules` | Install dependencies and build in connected CI |
| Browser E2E / Emulator / staging | NOT TESTED | No runtime evidence | Remains P0 |

## Reproduction commands

```bash
npm test
npm run test:rules:static
npm run check:layout
python -m unittest discover -s tests -p 'test_research_scope.py' -v
python -m unittest discover -s research/tests -p 'test_uci_baseline.py' -v
python research/src/audit_dataset.py --input research/data/synthetic_demo/scope_gate_smoke.csv --output research/evidence/DATA_SCOPE_GATE_SMOKE_RESULT.json
python research/src/validate_benchmark.py
node --experimental-strip-types research/src/closed_loop_replay_demo.mjs
node --experimental-strip-types --test research/tests/closed_loop_replay_demo.test.mjs
```

The production build command was attempted with `npm run build`; it cannot be validated until the project dependencies are installed in a network-enabled CI environment.
