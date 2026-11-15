# HF Windows Application Control compatibility fix — 15/11/2026

Windows Application Control may block pandas and pyarrow `.pyd` binaries even after pip succeeds. This workaround fetches dataset rows through the Hugging Face Dataset Viewer using Python standard library; it does not disable security or modify any CLA website code.

From the CLA project root (PowerShell):

```powershell
python .\research\huggingface\vnhsge_benchmark\fetch_stdlib.py --out work
Test-Path .\work\source.jsonl
python .\research\huggingface\vnhsge_benchmark\cla_hf_benchmark.py audit --input work/source.jsonl --out work/audit
python .\research\huggingface\vnhsge_benchmark\cla_hf_benchmark.py prepare --input work/source.jsonl --out work/benchmark
```

Important: no `pip install` required. If server reports no available split, an access restriction, or unexpected schema, stop and inspect. Don't claim dataset accuracy or license approval based on a completed download.

The Dataset Viewer is not a strict pinned snapshot; manifest records current repo SHA before/after, source checksum and explicit reproducibility limitation. Full freeze requires source revision pinning on an approved machine later. Do not redistribute source MCQs until upstream licensing is verified.
