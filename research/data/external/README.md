# External datasets — Hugging Face intake

Do not commit raw student datasets, personal data, access tokens or `.env` files to this repository.

## Candidate A — UCI Student Performance (Hugging Face mirror)

- Hugging Face: https://huggingface.co/datasets/DElmazi/Student_Performance
- Files: `student-mat.csv`, `student-por.csv`
- HF card metadata: CC-BY-4.0; official UCI repository also states CC BY 4.0.
- Original source: UCI Student Performance, DOI `10.24432/C5TG7T`.
- Use: external-domain method baseline only. Run Math and Portuguese separately; do not merge them because the same students may occur in both subjects and no cross-file participant key is provided.
- Limitations: two Portuguese schools; small cohort; not a Vietnamese THPT cohort; no CLA intervention, SCI/MAS/CSL or longitudinal check-in evidence. Do not claim CLA effectiveness or Vietnamese generalization.
- Important leakage note: G3 is the final-period target and UCI warns it is strongly correlated with G1/G2. Report separate feature sets: context/behavior only, +G1, +G1+G2. State the information cutoff for each.

Download manually with Hugging Face CLI after verifying the current revision:

```bash
hf download DElmazi/Student_Performance student-mat.csv --repo-type dataset --local-dir research/data/external/uci_student_performance
hf download DElmazi/Student_Performance student-por.csv --repo-type dataset --local-dir research/data/external/uci_student_performance
```

After download, record the full dataset revision, SHA-256 of each file, retrieval date and source/license review in the experiment manifest. Do not run the baseline until the file hashes and schema have been checked.

## Candidate B — VNHSGE (Hugging Face)

- Hugging Face: https://huggingface.co/datasets/roshansk23/Vietnam_HighSchool_Exam_Dataset
- HF viewer reports 6,663 multiple-choice questions across eight subjects.
- The card currently reports only generic `cc` metadata; exact Creative Commons variant is unresolved. Keep in review-only status; do not redistribute or treat as approved for training until rights are clarified.
- Use case if cleared: Vietnamese exam-question answer-quality benchmark for LLMs, not student-performance prediction.
