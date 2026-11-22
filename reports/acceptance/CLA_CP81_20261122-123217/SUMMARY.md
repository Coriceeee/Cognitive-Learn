# CLA CP81 - Acceptance run summary

Date: 2026-11-22 12:35:53 +07:00
Project: C:\Gạo\Cognitive-Learn
PASS: 133 | FAIL: 17 | BLOCKED: 2

This is automated technical evidence ONLY. It is not a website /100 or scientific validation /100 signoff.

## Technical checks

| Group | Task | Status | Exit | Log |
|---|---|---|---|---|
| ENV | node_version | PASS | 0 | 001_node_version.log |
| ENV | npm_version | PASS | 0 | 002_npm_version.log |
| ENV | python_version | PASS | 0 | 003_python_version.log |
| ENV | java_version | PASS | 0 | 004_java_version.log |
| ENV | git_status | PASS | 0 | 005_git_status.log |
| ENV | dependencies_precheck | PASS | 0 | 006_dependencies_precheck.log |
| ENV | dependencies_final | PASS | 0 | 007_dependencies_final.log |
| TEST | cp80_regression | PASS | 0 | 008_cp80_regression.log |
| BUILD | layout | FAIL | 1 | 009_layout.log |
| BUILD | api_typecheck | PASS | 0 | 010_api_typecheck.log |
| BUILD | production_build | PASS | 0 | 011_production_build.log |
| SECURITY | rules_static | PASS | 0 | 012_rules_static.log |
| SECURITY | rules_v5_static | PASS | 0 | 013_rules_v5_static.log |
| SECURITY | rules_gate_unit | PASS | 0 | 014_rules_gate_unit.log |
| SECURITY | rules_emulator_preflight | BLOCKED | 1 | 015_rules_emulator_preflight.log |
| TEST | npm_test_full | FAIL | 1 | 016_npm_test_full.log |
| UNIT | test:adaptive:study | PASS | 0 | 017_test_adaptive_study.log |
| UNIT | test:admin-recovery | PASS | 0 | 018_test_admin-recovery.log |
| UNIT | test:aspiration-draft | PASS | 0 | 019_test_aspiration-draft.log |
| UNIT | test:chart-first | PASS | 0 | 020_test_chart-first.log |
| UNIT | test:closed-loop | PASS | 0 | 021_test_closed-loop.log |
| UNIT | test:cognitive:validation | PASS | 0 | 022_test_cognitive_validation.log |
| UNIT | test:companion-push | PASS | 0 | 023_test_companion-push.log |
| UNIT | test:consent-server-cleanup | PASS | 0 | 024_test_consent-server-cleanup.log |
| UNIT | test:consent-share-revocation | PASS | 0 | 025_test_consent-share-revocation.log |
| UNIT | test:cp26:rebaseline | PASS | 0 | 026_test_cp26_rebaseline.log |
| UNIT | test:cp29:academic | PASS | 0 | 027_test_cp29_academic.log |
| UNIT | test:cp29:access | PASS | 0 | 028_test_cp29_access.log |
| UNIT | test:cp29:accounts | PASS | 0 | 029_test_cp29_accounts.log |
| UNIT | test:cp29:batch4 | PASS | 0 | 030_test_cp29_batch4.log |
| UNIT | test:cp29:routes | PASS | 0 | 031_test_cp29_routes.log |
| UNIT | test:cp30:batch4 | PASS | 0 | 032_test_cp30_batch4.log |
| UNIT | test:cp30:gpa | PASS | 0 | 033_test_cp30_gpa.log |
| UNIT | test:cp30:profile | PASS | 0 | 034_test_cp30_profile.log |
| UNIT | test:cp30:realtime | PASS | 0 | 035_test_cp30_realtime.log |
| UNIT | test:cp31:batch10 | PASS | 0 | 036_test_cp31_batch10.log |
| UNIT | test:cp31:batch11 | PASS | 0 | 037_test_cp31_batch11.log |
| UNIT | test:cp31:batch12 | PASS | 0 | 038_test_cp31_batch12.log |
| UNIT | test:cp31:batch13 | PASS | 0 | 039_test_cp31_batch13.log |
| UNIT | test:cp31:batch14 | PASS | 0 | 040_test_cp31_batch14.log |
| UNIT | test:cp31:batch15 | PASS | 0 | 041_test_cp31_batch15.log |
| UNIT | test:cp31:batch16 | PASS | 0 | 042_test_cp31_batch16.log |
| UNIT | test:cp31:batch17 | PASS | 0 | 043_test_cp31_batch17.log |
| UNIT | test:cp31:batch2:contract | PASS | 0 | 044_test_cp31_batch2_contract.log |
| UNIT | test:cp31:batch3 | PASS | 0 | 045_test_cp31_batch3.log |
| UNIT | test:cp31:batch4 | PASS | 0 | 046_test_cp31_batch4.log |
| UNIT | test:cp31:batch5 | PASS | 0 | 047_test_cp31_batch5.log |
| UNIT | test:cp31:batch6 | PASS | 0 | 048_test_cp31_batch6.log |
| UNIT | test:cp31:batch7 | PASS | 0 | 049_test_cp31_batch7.log |
| UNIT | test:cp31:batch8 | PASS | 0 | 050_test_cp31_batch8.log |
| UNIT | test:cp31:batch9 | PASS | 0 | 051_test_cp31_batch9.log |
| UNIT | test:cp31:nexus | PASS | 0 | 052_test_cp31_nexus.log |
| UNIT | test:cp32:cutoffs | PASS | 0 | 053_test_cp32_cutoffs.log |
| UNIT | test:cp32:decision | PASS | 0 | 054_test_cp32_decision.log |
| UNIT | test:cp32:discovery | PASS | 0 | 055_test_cp32_discovery.log |
| UNIT | test:cp32:national | PASS | 0 | 056_test_cp32_national.log |
| UNIT | test:cp32:personal | PASS | 0 | 057_test_cp32_personal.log |
| UNIT | test:cp32:public-search | PASS | 0 | 058_test_cp32_public-search.log |
| UNIT | test:cp33:external-ml | FAIL | 1 | 059_test_cp33_external-ml.log |
| UNIT | test:cp33:measurement | PASS | 0 | 060_test_cp33_measurement.log |
| UNIT | test:cp34:adaptive-analysis | PASS | 0 | 061_test_cp34_adaptive-analysis.log |
| UNIT | test:cp34:adaptive-decision | PASS | 0 | 062_test_cp34_adaptive-decision.log |
| UNIT | test:cp34:career-decision | PASS | 0 | 063_test_cp34_career-decision.log |
| UNIT | test:cp34:knowledge-xai | PASS | 0 | 064_test_cp34_knowledge-xai.log |
| UNIT | test:cp36:adaptive-lineage | PASS | 0 | 065_test_cp36_adaptive-lineage.log |
| UNIT | test:cp37-38:dynamic | PASS | 0 | 066_test_cp37-38_dynamic.log |
| UNIT | test:cp39:longitudinal | FAIL | 1 | 067_test_cp39_longitudinal.log |
| UNIT | test:cp39-41:bayes | PASS | 0 | 068_test_cp39-41_bayes.log |
| UNIT | test:cp40:allocation | PASS | 0 | 069_test_cp40_allocation.log |
| UNIT | test:cp40:student-only | FAIL | 1 | 070_test_cp40_student-only.log |
| UNIT | test:cp41:policy | PASS | 0 | 071_test_cp41_policy.log |
| UNIT | test:cp42:atlas | PASS | 0 | 072_test_cp42_atlas.log |
| UNIT | test:cp42:dthu-batch | PASS | 0 | 073_test_cp42_dthu-batch.log |
| UNIT | test:cp42:dthu-scheme | PASS | 0 | 074_test_cp42_dthu-scheme.log |
| UNIT | test:cp42:focused-workspaces | PASS | 0 | 075_test_cp42_focused-workspaces.log |
| UNIT | test:cp42:holistic-temporal | PASS | 0 | 076_test_cp42_holistic-temporal.log |
| UNIT | test:cp42:institution-discovery | PASS | 0 | 077_test_cp42_institution-discovery.log |
| UNIT | test:cp42:robust-decision | PASS | 0 | 078_test_cp42_robust-decision.log |
| UNIT | test:cp42:scheme-coverage | PASS | 0 | 079_test_cp42_scheme-coverage.log |
| UNIT | test:cp42:source-discovery | PASS | 0 | 080_test_cp42_source-discovery.log |
| UNIT | test:cp47:orion-autosave | PASS | 0 | 081_test_cp47_orion-autosave.log |
| UNIT | test:cp50:orion-race | PASS | 0 | 082_test_cp50_orion-race.log |
| UNIT | test:cp51:draft-queue | PASS | 0 | 083_test_cp51_draft-queue.log |
| UNIT | test:cp52:multidevice | PASS | 0 | 084_test_cp52_multidevice.log |
| UNIT | test:cp53:integrity | PASS | 0 | 085_test_cp53_integrity.log |
| UNIT | test:cp53:package | PASS | 0 | 086_test_cp53_package.log |
| UNIT | test:cp54:safety | PASS | 0 | 087_test_cp54_safety.log |
| UNIT | test:cp55:safety | PASS | 0 | 088_test_cp55_safety.log |
| UNIT | test:cp56:navigation | PASS | 0 | 089_test_cp56_navigation.log |
| UNIT | test:cp56:navigation:integration | PASS | 0 | 090_test_cp56_navigation_integration.log |
| UNIT | test:cp57:timestamp | PASS | 0 | 091_test_cp57_timestamp.log |
| UNIT | test:cp58:integration | PASS | 0 | 092_test_cp58_integration.log |
| UNIT | test:cp59:verified-drafts | PASS | 0 | 093_test_cp59_verified-drafts.log |
| UNIT | test:cp60:seed-listener | PASS | 0 | 094_test_cp60_seed-listener.log |
| UNIT | test:cp61:legacy-drafts | PASS | 0 | 095_test_cp61_legacy-drafts.log |
| UNIT | test:cp62:student-rail | PASS | 0 | 096_test_cp62_student-rail.log |
| UNIT | test:cp63:guided-workspaces | PASS | 0 | 097_test_cp63_guided-workspaces.log |
| UNIT | test:cp64:input-ux | PASS | 0 | 098_test_cp64_input-ux.log |
| UNIT | test:cp65:atlas-lumen-ux | PASS | 0 | 099_test_cp65_atlas-lumen-ux.log |
| UNIT | test:cp66:unified-states | PASS | 0 | 100_test_cp66_unified-states.log |
| UNIT | test:cp67:route-experience | PASS | 0 | 101_test_cp67_route-experience.log |
| UNIT | test:cp68:qa-gate | PASS | 0 | 102_test_cp68_qa-gate.log |
| UNIT | test:cp69:firebase-integration | PASS | 0 | 103_test_cp69_firebase-integration.log |
| UNIT | test:cp70:journey | PASS | 0 | 104_test_cp70_journey.log |
| UNIT | test:cp71:unified-nav | PASS | 0 | 105_test_cp71_unified-nav.log |
| UNIT | test:cp72:lumen-fallback | PASS | 0 | 106_test_cp72_lumen-fallback.log |
| UNIT | test:cp73:mvp | PASS | 0 | 107_test_cp73_mvp.log |
| UNIT | test:cp74:product-polish | PASS | 0 | 108_test_cp74_product-polish.log |
| UNIT | test:cp75:ux-audit | PASS | 0 | 109_test_cp75_ux-audit.log |
| UNIT | test:cp76:names | PASS | 0 | 110_test_cp76_names.log |
| UNIT | test:cp77:login-copy | PASS | 0 | 111_test_cp77_login-copy.log |
| UNIT | test:cp78:clarity | PASS | 0 | 112_test_cp78_clarity.log |
| UNIT | test:cp79:theme | PASS | 0 | 113_test_cp79_theme.log |
| UNIT | test:daily-companion | PASS | 0 | 114_test_daily-companion.log |
| UNIT | test:exam-calendar | PASS | 0 | 115_test_exam-calendar.log |
| UNIT | test:hf:benchmark | PASS | 0 | 116_test_hf_benchmark.log |
| UNIT | test:journey-reliability | PASS | 0 | 117_test_journey-reliability.log |
| UNIT | test:notifications | PASS | 0 | 118_test_notifications.log |
| UNIT | test:official-pathways | PASS | 0 | 119_test_official-pathways.log |
| UNIT | test:oulad | PASS | 0 | 120_test_oulad.log |
| UNIT | test:oulad:export | PASS | 0 | 121_test_oulad_export.log |
| UNIT | test:prediction-safety | PASS | 0 | 122_test_prediction-safety.log |
| UNIT | test:research:hf-uci | FAIL | 1 | 123_test_research_hf-uci.log |
| UNIT | test:rules:gate-unit | PASS | 0 | 124_test_rules_gate-unit.log |
| UNIT | test:rules:preflight | FAIL | 1 | 125_test_rules_preflight.log |
| UNIT | test:rules:static | PASS | 0 | 126_test_rules_static.log |
| UNIT | test:rules:v5:static | PASS | 0 | 127_test_rules_v5_static.log |
| UNIT | test:seed-atlas | PASS | 0 | 128_test_seed-atlas.log |
| UNIT | test:shadow | PASS | 0 | 129_test_shadow.log |
| UNIT | test:step06 | PASS | 0 | 130_test_step06.log |
| UNIT | test:student-consent | PASS | 0 | 131_test_student-consent.log |
| UNIT | test:subject-optimizer | PASS | 0 | 132_test_subject-optimizer.log |
| UNIT | test:visuals | PASS | 0 | 133_test_visuals.log |
| RESEARCH | research_oulad | PASS | 0 | 134_research_oulad.log |
| RESEARCH | research_cognitive | PASS | 0 | 135_research_cognitive.log |
| RESEARCH | research_adaptive | PASS | 0 | 136_research_adaptive.log |
| RESEARCH | research_general | FAIL | 1 | 137_research_general.log |
| RESEARCH | research_scope_py | PASS | 0 | 138_research_scope_py.log |
| RESEARCH | safe_package_py | PASS | 0 | 139_safe_package_py.log |
| RESEARCH | hf_benchmark_unit | PASS | 0 | 140_hf_benchmark_unit.log |
| RESEARCH | golden_path_generate | FAIL | 1 | 141_golden_path_generate.log |
| RESEARCH | golden_path_verify | FAIL | 1 | 142_golden_path_verify.log |
| RESEARCH | multi_cycle_generate | FAIL | 1 | 143_multi_cycle_generate.log |
| RESEARCH | multi_cycle_verify | FAIL | 1 | 144_multi_cycle_verify.log |
| RESEARCH | measurement_generate | FAIL | 1 | 145_measurement_generate.log |
| RESEARCH | measurement_verify | FAIL | 1 | 146_measurement_verify.log |
| RESEARCH | policy_verify | PASS | 0 | 147_policy_verify.log |
| DEMO | demo_gate | FAIL | 1 | 148_demo_gate.log |
| EMULATOR | firebase_cli | PASS | 0 | 149_firebase_cli.log |
| EMULATOR | firestore_security_emulator | FAIL | 1 | 150_firestore_security_emulator.log |
| BROWSER | browser_qa_preflight | FAIL | 2 | 151_browser_qa_preflight.log |
| BROWSER | browser_qa_full | BLOCKED | 2 | - |

## Known-source repairs

See fixes.json and backups/ for exact changes and SHA-256.

## Acceptance limitations

- Firebase Emulator test does not prove production Rules or permissions on live data.
- Real-browser E2E requires locally running QA emulators/server and synthetic QA accounts.
- SCI/MAS/CSL psychometric validity: NOT VERIFIED by these tests.
- Predictive generalization/calibration on real eligible THPT outcomes: NOT VERIFIED.
- CLA Static vs Adaptive real-world effect: NOT VERIFIED.
- National coverage and official admission source freshness: manual/real-source audit required.
- Contest prize probability: NOT ESTIMATED.
