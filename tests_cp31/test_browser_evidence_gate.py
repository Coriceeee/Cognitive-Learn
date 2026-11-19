"""CP31 Batch 6 pure contract tests. These tests do NOT execute Playwright/browser auth."""
import importlib.util
import json
import tempfile
import unittest
from datetime import datetime, timezone, timedelta
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / 'tools'
spec = importlib.util.spec_from_file_location('cp31_browser_gate', TOOLS / 'cp31_browser_gate.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)
runner_spec = importlib.util.spec_from_file_location('cp31_browser_e2e', TOOLS / 'cp31_browser_e2e.py')
runner = importlib.util.module_from_spec(runner_spec)
runner_spec.loader.exec_module(runner)


def fake_full_report():
    groups = gate.load_groups()
    observations = [{'case': name, 'result': 'PASS'} for name in gate.case_names(groups)]
    return gate.make_report(groups, observations, run_id='a' * 32, started_at=gate.now_utc(),
                            project_id='demo-cla-cp31-qa')


class BrowserEvidenceTests(unittest.TestCase):
    def test_01_exact_72_inventory_and_unique_ids(self):
        names = gate.case_names(gate.load_groups())
        self.assertEqual(72, len(names))
        self.assertEqual(72, len(set(names)))
        self.assertEqual(7, sum('CLUSTER-' in name for name in names))
        self.assertEqual(22, sum('TASK-' in name for name in names))
        self.assertEqual(22, sum('DIAGNOSTIC-' in name for name in names))
        self.assertEqual(12, sum('E2E-OP-' in name for name in names))
        self.assertEqual(3, sum('DENY-' in name for name in names))

    def test_02_report_builder_only_accepts_fixed_cases_and_unique_case_names(self):
        groups = gate.load_groups()
        with self.assertRaisesRegex(ValueError, 'Unrecognized'):
            gate.make_report(groups, [{'case': 'FAKE PASS', 'result': 'PASS'}],
                             run_id='a'*32, started_at=gate.now_utc(), project_id='qa-project')
        case = gate.case_names(groups)[0]
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            gate.make_report(groups, [{'case':case,'result':'PASS'},{'case':case,'result':'PASS'}],
                             run_id='a'*32, started_at=gate.now_utc(), project_id='qa-project')

    def test_03_complete_mock_object_validates_contract_only(self):
        # A fully-populated synthetic report validates structure, NOT browser execution.
        report = fake_full_report()
        self.assertEqual([], gate.audit_report(report))

    def test_04_missing_one_case_denies_gate(self):
        report = fake_full_report()
        report['results'][-1]['result'] = 'NOT RUN'
        report['passed'], report['executed'], report['notRun'], report['overall'] = 71, 71, 1, 'FAIL'
        self.assertTrue(gate.audit_report(report))

    def test_05_stale_and_future_report_denied(self):
        report = fake_full_report()
        now = datetime.now(timezone.utc)
        old = (now - timedelta(days=8)).isoformat().replace('+00:00','Z')
        report['startedAtUtc'] = old
        report['completedAtUtc'] = old
        self.assertIn('E2E report stale', gate.audit_report(report, now=now))
        future = (now + timedelta(hours=5)).isoformat().replace('+00:00','Z')
        report['startedAtUtc'] = future
        report['completedAtUtc'] = future
        self.assertIn('Run timestamps invalid', gate.audit_report(report, now=now))

    def test_06_forged_manifest_or_runner_checksum_denied(self):
        report = fake_full_report()
        report['runnerSha256'] = '0'*64
        self.assertIn('Invalid runnerSha256', gate.audit_report(report))
        report['runnerSha256'] = gate.sha256(gate.RUNNER)
        report['manifestSha256'] = '0'*64
        self.assertIn('Invalid manifestSha256', gate.audit_report(report))

    def test_07_reordered_and_duplicate_case_denied(self):
        report = fake_full_report()
        report['results'][0], report['results'][1] = report['results'][1], report['results'][0]
        self.assertIn('Missing, duplicate, or reordered case IDs', gate.audit_report(report))
        report['results'][0] = report['results'][1]
        self.assertIn('Missing, duplicate, or reordered case IDs', gate.audit_report(report))

    def test_08_partial_and_aborted_never_pass(self):
        groups = gate.load_groups()
        report = gate.make_report(groups, [], run_id='b'*32, started_at=gate.now_utc(),
                                  project_id='qa-project', abort_reason='AuthenticationFailed')
        self.assertEqual('BLOCKED', report['overall'])
        self.assertEqual(72, report['notRun'])
        self.assertTrue(gate.audit_report(report))
        self.assertNotIn('PASS', {row['result'] for row in report['results']})

    def test_09_failure_report_never_contains_exception_message_or_credentials(self):
        groups = gate.load_groups()
        report = gate.make_report(groups, [{'case': gate.case_names(groups)[0], 'result':'FAIL',
                                           'errorType':'auth/SECRET token=abc@example.org'}],
                                  run_id='a'*32, started_at=gate.now_utc(), project_id='qa-project')
        serialized = json.dumps(report)
        self.assertNotIn('SECRET', serialized)
        self.assertNotIn('abc@example.org', serialized)
        self.assertIn('TestFailure', serialized)

    def test_10_atomic_write_replaces_stale_pass_report(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp)/'result.json'
            gate.atomic_json(target, fake_full_report())
            self.assertEqual('PASS', json.loads(target.read_text())['overall'])
            gate.atomic_json(target, {'schema':gate.SCHEMA, 'overall':'BLOCKED', 'passed':0})
            self.assertEqual('BLOCKED', json.loads(target.read_text())['overall'])
            self.assertEqual([], list(Path(tmp).glob('*.pending-*')))

    def test_11_local_qa_project_mismatch_and_missing_file_block(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            with patch.object(runner, 'ROOT', root):
                with self.assertRaisesRegex(ValueError, 'differs'):
                    runner.local_qa_project('http://127.0.0.1:5173', 'qa-proj')
                (root / '.env.local').write_text('VITE_FIREBASE_PROJECT_ID=prod-wrong\n', encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'differs'):
                    runner.local_qa_project('http://127.0.0.1:5173', 'qa-proj')
                (root / '.env.development.local').write_text('VITE_FIREBASE_PROJECT_ID=qa-proj\n', encoding='utf-8')
                runner.local_qa_project('http://127.0.0.1:5173', 'qa-proj')

    def test_12_mobile_uses_real_playwright_page_api(self):
        source = (TOOLS/'cp31_browser_e2e.py').read_text(encoding='utf-8')
        self.assertIn('page.set_viewport_size({"width": 390', source)
        self.assertNotIn('context.set_viewport_size', source)

    def test_13_invalid_manifest_path_is_fail_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            altered = json.loads(gate.MANIFEST.read_text(encoding='utf-8'))
            altered['groups'][0]['tasks'][0]['diagnostic'] = 'https://evil.example.invalid/delete'
            target = Path(tmp)/'manifest.json'
            target.write_text(json.dumps(altered), encoding='utf-8')
            with patch.object(gate, 'MANIFEST', target):
                with self.assertRaisesRegex(ValueError, 'Unsafe diagnostic'):
                    gate.load_groups()

    def test_14_contract_auditor_rejects_absent_report(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = gate.audit_report(None)
            self.assertIn('Missing or malformed E2E report', result)


if __name__ == '__main__':
    unittest.main()
