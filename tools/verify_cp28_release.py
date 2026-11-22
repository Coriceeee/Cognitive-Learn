#!/usr/bin/env python3
"""Fail-closed pre-export scan for an unpacked CLA source release.
This DOES NOT inspect Git history or prove credential rotation.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FORBIDDEN_SUFFIXES=('.pem','.p12','.pfx','.key')
FORBIDDEN_COMPONENTS={'node_modules','.git','.venv','.vercel','.firebase','dist','__pycache__','raw_private','processed_private','staging_private','splits_private'}
SECRET_PATTERNS={
 'private_key_header':re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
 'openai_secret':re.compile(r'\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b'),
 'google_api_key':re.compile(r'\bAIza[0-9A-Za-z_-]{35}\b'),
 'github_pat':re.compile(r'\bgh[pousr]_[A-Za-z0-9]{30,}\b'),
 'slack_token':re.compile(r'\bxox[baprs]-[0-9A-Za-z-]{20,}\b'),
}
TEXT_EXTENSIONS={'.ts','.tsx','.js','.mjs','.cjs','.json','.jsonl','.md','.yml','.yaml','.toml','.txt','.csv','.py','.html','.css','.rules','.env'}

def scan(root: Path):
    flagged=[]
    hashed=[]
    for file in root.rglob('*'):
        if not file.is_file(): continue
        relative=file.relative_to(root)
        parts=set(relative.parts)
        if parts & FORBIDDEN_COMPONENTS:
            flagged.append({'path':str(relative),'reason':'forbidden component'})
            continue
        if file.name=='.env' or file.name.startswith('.env.') and file.name!='.env.example' and relative.as_posix()!='.env.mvp-qa.example' or file.suffix.lower() in FORBIDDEN_SUFFIXES or 'service-account' in file.name.lower():
            flagged.append({'path':str(relative),'reason':'potential secret file'})
            continue
        if relative.parts[:2] == ('research','oulad') and file.suffix.lower() in {'.zip','.csv','.parquet','.pkl','.joblib'}:
            flagged.append({'path':str(relative),'reason':'raw external dataset/model artifact must not ship'})
            continue
        if relative.parts[:2] == ('reports','security'):
            # runtime gate logs may contain local account paths and are excluded from releases
            flagged.append({'path':str(relative),'reason':'runtime security evidence should be private'})
            continue
        if file.suffix.lower() in TEXT_EXTENSIONS or file.name in {'firestore.rules.CANDIDATE_CP21','firebase.json','package.json'}:
            try: body=file.read_text(encoding='utf-8')
            except UnicodeDecodeError: continue
            for name,pat in SECRET_PATTERNS.items():
                if pat.search(body):
                    flagged.append({'path':str(relative),'reason':f'potential {name}'})
        if relative.as_posix() in {
          'src/page/seed/StudentConsentPage.tsx','src/lib/studentShareRevocation.ts',
          'tests/step20-consent-share-revocation.test.mjs','tests/firestore.rules.cp21.test.mjs',
          'firestore.rules.CANDIDATE_CP21','package.json'
        }:
            hashed.append({'path':relative.as_posix(),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
    return flagged,hashed

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',default=str(ROOT));p.add_argument('--report',default='')
    a=p.parse_args();root=Path(a.root).resolve()
    flagged,hashed=scan(root)
    status='PASS' if not flagged else 'FAIL'
    result={'status':status,'scan_scope':'unpacked source only, not Git history','flagged':flagged,'reviewed_file_hashes':hashed}
    if a.report:
        Path(a.report).write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(f'CP28 SOURCE RELEASE HYGIENE: {status}; flagged={len(flagged)}; SHA256 files={len(hashed)}')
    for issue in flagged[:30]: print(issue)
    raise SystemExit(0 if not flagged else 1)
