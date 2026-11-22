#!/usr/bin/env python3
"""Package CLA source without local secrets. Reviewed *.env examples are safe to ship.

This only assembles a source archive; it is not a build, Firebase validation, or deploy.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
BLOCK_DIRS = {'.git', 'node_modules', 'dist', '.vercel', '.firebase', '.venv', '__pycache__', 'coverage'}
BLOCK_SUFFIXES = ('.pem', '.p12', '.pfx', '.key', '.tsbuildinfo', '.pyc')
PRIVATE_PARTS = {'raw_private', 'raw_immutable', 'processed_private', 'staging_private', 'splits_private'}
BLOCK_LOGS = {'firebase-debug.log', 'firestore-debug.log', 'ui-debug.log'}
BLOCK_PATH_PREFIXES = ('reports/e2e/', 'reports/security/', 'research/evidence/private/', 'research/reports/private/',
                       'research/oulad/data/', 'research/oulad/work/')
EXPECTED_EXAMPLES = ('.env.example', '.env.mvp-qa.example', 'functions/.env.example', 'functions-admin/.env.example', 'functions-privacy/.env.example')

def allowed(rel: str) -> bool:
    parts = Path(rel).parts
    name = parts[-1]
    if any(p in BLOCK_DIRS or p in PRIVATE_PARTS for p in parts[:-1]):
        return False
    if any(rel.startswith(prefix) for prefix in BLOCK_PATH_PREFIXES):
        return False
    if name in BLOCK_LOGS or name.endswith(BLOCK_SUFFIXES):
        return False
    if name.startswith('.env') and name != '.env.example' and rel != '.env.mvp-qa.example':
        return False
    if name.endswith('.runtimeconfig.json') or ('service-account' in name.lower() and name.lower().endswith('.json')):
        return False
    if name in {'.DS_Store'} or name.startswith('java_pid') and name.endswith('.hprof'):
        return False
    return True

def file_list(root: Path) -> list[tuple[str, Path]]:
    found = []
    for folder, dirs, files in os.walk(root, followlinks=False):
        base = Path(folder)
        dirs[:] = sorted(d for d in dirs if allowed((base / d).relative_to(root).as_posix() + '/file'))
        for filename in sorted(files):
            p = base / filename
            if p.is_symlink() or not p.is_file():
                continue
            rel = p.relative_to(root).as_posix()
            if allowed(rel):
                found.append((rel, p))
    return sorted(found)

def build_archive(root: Path, destination: Path) -> dict:
    files = file_list(root)
    paths = {name for name, _ in files}
    missing = set(EXPECTED_EXAMPLES) - paths
    if missing:
        raise RuntimeError(f'Release would omit safe configuration templates: {sorted(missing)}')
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.resolve().is_relative_to(root.resolve()):
        raise ValueError('Destination must be outside project root to prevent recursive packaging')
    with ZipFile(destination, 'w', compression=ZIP_DEFLATED, compresslevel=6) as archive:
        for rel, path in files:
            info = ZipInfo(f'Cognitive-Learn/{rel}', date_time=(2026, 11, 21, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = (0o644 << 16)
            archive.writestr(info, path.read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=6)
        if archive.testzip() is not None:
            raise RuntimeError('Archive CRC verification failed')
    return {
        'archive': str(destination),
        'file_count': len(files),
        'bytes': destination.stat().st_size,
        'sha256': hashlib.sha256(destination.read_bytes()).hexdigest(),
        'safe_env_examples': list(EXPECTED_EXAMPLES),
        'source_only': True,
        'production_build_verified': False,
    }

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--root', type=Path, default=ROOT)
    args = parser.parse_args()
    print(json.dumps(build_archive(args.root, args.output), ensure_ascii=False, indent=2))
