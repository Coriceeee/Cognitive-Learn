#!/usr/bin/env python3
"""CP31 Batch 6: pure, privacy-preserving browser evidence contract.

A report generated from contract/unit checks is NOT a browser result. All 72
fixed, unique cases must have been executed in Chromium with real QA auth.
This contract checks runner output consistency; it is not an independent
cryptographic attestation of Firebase production or a scientific claim.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone, timedelta
import hashlib
import json
import os
from pathlib import Path
import re
import uuid

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'tests' / 'e2e' / 'cp31_nexus_manifest.json'
RUNNER = ROOT / 'tools' / 'cp31_browser_e2e.py'
DEFAULT_REPORT = ROOT / 'reports' / 'e2e' / 'cp31_browser_gate.json'
SCHEMA = 'cla-cp31-browser-gate-v2'
OPERATIONAL_VIEWS = ('seed-migration', 'atlas-fresh', 'haven-sources', 'release', 'seed-rules', 'model-eval',
                     'atlas-approve', 'orion-policy', 'orion-scenarios', 'pulse-evidence', 'pulse-trends', 'haven-finance')
DENIED_ROLES = ('student', 'teacher', 'parent')
CASE_PREFIX = 'CP31-E2E-'


def load_groups() -> list[dict]:
    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    if data.get('schema') != 'cla-cp31-nexus-e2e-v1':
        raise ValueError('Unexpected manifest schema')
    groups = data.get('groups')
    if not isinstance(groups, list) or len(groups) != 7:
        raise ValueError('Exactly seven Nexus groups required')
    ids: set[str] = set()
    clusters: set[str] = set()
    keys: set[str] = set()
    for group in groups:
        if not isinstance(group, dict) or not isinstance(group.get('tasks'), list):
            raise ValueError('Invalid group')
        key, cluster = group.get('key'), group.get('cluster')
        if not isinstance(key, str) or not re.fullmatch(r'[a-z]+', key) or key in keys:
            raise ValueError('Invalid or duplicate group key')
        if not isinstance(cluster, str) or not re.fullmatch(r'[a-z]+(?:-[a-z]+)+', cluster) or cluster in clusters:
            raise ValueError('Invalid or duplicate cluster')
        keys.add(key)
        clusters.add(cluster)
        for task in group['tasks']:
            if not isinstance(task, dict):
                raise ValueError('Invalid task')
            task_id, diagnostic = task.get('id'), task.get('diagnostic')
            if not isinstance(task_id, str) or not re.fullmatch(r'[a-z]+(?:-[a-z]+)*', task_id) or task_id in ids:
                raise ValueError('Invalid or duplicate task ID')
            if task.get('status') != 'limited' or not isinstance(task.get('title'), str) or not task['title'].strip():
                raise ValueError('Task cannot be silently marked completed')
            if not isinstance(diagnostic, str) or not re.fullmatch(r'/admin/diagnostics\?view=[a-z]+(?:-[a-z]+)*', diagnostic):
                raise ValueError('Unsafe diagnostic path')
            ids.add(task_id)
    if len(ids) != 22:
        raise ValueError('Exactly 22 Nexus tasks required')
    return groups


def case_names(groups: list[dict]) -> list[str]:
    result = [
        'CP31-E2E-01 anonymous denied all admin routes',
        'CP31-E2E-02 admin signs in using server verified role',
        'CP31-E2E-03 22 item inventory and honest evidence labels',
        'CP31-E2E-04 invalid task filter fails closed',
    ]
    result += [f"CP31-E2E-CLUSTER-{g['key']} cards/navigation" for g in groups]
    result += [f"CP31-E2E-TASK-{t['id']} drilldown" for g in groups for t in g['tasks']]
    result += [f"CP31-E2E-DIAGNOSTIC-{t['id']} route" for g in groups for t in g['tasks']]
    result += [f'CP31-E2E-OP-{view} read-only check' for view in OPERATIONAL_VIEWS]
    result += ['CP31-E2E-05 refresh retains scoped audit', 'CP31-E2E-06 mobile audit and no horizontal overflow']
    result += [f'CP31-E2E-DENY-{role} admin routes' for role in DENIED_ROLES]
    if len(result) != 72 or len(set(result)) != 72:
        raise ValueError('Expected 72 distinct browser cases, not arbitrary count')
    return result


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')


def atomic_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + '.pending-' + uuid.uuid4().hex)
    try:
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        os.replace(tmp, path)
    finally:
        if tmp.exists():
            tmp.unlink()


def make_report(groups: list[dict], observations: list[dict], *, run_id: str, started_at: str,
                project_id: str, abort_reason: str = '') -> dict:
    expected = case_names(groups)
    by_case: dict[str, dict] = {}
    for observation in observations:
        name = observation.get('case')
        if name not in expected or name in by_case or observation.get('result') not in ('PASS', 'FAIL'):
            raise ValueError('Unrecognized, duplicate, or fake browser case')
        # Only store an error *type*, never an exception message or page content.
        err = observation.get('errorType')
        row = {'case': name, 'result': observation['result']}
        if observation['result'] == 'FAIL':
            row['errorType'] = err if isinstance(err, str) and re.fullmatch(r'[A-Za-z]{1,60}', err) else 'TestFailure'
        by_case[name] = row
    rows = [by_case.get(name, {'case': name, 'result': 'NOT RUN'}) for name in expected]
    passed = sum(row['result'] == 'PASS' for row in rows)
    failed = sum(row['result'] == 'FAIL' for row in rows)
    not_run = len(rows) - passed - failed
    overall = 'BLOCKED' if abort_reason else 'PASS' if passed == len(rows) else 'FAIL'
    report = {
        'schema': SCHEMA,
        'scope': 'chromium-qa-accounts-no-mocks',
        'runId': run_id,
        'startedAtUtc': started_at,
        'completedAtUtc': now_utc(),
        'qaProjectId': project_id,
        'manifestSha256': sha256(MANIFEST),
        'runnerSha256': sha256(RUNNER),
        'expected': len(expected),
        'executed': passed + failed,
        'passed': passed,
        'failed': failed,
        'notRun': not_run,
        'overall': overall,
        'results': rows,
        'limitations': 'QA browser/role behavior only; does not prove production deployment or scientific validity',
    }
    if abort_reason:
        report['abortReason'] = abort_reason if re.fullmatch(r'[A-Za-z]{1,60}', abort_reason) else 'PreflightFailure'
    return report


def audit_report(raw: object, *, max_age_hours: int = 72, now: datetime | None = None) -> list[str]:
    errors: list[str] = []
    try:
        groups = load_groups()
        expected = case_names(groups)
    except (ValueError, OSError, json.JSONDecodeError):
        return ['Local manifest invalid']
    if not isinstance(raw, dict):
        return ['Missing or malformed E2E report']
    for key, value in [('schema', SCHEMA), ('scope', 'chromium-qa-accounts-no-mocks'),
                       ('manifestSha256', sha256(MANIFEST)), ('runnerSha256', sha256(RUNNER)),
                       ('overall', 'PASS'), ('expected', 72), ('executed', 72), ('passed', 72),
                       ('failed', 0), ('notRun', 0)]:
        if raw.get(key) != value:
            errors.append(f'Invalid {key}')
    if not isinstance(raw.get('qaProjectId'), str) or not re.fullmatch(r'[a-z][a-z0-9-]{3,63}', raw['qaProjectId']):
        errors.append('Missing QA project ID')
    if not isinstance(raw.get('runId'), str) or not re.fullmatch(r'[a-f0-9]{32}', raw['runId']):
        errors.append('Missing run ID')
    actual = raw.get('results')
    if not isinstance(actual, list) or len(actual) != 72 or [row.get('case') for row in actual if isinstance(row, dict)] != expected:
        errors.append('Missing, duplicate, or reordered case IDs')
    elif any(not isinstance(row, dict) or row.get('result') != 'PASS' or set(row) != {'case', 'result'} for row in actual):
        errors.append('At least one case did not pass')
    now = now or datetime.now(timezone.utc)
    try:
        started = datetime.fromisoformat(raw['startedAtUtc'].replace('Z', '+00:00'))
        finished = datetime.fromisoformat(raw['completedAtUtc'].replace('Z', '+00:00'))
        if started.tzinfo is None or finished.tzinfo is None or not (started <= finished <= now + timedelta(minutes=5)):
            errors.append('Run timestamps invalid')
        elif now - finished > timedelta(hours=max_age_hours):
            errors.append('E2E report stale')
    except (KeyError, AttributeError, TypeError, ValueError):
        errors.append('Missing valid UTC timestamps')
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description='Check CP31 real-browser gate report, never execute browser')
    parser.add_argument('--report', type=Path, default=DEFAULT_REPORT)
    parser.add_argument('--max-age-hours', type=int, default=72)
    args = parser.parse_args()
    if args.max_age_hours < 1 or args.max_age_hours > 168:
        print('CP31 E2E EVIDENCE INVALID: max-age-hours out of range')
        return 1
    try:
        raw = json.loads(args.report.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        print('CP31 E2E EVIDENCE: NOT TESTED (no verified browser report)')
        return 1
    errors = audit_report(raw, max_age_hours=args.max_age_hours)
    if errors:
        for error in errors:
            print(f'CP31 E2E EVIDENCE BLOCKED: {error}')
        return 1
    print('CP31 E2E EVIDENCE PASS: 72/72 distinct QA browser cases, current runner/manifest; not production attestation')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
