# CLA CP85 LOCAL ACCEPTANCE

Source: 
C:\Gạo\Cognitive-Learn
PASS=
14
 FAIL=
1
 BLOCKED=
0
 NOT_RUN=
0

| Gate | Result | Exit |
|---|---|---|
|cp85_snapshot|PASS|0|
|layout|PASS|0|
|production_build|PASS|0|
|npm_test_full|FAIL|1|
|cp85_ops_tests|PASS|0|
|rules_static|PASS|0|
|rules_emulator|PASS|0|
|cp82_synthetic_generate|PASS|0|
|cp82_synthetic_verify|PASS|0|
|ml_environment|PASS|0|
|python_research|PASS|0|
|python_oulad|PASS|0|
|python_cognitive_validation|PASS|0|
|python_adaptive_study|PASS|0|
|cp85_snapshot_after_tests|PASS|0|

## Limits

- SOURCE integrity != verified deployment. Source-bound synthetic replay != research validation.
- Legacy CP31 hashes remain locked; do not relabel CP31 evidence as CP85.
- CP82 synthetic replay remains synthetic-only (NOT a new CP85 study).
- Security gate must PASS real Firestore authorization tests, not just static tests.
- Firebase/browser staging E2E, university coverage, ML validity and live Gemini are not certified here.
- NEVER deploy production on the basis of this script alone.
- Review failures before sending logs; remove secrets or student information.
