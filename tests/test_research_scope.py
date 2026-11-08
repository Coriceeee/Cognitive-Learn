#!/usr/bin/env python3
"""Technical research gate only; DOES NOT measure student outcomes."""
import csv
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
modspec = importlib.util.spec_from_file_location('audit_dataset', ROOT/'research/src/audit_dataset.py')
audit_mod = importlib.util.module_from_spec(modspec)
modspec.loader.exec_module(audit_mod)

class ResearchScopeTest(unittest.TestCase):
    def test_synthetic_must_be_excluded(self):
        result = audit_mod.audit(ROOT/'research/data/synthetic_demo/scope_gate_smoke.csv')
        self.assertEqual(result['status'], 'BLOCKED')
        self.assertEqual(result['eligible_n'], 0)
        self.assertGreater(result['counts'].get('excluded_demo_or_synthetic', 0), 0)

    def test_missing_columns_blocks_data(self):
        with tempfile.TemporaryDirectory() as tmp:
            source=Path(tmp)/'missing.csv'
            source.write_text('data_scope,participant_id\nresearch,p001\n', encoding='utf8')
            self.assertEqual(audit_mod.audit(source)['status'], 'BLOCKED')

    def test_without_permission_blocks_data(self):
        with tempfile.TemporaryDirectory() as tmp:
            source=Path(tmp)/'nopermission.csv'
            fields=sorted(audit_mod.REQUIRED)
            row={x:'' for x in fields}
            row.update(participant_id='random-anonymized',data_scope='research',research_allowed='false',t0_time='2025-01-01T00:00:00+00:00',t1_time='2025-06-01T00:00:00+00:00',gpa_t0='7',gpa_t1='8')
            with source.open('w',encoding='utf8',newline='') as f:
                writer=csv.DictWriter(f,fieldnames=fields); writer.writeheader();writer.writerow(row)
            result=audit_mod.audit(source)
            self.assertEqual(result['status'], 'BLOCKED')
            self.assertEqual(result['counts'].get('missing_permission'), 1)

    def test_benchmark_120_templates_not_a_measured_result(self):
        source=ROOT/'research/benchmarks/cla_llm_120_cases_DRAFT.jsonl'
        cases=[json.loads(s) for s in source.read_text(encoding='utf8').splitlines() if s.strip()]
        self.assertEqual(len(cases),120)
        self.assertEqual(len({r['case_id'] for r in cases}),120)
        self.assertEqual({r['module'] for r in cases},{'lumen','atlas','orion','pulse','haven','security','vietnamese_edge'})
        self.assertTrue(all(r['evaluation_status']=='NOT RUN' and r['gold_status']=='DRAFT_NOT_REVIEWED' for r in cases))

if __name__ == '__main__': unittest.main(verbosity=2)
