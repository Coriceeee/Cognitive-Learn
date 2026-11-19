#!/usr/bin/env python3
"""CP34 participant-balanced descriptive Static/Adaptive comparison; no causal claims."""
import argparse
import hashlib
import json
import random
import statistics as st
from collections import defaultdict
from pathlib import Path
import csv
from study import audit, REQUIRED

SCHEMA='cla.adaptive.participant-comparison.v1'
SEED=20261118
REPS=2000
MIN_PER_ARM=10  # computational reporting floor, not evidence of adequate power

def read_strict(path):
    with Path(path).open(encoding='utf-8-sig',newline='') as f:
        reader=csv.DictReader(f); fields=reader.fieldnames or []
        if len(fields)!=len(set(fields)) or set(fields)!=set(REQUIRED):
            raise ValueError('Unexpected/missing columns; use exact private research schema')
        rows=list(reader)
    if any(None in r or None in r.values() for r in rows):raise ValueError('Malformed CSV row')
    return rows

def compare(rows,scope):
    if scope not in ('SYNTHETIC','CONSENTED_RESEARCH_UNVERIFIED'): raise ValueError('Invalid scope')
    if any(set(r)!=set(REQUIRED) or any(not isinstance(v,str) for v in r.values()) for r in rows):raise ValueError('Invalid row schema')
    if scope!='SYNTHETIC' and any(r['participant_id'].lower().startswith(('syn_','synthetic','demo_','test_')) for r in rows):
        raise ValueError('Synthetic identifier rejected')
    gate=audit(rows)
    report={'schema':SCHEMA,'data_scope':scope,'status':'BLOCKED_INVALID_INPUT','input_gate':gate['status'],
            'failure_codes':gate['failure_codes'],'groups':{},'difference':None,'ci95':None,'bootstrap_seed':SEED,'bootstrap_replicates':REPS,
            'estimand':'Unadjusted difference in participant mean observed cycle change (adaptive minus static); complete recorded cycles only.',
            'causal_effect':False,'efficacy_validated':False,'limitations':['Not ITT: unobserved assignments, dropout and missing outcomes cannot be inferred.','Declared consent, assignment and outcome verification are not independent attestation.','Participant bootstrap assumes independent learners; school-level clustering and confounding not addressed.','Not proof of intervention benefit or causation.']}
    if gate['status']!='PASS_DESCRIPTIVE_ONLY': return report
    if len(gate['assignment_methods'])!=1:
        report['status']='BLOCKED_MIXED_ASSIGNMENT';return report
    buckets={a:defaultdict(list) for a in ('static','adaptive')}
    versions={a:set() for a in buckets}
    for r in rows:
        arm=r['assigned_arm'].strip().lower(); versions[arm].add(r['policy_version'].strip())
        buckets[arm][r['participant_id'].strip()].append(float(r['outcome_score'])-float(r['baseline_score']))
    if any(len(x)!=1 for x in versions.values()):
        report['status']='BLOCKED_MIXED_POLICY';return report
    vals={a:[st.mean(v) for _,v in sorted(b.items())] for a,b in buckets.items()}
    report['groups']={a:{'participants':len(v),'cycles':sum(map(len,buckets[a].values())),'participant_mean_change':round(st.mean(v),6),'policy_version':next(iter(versions[a]))} for a,v in vals.items()}
    report['difference']=round(st.mean(vals['adaptive'])-st.mean(vals['static']),6)
    if min(map(len,vals.values()))<MIN_PER_ARM:
        report['status']='DESCRIPTIVE_ONLY_INSUFFICIENT_FOR_INTERVAL';return report
    rng=random.Random(SEED); a,b=vals['adaptive'],vals['static']
    boot=sorted(st.mean(rng.choices(a,k=len(a)))-st.mean(rng.choices(b,k=len(b))) for _ in range(REPS))
    def q(p):
        i=(len(boot)-1)*p;j=int(i);return round(boot[j]+(boot[min(j+1,len(boot)-1)]-boot[j])*(i-j),6)
    report['ci95']=[q(.025),q(.975)];report['status']='DESCRIPTIVE_PARTICIPANT_BOOTSTRAP_ONLY'
    return report

def main():
    p=argparse.ArgumentParser();p.add_argument('--input',required=True,type=Path);p.add_argument('--out',required=True,type=Path);p.add_argument('--scope',required=True,choices=['SYNTHETIC','CONSENTED_RESEARCH_UNVERIFIED']);a=p.parse_args()
    repo=Path(__file__).resolve().parents[2];out=a.out.resolve()
    if out.is_relative_to(repo) and not out.is_relative_to(repo/'research'/'reports'/'private'):p.error('Use research/reports/private/ or an external private directory')
    if a.scope!='SYNTHETIC' and 'synthetic' in a.input.name.lower():p.error('Synthetic fixture cannot be promoted')
    report=compare(read_strict(a.input),a.scope);report['input_sha256']=hashlib.sha256(a.input.read_bytes()).hexdigest()
    out.mkdir(parents=True,exist_ok=True);(out/'cluster_comparison.json').write_text(json.dumps(report,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    print(SCHEMA,report['status'],a.scope)
    if report['status'].startswith('BLOCKED'):raise SystemExit(2)
if __name__=='__main__':main()
