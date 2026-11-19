"""Fetch the reviewed CC BY 4.0 HF mirror at one immutable revision, then run
external method-feasibility analysis. Never export raw data or promote a model.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import io
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
REPO = 'DElmazi/Student_Performance'
REVISION = '85a4fba73197d748e4cfd445a5e9c2ed35ca4a21'
FILES = {'student-mat.csv': ('math', 395), 'student-por.csv': ('portuguese', 649)}
MAX_BYTES = 300_000
LICENSE = 'CC-BY-4.0'
CITATION = 'Cortez, P. (2008). Student Performance. UCI Machine Learning Repository. DOI: 10.24432/C5TG7T.'
REQUIRED = ('school', 'studytime', 'failures', 'G1', 'G2', 'G3')


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def atomic(path: Path, raw: bytes):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + '.tmp')
    try:
        with tmp.open('wb') as f:
            f.write(raw)
            f.flush()
            os.fsync(f.fileno())
        tmp.replace(path)
    finally:
        tmp.unlink(missing_ok=True)


def validated_rows(raw: bytes, expected_count: int):
    if len(raw) > MAX_BYTES:
        raise ValueError('File exceeded size gate')
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')), delimiter=';')
    if not reader.fieldnames or len(set(reader.fieldnames)) != len(reader.fieldnames) or not set(REQUIRED).issubset(reader.fieldnames):
        raise ValueError('CSV schema differs from documented source')
    rows = list(reader)
    if len(rows) != expected_count:
        raise ValueError('Row count differs from documented subject file')
    for row in rows:
        if None in row or any(v is None or not v.strip() for v in row.values()):
            raise ValueError('Unexpected malformed or missing field')
        for k in ('G1', 'G2', 'G3'):
            if not row[k].strip().isdigit() or not 0 <= int(row[k]) <= 20:
                raise ValueError('Grade outside documented integer range 0–20')
    if len({tuple(row.values()) for row in rows}) != len(rows):
        raise ValueError('Exact duplicate rows: manual data-quality review required')
    return len(rows)


def retrieve(name: str) -> bytes:
    url = f'https://huggingface.co/datasets/{REPO}/resolve/{REVISION}/{name}'
    req = Request(url, headers={'User-Agent':'CLA-Research-ExternalBaseline/1.0', 'Accept':'text/csv, application/octet-stream'})
    with urlopen(req, timeout=40) as response:
        if response.status != 200 or response.geturl().split(':', 1)[0] != 'https':
            raise ValueError('Unexpected source response')
        return response.read(MAX_BYTES + 1)


def work(out: Path, accept_license: bool, evaluate: bool):
    if not accept_license:
        raise ValueError('Review the CC BY 4.0 source and acknowledge using --accept-cc-by-4.0')
    protected = (ROOT / 'data' / 'raw_private').resolve()
    if out.resolve() != protected / 'uci_hf':
        raise ValueError('Use the fixed gitignored research/data/raw_private/uci_hf directory')
    out.mkdir(parents=True, exist_ok=True)
    manifest_path = out / 'manifest.json'
    previous = json.loads(manifest_path.read_text(encoding='utf8')) if manifest_path.exists() else None
    if previous and (previous.get('revision') != REVISION or previous.get('repo') != REPO):
        raise ValueError('Existing manifest source mismatch; preserve original data')
    entries = []
    for filename, (subject, count) in FILES.items():
        path = out / filename
        if path.exists():
            raw = path.read_bytes()
            known = next((x for x in (previous or {}).get('files', []) if x.get('file') == filename), None)
            if not known or known.get('sha256') != digest(raw):
                raise ValueError('Existing raw file lacks matching manifest hash; do not overwrite')
        else:
            raw = retrieve(filename)
        n = validated_rows(raw, count)
        entry = {'file':filename, 'subject':subject, 'rows':n, 'sha256':digest(raw), 'url':f'https://huggingface.co/datasets/{REPO}/resolve/{REVISION}/{filename}'}
        entries.append(entry)
        if not path.exists():
            atomic(path, raw)
        # Persist partial verified manifest so a second-file download failure can resume safely.
        merged = {e['file']:e for e in (previous or {}).get('files', [])}
        merged.update({e['file']:e for e in entries})
        manifest = {'repo':REPO,'revision':REVISION,'license':LICENSE,'citation':CITATION, 'source_reviewed_at':'2026-11-17', 'updated_at':datetime.now(timezone.utc).isoformat(), 'scope':'EXTERNAL_METHOD_FEASIBILITY_ONLY', 'files':list(merged.values())}
        atomic(manifest_path, (json.dumps(manifest, indent=2)+'\n').encode())
    if evaluate:
        sys.path.insert(0,str(ROOT/'src'))
        from baseline_uci_student_performance import run
        for item in entries:
            result = run(out/item['file'], item['subject'], source_revision=REVISION, source_verified=True)
            result['source_url'] = item['url']
            result['source_license'] = LICENSE
            result['source_citation'] = CITATION
            atomic(out/f"{item['subject']}_aggregate.json", (json.dumps(result, ensure_ascii=False, indent=2)+'\n').encode())
            if result['status'] != 'EXTERNAL_BASELINE_EVALUATED_WITH_LIMITATIONS':
                raise RuntimeError('External evaluation did not pass data gate')
    print('HF_SOURCE_VERIFIED_FILES:',len(entries), '| external only; no Vietnamese or CLA effectiveness claims')


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--accept-cc-by-4.0', dest='accept_cc_by_4_0', action='store_true')
    parser.add_argument('--evaluate', action='store_true')
    args=parser.parse_args()
    try:
        work(ROOT/'data'/'raw_private'/'uci_hf', args.accept_cc_by_4_0, args.evaluate)
    except Exception as exc:
        print('HF_EXTERNAL_BLOCKED:',type(exc).__name__,str(exc),file=sys.stderr)
        sys.exit(2)
