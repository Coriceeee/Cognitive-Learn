#!/usr/bin/env python3
"""CP28: evidence candidate crosswalk, not a PASS counter.

Usage: python tools/build_cp28_backlog.py --input docs/CP27_164_CROSSWALK_5_TAI_LIEU.csv
No network, secrets, user data or automatic PASS updates.
"""
from __future__ import annotations
import argparse
import csv
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Selected files are *candidate sources*, not proof that each full acceptance gate passed.
SOURCES = {
 'A1':'docs/CP31_GIT_HISTORY_AUDIT_20261109.json',
 'A4':'src/App.tsx;tests/admin-deeplink.test.cjs;tests/cp35-p0-p1-contract.test.cjs',
 'A6':'vite.config.ts;src/styles.css',
 'B1':'src/page/auth/LoginPage.tsx;src/lib/accountVerification.ts;tests/step07-admin-auth-recovery.test.cjs',
 'B2':'src/components/common/AccessGate.tsx;firestore.rules.CANDIDATE_CP21;tests/step07-admin-auth-recovery.test.cjs',
 'B3':'firestore.rules.CANDIDATE_CP21;tests/firestore.rules.cp21.test.mjs;src/lib/accountVerification.ts',
 'B4':'src/page/nexus/AdminDiagnosticsPage.tsx;firestore.rules.CANDIDATE_CP21;tests/firestore.rules.cp21.test.mjs',
 'B5':'src/components/common/SharedReportPanel.tsx;firestore.rules.CANDIDATE_CP21;tests/firestore.rules.cp21.test.mjs',
 'C1':'firestore.rules.CANDIDATE_CP21;src/lib/firebase.ts',
 'C4':'firestore.rules.CANDIDATE_CP21;tests/firestore.rules.cp21.test.mjs;tests/academic.test.cjs',
 'C5':'src/page/seed/hooks/useStudentTranscript.ts;src/page/seed/hooks/useStudentProfile.ts',
 'C6':'tests/cognitive-observation.test.cjs;src/lib/pipelineEvidence.ts;tests/academic.test.cjs',
 'C7':'src/page/seed/hooks/useStudentTranscript.ts;src/page/seed/hooks/useStudentProfile.ts',
 'C8':'docs/CLA_STUDENT_DATA_CONSENT_V1.md;src/page/seed/StudentConsentPage.tsx',
 'C9':'firebase.json;firebase.emulator.cp21.json;tests/firestore-security-gate.test.cjs',
 'D1':'src/page/seed/StudentProfilePage.tsx;src/page/seed/hooks/useStudentProfile.ts',
 'D2':'src/page/seed/services/academicCurriculum.ts;tests/academic.test.cjs',
 'D3':'firestore.rules.CANDIDATE_CP21;tests/firestore.rules.cp21.test.mjs;src/page/seed/StudentProfilePage.tsx',
 'D4':'src/page/seed/services/profileInputValidation.ts;tests/academic.test.cjs',
 'D5':'src/page/seed/StudentProfilePage.tsx;src/page/haven/HavenPage.tsx',
 'D6':'src/page/seed/services/transcriptData.ts;tests/academic.test.cjs',
 'D7':'src/page/seed/StudentTranscriptPage.tsx;src/page/seed/hooks/useStudentTranscript.ts',
 'D8':'src/page/seed/StudentProfilePage.tsx;src/page/seed/StudentTranscriptPage.tsx',
 'E1':'src/page/nexus/AdminPage.tsx;src/data/adminConsoleDirectory.ts;tests/admin-deeplink.test.cjs',
 'E2':'src/page/seed/StudentProfilePage.tsx;src/engines/cognitive/cognitiveEngine.ts;tests/cognitive-observation.test.cjs',
 'E4':'src/page/atlas/AtlasPage.tsx;src/lib/atlasKnowledgeBase.ts;src/data/officialAdmissionSources.ts',
 'E7':'src/page/haven/HavenScholarshipExplorer.tsx;src/data/officialScholarships.ts;tests/cp36-source-registry.test.mjs',
 'F1':'src/components/common/StudentLinkManager.tsx;tests/firestore.rules.cp21.test.mjs;src/lib/studentShareRevocation.ts',
 'F2':'src/components/common/SharedReportPanel.tsx;tests/firestore.rules.cp21.test.mjs;tests/step20-consent-share-revocation.test.mjs',
 'F3':'src/page/nexus/AdminDiagnosticsPage.tsx;src/page/nexus/AdminPage.tsx;src/data/adminConsoleDirectory.ts',
 'F4':'src/components/common/StudentLinkManager.tsx;src/components/common/SharedReportPanel.tsx',
 'G1':'api/health.ts;api/gemini-lumen.ts;api/gemini-admission-reader.ts',
 'G2':'api/gemini-lumen.ts;src/lib/pipelineEvidenceRecord.ts;src/lib/advisorChatPolicy.ts',
 'G4':'api/gemini-chat.ts;src/lib/advisorChatPolicy.ts;tests/admissions-and-chat.test.mjs',
 'I5':'src/styles.css;tests/ux-v7.test.cjs;tests/cp30-chat-readability.test.cjs',
 'J1':'README.md;docs/CP31_EXECUTION_NOTE_20261109.md;CP37_OPERATIONAL_AUDIT_20261111.md',
 'J2':'CP37_RELEASE_NOTES_20261111.md;docs/CP31_GIT_HISTORY_AUDIT_20261109.json',
 'K1':'src/page/nexus/AdminDiagnosticsPage.tsx;src/data/adminConsoleDirectory.ts;tests/admin-deeplink.test.cjs',
 'K2':'src/page/nexus/AdminDiagnosticsPage.tsx;tests/scientific-visuals.test.cjs',
 'K3':'src/components/common/SharedReportPanel.tsx;tests/student-role-isolation.test.cjs',
 'K4':'src/components/common/SharedReportPanel.tsx;tests/student-role-isolation.test.cjs',
 'K5':'src/page/nexus/AdminDiagnosticsPage.tsx;tests/academic.test.cjs',
 'K6':'src/page/nexus/AdminDiagnosticsPage.tsx;tests/firestore.rules.cp21.test.mjs',
 'K7':'src/data/adminConsoleDirectory.ts;tests/admin-deeplink.test.cjs',
 'K11':'src/page/atlas/AtlasPage.tsx;src/data/officialAdmissionSources.ts',
 'K14':'src/page/haven/HavenPage.tsx;src/page/haven/HavenScholarshipExplorer.tsx',
 'K15':'src/page/nexus/AdminPage.tsx;src/page/nexus/AdminDiagnosticsPage.tsx',
 'K16':'src/data/adminConsoleDirectory.ts;tests/admin-deeplink.test.cjs',
 'K17':'src/components/common/AccessGate.tsx;tests/firestore.rules.cp21.test.mjs;tests/step07-admin-auth-recovery.test.cjs',
 'K18':'src/page/nexus/AdminDiagnosticsPage.tsx;src/data/adminConsoleDirectory.ts',
 'K19':'src/page/nexus/AdminPage.tsx;src/styles.css;tests/ux-v7.test.cjs',
 'R1.1':'research/protocol/RESEARCH_SCOPE_DAY1.md;docs/CP31_REPORT_READY_SECTIONS_20261109.md',
 'R1.2':'research/registry/hypotheses_registry_candidate.csv;research/protocol/SAP_CANDIDATE_v1_20261109.md',
 'R1.3':'research/protocol/SAP_CANDIDATE_v1_20261109.md',
 'R1.4':'research/registry/source_register.csv;docs/CP31_REPORT_READY_SECTIONS_20261109.md',
 'R1.5':'research/registry/source_register.csv;docs/CP31_REPORT_READY_SECTIONS_20261109.md',
 'R1.6':'research/evidence/CLAIM_EVIDENCE_CP31.md;research/protocol/RESEARCH_SCOPE_DAY1.md',
 'R2.2':'docs/CLA_STUDENT_DATA_CONSENT_V1.md;src/lib/studentConsentPolicy.ts',
 'R2.4':'research/registry/privacy_threat_model_CP31.md;src/lib/studentShareRevocation.ts',
 'R2.5':'research/registry/privacy_threat_model_CP31.md;tests/firestore-security-gate.test.cjs',
 'R2.6':'docs/CLA_PREDICTION_RULE_SEMANTICS_V2_1.md;src/page/seed/StudentConsentPage.tsx',
 'R3.1':'research/evidence/CLAIM_EVIDENCE_CP31.md;research/oulad/scientific_audit.py',
 'R3.3':'src/engines/history/measurementEventEngine.ts;src/lib/closedLoopJourney.ts',
 'R3.6':'research/protocol/SAP_CANDIDATE_v1_20261109.md;research/registry/hypotheses_registry_candidate.csv',
 'R3.8':'research/src/audit_dataset.py;research/cognitive_validation/validate.py',
 'R4.4':'research/cognitive_validation/README.md;research/protocol/SAP_CANDIDATE_v1_20261109.md',
 'R4.7':'research/cognitive_validation/validate.py;research/registry/hypotheses_registry_candidate.csv',
 'R5.5':'research/oulad/pipeline.py;research/registry/model_register.csv',
 'R6.2':'src/lib/orionStrategyEngine.ts;research/registry/model_card_orion_rule_engine.md',
 'R6.4':'research/registry/hypotheses_registry_candidate.csv;research/adaptive_study/README.md',
 'R6.5':'src/lib/closedLoopJourney.ts;research/src/closed_loop_replay_demo.mjs',
 'R6.6':'src/page/orion/OrionPage.tsx;tests/step11-prediction-semantics.test.cjs',
 'R8.1':'research/benchmarks/cla_llm_120_cases_DRAFT.jsonl;research/src/validate_benchmark.py',
 'R8.2':'research/src/validate_benchmark.py;research/benchmarks/cla_llm_120_cases_DRAFT.jsonl',
 'R8.3':'research/benchmarks/cla_llm_120_cases_DRAFT.jsonl;research/src/validate_benchmark.py',
 'R8.4':'research/registry/privacy_threat_model_CP31.md;src/lib/advisorChatPolicy.ts',
 'R8.5':'research/benchmarks/cla_llm_120_cases_DRAFT.jsonl;research/registry/model_register.csv',
 'R9.1':'research/protocol/SAP_CANDIDATE_v1_20261109.md',
 'R9.2':'research/README.md;research/models/README.md;research/results/README.md',
 'R9.4':'research/logs/ai_usage_log.csv;research/logs/contribution_log.csv;research/logs/negative_result_log.csv',
 'R10.1':'docs/CP31_REPORT_READY_SECTIONS_20261109.md',
 'R10.2':'docs/CP31_REPORT_READY_SECTIONS_20261109.md',
 'R10.3':'docs/CP31_REPORT_READY_SECTIONS_20261109.md;research/protocol/SAP_CANDIDATE_v1_20261109.md',
 'R10.4':'research/figures/README.md;docs/CP32_SCIENTIFIC_VISUALS_RELEASE_20261110.md',
 'R10.5':'docs/CP31_REPORT_READY_SECTIONS_20261109.md;docs/CP31_EXECUTION_NOTE_20261109.md',
 'C25-01':'src/components/common/FloatingAdvisorChat.tsx;tests/admissions-and-chat.test.mjs',
 'C25-02':'api/gemini-chat.ts;tests/admissions-and-chat.test.mjs',
 'C25-03':'api/gemini-chat.ts;src/lib/advisorChatPolicy.ts',
 'C25-06':'src/data/officialAdmissionSources.ts;src/page/atlas/AtlasPage.tsx',
 'C25-07':'src/data/officialAdmissionSources.ts;src/lib/atlasAdmissionEvidence.ts',
 'C25-08':'src/data/officialAdmissionSources.ts;src/lib/examMethodRules.ts',
 'C25-09':'src/page/atlas/components/AtlasOfficialSourceRegistry.tsx;src/data/officialAdmissionSources.ts',
 'C25-10':'src/lib/admissionEngine.ts;src/page/atlas/AtlasPage.tsx',
 'C25-12':'src/page/study-abroad/StudyAbroadPage.tsx;src/data/internationalPathways.ts',
 'C25-13':'src/data/internationalPathways.ts;src/page/study-abroad/StudyAbroadPage.tsx',
 'C25-14':'src/data/officialScholarships.ts;src/page/haven/HavenScholarshipExplorer.tsx',
 'C25-15':'src/page/study-abroad/StudyAbroadPage.tsx;src/lib/havenSupportEngine.ts',
 'C25-16':'src/page/study-abroad/StudyAbroadPage.tsx;src/data/internationalPathways.ts',
 'C25-18':'docs/CP25_ADMISSIONS_CHAT_RELEASE_NOTES.md;tests/admissions-and-chat.test.mjs',
 'C26-01':'src/components/common/FloatingAdvisorChat.tsx;tests/chat-launcher-mascot.test.cjs',
}

NEXT = {
 'A1':'Gắn commit SHA của source đang chạy và diff với release; reviewer ký.',
 'A4':'Browser E2E: 13 routes, refresh/deep-link/mobile; không chỉ static path.',
 'B2':'Chạy role tests trên Emulator và browser cho active missing/false.',
 'C4':'Emulator: sửa môn từ learning_profiles và student_transcripts đều bị từ chối.',
 'D3':'Có quy trình sửa ngoại lệ có thẩm quyền + audit log, ngoài Rules lock.',
 'K15':'Triển khai user management có quyền và audit hoặc ghi rõ chưa có.',
 'C25-06':'Audit đủ 3 năm từng ngành/từng phương thức từ nguồn trường chính thức.',
 'C25-14':'Xác nhận deadline và điều kiện từng học bổng trên trang nguồn, có ngày truy cập.',
 'C25-18':'Release staging, chạy UI/backend E2E, ghi deployment SHA.',
 'F1':'Emulator 75 ca (thêm L14), test rút consent tại UI, rollback và cache.',
 'F2':'Emulator và UI: share → review → revoke; chứng minh danh sách sạch sau logout.',
 'R2.4':'Thiết kế server-side revocation/retention/backup + consent renewal; chưa đủ policy.',
 'R8.1':'120 template chỉ là DRAFT: freeze gold set + evidence hợp lệ trước scoring.',
 'R8.2':'Run model thực + trace từng factual field; không coi case template là kết quả.',
 'R7.1':'Cần cohort/comparator thật, ethics/consent phù hợp, outcome có thời gian.',
 'K17':'Browser E2E + deployment production Rules + reject demo cross-UID.',
}
DRAFT_RESEARCH = {
 'R1.1','R1.2','R1.3','R1.4','R1.5','R1.6','R2.2','R2.4','R2.5','R2.6',
 'R3.1','R3.3','R3.6','R3.8','R4.4','R4.7','R6.4','R6.5','R8.1',
 'R8.2','R8.3','R8.4','R8.5','R9.1','R9.2','R9.4','R10.1',
 'R10.2','R10.3','R10.4','R10.5',
}
BATCH1 = {'F1','F2','B5','R2.4'}
FIELDNAMES = [
 'ID','Nhóm','Ưu tiên','Mô tả gốc','Mức triển khai','Tình trạng nguồn',
 'Bằng chứng ứng viên (kiểm tra đường dẫn)','Vòng xử lý','Cổng nghiệm thu còn thiếu',
 'Trạng thái reviewer','Giới hạn chứng cứ',
]

def build(input_file: Path, output_dir: Path):
    with input_file.open(encoding='utf-8-sig', newline='') as f:
        original = list(csv.DictReader(f))
    if len(original) != 164 or len({r['ID'] for r in original}) != 164:
        raise ValueError('Baseline must have 164 unique tasks')
    missing = [r for r in original if not r['Đường dẫn bằng chứng'].strip()]
    if len(missing) != 100:
        raise ValueError(f'Expected 100 initially unlinked tasks, found {len(missing)}')
    if set(SOURCES) != {r['ID'] for r in missing}:
        raise ValueError('Candidate map must cover exact 100 tasks: missing=' + repr(set(r['ID'] for r in missing)-set(SOURCES)) + ' extras=' + repr(set(SOURCES)-{r['ID'] for r in missing}))
    for task_id, paths in SOURCES.items():
        for p in paths.split(';'):
            if not (ROOT / p).is_file():
                raise FileNotFoundError(f'Candidate path missing for {task_id}: {p}')
    out = []
    for r in missing:
        code = r['ID']
        source_type = 'BẢN NHÁP / CHỈ CÓ SOURCE' if code in DRAFT_RESEARCH else 'ĐÃ TÌM SOURCE, CHƯA NGHIỆM THU'
        out.append({
            'ID':code,'Nhóm':r['Nhóm'],'Ưu tiên':r['Ưu tiên'],
            'Mô tả gốc':r['Mô tả công việc gốc'],
            'Mức triển khai':'P0' if r['Ưu tiên']=='P0' or code in BATCH1 else 'P1',
            'Tình trạng nguồn':source_type,
            'Bằng chứng ứng viên (kiểm tra đường dẫn)':SOURCES[code],
            'Vòng xử lý':'CP28 / code + 9 local tests; emulator phải chạy lại' if code in BATCH1 else 'CHỜ NGHIỆM THU',
            'Cổng nghiệm thu còn thiếu':NEXT.get(code,r['Điều kiện nghiệm thu tiếp theo']),
            'Trạng thái reviewer':'PENDING',
            'Giới hạn chứng cứ':'Có file không đồng nghĩa đủ chức năng, đủ dữ liệu hoặc hoàn thành checklist.',
        })
    output_dir.mkdir(parents=True,exist_ok=True)
    out_file=output_dir/'CP28_BACKLOG_100_EVIDENCE_CANDIDATES.csv'
    with out_file.open('w',encoding='utf-8-sig',newline='') as f:
        wr=csv.DictWriter(f,fieldnames=FIELDNAMES);wr.writeheader();wr.writerows(out)
    # 164-row review ledger preserves original text and status, adds source candidates.
    all_rows=[]
    for r in original:
        code=r['ID']
        old=r['Đường dẫn bằng chứng'].strip()
        candidate=SOURCES.get(code,'')
        row={
            'ID':code,'Nhóm':r['Nhóm'],'Ưu tiên':r['Ưu tiên'],
            'Mô tả gốc':r['Mô tả công việc gốc'],
            'Liên kết CP27 cũ':old,'Ứng viên mới CP28':candidate,
            'Có file nguồn ứng viên':bool(old or candidate),
            'Kiểm thử đã có':'V5 emulator 74/74 PASS, SHARED TEST CP28 còn CHỜ' if code in ['C3','I3','F1','F2'] else '',
            'Reviewer':'PENDING',
            'Yêu cầu nghiệm thu':NEXT.get(code,r['Điều kiện nghiệm thu tiếp theo']),
        }
        all_rows.append(row)
    ledger_file=output_dir/'CP28_164_FULL_REVIEW_LEDGER.csv'
    with ledger_file.open('w',encoding='utf-8-sig',newline='') as f:
        wr=csv.DictWriter(f,fieldnames=list(all_rows[0]));wr.writeheader();wr.writerows(all_rows)
    counter=Counter(r['Nhóm'] for r in missing)
    summary={
        'baseline_task_count':164,
        'previous_candidate_linked':64,
        'previous_unlinked':100,
        'new_candidate_paths_verified_exist':len(out),
        'unlinked_without_candidate_source':0,
        'source_coverage_after_indexing':164,
        'newly_accepted_PASS_tasks':0,
        'reviewer_accepted_PASS_total':'NOT ASSESSED',
        'new_local_regression_tests':9,
        'new_emulator_cases_to_verify':1,
        'source_path_coverage_is_NOT_completion':True,
        'group_counts':dict(counter),
        'next_actions':['Emulator 75 tests on Windows','npm run verify:cp37','Browser E2E + 22 Nexus actions','Review each task against requirements'],
    }
    (output_dir/'CP28_SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return summary

if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--input',default='docs/CP27_164_CROSSWALK_5_TAI_LIEU.csv')
    ap.add_argument('--output',default='docs/CP28')
    a=ap.parse_args()
    print(json.dumps(build(ROOT/a.input, ROOT/a.output),ensure_ascii=False,indent=2))
