"""Unit checks for CP31 E2E gate configuration, NOT browser E2E results."""
import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'tools' / 'cp31_browser_e2e.py'
spec = importlib.util.spec_from_file_location('cp31_browser_e2e', SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BrowserGateConfigTest(unittest.TestCase):
    def test_exact_inventory(self):
        groups = module.load_manifest()
        self.assertEqual(7, len(groups))
        self.assertEqual(22, sum(len(group['tasks']) for group in groups))
        self.assertEqual(22, sum(task['diagnostic'] is not None for g in groups for task in g['tasks']))

    def test_only_loopback_http_without_explicit_staging(self):
        self.assertEqual('http://127.0.0.1:5173', module.checked_origin('http://127.0.0.1:5173'))
        self.assertEqual('http://localhost:4173', module.checked_origin('http://localhost:4173/'))
        for url in ('http://example.com', 'https://example.com', 'http://0.0.0.0:5173',
                    'http://192.168.1.9:5173', 'https://localhost:5173',
                    'http://localhost', 'http://localhost:80', 'http://localhost:99999',
                    'http://localhost:5173/admin', 'http://user:pass@localhost:5173',
                    'http://localhost:5173/?token=x', 'http://localhost:5173/#foo'):
            with self.subTest(url=url), self.assertRaises(ValueError):
                module.checked_origin(url)

    def test_staging_requires_exact_host_https(self):
        self.assertEqual('https://cla-staging.example.org', module.checked_origin(
            'https://cla-staging.example.org', 'cla-staging.example.org'))
        for url in ('https://cla-staging.example.org.evil.test',
                    'http://cla-staging.example.org',
                    'https://www.cla-staging.example.org'):
            with self.subTest(url=url), self.assertRaises(ValueError):
                module.checked_origin(url, 'cla-staging.example.org')

    def test_no_credentials_or_ack_no_execution(self):
        from unittest.mock import patch
        with patch.dict('os.environ', {}, clear=True), self.assertRaisesRegex(ValueError, 'ACK'):
            module.require_accounts()
        with patch.dict('os.environ', {'CLA_E2E_QA_ACK': 'I_USE_SYNTHETIC_QA_ACCOUNTS'}, clear=True), \
                self.assertRaisesRegex(ValueError, 'ADMIN'):
            module.require_accounts()


if __name__ == '__main__':
    unittest.main()
