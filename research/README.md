# CLA Research — structure and execution status

Nguồn code hiện hành: CP30 chat-readability source. Research assets are separate from the React/Vite app.

- `registry/`: source/model/license registers and data cards. A listed source is not automatically approved for every use.
- `protocol/`: research scope, validation protocol and candidate SAP. The SAP candidate is not frozen or approved.
- `data/synthetic_demo/`: synthetic fixtures for technical tests only; never use them to train/evaluate student outcomes.
- `data/external/`: intake instructions only. Raw datasets are not committed.
- `src/`: reproducible Python analysis and data-scope scripts.
- `tests/`: technical tests for gates and leakage-aware scripts.
- `benchmarks/`: 120-case LLM inventory, draft only; no gold review/model evaluation yet.
- `evidence/`: machine-readable validation results and technical evidence; not human-subject results.
- `logs/`: templates/readme for append-only decision, negative-result, AI-usage and contribution logs.

## Data scope gate

```bash
python research/src/audit_dataset.py --input research/data/synthetic_demo/scope_gate_smoke.csv --output research/evidence/DATA_SCOPE_GATE_SMOKE_RESULT.json
python -m unittest discover -s tests -p "test_research_scope.py" -v
```

Expected: `BLOCKED`, eligible=0 because every row is synthetic/demo. This is a successful privacy/validity gate, not a missing model result to work around.

## LLM benchmark inventory

```bash
python research/src/validate_benchmark.py
```

This validates 120 draft case IDs and module counts only. It does not evaluate a model.

## External Hugging Face baseline (UCI Student Performance)

The UCI Student Performance mirror is CC BY 4.0 and may be used for an external-domain methods baseline with attribution. It is not Vietnamese CLA outcome evidence. Download files manually using the instructions in `data/external/README.md`, pin the full HF commit SHA, record SHA-256 and review the license before running.

```bash
python research/src/baseline_uci_student_performance.py \
  --input research/data/external/uci_student_performance/student-mat.csv \
  --subject math \
  --source-revision FULL_HF_COMMIT_SHA \
  --source-verified \
  --output research/evidence/uci_math_external_baseline.json
```

Run `student-mat.csv` and `student-por.csv` separately. The script separates context/behavior-only, +G1, and +G1+G2 information cutoffs; it does not mix subjects. Its 100-row technical floor is not a power calculation. The output must be labelled external-domain feasibility only.

```bash
python -m unittest discover -s research/tests -p "test_uci_baseline.py" -v
```

## Research boundaries

- Do not use CLA Firestore student records until lawful basis, consent/assent, pseudonymization, retention and access review are verified.
- Keep T (technical), S (synthetic), O (observational) and E (external) evidence separate.
- Do not report psychometric validity, ML performance, Adaptive effectiveness or causal effects without eligible outcomes and an approved design.

## Closed-loop synthetic technical replay

```bash
node --experimental-strip-types research/src/closed_loop_replay_demo.mjs
node --experimental-strip-types --test research/tests/closed_loop_replay_demo.test.mjs
```

This runs the current Orion strategy engine through eight traceable demo stages. Every input and the outcome are synthetic; the outcome is marked `SIMULATED_NOT_OBSERVED`, `dataScope=synthetic`, and `complete=false`. It is not persisted to Firestore and is not a learning-effectiveness result.
