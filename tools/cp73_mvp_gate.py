#!/usr/bin/env python3
"""CP73 fail-closed, synthetic-only MVP release gate.

The gate never installs dependencies, creates accounts, launches a server,
contacts a cloud service or deploys Rules. Local Firebase emulators and Vite
must already be running. Browser smoke checks use CP68's real Playwright
suite and an explicitly supplied synthetic QA student (never personal data).

Return 0 only for a complete PASS; 2 for missing prerequisites; 1 for a
runtime/test failure. A BLOCKED run is *not* MVP acceptance.
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = 'cla-cp73-mvp-gate-v1'
QA_PROJECT = 'demo-cla-mvp'
EXPECTED_ENV = {
    'VITE_USE_FIREBASE_EMULATORS': 'true',
    'VITE_FIREBASE_PROJECT_ID': QA_PROJECT,
    'VITE_FIREBASE_API_KEY': 'fake-api-key',
    'VITE_FIREBASE_AUTH_DOMAIN': QA_PROJECT + '.firebaseapp.com',
    'VITE_CLA_STUDENT_CONSENT_GATE': 'true',
}
CHECK_KEYS = ('qaConfiguration', 'dependencies', 'firebaseCli', 'emulatorPorts',
              'localReactOrigin', 'productionBuild', 'firestoreRulesEmulator',
              'realBrowserE2E')


def parse_local_env(text: str) -> dict[str, str]:
    """Read only the public allowlisted settings. Never report other env values."""
    settings = {}
    for line in text.splitlines():
        item = line.strip()
        if not item or item.startswith('#') or '=' not in item:
            continue
        name, value = item.split('=', 1)
        name = name.strip()
        if name in EXPECTED_ENV:
            settings[name] = value.strip().strip('"\'')
    return settings


def qa_config_is_safe(text: str) -> bool:
    settings = parse_local_env(text)
    return all(settings.get(key) == expected for key, expected in EXPECTED_ENV.items())


def loopback_port_listening(port: int) -> bool:
    try:
        with socket.create_connection(('127.0.0.1', port), timeout=0.8):
            return True
    except (OSError, TimeoutError):
        return False


def run_quiet(cmd: list[str], timeout: int = 120) -> bool:
    """Only report exit status; never leak passwords, page HTML or URL params."""
    try:
        proc = subprocess.run(cmd, cwd=ROOT, check=False, timeout=timeout,
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return proc.returncode == 0
    except (OSError, subprocess.TimeoutExpired):
        return False


def origin_safe(raw: str) -> bool:
    value = urlsplit(raw)
    return (value.scheme == 'http' and value.hostname in ('localhost', '127.0.0.1', '::1')
            and bool(value.port) and value.path in ('', '/') and not value.query
            and not value.fragment and not value.username and not value.password)


def safe_report_path(raw: str) -> Path:
    path = Path(raw)
    if not path.is_absolute():
        path = ROOT / path
    path = path.resolve()
    if not path.is_relative_to(ROOT.resolve()):
        raise ValueError('Report path must remain inside the project')
    return path


def write_report(path: Path, report: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    staged = path.with_suffix(path.suffix + '.pending')
    staged.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(staged, path)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:5173')
    parser.add_argument('--preflight', action='store_true', help='Only check local prerequisites; never claims MVP PASS')
    parser.add_argument('--report', default='reports/cp73/mvp-gate.json')
    args = parser.parse_args(argv)
    if not origin_safe(args.base_url):
        print('CP73 BLOCKED: only an HTTP loopback origin is permitted', file=sys.stderr)
        return 2
    try:
        out = safe_report_path(args.report)
    except ValueError:
        print('CP73 BLOCKED: report must be stored within the project', file=sys.stderr)
        return 2

    checks = {name: 'NOT_RUN' for name in CHECK_KEYS}
    report = {
        'schema': SCHEMA,
        'atUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        'qaProject': QA_PROJECT, 'scope': 'LOCAL_SYNTHETIC_ONLY',
        'status': 'BLOCKED', 'mvpAccepted': False, 'qaTechnicalPassed': False, 'checks': checks,
        'limits': 'No production deployment, scientific validation or real student data covered.',
    }
    try:
        file = ROOT / '.env.local'
        checks['qaConfiguration'] = 'PASS' if file.is_file() and qa_config_is_safe(file.read_text(encoding='utf-8-sig')) else 'BLOCKED'
        checks['dependencies'] = 'PASS' if run_quiet(['node', 'tools/check-dependencies.cjs'], 45) else 'BLOCKED'
        checks['firebaseCli'] = 'PASS' if shutil.which('firebase') else 'BLOCKED'
        checks['emulatorPorts'] = ('PASS' if loopback_port_listening(9099) and loopback_port_listening(8080) else 'BLOCKED')
        # The local meta marker is the existing CP31/CP68 identity check. Do not
        # access an unaudited server or read its contents into the report.
        if checks['qaConfiguration'] == 'PASS' and checks['dependencies'] == 'PASS':
            checks['localReactOrigin'] = ('PASS' if run_quiet([
                sys.executable, 'tools/cp68_student_ux_e2e.py', '--base-url', args.base_url,
                '--project-id', QA_PROJECT, '--preflight', '--report', 'reports/cp73/cp68-preflight.json',
            ], 45) else 'BLOCKED')
        else:
            checks['localReactOrigin'] = 'BLOCKED'

        prerequisite = ('qaConfiguration','dependencies','firebaseCli','emulatorPorts','localReactOrigin')
        if not all(checks[item] == 'PASS' for item in prerequisite):
            report['status'] = 'BLOCKED'
            return 2
        if args.preflight:
            report['status'] = 'PREFLIGHT_PASS_NOT_MVP'
            return 0
        if os.environ.get('CLA_E2E_QA_ACK') != 'I_USE_SYNTHETIC_QA_ACCOUNTS' or not os.environ.get('CLA_E2E_STUDENT_EMAIL') or not os.environ.get('CLA_E2E_STUDENT_PASSWORD'):
            report['status'] = 'BLOCKED'
            return 2
        checks['productionBuild'] = 'PASS' if run_quiet(['npm','run','build'], 180) else 'FAIL'
        if checks['productionBuild'] != 'PASS':
            report['status'] = 'FAIL'
            return 1
        checks['firestoreRulesEmulator'] = 'PASS' if run_quiet(['npm','run','test:rules:emulator'], 450) else 'FAIL'
        if checks['firestoreRulesEmulator'] != 'PASS':
            report['status'] = 'FAIL'
            return 1
        checks['realBrowserE2E'] = 'PASS' if run_quiet([
            sys.executable, 'tools/cp68_student_ux_e2e.py', '--base-url', args.base_url,
            '--project-id', QA_PROJECT, '--report', 'reports/cp73/react-student-e2e.json',
        ], 300) else 'FAIL'
        if checks['realBrowserE2E'] == 'PASS':
            # The browser result is checked before claiming a pass, never
            # inferred merely from a successful subprocess exit.
            evidence = json.loads((ROOT/'reports/cp73/react-student-e2e.json').read_text(encoding='utf-8'))
            if evidence.get('status') != 'PASS' or len(evidence.get('checks',[])) != 12:
                checks['realBrowserE2E'] = 'FAIL'
        report['qaTechnicalPassed'] = all(checks[item] == 'PASS' for item in CHECK_KEYS)
        report['status'] = 'QA_TECHNICAL_PASS_NOT_MVP' if report['qaTechnicalPassed'] else 'FAIL'
        # Navigation E2E alone does not prove persisted student workflows,
        # production security or research validity. MVP signoff stays false.
        return 0 if report['qaTechnicalPassed'] else 1
    finally:
        write_report(out, report)
        print('CP73 MVP QA:', report['status'], '| offline tests are not acceptance')
        for key in CHECK_KEYS:
            print(' -', key, checks[key])


if __name__ == '__main__':
    raise SystemExit(main())
