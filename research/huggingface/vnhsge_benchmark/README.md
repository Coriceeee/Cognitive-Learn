# CLA — Hugging Face VNHSGE benchmark starter

This **standalone** research package does not overwrite, patch or deploy CLA source.

## Scope and evidence level

- Target source: https://huggingface.co/datasets/roshansk23/Vietnam_HighSchool_Exam_Dataset
- Original source: https://github.com/Xdao85/VNHSGE
- Intended use: offline assessment of Vietnamese school-exam MCQ answering by an LLM, **not** student performance prediction or Adaptive-vs-Static intervention effect.
- HF dataset mirror specifies `license: cc` without a sufficiently precise license identifier. Verify upstream rights/derivative distribution and document authorization **before publishing/re-distributing**.
- Download is not possible in this authoring environment; `fetch` is designed to execute on a network-enabled machine. No real dataset or model scores are included in this ZIP.
- Do not upload sensitive individual records, student PII or answer keys into an LLM prompt.

## Quick start (PowerShell; Python 3.10+)

```powershell
cd research/huggingface/vnhsge_benchmark
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python cla_hf_benchmark.py fetch --out work --revision main
python cla_hf_benchmark.py audit --input work/source.jsonl --out work/audit
python cla_hf_benchmark.py prepare --input work/source.jsonl --out work/benchmark --seed 20261115
python cla_hf_benchmark.py evaluate --gold work/benchmark/benchmark_gold.csv --predictions work/model_predictions.csv --out work/results
```

`fetch` records the actual resolved repository revision and a SHA-256 checksum in `work/fetch_manifest.json`; `main` is merely a request, not a reproducible frozen reference. For a reproducible run, reuse the resolved commit SHA in a later fetch. Record original license review separately; `fetch` never automatically approves a dataset for final research.

To produce model predictions, give your model only `benchmark_prompts.csv` (`item_id`, `prompt`). Make a CSV containing `item_id,prediction` where prediction is one of `1`, `2`, `3`, `4` or `A`, `B`, `C`, `D`. The reference answers are isolated in `benchmark_gold.csv`, not included in the prompts file. This script **does not** call an LLM or present model accuracy unless you supply actual predictions.

## Files and artifacts

- `fetch`: pulls HF dataset and saves `source.jsonl`, provenance/hash metadata.
- `audit`: counts missing and invalid rows, exact question+options duplicates, conflicting answer keys, categories and audit JSON.
- `prepare`: filters schema-valid items, de-duplicates by normalized question+options, quarantines conflicting answer keys, assigns deterministic grouped train/val/test by `file_name` when available, and emits prompt/gold CSV for the **test split only**.
- `evaluate`: matches predictions against test gold; reports accuracy, answer coverage, abstention and per-category metrics (descriptive; no significance claim).

### Research caution

- Test split by source `file_name` reduces shared exam-file leakage, but **does not guarantee** semantic deduplication or independence of tests. Manually inspect near-duplicates and cross-source overlap before publishing.
- LLMs may have seen these public exam questions during pretraining; a held-out split of dataset files is not proof of out-of-distribution generalization for pre-trained LLMs.
- This dataset has no learner ID, intervention, T0/T1 outcome or behavior logs. Therefore, don't use it to train or validate SCI/MAS/CSL, learner progression or adaptive intervention efficacy.
- Dataset quality, original item correctness and license review are research gates, not automatically assured by the code.

## Run smoke tests without downloading data

```bash
python -m unittest discover -s tests -v
python cla_hf_benchmark.py audit --input sample/fixture_synthetic.jsonl --out sample/audit
```

The fixture is explicitly **synthetic test data**, not research evidence.
