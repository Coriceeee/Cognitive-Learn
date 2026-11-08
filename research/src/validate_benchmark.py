#!/usr/bin/env python3
"""Verify 120-case benchmark inventory only; does NOT run or score an LLM."""
from pathlib import Path
import json
from collections import Counter
ROOT=Path(__file__).resolve().parent.parent
source=ROOT/'benchmarks/cla_llm_120_cases_DRAFT.jsonl'
rows=[json.loads(line) for line in source.read_text(encoding='utf8').splitlines() if line.strip()]
expected={'lumen':20,'atlas':20,'orion':15,'pulse':15,'haven':15,'security':15,'vietnamese_edge':20}
counts=dict(Counter(r.get('module') for r in rows))
assert len(rows)==120, f'Expected 120 cases, got {len(rows)}'
assert counts==expected, (counts,expected)
assert len({r.get('case_id') for r in rows})==120, 'Duplicate case ID'
assert all(r.get('evaluation_status')=='NOT RUN' for r in rows), 'Do not silently change evaluation status'
assert all(r.get('gold_status')=='DRAFT_NOT_REVIEWED' for r in rows), 'Gold rubric not reviewed'
report={'status':'TEMPLATE_MANIFEST_PASS','cases_total':len(rows),'by_module':counts,'model_evaluation':'NOT RUN','gold_criteria_review':'NOT DONE','scientific_claim':'NOT EVALUABLE'}
out=ROOT/'evidence/benchmark_manifest_validation.json';out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('BENCHMARK TEMPLATE PASS: 120 IDs unique, 7 groups; model evaluation NOT RUN')
