# Hugging Face Source Review — CP31 (2026-11-09)

## 1. UCI Student Performance mirror

**Hugging Face:** https://huggingface.co/datasets/DElmazi/Student_Performance  
**Official source:** https://archive.ics.uci.edu/dataset/320/student%2Bperformance  
**Citation:** Cortez, P. (2008). Student Performance. UCI Machine Learning Repository. DOI: 10.24432/C5TG7T.

Verified from the reviewed source pages:

- Hugging Face file page displays CC BY 4.0 metadata.
- Official UCI page states CC BY 4.0, 649 instances, 30 features, and two Portuguese schools.
- Features include school, demographic/social context, study time, absences and period grades G1/G2/G3.
- UCI explicitly warns G3 is strongly correlated with G1 and G2.

**Decision:** allow external method-baseline use with attribution after the exact HF revision and file SHA-256 are recorded. Analyze Mathematics and Portuguese separately. Report context/behavior-only, +G1 and +G1+G2 information cutoffs separately. Do not claim Vietnamese or CLA validity.

**Retrieval:** not downloaded in this environment. `container.download` failed; no real metrics are available. Full revision and checksum remain pending.

## 2. VNHSGE on Hugging Face

**Hugging Face:** https://huggingface.co/datasets/roshansk23/Vietnam_HighSchool_Exam_Dataset  
**Original repository:** https://github.com/Xdao85/VNHSGE  
**Paper:** arXiv:2305.12199.

Verified from the reviewed source pages:

- HF viewer/card reports 6,663 MCQ rows across eight subjects.
- HF card metadata reports generic `cc`; exact Creative Commons variant was not identified.
- Original repository describes the VNHSGE exam-question dataset and links to the associated paper.

**Decision:** hold training/redistribution until the exact license and source rights are resolved. If cleared, use as a Vietnamese exam QA/LLM benchmark, not student outcome data.
