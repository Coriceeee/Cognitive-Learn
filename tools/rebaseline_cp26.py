#!/usr/bin/env python3
"""CP26: evidence-preserving rebaseline of canonical 164-task checklist.
No automated promotion to 'accepted' from unit/synthetic tests alone.
"""
import csv, json, collections, pathlib, datetime, hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=ROOT/'CLA_REBASELINE_164_NOTIFICATIONS_20261114.csv'
OUT=ROOT/'reports/progress/cp26'
# Task -> (artifact available in source, precise limitation, next acceptance gate)
E={
 'A2':('tests/firestore-security-gate.test.cjs','Security scan/key rotation not attested','Secret scan repo+history; rotate any disclosed tokens'),
 'A3':('package.json','No CP26 production build verification','npm ci && npm run build with logs'),
 'C3':('tests/firestore-security-gate.test.cjs','Gate unit test is not deployed emulator matrix','Run emulator test with Firebase credentials/roles'),
 'E3':('research/oulad/export_public_evidence.py; src/','Evidence panel not personalized verified prediction','Browser E2E with real public evidence and error states'),
 'E8':('tests/step12-closed-loop-journey.test.mjs','Synthetic replay does not prove live cross-module flow','Browser full journey with signed-in test accounts'),
 'G3':('research/oulad/pipeline.py','OULAD UK course prediction cannot become VN student probability','Inspect all Lumen probability labels in browser'),
 'H1':('research/adaptive_study/study.py; research/tests/closed_loop_replay_demo.test.mjs','Feasibility/synthetic, no observed CLA outcome','Record consented intervention/outcome or label demo'),
 'H2':('research/oulad/scientific_audit.py; research/adaptive_study/study.py','Audit schema exists; end-to-end UI record coverage not proven','Inspect complete evidence record in UI'),
 'H3':('research/adaptive_study/study.py','Captures proposed policy metadata; runtime accept/reject audit not proven','Implement and E2E test accept/reject and override'),
 'H4':('research/adaptive_study/study.py','Descriptive-only guard; website copy not fully audited','Browser inspect all causal language'),
 'I1':('research/adaptive_study/tests; research/oulad/tests; research/cognitive_validation/tests','38/38 Python tests, CI full test suite not proven','Run complete CI and archive logs'),
 'I2':('research/cognitive_validation/tests; research/oulad/tests','Validation/unit tests pass; all GPA & rules tests not rerun','Run complete academic and cognitive unit suite'),
 'I3':('tests/firestore-security-gate.test.cjs','No actual Firebase Emulator run','Emulator role x collection matrix PASS'),
 'I4':('tests/step12-closed-loop-journey.test.mjs','Unit/synthetic only; browser E2E missing','Playwright or browser E2E desktop/mobile'),
 'J3':('reports/progress/cp26/','Only CP26 source-reviewed status; human acceptance pending','Reviewer, timestamp, reproducible logs and sign-off'),
 'K8':('research/cognitive_validation/validate.py','Experimental proxies, not validated psychometrics','Independent measurements and psychometric assessment'),
 'K9':('research/cognitive_validation/validate.py','Terminology MAS inconsistent across versions; UI language not E2E verified','Freeze construct + audit rendered UI'),
 'K10':('research/oulad/pipeline.py; research/oulad/scientific_audit.py','External dataset only and local metrics not in packaged source','Run actual local OULAD scientific audit and attach outputs'),
 'R2.1':('research/oulad; research/huggingface/vnhsge_benchmark','Some verified open datasets; not complete inventory of CLA data','Finish dataset and license registry'),
 'R2.3':('research/adaptive_study/study.py; research/cognitive_validation/validate.py','Synthetic fixtures isolated; privacy governance incomplete','Privacy review and participant pseudonym mapping rules'),
 'R2.7':('research/oulad/pipeline.py; research/huggingface/vnhsge_benchmark/','UCI CC BY 4.0 declared; upstream VNHSGE permission uncertain','Verify original license and redistribution'),
 'R3.2':('research/adaptive_study/study.py; research/oulad/pipeline.py','Schemas for external datasets and study, not full CLA event dictionary','Freeze cross-module data dictionary'),
 'R3.4':('research/oulad/pipeline.py; research/oulad/scientific_audit.py','Checksum available, raw corrected immutability not universal','End-to-end lineage and immutable raw store'),
 'R3.5':('research/cognitive_validation/validate.py; research/oulad/scientific_audit.py','QA on specific datasets, not all product data','Add dataset-wide QC gates'),
 'R3.7':('research/adaptive_study/study.py','Schema feasibility; no real T0/T1/T2 participant flow','Prospective participant enrollment and attrition flow'),
 'R3.9':('research/adaptive_study/sample/fixture_SYNTHETIC.csv; research/cognitive_validation/sample/fixture_SYNTHETIC.csv','Synthetic data clearly labeled; check all dashboard copy','Verify no synthetic outcome in efficacy claims'),
 'R4.1':('research/cognitive_validation/validate.py','Master MAS meaning alignment conflicts with later stability wording','Freeze MAS conceptual definition and expert review'),
 'R4.2':('research/cognitive_validation/validate.py','Proxy formula and gates only; psychometric validation pending','Version freeze and data-driven calibration'),
 'R4.3':('research/cognitive_validation/tests','9/9 synthetic/technical tests; no external validity','Real repeated-measure testing'),
 'R4.5':('research/cognitive_validation/validate.py','Repeated synthetic examples, no real test-retest/ICC','Collect eligible longitudinal real measurements'),
 'R4.6':('research/cognitive_validation/validate.py','Label experimental proxy in research output; UI may differ','Audit UI labels and written claims'),
 'R5.1':('research/oulad/pipeline.py','OULAD pass vs fail target is external university data','Define separate CLA Vietnam high-school target'),
 'R5.2':('research/oulad/scientific_audit.py','Source code audit exists; real local audit not packaged','Run CP22 audit on 5445 test and save PASS'),
 'R5.3':('research/oulad/pipeline.py','Learner-level split; no independent temporal or foreign-domain holdout','Temporal/cross-course external validation'),
 'R5.4':('research/oulad/pipeline.py','Academic baseline on OULAD real; CLA score baseline pending','Last-score/mean comparison on VN data'),
 'R5.6':('research/oulad/pipeline.py; research/oulad/scientific_audit.py','Brier/AUC/calibration implemented; PR-AUC and full subgroups pending','Attach CI calibration and cluster-robust metrics'),
 'R5.7':('research/oulad/pipeline.py','Academic vs +behavior only; +SCI/MAS/CSL not validated','Controlled ablation for each proxy when eligible'),
 'R5.8':('research/oulad/scientific_audit.py','Reliability audit not OOD/abstention validation','OOD and abstention with external holdout'),
 'R5.9':('research/oulad/pipeline.py','Data manifest exists; deployed versioned model card incomplete','Model card + artifact + rollback verified'),
 'R7.1':('research/adaptive_study/study.py','Prospective study audit only; runtime interventions not demonstrated','Runtime observed outcome trace'),
 'R7.2':('research/adaptive_study/study.py','Policy/version input schema; no locked policy taxonomy','Freeze eligibility, treatment taxonomy and dose'),
 'R7.3':('research/adaptive_study/study.py','Static/Adaptive schema + descriptive comparator, no deployed trial','Pre-register treatment contrast and audit assignment'),
 'R7.4':('research/adaptive_study/study.py','Synthetic fixture; not historical observational outcome','Retrospective evaluation only if access justified'),
 'R7.5':('research/adaptive_study/study.py','No longitudinal intervention outcomes; causal gate blocks claims','SAP+ethics+comparable cohorts+outcomes'),
 'R7.6':('research/adaptive_study/study.py','Descriptive statistic only, no ITT/missingness model','Appropriate ITT/attrition analysis for real trial'),
 'R7.7':('research/adaptive_study/study.py','Has exposure/outcome schema; adherence/runtime acceptance incomplete','Log fidelity and acceptance at runtime'),
 'R7.8':('research/adaptive_study/study.py','Correct DESCRIPTIVE_NOT_CAUSAL result','Verify public claims against evidence matrix'),
 'R9.3':('research/oulad/scientific_audit.py; research/adaptive_study/study.py','Checksum and test scripts; no locked end-to-end reproducible build','Record git SHA, dependencies, seeds, real results'),
 'R9.5':('research/oulad/scientific_audit.py','Scientific audit includes confidence/calibration hooks; real report not bundled','Archive actual CP22 report and confirm thresholds'),
 'R9.6':('research/oulad/export_public_evidence.py; research/adaptive_study/study.py','Source-supported claims vs causal claims clearly separated in research tooling','Acceptance matrix signed by reviewer'),
 'R9.7':('research/oulad/; research/huggingface/','Source metadata in manifests; not all cards verified','Publish provenance and model cards'),
 'C25-19':('research/huggingface/vnhsge_benchmark/cla_hf_benchmark.py','6663 QA dataset and 6538 eligible prompts; 120-case Gemini evaluation not demonstrated','Run and score locked 120-case Gemini benchmark'),
 'C25-20':('research/oulad; research/cognitive_validation; research/adaptive_study','ML external evidence, synthetic psychometrics/adaptive feasibility; full item broad','Obtain real CLA longitudinal outcomes and psychometrics'),
}

def main():
 OUT.mkdir(parents=True,exist_ok=True)
 with SOURCE.open(encoding='utf-8-sig',newline='') as f: old=list(csv.DictReader(f))
 assert len(old)==164 and len({r['ID'] for r in old})==164
 # Check evidence references actually exist (directory allowed)
 bad=[]
 for ident,(paths,_,__) in E.items():
  for p in paths.split('; '):
   if not (ROOT/p).exists() and not p.startswith('reports/progress/cp26/'):
    bad.append((ident,p))
 if bad:raise RuntimeError('Missing evidence paths: '+repr(bad))
 result=[]
 for r in old:
  ident=r['ID']; s=E.get(ident)
  x={
  'ID':ident,'Nhóm':r['Nhóm'],'Ưu tiên':r['Ưu tiên'],
  'Mô tả công việc gốc':r['Mô tả mục gốc'],
  'Điểm kiểm kê 14-11 (%)':r['Điểm tạm kiểm kê nguồn 14-11 (%)'],
  'CP26 trạng thái nghiệm thu':'CHỜ NGHIỆM THU / CHƯA ĐỦ BẰNG CHỨNG',
  'Bằng chứng CP19-CP25':'Có dấu vết kỹ thuật, cần xác nhận' if s else 'Chưa có bằng chứng CP19-CP25 được ánh xạ',
  'Đường dẫn bằng chứng':s[0] if s else r['Bằng chứng trong source'],
  'Giới hạn/không suy diễn':s[1] if s else r['Giới hạn/chưa nghiệm thu'],
  'Điều kiện nghiệm thu tiếp theo':s[2] if s else 'Đối chiếu tiêu chí gốc; chạy kiểm thử E2E hoặc kiểm toán thủ công và ký xác nhận',
  'Đã loại khỏi backlog (0/1)':0,
  'Được nâng điểm tự động (0/1)':0,
  'Mức ưu tiên triển khai':('P0-NGHIỆM THU' if r['Ưu tiên']=='P0' else ('P1-ĐỐI CHIẾU' if s else 'P2-RÀ SOÁT')),
  }
  result.append(x)
 assert len(result)==164
 p=OUT/'CP26_REBASELINE_164_EVIDENCE.csv'
 with p.open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(result[0]));w.writeheader();w.writerows(result)
 group=collections.defaultdict(list)
 for x in result:group[x['Nhóm']].append(x)
 summary={
 'checkpoint':'CP26','scope':'164 canonical tasks','source_file':str(SOURCE.relative_to(ROOT)),
 'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
 'total':len(result),'evidence_linked':sum(r['ID'] in E for r in old),
 'accepted_by_cp26':0,'removed_from_backlog':0,
 'baseline_mean_pct':round(sum(float(x['Điểm kiểm kê 14-11 (%)']) for x in result)/164,2),
 'group_baseline':{k:{'count':len(v),'baseline_mean_pct':round(sum(float(x['Điểm kiểm kê 14-11 (%)']) for x in v)/len(v),2),'evidence_linked':sum(x['ID'] in E for x in v)} for k,v in group.items()},
 'test_evidence':'38/38 Python unit tests passed in container for CP25(12), CP24(9), OULAD(13), HF(4). Synthetic/technical tests, not research validation.',
 'guardrails':['No automatic percentage increases','No 164-task completion from synthetic tests','No causal claim for Adaptive','No psychometric validation claims','Full npm build / emulator / browser E2E not re-verified here'],
 }
 (OUT/'CP26_SUMMARY.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
 order=sorted(result,key=lambda r:(0 if r['Ưu tiên']=='P0' else 1,0 if r['ID'] in E else 1,r['ID']))
 with (OUT/'CP26_BACKLOG_PRIORITIZED.csv').open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(result[0]));w.writeheader();w.writerows(order)
 print(json.dumps(summary,indent=2,ensure_ascii=False))
if __name__=='__main__':main()
