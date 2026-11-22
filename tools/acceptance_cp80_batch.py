#!/usr/bin/env python3
"""Run indexed commands from package.json `npm test` independently; no deployments or QA credentials.
Useful when a legacy test fails early, masking the rest. Prints a verified PASS/FAIL/BLOCKED ledger.
"""
import argparse
import csv
import json
import os
from pathlib import Path
import subprocess
import sys
import time

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--start',type=int,default=0)
parser.add_argument('--end',type=int)
parser.add_argument('--timeout',type=int,default=35)
args=parser.parse_args()
commands=json.loads((root/'package.json').read_text(encoding='utf8'))['scripts']['test'].split(' && ')
end=len(commands) if args.end is None else min(args.end,len(commands))
assert 0<=args.start<=end
out=root/'reports'/'acceptance'/'CP80'/'independent-tests'
out.mkdir(parents=True,exist_ok=True)
rows=[]
for i in range(args.start,end):
    cmd=commands[i]
    started=time.monotonic()
    try:
        res=subprocess.run(cmd,cwd=root,shell=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=args.timeout,text=True,errors='replace')
        exitcode=res.returncode
        status='PASS' if exitcode==0 else 'FAIL'
        log=res.stdout
    except subprocess.TimeoutExpired as e:
        exitcode=124;status='BLOCKED_TIMEOUT'
        buf=e.stdout or b''
        log=buf.decode('utf8','replace') if isinstance(buf,bytes) else buf
    logpath=out/f'{i:03}.log';logpath.write_text(log,encoding='utf8')
    rows.append(dict(index=i,status=status,exitcode=exitcode,seconds=round(time.monotonic()-started,2),command=cmd,log=str(logpath.relative_to(root))))
    print(f'{i:03} {status:<15} {rows[-1]["seconds"]:>7}s  {cmd[:90]}',flush=True)
output=out/f'status_{args.start:03}_{end:03}.csv'
with output.open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=['index','status','exitcode','seconds','command','log']);w.writeheader();w.writerows(rows)
print(f'RESULT {output} | {sum(r["status"]=="PASS" for r in rows)} PASS / {len(rows)}')
sys.exit(0 if all(r['status']=='PASS' for r in rows) else 1)
