#!/usr/bin/env python3
"""CP82 offline ML environment preflight. Stdlib only, no changes or uploads.

Checks the ACTUAL python executable, imports each binary package in a clean
subprocess, and distinguishes missing modules from OS application-control blocks.
No model accuracy, dataset validation or research outcomes are asserted.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys

# On Windows, a Python process may inherit a cp1252 console even when the
# source tree lives in a Unicode folder (e.g. C:\Gạo). Do not allow the
# diagnostic itself to crash while printing the path to its JSON evidence.
# The JSON report always uses UTF-8; output uses UTF-8 or safe escaping.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='backslashreplace')

PACKAGES = (
    ('numpy', 'numpy'), ('pandas', 'pandas'), ('scipy', 'scipy'),
    ('scikit-learn', 'sklearn'), ('xgboost', 'xgboost')
)
REPORT = Path(__file__).resolve().parents[1] / 'reports' / 'acceptance-cp82' / 'ml_environment.json'


def classify(output: str, code: int) -> str:
    if code == 0:
        return 'PASS'
    lowered = output.casefold()
    if ('application control' in lowered or 'blocked this file' in lowered
            or 'app control policy' in lowered or 'tệp bị chặn' in lowered):
        return 'OS_POLICY_BLOCKED'
    if ('no module named' in lowered or 'modulenotfounderror' in lowered):
        return 'MISSING_DEPENDENCY'
    if 'dll load failed' in lowered or 'numpy._core.multiarray failed' in lowered:
        return 'NATIVE_DLL_FAILURE'
    if 'permission denied' in lowered or 'access is denied' in lowered:
        return 'OS_ACCESS_DENIED'
    return 'IMPORT_FAILURE'


def check_package(module: str) -> dict:
    code = 'import ' + module + '\nprint("CP82_IMPORT_OK")'
    try:
        proc = subprocess.run([sys.executable, '-I', '-c', code], capture_output=True,
                              text=True, encoding='utf-8', errors='replace', timeout=30,
                              check=False)
        output = (proc.stderr or '') + '\n' + (proc.stdout or '')
        status = classify(output, proc.returncode)
        return {'status': status, 'exitCode': proc.returncode,
                'diagnostic': (output[-650:] if status != 'PASS' else 'import succeeded')}
    except subprocess.TimeoutExpired:
        return {'status': 'TIMEOUT', 'exitCode': None, 'diagnostic': 'import exceeded 30 seconds'}
    except OSError as exc:
        return {'status': 'PROCESS_BLOCKED', 'exitCode': None,
                'diagnostic': type(exc).__name__}


def main() -> int:
    parser = argparse.ArgumentParser(description='Offline CP82 Python research dependency check')
    parser.add_argument('--check', action='store_true', help='Return a nonzero exit code if any import is unavailable')
    parser.add_argument('--output', default=str(REPORT), help='Local JSON report path')
    args = parser.parse_args()
    items = {package: check_package(module) for package, module in PACKAGES}
    report = {'schema': 'cla.cp82.ml-environment.v1',
              'pythonVersion': '.'.join(map(str, sys.version_info[:3])),
              'usingVirtualEnv': sys.prefix != sys.base_prefix,
              'pythonExecutable': str(Path(sys.executable).resolve()),
              'sysPrefix': sys.prefix,
              'sysBasePrefix': sys.base_prefix,
              'packages': items,
              'overall': 'PASS' if all(x['status'] == 'PASS' for x in items.values()) else 'BLOCKED',
              'sourceTestsRun': False,
              'scientificClaimVerified': False,
              'notes': ['Install with python -m pip install -r research/requirements-cp82-ml.txt in an approved venv.',
                        'OS Application Control policy must be resolved by authorized IT; do not disable controls.',
                        'An import PASS proves only dependency availability, not an ML accuracy claim.']}
    out = Path(args.output).expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for k, v in items.items():
        print(f"{k}: {v['status']}")
    print(f"CP82 ML ENV: {report['overall']} | {out}")
    return 0 if report['overall'] == 'PASS' or not args.check else 2

if __name__ == '__main__':
    raise SystemExit(main())
