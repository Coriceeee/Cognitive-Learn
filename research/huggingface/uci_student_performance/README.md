# UCI Student Performance via Hugging Face — external methodological benchmark only

Checked 2026-11-17: HF [card](https://huggingface.co/datasets/DElmazi/Student_Performance) and [file listing](https://huggingface.co/datasets/DElmazi/Student_Performance/tree/main) display CC BY 4.0. UCI [original source](https://archive.ics.uci.edu/dataset/320/student+performance) describes two Portuguese secondary schools, two subject files, final grade G3, and correlation with prior grades. The HF history link resolves to immutable revision `85a4fba73197d748e4cfd445a5e9c2ed35ca4a21`. API and bytes were not reachable in this packaging environment; manifests and actual metrics must come from successful retrieval, not this document.

On Windows, from repo root, after reviewing source rights:

```powershell
python -m pip install numpy pandas scikit-learn
python research/huggingface/uci_student_performance/fetch_eval.py --accept-cc-by-4.0 --evaluate
```

The script refuses an unacknowledged license, validates expected separate file counts (395 math/649 Portuguese), checks grades and file digests, and stores raw and aggregate output in gitignored `research/data/raw_private/uci_hf/`. A local hash validates subsequent reuse, not independent publisher authentication. Do not upload student rows or commit raw data. No CLA deployment, Vietnamese prediction or causal claim follows from this external benchmark; no participant identifier or exact feature observation times are available, so row-level retrospective modeling is not a prospective validation. Cite Cortez, P. (2008). Student Performance. UCI Machine Learning Repository. DOI: 10.24432/C5TG7T. A network failure remains BLOCKED; never substitute synthetic rows.
