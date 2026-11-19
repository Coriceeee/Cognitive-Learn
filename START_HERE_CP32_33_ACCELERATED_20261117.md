# CLA – CP32/33 accelerated integration, 17/11/2026

Base: CLA_FULL_SOURCE_CP31_BATCH17_BUILD_HOTFIX_20261116.zip plus the CP31 synthetic evidence repair. This is a candidate update, NOT the final CP36 release or a 100/100 sign-off. Preserve all 100 outstanding work items and the 164-item re-audit ledger. No production Firebase deploy, real student-data access or settings changes were performed.

## Nine workstreams – unchanged scope (100 items)

| Checkpoint | Count | Required focus / exit evidence |
|---|---:|---|
| CP28 | 4 | Privacy, withdrawal/consent, Teacher/Parent; real revoke/deny/read and server cleanup |
| CP29 | 11 | Auth, role, subject lock, cross-UID; Rules Emulator + browser negative tests |
| CP30 | 12 | Seed, transcript, Firestore, two-session realtime sync; real save/reload and conflict behavior |
| CP31 | 15 | Nexus and all 22 operations; full 72-case QA browser suite; source integrity and reviewer logs |
| CP32 | 17 | Domestic admission by school/program/year/method, international admission, certificates, scholarships, official URLs, chatbot/fallback; complete coverage still open |
| CP33 | 16 | Research design, eligible data, measurement proxies, SCI/MAS/CSL sensitivity, ML baselines and holdout; no synthetic empirical claims |
| CP34 | 12 | Orion closed loop, actual outcome vs simulation, Gemini and 120-case benchmark, groundedness/safety and actual multi-run evaluation |
| CP35 | 8 | Scientific report, reproducibility, limitations, evidence linking, defense package |
| CP36 | 5 | E2E, performance, accessibility, production smoke/release/rollback and sign-off |
| Total | 100 | Do not remove items or count a test as a completed task without matching evidence |

## Changes in this candidate

- Atlas: append 90 method-specific cutoff entries for 10 selected PTIT BVH programs from the school's 10/08/2026 disclosure; show 2024 THPT, 2025 common published cutoff, and 2026 method-specific values separately. No cross-scale conversion; historical arithmetic is not admission probability. Coverage remains a pilot subset, not nationwide/all PTIT programs. Source: https://tuyensinh.ptit.edu.vn/thong-bao-diem-chuan-trung-tuyen-vao-dai-hoc-he-chinh-quy-nam-2026/ .
- Hugging Face: pinned CC BY 4.0 UCI Student Performance mirror retrieval + size/schema/row-count/grade/duplicate/hash checks; raw files are gitignored. Separate two subjects and explicit feature cutoffs. Existing baseline augmented; external methods only. Read `research/huggingface/uci_student_performance/README.md` before downloading. No real dataset bytes retrieved in the packaging environment.
- Update the existing source fingerprint and regenerate synthetic golden-path, multicycle, measurement and offline demo artifacts. No replacement of real-data evidence. Earlier roadmap/checklists retained unmodified.

## Tested in packaging environment

| Command | Result |
|---|---|
| npm test | PASS – 923 node tests, includes 3 new Atlas tests |
| npm run test:rules:static | PASS – 15/15, static only |
| npm run check:layout | PASS – 22 required files, 19 legacy misplacements absent |
| npm run demo:final | PASS – 11/11 offline gates and synthetic HTML replay |
| npm run audit:cp31:evidence | Source fingerprint matches 302 files; live evidence NOT TESTED |
| python -m unittest discover -s research/tests -v | PASS – 8/8 Python tests |
| python research/src/validate_benchmark.py | PASS – 120 unique draft cases, 7 groups; actual LLM evaluation NOT RUN |
| npm ci / npm run build | BLOCKED – dependencies cannot be downloaded; final clean build has not been verified |
| npm run test:rules:emulator | BLOCKED – Firebase CLI unavailable; static preflight does not replace Emulator |
| Hugging Face CSV retrieval/evaluation | BLOCKED – DNS/network; no empirical metrics |
| 72-case Browser E2E / staging / production | NOT RUN – use authorized QA environment and reviewer |

## Windows – apply and verify

Extract into a NEW directory and compare before overlaying a local repo; do not overwrite uncommitted changes. Keep `.env.local` and QA access securely on your machine; never publish keys or copy production learner data. Do NOT run Firebase deploy from this guide.

In PowerShell from the new repo root (Node 22+ compatible with locked dependencies, Python, Firebase CLI/Java for Emulator):

```powershell
npm ci
npm test
npm run test:rules:static
npm run check:layout
npm run demo:final
npm run build
npm run test:rules:emulator
python -m pip install numpy pandas scikit-learn
npm run test:research:hf-uci
python research/src/validate_benchmark.py
```

After reviewing rights/terms for the actual HF source, run separately:

```powershell
python research/huggingface/uci_student_performance/fetch_eval.py --accept-cc-by-4.0 --evaluate
```

Browser E2E: check `START_HERE_CP31_BATCH6_20261115.md`, then use `python tools/cp31_browser_e2e.py --help`; run the 72 cases on authorized QA accounts and QA Firebase project, not production. Do not use a browser preflight or config-only run as E2E evidence. The 120 LLM prompts are still draft gold criteria and must be reviewed and scored on real model outputs; do not assign PASS from template validation. Full release remains conditional on the unchanged CP28–36 evidence gates, including outcomes for empirical claims.
