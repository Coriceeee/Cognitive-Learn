"""Resumable HF Dataset Viewer downloader (stdlib only).

Use: python research/huggingface/vnhsge_benchmark/fetch_stdlib.py --out work
No pandas, pyarrow, datasets, or third-party dependencies.
The viewer API is not revision-pinned; the manifest states this limitation.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import random
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen

DATASET = 'roshansk23/Vietnam_HighSchool_Exam_Dataset'
API = 'https://huggingface.co/api/datasets/'
VIEWER = 'https://datasets-server.huggingface.co'
RETRIABLE = {429, 500, 502, 503, 504}


def get_json(url: str, *, max_retries: int, retry_delay: float):
    req = Request(url, headers={'User-Agent': 'CLA-Research-Benchmark/1.1', 'Accept': 'application/json'})
    for attempt in range(max_retries + 1):
        try:
            with urlopen(req, timeout=25) as resp:
                return json.load(resp)
        except HTTPError as exc:
            if exc.code not in RETRIABLE or attempt == max_retries:
                raise RuntimeError(f'HTTP {exc.code} for {url} after {attempt+1} attempt(s)') from exc
            header = exc.headers.get('Retry-After', '')
            try:
                min_delay = float(header)
            except ValueError:
                min_delay = 0
            seconds = max(min_delay, min(180.0, retry_delay * (2 ** attempt))) + random.uniform(0, 1)
            print(f'HTTP {exc.code}; retry after {seconds:.1f}s ({attempt+1}/{max_retries})', flush=True)
            time.sleep(seconds)
        except (URLError, TimeoutError, ConnectionError) as exc:
            if attempt == max_retries:
                raise RuntimeError(f'Network failure for {url}: {exc}') from exc
            seconds = min(180.0, retry_delay * (2 ** attempt)) + random.uniform(0, 1)
            print(f'Network error; retry after {seconds:.1f}s ({attempt+1}/{max_retries})', flush=True)
            time.sleep(seconds)


def write_json_atomic(path: Path, data):
    temp = path.with_suffix(path.suffix + '.tmp')
    with temp.open('w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
        f.flush(); os.fsync(f.fileno())
    temp.replace(path)


def sha256(path: Path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def validate_partial(path: Path) -> int:
    count = 0
    if not path.exists():
        return 0
    with path.open('rb') as f:
        for line in f:
            if not line.endswith(b'\n'):
                raise RuntimeError('Partial file ends in incomplete line; manually inspect before resuming')
            try:
                data = json.loads(line)
            except (ValueError, UnicodeDecodeError) as exc:
                raise RuntimeError(f'Corrupt JSON at saved row {count}') from exc
            if not isinstance(data, dict):
                raise RuntimeError(f'Unexpected row type at saved row {count}')
            count += 1
    return count


def fetch(args):
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    part = out / 'source.jsonl.part'
    checkpoint_file = out / 'fetch_checkpoint.json'
    final = out / 'source.jsonl'
    manifest_file = out / 'fetch_manifest.json'
    if final.exists() and not args.force:
        print(f'Existing completed file: {final} ({validate_partial(final)} rows). Use --force only to replace it.')
        return
    if args.force:
        for p in (part, checkpoint_file):
            p.unlink(missing_ok=True)

    kwargs = {'max_retries': args.max_retries, 'retry_delay': args.retry_delay}
    metadata = get_json(API + quote(DATASET, safe='/'), **kwargs)
    before_sha = metadata.get('sha')
    if not before_sha:
        raise RuntimeError('Hugging Face API provided no repository SHA')
    available = get_json(VIEWER + '/splits?' + urlencode({'dataset': DATASET}), **kwargs).get('splits', [])
    splits = [s for s in available if s.get('split') == 'train'] or available
    if len(splits) != 1:
        raise RuntimeError(f'Expected one split, got {splits!r}')
    config, split = splits[0]['config'], splits[0]['split']

    current_count = validate_partial(part)
    if current_count:
        if not checkpoint_file.exists():
            raise RuntimeError('Partial file exists without checkpoint; do not guess its provenance')
        cp = json.loads(checkpoint_file.read_text(encoding='utf-8'))
        expected = {'source': DATASET, 'config': config, 'split': split, 'revision': before_sha}
        if any(cp.get(k) != v for k, v in expected.items()):
            raise RuntimeError('Source/config/revision has changed; refusing to append incompatible data')
        if cp.get('rows') != current_count:
            raise RuntimeError(f'Checkpoint mismatch: checkpoint={cp.get("rows")}, partial={current_count}')
        if cp.get('partial_sha256') != sha256(part):
            raise RuntimeError('Partial file checksum mismatch; refusing to continue')
        total = cp['total']
        print(f'Resuming saved {current_count}/{total} rows', flush=True)
    else:
        if checkpoint_file.exists():
            raise RuntimeError('Checkpoint exists without partial data; investigate before resetting')
        total = None

    offset = current_count
    try:
        with part.open('a', encoding='utf-8', newline='\n') as f:
            while total is None or offset < total:
                length = min(args.page_size, total - offset) if total is not None else args.page_size
                url = VIEWER + '/rows?' + urlencode({'dataset': DATASET, 'config': config,
                                                     'split': split, 'offset': offset, 'length': length})
                body = get_json(url, **kwargs)
                if body.get('partial'):
                    raise RuntimeError(f'Dataset viewer returned partial=true at offset {offset}')
                rows = body.get('rows')
                reported_total = body.get('num_rows_total')
                if not isinstance(reported_total, int) or reported_total < 1:
                    raise RuntimeError('Invalid/missing total row count')
                if total is not None and total != reported_total:
                    raise RuntimeError('Dataset row count changed during download')
                total = reported_total
                if not isinstance(rows, list) or not rows or len(rows) > length:
                    raise RuntimeError(f'Invalid/empty rows at offset {offset}')
                if offset + len(rows) < total and len(rows) != length:
                    raise RuntimeError('Incomplete page before end of dataset')
                for idx, item in enumerate(rows):
                    if item.get('row_idx') != offset + idx or not isinstance(item.get('row'), dict):
                        raise RuntimeError(f'Unexpected row index/format at offset {offset + idx}')
                for item in rows:
                    f.write(json.dumps(item['row'], ensure_ascii=False) + '\n')
                f.flush(); os.fsync(f.fileno())
                offset += len(rows)
                write_json_atomic(checkpoint_file, {'source': DATASET, 'config': config, 'split': split,
                    'revision': before_sha, 'rows': offset, 'total': total,
                    'partial_sha256': sha256(part), 'updated_at_utc': datetime.now(timezone.utc).isoformat()})
                print(f'Fetched {offset}/{total} rows (saved checkpoint)', flush=True)
                if offset < total:
                    time.sleep(args.pause)
    except (KeyboardInterrupt, Exception):
        print(f'Partial progress retained at {part}; rerun the same command to resume.', flush=True)
        raise

    after_sha = get_json(API + quote(DATASET, safe='/'), **kwargs).get('sha')
    if before_sha != after_sha:
        raise RuntimeError('Dataset SHA changed during download; partial remains for investigation')
    if offset != total:
        raise RuntimeError(f'Incomplete download {offset}/{total}')
    part.replace(final)
    write_json_atomic(manifest_file, {
        'source': DATASET, 'requested_revision': 'current main', 'resolved_revision': before_sha,
        'verification': 'sha before/after; viewer endpoint may serve separately cached revision',
        'source_is_strictly_revision_pinned': False, 'config': config, 'split': split,
        'rows': offset, 'artifact': 'source.jsonl', 'sha256': sha256(final),
        'fetched_at_utc': datetime.now(timezone.utc).isoformat(),
        'dataset_license_status': 'UNVERIFIED; do not redistribute without verification',
        'research_use_approved': False,
        'population': 'Vietnamese high-school exam MCQs; not individual learning outcomes',
    })
    checkpoint_file.unlink(missing_ok=True)
    print(f'DONE: {final} rows: {offset}', flush=True)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--out', default='work')
    p.add_argument('--page-size', type=int, default=50)
    p.add_argument('--pause', type=float, default=2.0)
    p.add_argument('--max-retries', type=int, default=8)
    p.add_argument('--retry-delay', type=float, default=30.0)
    p.add_argument('--force', action='store_true', help='Discard incomplete checkpoint, not existing final file')
    args = p.parse_args()
    if not 1 <= args.page_size <= 100 or args.pause < 0 or args.max_retries < 0 or args.retry_delay < 0:
        p.error('Invalid page-size, pause, or retries settings')
    try:
        fetch(args)
    except Exception as exc:
        raise SystemExit(f'FETCH ERROR: {exc}') from exc

if __name__ == '__main__':
    main()
