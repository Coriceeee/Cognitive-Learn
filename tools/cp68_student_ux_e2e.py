#!/usr/bin/env python3
"""CP68: real React + Firebase QA student UX browser gate.

No mocks, no production origin, no real pupil data. Results are **BLOCKED** unless
an actual browser completes all six module checks on an explicitly approved,
synthetic, local Firebase QA project. Screenshots are opt-in only. Results
never contain email, passwords, URL query values, or student page content.

Suggested workflow: npm ci && npm run dev (QA-only Firebase config), then
  CLA_E2E_QA_ACK=I_USE_SYNTHETIC_QA_ACCOUNTS \
  CLA_E2E_STUDENT_EMAIL=synthetic@example.invalid \
  CLA_E2E_STUDENT_PASSWORD=... \
  python tools/cp68_student_ux_e2e.py --project-id qa-project-123
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from cp31_browser_e2e import checked_origin, qa_preflight, SAFE_LOOPBACK  # noqa: E402

MODULES = ('student', 'lumen', 'atlas', 'orion', 'pulse', 'haven')
VIEWPORTS = ((1280, 800), (390, 844))
SCHEMA = 'cla-cp68-student-ux-e2e-v1'
DEFAULT_OUTPUT = ROOT / 'reports' / 'e2e' / 'cp68_student_ux.json'


def report_template() -> dict:
    return {
        'schema': SCHEMA,
        'dateUtc': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'scope': 'real-React-Firebase-QA-synthetic-student',
        'status': 'BLOCKED',
        'checks': [],
        'limitations': 'This only assesses QA browser/UX. It is not production, ML validity or user research evidence.',
    }


def write_report(path: Path, report: dict) -> None:
    if not path.is_absolute():
        path = (ROOT / path).resolve()
    # Never write outside project and /mnt/data; avoid arbitrary overwrites.
    allowed = (ROOT.resolve(), Path('/mnt/data').resolve())
    if not any(path.is_relative_to(folder) for folder in allowed):
        raise ValueError('Report path must stay within the project or /mnt/data')
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.pending')
    tmp.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(tmp, path)


def validate_origin(origin: str) -> str:
    origin = checked_origin(origin)
    # For CP68, even staging is forbidden: we cannot certify it contains QA data.
    if urlsplit(origin).hostname not in SAFE_LOOPBACK:
        raise ValueError('CP68 only permits a loopback QA origin; never production/staging')
    return origin


def dependencies_ready() -> bool:
    cmd = subprocess.run(['node', 'tools/check-dependencies.cjs'],
                         cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                         check=False, timeout=30)
    return cmd.returncode == 0


def preflight(origin: str, project_id: str) -> None:
    validate_origin(origin)
    if not re.fullmatch(r'[a-z][a-z0-9-]{3,63}', project_id):
        raise ValueError('Explicit valid QA Firebase project ID is required')
    if not dependencies_ready():
        raise RuntimeError('MissingDependencies')
    # Proves that the served page matches the *requested* local QA project
    # before asking for login credentials. Not a signed project attestation.
    qa_preflight(origin, project_id, check_browser=False)


def require_student_qa() -> tuple[str, str]:
    if os.environ.get('CLA_E2E_QA_ACK') != 'I_USE_SYNTHETIC_QA_ACCOUNTS':
        raise ValueError('QAAccountAcknowledgementMissing')
    email = os.environ.get('CLA_E2E_STUDENT_EMAIL', '').strip()
    password = os.environ.get('CLA_E2E_STUDENT_PASSWORD', '')
    if '@' not in email or not password:
        raise ValueError('SyntheticStudentCredentialMissing')
    return email, password


def browser_run(origin: str, account: tuple[str, str], screenshots: Path | None, results: list[dict]) -> None:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            for width, height in VIEWPORTS:
                context = browser.new_context(viewport={'width': width, 'height': height},
                                              reduced_motion='reduce')
                page = context.new_page()
                try:
                    page.goto(origin + '/', wait_until='domcontentloaded', timeout=20000)
                    page.get_by_placeholder('Nhập email').fill(account[0])
                    page.get_by_placeholder('Nhập mật khẩu').fill(account[1])
                    page.locator('form.login-form button[type=submit]').click()
                    page.wait_for_url(origin + '/student', timeout=30000)
                    page.locator('#cla-page-content').wait_for(state='visible', timeout=30000)
                    page.evaluate('window.__cp68DocumentProof = 681968')
                    for idx, slug in enumerate(MODULES):
                        if idx > 0:
                            if idx > 1:
                                # Return to Seed using the browser's real SPA history.
                                page.go_back(wait_until='domcontentloaded')
                                page.locator('#cla-page-content[data-cla-route="/student"]').wait_for(
                                    state='visible', timeout=30000)
                            # Use the visible six-module learning circuit on Seed.
                            # The removed per-module dropdown is no longer part of UX.
                            page.locator(f'.cla-circuit a[href="/{slug}"]:visible').first.click()
                            page.wait_for_url(origin + '/' + slug, timeout=20000)
                        page.locator(f'#cla-page-content[data-cla-route="/{slug}"]').wait_for(
                            state='visible', timeout=30000)
                        page.locator('.cla-guided-workspace').wait_for(state='visible', timeout=30000)
                        metrics = page.evaluate('''() => ({
                          noReload: window.__cp68DocumentProof === 681968,
                          overflow: document.documentElement.scrollWidth > innerWidth + 1,
                          title: document.title.includes('Cognitive Learn AI'),
                          focus: document.activeElement?.id || '',
                          hasApp: !!document.querySelector('#root .app-root'),
                          skip: !!document.querySelector('a.cla-skip-to-content'),
                        })''')
                        # Every module transition is a click on a visible link;
                        # all transitions must preserve the current SPA document.
                        ok = all((metrics['noReload'], not metrics['overflow'],
                                  metrics['title'], metrics['hasApp'], metrics['skip']))
                        if idx > 0 and metrics['focus'] != 'cla-page-content':
                            ok = False
                        results.append({'case': f'{width}:{slug}', 'result': 'PASS' if ok else 'FAIL'})
                        if screenshots is not None and ok:
                            screenshots.mkdir(parents=True, exist_ok=True)
                            page.screenshot(path=str(screenshots / f'cp68-qa-{width}-{slug}.png'),
                                            full_page=True)
                        if not ok:
                            raise AssertionError('React UX navigation/overflow/focus gate failed')
                finally:
                    context.close()
        finally:
            browser.close()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:5173')
    parser.add_argument('--project-id', required=True)
    parser.add_argument('--preflight', action='store_true')
    parser.add_argument('--screenshots', action='store_true', help='QA synthetic student screenshots only')
    parser.add_argument('--report', type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args(argv)
    evidence = report_template()
    try:
        origin = validate_origin(args.base_url)
        preflight(origin, args.project_id)
        if args.preflight:
            evidence['status'] = 'PREFLIGHT_PASS_NOT_RUN'
            print('CP68 PREFLIGHT PASS; browser cases NOT RUN')
            return 0
        account = require_student_qa()
        shots = ROOT / 'reports/e2e/cp68_qa_screenshots' if args.screenshots else None
        browser_run(origin, account, shots, evidence['checks'])
        evidence['status'] = 'PASS' if len(evidence['checks']) == 12 and all(
            x['result'] == 'PASS' for x in evidence['checks']) else 'FAIL'
        print(f"CP68 REACT QA {evidence['status']}: {len(evidence['checks'])}/12 executed")
        return 0 if evidence['status'] == 'PASS' else 1
    except Exception as exc:
        # Never serialize the exception value (it could contain URLs or secrets).
        evidence['reasonType'] = type(exc).__name__
        if evidence['checks'] and any(row['result'] == 'FAIL' for row in evidence['checks']):
            evidence['status'] = 'FAIL'
            print(f'CP68 REACT QA FAIL: {type(exc).__name__} (no student data logged)', file=sys.stderr)
            return 1
        print(f'CP68 REACT QA BLOCKED: {type(exc).__name__} (no student data logged)', file=sys.stderr)
        return 2
    finally:
        write_report(args.report, evidence)


if __name__ == '__main__':
    raise SystemExit(main())
