# CLA — Hugging Face research integration (15/11/2026)

This directory contains an **offline research tool**, NOT an automatic model deployment. No downloaded Hugging Face datasets are shipped.

- `vnhsge_benchmark/`: Vietnamese exam MCQ benchmark (candidate HF mirror `roshansk23/Vietnam_HighSchool_Exam_Dataset`).
- `vnhsge_benchmark/sample/`: **synthetic** fixtures for testing only; NOT real students or real results.
- Source review & license hold: `../registry/data_card_vnhsge.md`, `../registry/license_register.csv`, `../evidence/HF_SOURCE_REVIEW_CP31.md`.
- Benchmark predictions and evaluation metrics become research evidence ONLY when actual permitted data, frozen benchmark, real predictions, and full provenance are recorded.
- This dataset does NOT demonstrate adaptive CLA efficacy, prediction of student progress, or validation of SCI/MAS/CSL.

## Quick start (PowerShell from the root CLA project)

```powershell
py -m pip install -r research/huggingface/vnhsge_benchmark/requirements.txt
py -m unittest discover -s research/huggingface/vnhsge_benchmark/tests -v
py research/huggingface/vnhsge_benchmark/cla_hf_benchmark.py fetch --out research/huggingface/vnhsge_benchmark/work --revision main
py research/huggingface/vnhsge_benchmark/cla_hf_benchmark.py audit --input research/huggingface/vnhsge_benchmark/work/source.jsonl --out research/huggingface/vnhsge_benchmark/work/audit
py research/huggingface/vnhsge_benchmark/cla_hf_benchmark.py prepare --input research/huggingface/vnhsge_benchmark/work/source.jsonl --out research/huggingface/vnhsge_benchmark/work/benchmark --seed 20261115
```

**Research hold:** Verify original rights and explicit license before redistributing or publishing any source material. The fetch operation does not confer rights. Freeze resolved SHA and input hash for any final report. `work/` is intentionally ignored by Git.

**CLI behavior:** `fetch` requires Internet; no live download, training, Gemini inference, Firebase integration, or real accuracy is claimed in this source release.
