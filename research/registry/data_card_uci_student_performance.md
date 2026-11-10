# Data Card — UCI Student Performance (Hugging Face mirror)

- **HF dataset:** https://huggingface.co/datasets/DElmazi/Student_Performance
- **Original source:** UCI Machine Learning Repository, Student Performance, DOI `10.24432/C5TG7T`.
- **License:** CC BY 4.0 is shown by the Hugging Face dataset file page and the official UCI record. Attribution is required.
- **Files:** `student-mat.csv`, `student-por.csv`.
- **Population:** Secondary-school students from two schools in Portugal.
- **Size:** UCI reports 649 instances overall and 30 features.
- **Target:** `G3`, final-period grade on a 0–20 scale. `G1` and `G2` are earlier-period grades.
- **Potential use:** External method-feasibility baseline for regression and feature-cutoff/leakage demonstrations.
- **Not suitable for:** Estimating CLA effects, validating SCI/MAS/CSL, or claiming performance for Vietnamese students.
- **Leakage/interpretation warning:** UCI explicitly notes strong correlation between G3 and G1/G2. Run and report context/behavior-only, +G1, and +G1+G2 models separately, with the information cutoff made explicit.
- **Privacy note:** Public files contain demographic and family-context variables. The current baseline script excludes demographic and family variables from the predictor feature set; no raw data should be committed to the repository.
- **Download state:** NOT DOWNLOADED in this environment; DNS/network prevented retrieval. Revision and SHA-256 remain pending. Do not report model metrics until the file is downloaded and hashed.
