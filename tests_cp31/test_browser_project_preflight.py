"""CP31 Batch 7: pre-auth served-project binding tests; never log credentials."""
import importlib.util
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from unittest.mock import patch
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'tools' / 'cp31_browser_e2e.py'
spec = importlib.util.spec_from_file_location('cp31_browser_e2e', SCRIPT)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class _Server:
    def __init__(self, body: bytes, *, status=200, ctype='text/html'):
        self.body, self.status, self.ctype = body, status, ctype
        self.server = None
        self.thread = None

    def __enter__(self):
        body, status, ctype = self.body, self.status, self.ctype
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(status)
                self.send_header('Content-Type', ctype)
                if status == 302:
                    self.send_header('Location', 'https://example.org/')
                self.end_headers()
                self.wfile.write(body)
            def log_message(self, *args):
                pass
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.thread = Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        return f'http://127.0.0.1:{self.server.server_port}'

    def __exit__(self, *_):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)


def html(project: str) -> bytes:
    return f'<html><head><meta name="cla-firebase-project-id" content="{project}"></head><body>QA</body></html>'.encode()


class QaProjectPreflight(unittest.TestCase):
    def test_b7_01_public_marker_matches_expected_project_no_auth(self):
        with _Server(html('qa-project-001')) as origin:
            runner.assert_qa_origin_project(origin, 'qa-project-001')

    def test_b7_02_denies_wrong_project_before_credentials(self):
        with _Server(html('prod-project-111')) as origin:
            with self.assertRaisesRegex(ValueError, 'credentials not requested'):
                runner.assert_qa_origin_project(origin, 'qa-project-001')

    def test_b7_03_denies_missing_unexpanded_or_repeated_marker(self):
        for body in [b'<html>missing</html>', html('%VITE_FIREBASE_PROJECT_ID%'), html('qa-project-001') * 2]:
            with self.subTest(body=body[:30]), _Server(body) as origin:
                with self.assertRaises(ValueError):
                    runner.assert_qa_origin_project(origin, 'qa-project-001')

    def test_b7_04_denies_redirects_wrong_content_type_and_error_response(self):
        for status, ctype in [(302, 'text/html'), (200, 'application/json'), (503, 'text/html')]:
            with self.subTest(status=status, content_type=ctype), _Server(html('qa-project-001'), status=status, ctype=ctype) as origin:
                with self.assertRaises(ValueError):
                    runner.assert_qa_origin_project(origin, 'qa-project-001')

    def test_b7_05_html_over_128k_cannot_sneak_second_project_marker(self):
        with _Server(html('qa-project-001') + b'A' * 131073) as origin:
            with self.assertRaisesRegex(ValueError, '128 KiB'):
                runner.assert_qa_origin_project(origin, 'qa-project-001')

    def test_b7_06_preflight_is_credential_free_and_checks_local_env(self):
        with tempfile.TemporaryDirectory() as tmp, _Server(html('qa-project-001')) as origin:
            Path(tmp, '.env.local').write_text('VITE_FIREBASE_PROJECT_ID=qa-project-001\n', encoding='utf8')
            with patch.object(runner, 'ROOT', Path(tmp)):
                with patch.dict('os.environ', {}, clear=True):
                    runner.qa_preflight(origin, 'qa-project-001', check_browser=False)
            with patch.object(runner, 'ROOT', Path(tmp)):
                with self.assertRaisesRegex(ValueError, 'differs'):
                    runner.qa_preflight(origin, 'qa-project-002', check_browser=False)

    def test_b7_07_bad_project_id_fails_without_network(self):
        for candidate in ('', 'PROJECT', 'bad/id', '%VITE_FIREBASE_PROJECT_ID%'):
            with self.subTest(candidate=candidate), self.assertRaisesRegex(ValueError, 'project ID'):
                runner.qa_preflight('http://127.0.0.1:5173', candidate, check_browser=False)

    def test_b7_08_preflight_cli_does_not_invalidate_previous_report(self):
        import inspect
        source = inspect.getsource(runner.main)
        self.assertIn('if not args.check_config and not args.preflight:', source)
        self.assertLess(source.index('qa_preflight(origin, project_id)'), source.index('accounts = require_accounts'))
        self.assertLess(source.index('if args.preflight:'), source.index('accounts = require_accounts'))

    def test_b7_09_missing_chromium_blocks_without_credential_prompt(self):
        import sys
        from types import ModuleType, SimpleNamespace
        with tempfile.TemporaryDirectory() as tmp, _Server(html('qa-project-001')) as origin:
            base = Path(tmp)
            (base / '.env.local').write_text('VITE_FIREBASE_PROJECT_ID=qa-project-001\n', encoding='utf8')
            lib = ModuleType('playwright')
            api = ModuleType('playwright.sync_api')
            class FakeBrowser:
                def __enter__(self):
                    return SimpleNamespace(chromium=SimpleNamespace(executable_path=str(base / 'missing-chromium')))
                def __exit__(self, *args):
                    return False
            api.sync_playwright = lambda: FakeBrowser()
            with patch.object(runner, 'ROOT', base), patch.dict(sys.modules, {'playwright':lib, 'playwright.sync_api':api}):
                with self.assertRaisesRegex(ValueError, 'Chromium is missing'):
                    runner.qa_preflight(origin, 'qa-project-001')

if __name__ == '__main__':
    unittest.main()
